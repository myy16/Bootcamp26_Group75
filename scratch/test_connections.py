import os
from dotenv import load_dotenv
from supabase import create_client
from openai import OpenAI

# Load the environment variables from the root .env
load_dotenv(dotenv_path="d:\\Bootcamp26_Group75\\.env")

print("--- Testing Connections ---")

# 1. Test Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")
print(f"Supabase URL: {supabase_url}")
print(f"Supabase Key: {supabase_key[:10]}...")

try:
    supabase = create_client(supabase_url, supabase_key)
    # Try fetching a row from a table, e.g. products
    res = supabase.table("products").select("id").limit(1).execute()
    print("Supabase Connection Successful!")
    print(f"Sample data from products: {res.data}")
except Exception as e:
    print(f"Supabase Connection Failed: {e}")

# 2. Test Gemini API (OpenAI Compatible)
api_key = os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_BASE_URL")
chat_model = os.getenv("CHAT_MODEL", "gemini-1.5-flash")
embedding_model = os.getenv("EMBEDDING_MODEL", "text-embedding-004")

print(f"\nGemini Base URL: {base_url}")
print(f"Gemini Key: {api_key[:10]}...")
print(f"Chat Model: {chat_model}")
print(f"Embedding Model: {embedding_model}")

try:
    client = OpenAI(api_key=api_key, base_url=base_url)
    
    # Test Chat Completion
    chat_res = client.chat.completions.create(
        model=chat_model,
        messages=[{"role": "user", "content": "Merhaba, nasılsın?"}],
        max_tokens=50
    )
    print("Gemini Chat Completion Successful!")
    print(f"Response: {chat_res.choices[0].message.content}")
    
    # Test Embeddings
    emb_res = client.embeddings.create(
        model=embedding_model,
        input="Kozmetik ürün önerisi"
    )
    print("Gemini Embeddings Successful!")
    print(f"Embedding dimensions: {len(emb_res.data[0].embedding)}")
except Exception as e:
    print(f"Gemini Connection Failed: {e}")
