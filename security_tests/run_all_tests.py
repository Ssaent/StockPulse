import subprocess
import sys
import time

print("=" * 70)
print(" " * 15 + "STOCKPULSE SECURITY AUDIT")
print(" " * 20 + "Complete Test Suite")
print("=" * 70)

tests = [
    ("test_01_sql_injection.py", "SQL Injection"),
    ("test_02_brute_force.py", "Brute Force Protection"),
    ("test_03_jwt_security.py", "JWT Token Security"),
    ("test_04_xss.py", "Cross-Site Scripting (XSS)"),
    ("test_05_idor.py", "IDOR - Authorization"),
    ("test_06_rate_limiting.py", "API Rate Limiting"),
]

passed = 0
failed = 0
results = []

for i, (test_file, test_name) in enumerate(tests, 1):
    print(f"\n{'=' * 70}")
    print(f"Running Test {i}/{len(tests)}: {test_name}")
    print(f"{'=' * 70}\n")

    try:
        result = subprocess.run(
            [sys.executable, test_file],
            capture_output=False,
            text=True,
            timeout=60
        )

        if result.returncode == 0:
            passed += 1
            results.append(f"✅ {test_name}")
        else:
            failed += 1
            results.append(f"❌ {test_name}")
    except subprocess.TimeoutExpired:
        failed += 1
        results.append(f"⏱️  {test_name} (Timeout)")
        print(f"\n⏱️  Test timed out after 60 seconds\n")
    except Exception as e:
        failed += 1
        results.append(f"❌ {test_name} (Error: {e})")
        print(f"\n❌ Error running test: {e}\n")

    # ADD DELAY BETWEEN TESTS
    if i < len(tests):
        print(f"\n⏳ Waiting 10 seconds for rate limits to reset...")
        time.sleep(10)

    input("\nPress Enter to continue to next test...")

# Final Report
print("\n" + "=" * 70)
print(" " * 25 + "FINAL REPORT")
print("=" * 70)

for result in results:
    print(result)

print(f"\n{'=' * 70}")
print(f"Total Tests: {len(tests)}")
print(f"Passed: {passed}")
print(f"Failed: {failed}")
print(f"Success Rate: {(passed / len(tests) * 100):.1f}%")
print("=" * 70)