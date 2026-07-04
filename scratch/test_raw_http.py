import os
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path="d:\\Bootcamp26_Group75\\.env")

api_key = os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_BASE_URL")
url = f"{base_url}chat/completions"

print(f"Testing URL: {url}")
print(f"Using Key: {api_key}")

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}

payload = {
    "model": "gemini-1.5-flash",
    "messages": [{"role": "user", "content": "Hello"}]
}

try:
    response = requests.post(url, headers=headers, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {response.headers}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
