import os
import sys
import io
import json
import time
import argparse
import re
from dotenv import load_dotenv
from supabase import create_client
from openai import OpenAI
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Force UTF-8 stdout encoding to prevent Windows charmap encoding errors
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load .env file from project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

# Initialize API clients
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY") or SUPABASE_ANON_KEY
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Supabase URL and Key are required in .env file!")
    exit(1)

if not OPENAI_API_KEY:
    print("ERROR: OPENAI_API_KEY is required in .env file!")
    exit(1)

sb = create_client(SUPABASE_URL, SUPABASE_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY, base_url="https://api.openai.com/v1")

def parse_json_from_text(text: str) -> dict:
    """Extracts JSON object from text that may contain markdown or malformed quotes."""
    text = text.strip()
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        pass

    # Try extracting from markdown code block
    match = re.search(r'```(?:json)?\s*\n?(.+?)\n?```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except (json.JSONDecodeError, ValueError):
            pass

    # Try finding the first '{' and last '}'
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    if start_idx != -1 and end_idx != -1:
        try:
            return json.loads(text[start_idx:end_idx + 1])
        except (json.JSONDecodeError, ValueError) as err:
            # Try to fix basic unterminated strings or escape issues before parsing
            fixed_text = text[start_idx:end_idx + 1]
            # Replace unescaped control chars
            fixed_text = re.sub(r'[\x00-\x1F\x7F]', '', fixed_text)
            try:
                return json.loads(fixed_text)
            except Exception:
                pass
    return None

def extract_metadata_from_raw_html(page_text, product_name, category_name):
    """
    Uses GPT-4o-mini to extract exact product description and ingredients list 
    from raw web page text content to ensure zero hallucinations.
    """
    prompt = (
        f"Kozmetik Ürün Adı: {product_name}\n"
        f"Kategorisi: {category_name}\n\n"
        f"Aşağıdaki web sayfası metnini analiz et. Bu metnin içerisinden:\n"
        f"1. Ürünün resmi açıklamasını (varsa doğrudan üretici/mağaza açıklamasını, yoksa özelliklerini).\n"
        f"2. Ürünün içindekiler listesini (ingredients / bileşenler) metinden birebir yakala.\n"
        f"3. Bu ürünün hangi cilt/saç tiplerine uygun olduğunu metindeki ibarelere göre belirt.\n\n"
        f"KURAL: Metinde yazmayan hiçbir şeyi uydurma. Eğer içerik listesi metinde bulunmuyorsa 'Metinde bulunamadı' yaz.\n\n"
        f"SADECE aşağıdaki şablona göre bir JSON nesnesi döndür, başka hiçbir şey yazma.\n"
        f"Şablon:\n"
        f"{{\n"
        f"  \"description\": \"Metinden çıkarılan açıklama...\",\n"
        f"  \"ingredients\": \"Metinden çıkarılan içerik listesi...\",\n"
        f"  \"suitable_for\": \"Metinden çıkarılan cilt/saç tipi bilgisi...\"\n"
        f"}}\n\n"
        f"Web Sayfası Metni:\n"
        f"{page_text[:6000]}"
    )

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Sen web sayfalarından kozmetik ürün açıklaması ve içerik listesi çıkaran bir veri ayıklama asistanısın. Asla bilgi uydurmaz, sadece sayfada yazan gerçek veriyi çekersin. Sadece JSON formatında çıktı verirsin."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
            max_tokens=300
        )
        raw_content = response.choices[0].message.content or ""
        parsed = parse_json_from_text(raw_content)
        if not parsed:
            print(f"  Warning: GPT returned malformed JSON: {raw_content[:150]}")
            # Mock fallback mapping to not lose progress
            parsed = {
                "description": "Metinden çıkarılamadı",
                "ingredients": "Metinden bulunamadı",
                "suitable_for": "Bilinmiyor"
            }
        return parsed
    except Exception as e:
        print(f"  Error extracting metadata from text: {e}")
        return None

