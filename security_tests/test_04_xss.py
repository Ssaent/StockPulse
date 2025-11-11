import requests
import time

print("=" * 60)
print("TEST 4: Cross-Site Scripting (XSS)")
print("=" * 60)

# First, register a test user
print("\n📝 Registering test user...")
register_url = "http://localhost:5000/api/auth/register"
test_user = {
    "email": f"xss_test_{int(time.time())}@test.com",
    "password": "Test123!"
}

try:
    response = requests.post(register_url, json=test_user)
    if response.status_code in [200, 201]:
        token = response.json()['access_token']
        print("✅ Logged in successfully")
    else:
        print("❌ Registration failed")
        exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# XSS Payloads
xss_payloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
]

# Test 1: XSS in Portfolio
print("\n🔍 Test 1: Testing XSS in Portfolio symbol...")
portfolio_url = "http://localhost:5000/api/portfolio"

for i, payload in enumerate(xss_payloads, 1):
    print(f"\n   Payload {i}: {payload}")
    data = {
        "symbol": payload,
        "quantity": 10,
        "price": 100
    }

    try:
        response = requests.post(portfolio_url, json=data, headers=headers)
        print(f"   Status: {response.status_code}")

        if response.status_code == 201:
            print("   ⚠️  Payload accepted - Checking sanitization...")
            get_response = requests.get(portfolio_url, headers=headers)
            if payload in get_response.text:
                print("   ❌ VULNERABLE: Raw XSS payload in response!")
            else:
                print("   ✅ SECURE: Payload sanitized/escaped")
        else:
            print(f"   ✅ SECURE: Payload rejected")
            print(f"   Response: {response.text[:100]}")
    except Exception as e:
        print(f"   ⚠️  Error: {e}")

    time.sleep(0.5)

# Test 2: XSS in Alerts
print("\n🔍 Test 2: Testing XSS in Alerts...")
alerts_url = "http://localhost:5000/api/alerts"

payload = '<script>alert("XSS")</script>'
print(f"   Payload: {payload}")

data = {
    "symbol": payload,
    "exchange": "NSE",
    "alert_type": "price",
    "condition": "above",
    "threshold": 2500
}

try:
    response = requests.post(alerts_url, json=data, headers=headers)
    print(f"   Status: {response.status_code}")

    if response.status_code == 201:
        print("   ⚠️  Payload accepted - Checking sanitization...")
        get_response = requests.get(alerts_url, headers=headers)
        if payload in get_response.text:
            print("   ❌ VULNERABLE: Raw XSS payload in response!")
        else:
            print("   ✅ SECURE: Payload sanitized/escaped")
    else:
        print(f"   ✅ SECURE: Payload rejected")
except Exception as e:
    print(f"   ⚠️  Error: {e}")

print("\n" + "=" * 60)
print("NOTE: Check browser console for actual XSS execution.")
print("No alert popup = SECURE")
print("=" * 60)