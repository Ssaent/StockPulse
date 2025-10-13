"""Production server using Waitress"""
from waitress import serve
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app import create_app

if __name__ == '__main__':
    print("=" * 60)
    print("StockPulse Production Server")
    print("Server: Waitress (Multi-threaded)")
    print("Threads: 8")
    print("URL: http://localhost:5000")
    print("=" * 60)

    app = create_app('production')
    serve(app, host='0.0.0.0', port=5000, threads=8)