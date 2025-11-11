"""
Simple Rate Limiter for StockPulse
"""
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

def setup_rate_limiting(app):
    """
    Setup rate limiting for Flask app
    Returns limiter instance that can be used as decorator
    """
    try:
        limiter = Limiter(
            app=app,
            key_func=get_remote_address,
            default_limits=["200 per day", "50 per hour"],
            storage_uri="memory://",
            headers_enabled=True
        )
        print("✅ Rate limiter initialized successfully")
        return limiter
    except Exception as e:
        print(f"⚠️  Rate limiter initialization failed: {e}")
        print("    Continuing without rate limiting...")
        # Return a dummy limiter that does nothing
        class DummyLimiter:
            def limit(self, *args, **kwargs):
                def decorator(f):
                    return f
                return decorator
        return DummyLimiter()