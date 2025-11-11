import requests
import time

print("=" * 60)
print("TEST 6: API Rate Limiting")
print("=" * 60)

# Register and login
print("\n📝 Creating test user and logging in...")
test_email = f"ratelimit_{int(time.time())}@test.com"

response = requests.post("http://localhost:5000/api/auth/register", json={
    "email": test_email,
    "password": "Test123!"
})

if response.status_code in [200, 201]:
    token = response.json()['access_token']
    print("✅ Logged in successfully")
else:
    print("❌ Login failed")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# Test: Sequential requests
print("\n🔍 Sending 25 sequential requests to /api/watchlist...")
watchlist_url = "http://localhost:5000/api/watchlist"

rate_limited = False
rate_limit_after = 0

for i in range(1, 26):
    response = requests.get(watchlist_url, headers=headers)
    status = response.status_code

    if status == 429:
        if not rate_limited:
            rate_limited = True
            rate_limit_after = i
        print(f"   Request {i:2d}: Status {status} ✅ RATE LIMITED")
    elif status == 200:
        print(f"   Request {i:2d}: Status {status} ⚪ Success")
    else:
        print(f"   Request {i:2d}: Status {status} ⚠️  Unexpected")

    time.sleep(0.2)

print(f"\n{'=' * 60}")
if rate_limited:
    print(f"✅ SECURE: Rate limiting kicked in after {rate_limit_after} requests")
else:
    print(f"❌ VULNERABLE: No rate limiting detected after 25 requests")
print("=" * 60)