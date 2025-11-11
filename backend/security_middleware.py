# backend/security_middleware.py
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import re


class SecurityMiddleware:
    def __init__(self, app=None):
        """
        Usage:
            security = SecurityMiddleware()
            security.init_app(app)   # or pass app at construction
        """
        self.limiter = None
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        # Rate limiter for the app
        self.limiter = Limiter(
            app=app,
            key_func=get_remote_address,
            default_limits=["200 per day", "50 per hour"],
            storage_uri="memory://",
            headers_enabled=True
        )

        # Create shared limits for scopes that can be used as decorators
        self.auth_limiter = self.limiter.shared_limit("5 per minute", scope="auth")
        self.api_limiter = self.limiter.shared_limit("60 per minute", scope="api")

        # Setup security headers
        @app.after_request
        def add_security_headers(response):
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            return response

    # Decorator accessors
    def rate_limit_auth(self):
        return self.auth_limiter

    def rate_limit_api(self):
        return self.api_limiter


# Input validation helpers
def validate_symbol(symbol):
    """Validate stock symbol format"""
    if not symbol or not isinstance(symbol, str):
        raise ValueError("Invalid symbol")

    # Only allow uppercase alphanumeric characters and length limit
    if not re.match(r'^[A-Z0-9]{1,20}$', symbol.upper()):
        raise ValueError("Invalid symbol format")

    return symbol.upper()


def validate_email(email):
    """Validate email format"""
    if not email or not isinstance(email, str):
        raise ValueError("Invalid email")

    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValueError("Invalid email format")

    return email.lower()
