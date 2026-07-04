import requests

key = "REMOVED_API_KEY"
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(response.json())
except Exception as e:
    print(f"Request failed: {e}")
