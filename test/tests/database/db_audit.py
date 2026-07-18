import os
import sys
# Set terminal stdout encoding to UTF-8
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
from supabase import create_client

sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))

tables_to_check = [
    "products", "markets", "categories", "store_mappings", "brands",
    "user_profiles", "skin_types", "skin_concerns", "hair_types",
    "user_skin_concerns", "product_skin_types", "product_skin_concerns",
    "product_hair_types", "tags", "product_tags"
]

print("=" * 50)
print("SUPABASE DATABASE AUDIT")
print("=" * 50)

for t in tables_to_check:
    try:
        res = sb.table(t).select("*", count="exact").limit(1).execute()
        count = res.count if res.count is not None else len(res.data)
        sample = res.data[0] if res.data else {}
        cols = list(sample.keys()) if sample else ["?"]
        print(f"  {t:30s} | rows: {count:5d} | cols: {', '.join(cols[:5])}")
    except Exception as e:
        err_msg = str(e)
        if "PGRST205" in err_msg:
            print(f"  {t:30s} | TABLE NOT FOUND")
        else:
            print(f"  {t:30s} | ERROR: {err_msg[:60]}")

print("\n" + "=" * 50)
print("SAMPLE DATA CHECKS")
print("=" * 50)

# Check markets
print("\nMarkets:")
for m in sb.table("markets").select("*").execute().data:
    print(f"  id={m['id']} -> {m['name']}")

# Check product count by category (top 5)
print("\nProducts per category (top 5):")
products = sb.table("products").select("category_id").execute().data
from collections import Counter
cat_counts = Counter(p["category_id"] for p in products)
cats = sb.table("categories").select("id, name").execute().data
cat_map = {c["id"]: c["name"] for c in cats}
for cat_id, count in cat_counts.most_common(5):
    print(f"  {cat_map.get(cat_id, '?'):25s} (id={cat_id}): {count} products")

# Check store_mappings sample
print("\nStore mappings sample (first 3):")
mappings = sb.table("store_mappings").select("p_id, m_id, current_price, product_url").limit(3).execute().data
for m in mappings:
    print(f"  p_id={m['p_id']} m_id={m['m_id']} price={m['current_price']} url={m['product_url'][:50]}...")
