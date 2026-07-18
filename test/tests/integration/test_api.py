import requests
import json
import sys
import io

# Set terminal stdout encoding to UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

base_url = "http://127.0.0.1:8000"
user_id = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
session_id = "session-v2"

# Clear previous session
requests.post(f"{base_url}/session/clear?user_id={user_id}&session_id={session_id}")

def send_chat(message):
    payload = {
        "user_id": user_id,
        "message": message,
        "session_id": session_id
    }
    response = requests.post(f"{base_url}/chat", json=payload)
    data = response.json()
    return data

print("=" * 60)
print("BEAUTRICS CHATBOT v2 - INTEGRATION TEST")
print("=" * 60)

# Step 1: Empty profile - should ask for profile info
print("\n--- ADIM 1: Boş profille giriş ---")
result = send_chat("Merhaba")
print(f"Yanıt:\n{result['response']}")
print(f"Eksik Alanlar: {result['missing_fields']}")
print(f"Profil: {result['profile']}")

# Step 2: Provide profile info - should ONLY confirm, NOT recommend
print("\n--- ADIM 2: Profil bilgisi verme (SADECE onay bekleniyor) ---")
result = send_chat("Cildim yağlı, saçım kuru")
print(f"Yanıt:\n{result['response']}")
print(f"Eksik Alanlar: {result['missing_fields']}")
print(f"Profil: {result['profile']}")

# Step 3: Ask for recommendations - should use category/vector matching
print("\n--- ADIM 3: Nemlendirici önerisi (semantik arama) ---")
result = send_chat("Bana nemlendirici önerir misin?")
print(f"Yanıt:\n{result['response']}")
print(f"Eksik Alanlar: {result['missing_fields']}")
print(f"Bulunan Ürün Sayısı: {len(result.get('retrieved_products', []))}")

# Check market names in retrieved products
print("\n--- MAĞAZA İSİM KONTROLÜ ---")
for prod in result.get('retrieved_products', []):
    print(f"Ürün: {prod['universal_name']}")
    for st in prod.get('store_mappings', []):
        print(f"  m_id={st['m_id']} -> {st.get('market_name', 'ÇÖZÜLEMEDI')} | {st['current_price']} TL")

# Step 4: Ask for ruj - should match dudak/ruj category
print("\n--- ADIM 4: Ruj önerisi (farklı kategori testi) ---")
result = send_chat("Ruj arıyorum")
print(f"Yanıt:\n{result['response']}")
print(f"Bulunan Ürün Sayısı: {len(result.get('retrieved_products', []))}")

print("\n" + "=" * 60)
print("TEST TAMAMLANDI")
print("=" * 60)
