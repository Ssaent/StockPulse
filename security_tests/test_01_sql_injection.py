import requests
import json

print("=" * 60)
print("TEST 1: SQL Injection in Login Endpoint")
print("=" * 60)

url = "http://localhost:5000/api/auth/login"

# Test payloads
payloads = [
    "admin' OR '1'='1",
    "admin'--",
    "admin' #",
    "' OR '1'='1'--",
    "admin' OR '1'='1'/*"
]

for payload in payloads:
    print(f"\n🔍 Testing payload: {payload}")

    data = {
        "email": payload,
        "password": "anything"
    }

    try:
        response = requests.post(url, json=data, timeout=5)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text[:200]}")

        if response.status_code == 200:
            print("   ❌ VULNERABLE! SQL injection successful!")
        else:
            print("   ✅ SECURE: Request rejected")
    except Exception as e:
        print(f"   ⚠️ Error: {e}")

print("\n" + "=" * 60)