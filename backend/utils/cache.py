"""Simple in-memory cache"""
import time
from functools import wraps

class SimpleCache:
    def __init__(self):
        self.cache = {}
        self.timestamps = {}
        self.ttl = 300  # 5 minutes

    def get(self, key):
        if key in self.cache:
            if time.time() - self.timestamps[key] < self.ttl:
                return self.cache[key]
            else:
                del self.cache[key]
                del self.timestamps[key]
        return None

    def set(self, key, value):
        self.cache[key] = value
        self.timestamps[key] = time.time()

# Global cache instance
cache = SimpleCache()

def cached(ttl=300):
    """Decorator for caching function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"

            # Check cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                print(f"Cache hit: {cache_key[:50]}")
                return cached_result

            # Execute function
            result = func(*args, **kwargs)

            # Store in cache
            if result is not None:
                cache.set(cache_key, result)

            return result

        return wrapper
    return decorator