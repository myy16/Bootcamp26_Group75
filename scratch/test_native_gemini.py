import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load root .env
load_dotenv(dotenv_path="d:\\Bootcamp26_Group75\\.env")

api_key = os.getenv("OPENAI_API_KEY") # This is the Gemini key the user provided
print(f"Using Gemini Key: {api_key[:10]}...")

genai.configure(api_key=api_key)

try:
    # 1. Test Chat / Generation
    model = genai.GenerativeModel("gemini-3.5-flash")
    response = model.generate_content("Merhaba, nasılsın?")
    print("Native Gemini Generation Successful!")
    print(f"Response: {response.text}")
    
    # 2. Test Embeddings
    emb = genai.embed_content(
        model="models/gemini-embedding-2",
        contents="Kozmetik ürün önerisi"
    )
    print("Native Gemini Embeddings Successful!")
    print(f"Embedding length: {len(emb['embedding'])}")
    
except Exception as e:
    print(f"Native Gemini Test Failed: {e}")
