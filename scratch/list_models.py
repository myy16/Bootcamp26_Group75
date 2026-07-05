import os
import requests
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

key = os.getenv("OPENAI_API_KEY")

if not key:
    print("ERROR: OPENAI_API_KEY not found in .env file!")
    print("Make sure your .env file contains: OPENAI_API_KEY=your_key_here")
    exit(1)

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(response.json())
except Exception as e:
    print(f"Request failed: {e}")