def get_embedding(text):
    """Generates a 1536-dimension embedding using text-embedding-3-small."""
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"  Error generating embedding: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Beautrics Product Embedding Pipeline with Selenium Scraping")
    parser.add_argument("--limit", type=int, default=10, help="Number of products to process (default: 10)")
    parser.add_argument("--all", action="store_true", help="Process all products")
    args = parser.parse_args()

    print("=" * 60)
    print("BEAUTRICS EMBEDDING & SCRAPING PIPELINE")
    print("=" * 60)

    # 1. Fetch categories and brands (with retry logic)
    print("Loading brands and categories lookups...")
    brands_data, cats_data = None, None
    for attempt in range(1, 4):
        try:
            brands_res = sb.table("brands").select("id, name").execute()
            cats_res = sb.table("categories").select("id, name").execute()
            brands_data = brands_res.data
            cats_data = cats_res.data
            break
        except Exception as conn_err:
            print(f"  Connection attempt {attempt} failed: {conn_err}")
            if attempt < 3:
                time.sleep(3)
            else:
                print("[ERROR] Failed to load brands/categories after 3 attempts.")
                exit(1)

    brand_map = {row["id"]: row["name"] for row in brands_data} if brands_data else {}
    cat_map = {row["id"]: row["name"] for row in cats_data} if cats_data else {}

    # 2. Fetch products (with retry logic)
    print("Fetching products from Supabase...")
    products = None
    for attempt in range(1, 4):
        try:
            prod_query = sb.table("products").select("id, brand_id, category_id, universal_name").is_("embedding", "null")
            if not args.all:
                prod_query = prod_query.limit(args.limit)
            products_res = prod_query.execute()
            products = products_res.data
            break
        except Exception as conn_err:
            print(f"  Connection attempt {attempt} to fetch products failed: {conn_err}")
            if attempt < 3:
                time.sleep(3)
            else:
                print("[ERROR] Failed to fetch products after 3 attempts.")
                exit(1)

def get_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    })
    driver.set_page_load_timeout(30)
    return driver

