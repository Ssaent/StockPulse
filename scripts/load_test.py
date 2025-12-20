"""Load test for StockPulse API - Simulate 10,000 concurrent users"""
import requests
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
import statistics

API_URL = "http://localhost:5000/api/analyze"


class LoadTester:
    def __init__(self, target_users=10000):
        self.target_users = target_users
        self.success_count = 0
        self.failure_count = 0
        self.response_times = []
        self.errors = []
        self.lock = threading.Lock()

    def make_request(self, user_id):
        """Single API request"""
        symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK',
                   'SBIN', 'BHARTIARTL', 'ITC', 'WIPRO', 'MARUTI']

        symbol = symbols[user_id % len(symbols)]

        start = time.time()

        try:
            response = requests.post(
                API_URL,
                json={"symbol": symbol, "exchange": "NSE"},
                timeout=60
            )

            elapsed = time.time() - start

            with self.lock:
                self.response_times.append(elapsed)

                if response.status_code == 200:
                    self.success_count += 1
                    return {'user_id': user_id, 'status': 'success', 'time': elapsed}
                else:
                    self.failure_count += 1
                    return {'user_id': user_id, 'status': 'failed', 'code': response.status_code, 'time': elapsed}

        except Exception as e:
            elapsed = time.time() - start
            with self.lock:
                self.failure_count += 1
                self.errors.append(str(e))
            return {'user_id': user_id, 'status': 'error', 'error': str(e), 'time': elapsed}

    def run_test(self, batch_size=100):
        """Run load test in batches"""
        print("=" * 70)
        print(f"LOAD TEST: Simulating {self.target_users} concurrent users")
        print(f"Target API: {API_URL}")
        print(f"Batch size: {batch_size}")
        print("=" * 70)

        total_start = time.time()

        # Process in batches to avoid overwhelming the system
        for batch_num in range(0, self.target_users, batch_size):
            batch_end = min(batch_num + batch_size, self.target_users)
            current_batch = batch_end - batch_num

            print(f"\nBatch {batch_num // batch_size + 1}: Testing users {batch_num + 1}-{batch_end}")
            batch_start = time.time()

            with ThreadPoolExecutor(max_workers=current_batch) as executor:
                futures = [executor.submit(self.make_request, i) for i in range(batch_num, batch_end)]

                completed = 0
                for future in as_completed(futures):
                    completed += 1
                    if completed % 10 == 0:
                        print(f"  Progress: {completed}/{current_batch} requests completed")

            batch_elapsed = time.time() - batch_start
            print(f"  Batch completed in {batch_elapsed:.2f}s")
            print(f"  Success: {self.success_count}, Failed: {self.failure_count}")

            # Brief pause between batches
            if batch_end < self.target_users:
                time.sleep(2)

        total_elapsed = time.time() - total_start

        # Results
        self.print_results(total_elapsed)

    def print_results(self, total_time):
        """Print test results"""
        print("\n" + "=" * 70)
        print("LOAD TEST RESULTS")
        print("=" * 70)

        print(f"\nTotal users simulated: {self.target_users}")
        print(f"Total time: {total_time:.2f}s")
        print(f"Success: {self.success_count}")
        print(f"Failed: {self.failure_count}")
        print(f"Success rate: {(self.success_count / self.target_users) * 100:.2f}%")

        if self.response_times:
            print(f"\nResponse Time Statistics:")
            print(f"  Average: {statistics.mean(self.response_times):.2f}s")
            print(f"  Median: {statistics.median(self.response_times):.2f}s")
            print(f"  Min: {min(self.response_times):.2f}s")
            print(f"  Max: {max(self.response_times):.2f}s")
            print(f"  95th percentile: {sorted(self.response_times)[int(len(self.response_times) * 0.95)]:.2f}s")

        print(f"\nThroughput: {self.target_users / total_time:.2f} requests/second")

        if self.errors:
            print(f"\nTop errors:")
            error_counts = {}
            for error in self.errors[:100]:
                error_counts[error] = error_counts.get(error, 0) + 1

            for error, count in sorted(error_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
                print(f"  {count}x: {error[:100]}")

        print("\n" + "=" * 70)
        print("RECOMMENDATIONS")
        print("=" * 70)

        if self.success_count / self.target_users < 0.9:
            print("⚠ Success rate below 90%")
            print("  - Add caching layer (Redis)")
            print("  - Increase server resources")
            print("  - Add rate limiting")

        if self.response_times and statistics.mean(self.response_times) > 5:
            print("⚠ Average response time > 5s")
            print("  - Cache historical data")
            print("  - Use async processing")
            print("  - Pre-compute analyses")

        if self.failure_count > self.target_users * 0.1:
            print("⚠ High failure rate")
            print("  - Check yfinance rate limits")
            print("  - Implement request queuing")
            print("  - Add load balancer")


def quick_test():
    """Quick test with 100 users"""
    print("Running QUICK TEST (100 users)...\n")
    tester = LoadTester(target_users=100)
    tester.run_test(batch_size=20)


def full_test():
    """Full test with 10,000 users"""
    print("Running FULL TEST (10,000 users)...\n")
    print("⚠ WARNING: This will take 10-30 minutes and stress your system")
    response = input("Continue? (yes/no): ")

    if response.lower() == 'yes':
        tester = LoadTester(target_users=10000)
        tester.run_test(batch_size=100)
    else:
        print("Test cancelled")


if __name__ == '__main__':
    print("\nStockPulse Load Testing Tool")
    print("1. Quick test (100 users)")
    print("2. Full test (10,000 users)")

    choice = input("\nSelect test (1 or 2): ")

    if choice == '1':
        quick_test()
    elif choice == '2':
        full_test()
    else:
        print("Invalid choice")