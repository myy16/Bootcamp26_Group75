import requests
import json
import sys
import io

# Set terminal stdout encoding to UTF-8 to prevent charmap/emoji print errors on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

base_url = "http://127.0.0.1:8000"
user_id = "test-user-uuid-999"
session_id = "session-1"

# Clear previous session if any
requests.post(f"{base_url}/session/clear?user_id={user_id}&session_id={session_id}")

print("--- Step 1: Initial conversation message (Profile is empty) ---")
payload = {
    "user_id": user_id,
    "message": "Merhaba",
    "session_id": session_id
}

response = requests.post(f"{base_url}/chat", json=payload)
data = response.json()
print(f"Status Code: {response.status_code}")
print(f"Chatbot Response:\n{data.get('response')}\n")
print(f"Missing Fields: {data.get('missing_fields')}")
print(f"Profile: {data.get('profile')}")

print("\n--- Step 2: Answering the onboarding question ---")
payload = {
    "user_id": user_id,
    "message": "Cildim kuru ve saçım normal",
    "session_id": session_id
}

response = requests.post(f"{base_url}/chat", json=payload)
data = response.json()
print(f"Status Code: {response.status_code}")
print(f"Chatbot Response:\n{data.get('response')}\n")
print(f"Missing Fields: {data.get('missing_fields')}")
print(f"Profile: {data.get('profile')}")

print("\n--- Step 3: Asking for recommendations (Now that profile is complete) ---")
payload = {
    "user_id": user_id,
    "message": "Bana uygun bir nemlendirici önerir misin?",
    "session_id": session_id
}

response = requests.post(f"{base_url}/chat", json=payload)
data = response.json()
print(f"Status Code: {response.status_code}")
print(f"Chatbot Response:\n{data.get('response')}\n")
print(f"Missing Fields: {data.get('missing_fields')}")
print(f"Profile: {data.get('profile')}")
print(f"Retrieved Products Count: {len(data.get('retrieved_products', []))}")
