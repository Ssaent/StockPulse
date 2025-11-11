import requests
import json
import time
from datetime import datetime

print("=" * 60)
print("TEST 3: JWT Token Security")
print("=" * 60)

# Step 1: Register a test user
print("\n📝 Step 1: Creating test user...")
register_url = "http://localhost:5000/api/auth/register"
test_user = {
    "email": f"testuser_{int(time.time())}@test.com",
    "password": "Test123!"
}

try:
    response = requests.post(register_url, json=test_user)
    if response.status_code == 201 or response.status_code == 200:
        data = response.json()
        token = data.get('access_token')
        print(f"✅ User created successfully")
        print(f"   Token (first 50 chars): {token[:50]}...")
    else:
        print(f"❌ Registration failed: {response.text}")
        exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

# Step 2: Test token without Authorization header
print("\n🔍 Step 2: Testing protected endpoint WITHOUT token...")
watchlist_url = "http://localhost:5000/api/watchlist"

try:
    response = requests.get(watchlist_url)
    print(f"   Status Code: {response.status_code}")

    if response.status_code == 401:
        print("   ✅ SECURE: Unauthorized access blocked")
    else:
        print("   ❌ VULNERABLE: Accessed without token!")
        print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"   ⚠️ Error: {e}")

# Step 3: Test with valid token
print("\n🔍 Step 3: Testing protected endpoint WITH valid token...")
headers = {"Authorization": f"Bearer {token}"}

try:
    response = requests.get(watchlist_url, headers=headers)
    print(f"   Status Code: {response.status_code}")

    if response.status_code == 200:
        print("   ✅ SECURE: Valid token accepted")
    else:
        print(f"   ❌ ISSUE: Valid token rejected")
        print(f"   Response: {response.text}")
except Exception as e:
    print(f"   ⚠️ Error: {e}")

# Step 4: Test with modified token
print("\n🔍 Step 4: Testing with MODIFIED token...")
modified_token = token[:-10] + "hacked1234"
headers = {"Authorization": f"Bearer {modified_token}"}

try:
    response = requests.get(watchlist_url, headers=headers)
    print(f"   Status Code: {response.status_code}")

    if response.status_code == 401 or response.status_code == 422:
        print("   ✅ SECURE: Modified token rejected")
    else:
        print("   ❌ VULNERABLE: Modified token accepted!")
        print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"   ⚠️ Error: {e}")

# Step 5: Check token expiration
print("\n🔍 Step 5: Checking token expiration...")
print("   Note: Full test requires waiting 24 hours")
print("   Checking if expiration is set...")

# Decode JWT (base64)
import base64

try:
    parts = token.split('.')
    if len(parts) == 3:
        payload = parts[1]
        payload += '=' * (4 - len(payload) % 4)
        decoded = base64.b64decode(payload)
        payload_json = json.loads(decoded)

        print(f"   Token Payload:")
        print(f"   - User ID: {payload_json.get('sub', 'N/A')}")

        if 'exp' in payload_json:
            exp_timestamp = payload_json['exp']
            exp_datetime = datetime.fromtimestamp(exp_timestamp)
            print(f"   - Expires: {exp_datetime}")
            print(f"   ✅ SECURE: Token has expiration set")
        else:
            print(f"   ❌ VULNERABLE: Token has NO expiration!")
except Exception as e:
    print(f"   ⚠️ Could not decode token: {e}")

print("\n" + "=" * 60)