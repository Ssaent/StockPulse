#!/usr/bin/env python3
"""
StockPulse Launcher
Run from project root to avoid import path issues
"""
import sys
import os

# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

try:
    from backend.app import create_app
    
    if __name__ == '__main__':
        config_name = os.getenv('FLASK_ENV', 'development')
        app, socketio = create_app(config_name)
        
        # Get configuration for server settings
        from backend.config import get_config
        config = get_config()
        
        host = config.HOST
        port = config.PORT
        debug = config.DEBUG
        
        print("=" * 60)
        print("StockPulse Backend v3.0 - Advanced AI + Real-Time Chat")
        print(f"Environment: {config_name}")
        print(f"Features: Auth, Watchlist, Alerts, Portfolio, Advanced LSTM")
        print(f"          News, Corporate Actions, Analysis History")
        if socketio:
            print("Real-Time Chat: WebSocket (supports 10,000+ concurrent users)")
        else:
            print("Real-Time Chat: HTTP Polling (fallback)")
        print(f"Server: http://{host}:{port}")
        print("=" * 60)
        
        # Run with SocketIO if available, otherwise regular Flask
        if socketio:
            socketio.run(app, host=host, port=port, debug=debug)
        else:
            app.run(host=host, port=port, debug=debug)

except Exception as e:
    print(f"FATAL ERROR: {e}")
    import traceback
    traceback.print_exc()
    input("Press Enter to exit...")