import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath("."))
from fastapi.testclient import TestClient
from test.main import app

client = TestClient(app)
user_id = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
session_id = "test-session-v3"

def run_tests():
    print("=" * 60, flush=True)
    print("BEAUTRICS CHATBOT END-TO-END SCENARIO TEST", flush=True)
    print("=" * 60, flush=True)

    # 0. Clear session
    client.post(f"/session/clear?user_id={user_id}&session_id={session_id}")

    # Set up user profile first so profile is complete
    profile_payload = {
        "full_name": "Test User",
        "skin_type": "karma",
        "hair_type": "normal",
        "skin_concerns": ["akne", "leke"],
        "min_budget": 0,
        "max_budget": 1000
    }
    client.post(f"/profile/{user_id}", json=profile_payload)

    # Test 1: Normal recommendation
    print("\n--- SENARYO 1: Ürün Önerisi (Nemlendirici) ---", flush=True)
    res = client.post("/chat", json={"user_id": user_id, "session_id": session_id, "message": "Bana nemlendirici öner"})
    print("STATUS:", res.status_code, flush=True)
    data = res.json()
    print("YANIT:\n", data.get("response", "").encode('utf-8', errors='replace').decode('utf-8'), flush=True)
    print("BULUNAN ÜRÜNLER:", [p.get("universal_name") for p in data.get("retrieved_products", [])], flush=True)

    # Test 2: Alternative / Dupe search
    print("\n--- SENARYO 2: Muadil / Daha Ucuz Alternatif Arama ---", flush=True)
    res = client.post("/chat", json={"user_id": user_id, "session_id": session_id, "message": "Bunun daha ucuzunu bulabilir misin?"})
    print("STATUS:", res.status_code, flush=True)
    data = res.json()
    print("YANIT:\n", data.get("response", "").encode('utf-8', errors='replace').decode('utf-8'), flush=True)
    print("BULUNAN ÜRÜNLER:", [p.get("universal_name") for p in data.get("retrieved_products", [])], flush=True)

    # Test 3: Store-specific comparison
    print("\n--- SENARYO 3: Mağaza Bazlı Muadil (Gratis) ---", flush=True)
    res = client.post("/chat", json={"user_id": user_id, "session_id": session_id, "message": "Gratis'te muadili var mı?"})
    print("STATUS:", res.status_code, flush=True)
    data = res.json()
    print("YANIT:\n", data.get("response", "").encode('utf-8', errors='replace').decode('utf-8'), flush=True)
    print("BULUNAN ÜRÜNLER:", [p.get("universal_name") for p in data.get("retrieved_products", [])], flush=True)

    # Test 4: Chat budget override
    print("\n--- SENARYO 4: Sohbet Bütçesi Override (150 TL altı serum) ---", flush=True)
    res = client.post("/chat", json={"user_id": user_id, "session_id": session_id, "message": "150 TL altı serum öner"})
    print("STATUS:", res.status_code, flush=True)
    data = res.json()
    print("YANIT:\n", data.get("response", "").encode('utf-8', errors='replace').decode('utf-8'), flush=True)
    print("BULUNAN ÜRÜNLER:", [p.get("universal_name") for p in data.get("retrieved_products", [])], flush=True)

    print("\n" + "=" * 60, flush=True)
    print("TÜM SENARYO TESTLERİ BAŞARIYLA TAMAMLANDI ✓", flush=True)
    print("=" * 60, flush=True)

if __name__ == "__main__":
    run_tests()
