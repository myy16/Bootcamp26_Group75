import os
import time
from dotenv import load_dotenv
from supabase import create_client
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

sb = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Get some sample product URLs
res = sb.table("store_mappings").select("m_id, product_url").limit(50).execute()
urls_by_market = {}
for row in res.data:
    m_id = row["m_id"]
    if m_id not in urls_by_market:
        urls_by_market[m_id] = row["product_url"]

print("Sample URLs:")
for m_id, url in urls_by_market.items():
    print(f"  Market {m_id}: {url}")

# Setup headless Selenium
options = webdriver.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--start-maximized")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
options.add_argument("--disable-blink-features=AutomationControlled")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

try:
    for m_id, url in urls_by_market.items():
        print(f"\nTesting Market {m_id} via Selenium headless...")
        try:
            driver.get(url)
            time.sleep(5)
            
            page_text = driver.find_element(by="css selector", value="body").text
            print(f"  Successfully fetched URL.")
            print(f"  Text Length: {len(page_text)}")
            print(f"  Snippet: {page_text.strip()[:250]}")
        except Exception as e:
            print(f"  Selenium fetch failed: {e}")
finally:
    driver.quit()
