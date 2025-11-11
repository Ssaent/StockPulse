import requests
import time

print("="*60)
print("TEST 5: IDOR (Insecure Direct Object Reference)")
print("="*60)

# Create two test users
print("\n📝 Creating two test users...")

user1_email = f"user1_{int(time.time())}@test.com"
user2_email = f"user2_{int(time.time())+1}@test.com"

# Register User 1
print(f"\n   Creating User 1: {user1_email}")
response = requests.post("http://localhost:5000/api/auth/register", json={
    "email": user1_email,
    "password": "Test123!"
})

if response.status_code in [200, 201]:
    user1_token = response.json()['access_token']
    user1_id = response.json()['user']['id']
    print(f"   ✅ User 1 created - ID: {user1_id}")
else:
    print(f"   ❌ Failed to create User 1: {response.text}")
    exit(1)

time.sleep(1)

# Register User 2
print(f"\n   Creating User 2: {user2_email}")
response = requests.post("http://localhost:5000/api/auth/register", json={
    "email": user2_email,
    "password": "Test123!"
})

if response.status_code in [200, 201]:
    user2_token = response.json()['access_token']
    user2_id = response.json()['user']['id']
    print(f"   ✅ User 2 created - ID: {user2_id}")
else:
    print(f"   ❌ Failed to create User 2: {response.text}")
    exit(1)

# Test 1: User 1 creates portfolio entry
print("\n🔍 Test 1: User 1 creates a portfolio holding...")
portfolio_url = "http://localhost:5000/api/portfolio"
headers1 = {"Authorization": f"Bearer {user1_token}", "Content-Type": "application/json"}

# NEW (add all required fields):
portfolio_data = {
    "symbol": "RELIANCE",
    "exchange": "NSE",
    "quantity": 10,
    "average_price": 2500,  # Changed from 'price'
    "current_price": 2500   # Add current price
}

response = requests.post(portfolio_url, json=portfolio_data, headers=headers1)
if response.status_code == 201:
    portfolio_id = response.json()['id']
    print(f"   ✅ Portfolio entry created - ID: {portfolio_id}")
else:
    print(f"   ❌ Failed to create portfolio entry: {response.text}")
    exit(1)

# Test 2: User 2 tries to access User 1's portfolio
print("\n🔍 Test 2: User 2 trying to access User 1's portfolio...")
headers2 = {"Authorization": f"Bearer {user2_token}"}

response = requests.get(f"{portfolio_url}/{portfolio_id}", headers=headers2)
print(f"   Status Code: {response.status_code}")

if response.status_code == 403:
    print("   ✅ SECURE: Access denied (403 Forbidden)")
elif response.status_code == 404:
    print("   ✅ SECURE: Resource not found (404)")
elif response.status_code == 200:
    print("   ❌ VULNERABLE: User 2 accessed User 1's data!")
    print(f"   Response: {response.json()}")
else:
    print(f"   ⚠️  Unexpected status: {response.status_code}")

# Test 3: User 2 tries to modify User 1's portfolio
print("\n🔍 Test 3: User 2 trying to MODIFY User 1's portfolio...")

update_data = {"quantity": 100, "price": 1}
response = requests.put(f"{portfolio_url}/{portfolio_id}", json=update_data, headers=headers2)
print(f"   Status Code: {response.status_code}")

if response.status_code in [403, 404]:
    print("   ✅ SECURE: Modification denied")
elif response.status_code == 200:
    print("   ❌ VULNERABLE: User 2 modified User 1's data!")
else:
    print(f"   ⚠️  Unexpected status: {response.status_code}")

# Test 4: User 2 tries to delete User 1's portfolio
print("\n🔍 Test 4: User 2 trying to DELETE User 1's portfolio...")

response = requests.delete(f"{portfolio_url}/{portfolio_id}", headers=headers2)
print(f"   Status Code: {response.status_code}")

if response.status_code in [403, 404]:
    print("   ✅ SECURE: Deletion denied")
elif response.status_code == 200:
    print("   ❌ VULNERABLE: User 2 deleted User 1's data!")
else:
    print(f"   ⚠️  Unexpected status: {response.status_code}")

print("\n" + "="*60)