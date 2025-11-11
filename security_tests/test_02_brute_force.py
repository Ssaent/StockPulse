import requests
import time

print("=" * 60)
print("TEST 2: Brute Force Protection")
print("=" * 60)

url = "http://localhost:5000/api/auth/login"
email = "test@test.com"

print(f"\n🔍 Attempting 20 login requests with wrong password...")
print("Testing if rate limiting is enabled...\n")

success_count = 0
blocked_count = 0

for i in range(1, 21):
    data = {
        "email": email,
        "password": f"wrong_password_{i}"
    }

    try:
        response = requests.post(url, json=data, timeout=5)
        print(f"Attempt {i:2d}: Status {response.status_code} ", end="")

        if response.status_code == 200:
            print("❌ LOGIN SUCCESS (Should not happen!)")
            success_count += 1
        elif response.status_code == 429:
            print("✅ RATE LIMITED (Good!)")
            blocked_count += 1
        elif response.status_code == 401 or response.status_code == 400:
            print("⚪ LOGIN FAILED (Expected)")
        else:
            print(f"⚠️  Unexpected: {response.text[:50]}")

    except Exception as e:
        print(f"⚠️  Error: {e}")

    time.sleep(0.2)

print(f"\n{'=' * 60}")
print(f"Results:")
print(f"  Total Attempts: 20")
print(f"  Successful: {success_count}")
print(f"  Rate Limited: {blocked_count}")

if blocked_count > 0:
    print(f"\n✅ SECURE: Rate limiting is working!")
else:
    print(f"\n❌ VULNERABLE: No rate limiting detected!")
print("=" * 60)