def main():
    parser = argparse.ArgumentParser(description="Beautrics Product Embedding Pipeline with Selenium Scraping")
    parser.add_argument("--limit", type=int, default=10, help="Number of products to process (default: 10)")
    parser.add_argument("--all", action="store_true", help="Process all products")
    args = parser.parse_args()

    print("=" * 60)
    print("BEAUTRICS EMBEDDING & SCRAPING PIPELINE")
    print("=" * 60)

    # 1. Fetch categories and brands (with retry logic)
    print("Loading brands and categories lookups...")
    brands_data, cats_data = None, None
    for attempt in range(1, 4):
        try:
            brands_res = sb.table("brands").select("id, name").execute()
            cats_res = sb.table("categories").select("id, name").execute()
            brands_data = brands_res.data
            cats_data = cats_res.data
            break
        except Exception as conn_err:
            print(f"  Connection attempt {attempt} failed: {conn_err}")
            if attempt < 3:
                time.sleep(3)
            else:
                print("[ERROR] Failed to load brands/categories after 3 attempts.")
                exit(1)

    brand_map = {row["id"]: row["name"] for row in brands_data} if brands_data else {}
    cat_map = {row["id"]: row["name"] for row in cats_data} if cats_data else {}

    # 2. Fetch products (with retry logic)
    print("Fetching products from Supabase...")
    products = None
    for attempt in range(1, 4):
        try:
            prod_query = sb.table("products").select("id, brand_id, category_id, universal_name")
            if not args.all:
                prod_query = prod_query.limit(args.limit)
            products_res = prod_query.execute()
            products = products_res.data
            break
        except Exception as conn_err:
            print(f"  Connection attempt {attempt} to fetch products failed: {conn_err}")
            if attempt < 3:
                time.sleep(3)
            else:
                print("[ERROR] Failed to fetch products after 3 attempts.")
                exit(1)

    if not products:
        print("No products found to process!")
        return

    total = len(products)
    print(f"Loaded {total} products. Initializing Selenium driver...")

    driver = get_driver()
    success_count = 0

    try:
        for i, p in enumerate(products):
            p_id = p["id"]
            p_name = p["universal_name"]
            brand_name = brand_map.get(p["brand_id"], "Bilinmeyen Marka")
            cat_name = cat_map.get(p["category_id"], "Genel")

            print(f"\n[{i+1}/{total}] Product: {brand_name} - {p_name} ({cat_name})")

            # Fetch product store mapping URL
            mapping_res = sb.table("store_mappings").select("product_url").eq("p_id", p_id).limit(1).execute()
            
            product_url = None
            if mapping_res.data:
                product_url = mapping_res.data[0]["product_url"]

            # Step A: Load page using Selenium (try to read body text even on page load timeout)
            page_text = ""
            scraped_successfully = False
            
            if product_url:
                print(f"  Fetching detail page: {product_url}")
                try:
                    driver.get(product_url)
                    time.sleep(4) # Wait for JS execution
                except Exception as scrape_err:
                    print(f"  Page load timeout/exception for {product_url}, attempting to read text anyway...")
                    # If session became invalid, recreate it
                    if "invalid session id" in str(scrape_err) or "session" in str(scrape_err).lower():
                        try:
                            driver.quit()
                        except Exception:
                            pass
                        driver = get_driver()
                        try:
                            driver.get(product_url)
                            time.sleep(4)
                        except Exception:
                            pass
                
                try:
                    page_text = driver.find_element(by="css selector", value="body").text
                    if page_text and len(page_text) > 100:
                        print(f"  Successfully fetched text ({len(page_text)} chars).")
                        scraped_successfully = True
                    else:
                        print("  Page content empty or too short.")
                except Exception as read_err:
                    print(f"  Could not read body text: {read_err}")
                    # Recreate session if it died
                    if "invalid session id" in str(read_err) or "session" in str(read_err).lower():
                        try:
                            driver.quit()
                        except Exception:
                            pass
                        driver = get_driver()

            # Step B: Extract metadata
            metadata = {}
            if scraped_successfully and page_text:
                print("  Extracting real description and ingredients using LLM...")
                extracted = extract_metadata_from_raw_html(page_text, p_name, cat_name)
                if extracted:
                    metadata = extracted

            # If scraping or extraction failed, fallback to name-category document
            if not metadata:
                print("  [Fallback] Using name and category metadata document.")
                metadata = {
                    "description": f"Bu ürün {brand_name} markasına ait {p_name} isimli {cat_name} ürünüdür.",
                    "ingredients": "Metinden bulunamadı",
                    "suitable_for": "Tüm Cilt Tipleri"
                }

            print(f"  Description: {metadata.get('description', '')[:80]}...")
            print(f"  Ingredients: {metadata.get('ingredients', '')[:80]}...")

            # Format authentic document text for embedding
            document_text = (
                f"Ürün Adı: {brand_name} {p_name}\n"
                f"Kategori: {cat_name}\n"
                f"Açıklama: {metadata.get('description', '')}\n"
                f"Orijinal İçerikler: {metadata.get('ingredients', '')}\n"
                f"Hedef Cilt Tipi: {metadata.get('suitable_for', '')}"
            )

            # Step C: Generate embedding vector
            print("  Generating vector embedding...")
            vector = get_embedding(document_text)
            if not vector:
                print("  Embedding generation failed.")
                continue

            # Step D: Save embedding back to Supabase (with retry logic)
            print("  Writing embedding to Supabase...")
            updated = False
            for attempt in range(1, 4):
                try:
                    update_res = sb.table("products").update({"embedding": vector}).eq("id", p_id).execute()
                    if update_res.data:
                        print(f"  Successfully updated product id={p_id} (Attempt {attempt})")
                        success_count += 1
                        updated = True
                        break
                    else:
                        print(f"  Failed update product id={p_id} (No data returned, RLS or cache issue? Attempt {attempt})")
                        # If table doesn't have the column in Postgrest cache, wait and retry
                        time.sleep(2)
                except Exception as db_err:
                    print(f"  Database update attempt {attempt} failed: {db_err}")
                    time.sleep(2)
            
            if not updated:
                print(f"  [ERROR] Could not write embedding to DB for product id={p_id} after 3 attempts.")

            time.sleep(1)

    finally:
        driver.quit()

    print("\n" + "=" * 60)
    print(f"Pipeline completed! Successfully embedded {success_count}/{total} products.")
    print("=" * 60)

if __name__ == "__main__":
    main()
