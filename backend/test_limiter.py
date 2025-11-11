# Create file: test_limiter.py in backend folder
from flask import Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri="memory://"
)

@app.route('/test')
@limiter.limit("3 per minute")
def test():
    return "OK"

if __name__ == '__main__':
    print("✅ Rate limiter initialized successfully!")
    print("Starting test server on http://localhost:5001")
    app.run(port=5001, debug=True)