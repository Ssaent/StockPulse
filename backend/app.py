"""
StockPulse Backend - Complete with WebSocket Real-Time Chat
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

import pandas as pd
import os
import sys
from datetime import datetime, timedelta

# Fix path before imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Initialize chat flags
CHAT_ENABLED = False
WEBSOCKET_ENABLED = False
chat_bp = None
init_socketio = None

# Try flexible imports
try:
    from backend.config import config
    from backend.services.backtesting_service import BacktestingEngine
    from backend.services.news_fetcher import StockNewsFetcher
    from backend.services.corporate_actions import CorporateActionsTracker
    from backend.database.models import db, AnalysisHistory  # ✅ IMPORT AnalysisHistory
    from backend.features.auth import auth_bp, jwt, bcrypt as blueprint_bcrypt
    from backend.features.watchlist import watchlist_bp
    from backend.features.alerts import alerts_bp
    from backend.features.portfolio import portfolio_bp
    from backend.features.market import market_bp
    from backend.data_fetchers.live_stock_fetcher import LiveStockFetcher
    from backend.data_fetchers.price_fetcher import RealTimePriceFetcher
    from backend.ai_engine.technical_analyzer import TechnicalAnalyzer
    from backend.ai_engine.advanced_lstm import AdvancedStockPredictor
    from backend.ai_engine.feature_engineer import FeatureEngineer
    from backend.utils.cache import cached

    # Chat imports - try both with and without socketio
    try:
        from backend.chat.chat_routes import chat_bp
        CHAT_ENABLED = True
        print("Chat REST API loaded")
        try:
            from backend.chat.chat_socketio import init_socketio
            WEBSOCKET_ENABLED = True
            print("WebSocket module loaded")
        except ImportError as e:
            print(f"WebSocket not available: {e}")
    except ImportError as e:
        print(f"Chat module not found: {e}")

except ImportError:
    # Fallback: running from backend directory
    from config import config
    from services.backtesting_service import BacktestingEngine
    from services.news_fetcher import StockNewsFetcher
    from services.corporate_actions import CorporateActionsTracker
    from database.models import db, AnalysisHistory  # ✅ IMPORT AnalysisHistory
    from features.auth import auth_bp, jwt, bcrypt as blueprint_bcrypt
    from features.watchlist import watchlist_bp
    from features.alerts import alerts_bp
    from features.portfolio import portfolio_bp
    from features.market import market_bp
    from data_fetchers.live_stock_fetcher import LiveStockFetcher
    from data_fetchers.price_fetcher import RealTimePriceFetcher
    from ai_engine.technical_analyzer import TechnicalAnalyzer
    from ai_engine.advanced_lstm import AdvancedStockPredictor
    from ai_engine.feature_engineer import FeatureEngineer
    from utils.cache import cached

    # Chat imports - try both with and without socketio
    try:
        from chat.chat_routes import chat_bp
        CHAT_ENABLED = True
        print("Chat REST API loaded")
        try:
            from chat.chat_socketio import init_socketio
            WEBSOCKET_ENABLED = True
            print("WebSocket module loaded")
        except ImportError as e:
            print(f"WebSocket not available: {e}")
    except ImportError as e:
        print(f"Chat module not found: {e}")


def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # JWT Secret Key
    app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

    # Initialize Rate Limiter with VERY HIGH default limits for development
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["50000 per day", "10000 per hour"],  # Very high limits for dev
        storage_uri="memory://",
        headers_enabled=True
    )
    print("Rate limiter initialized successfully")

    # Initialize extensions
    db.init_app(app)

    try:
        blueprint_bcrypt.init_app(app)
    except Exception:
        pass

    try:
        jwt.init_app(app)
    except Exception:
        pass

    # CORS - Updated for better compatibility
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "expose_headers": ["Authorization"],
                "supports_credentials": True,
                "max_age": 3600
            }
        }
    )

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(watchlist_bp, url_prefix='/api/watchlist')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
    app.register_blueprint(portfolio_bp, url_prefix='/api/portfolio')
    app.register_blueprint(market_bp, url_prefix='/api/market')

    # Register chat blueprint if available (REST API fallback)
    if CHAT_ENABLED and chat_bp is not None:
        app.register_blueprint(chat_bp, url_prefix='/api/chat')
        limiter.exempt(chat_bp)
        print("Chat REST API enabled (fallback for non-WebSocket clients)")

    # Initialize WebSocket chat
    socketio_instance = None
    if WEBSOCKET_ENABLED and init_socketio is not None:
        try:
            socketio_instance = init_socketio(app)
            print("WebSocket real-time chat enabled (supports 10,000+ users)")
        except Exception as e:
            print(f"WebSocket initialization failed: {e}")
            import traceback
            traceback.print_exc()
            socketio_instance = None

    # Apply rate limiting to specific routes (chat is already exempted)
    @app.before_request
    def apply_rate_limiting():
        """Apply rate limiting based on endpoint"""
        endpoint = request.endpoint

        if endpoint:
            # Auth endpoints - increased limits
            if 'auth.login' in endpoint:
                limiter.limit("20 per minute")(lambda: None)()
            elif 'auth.register' in endpoint:
                limiter.limit("10 per hour")(lambda: None)()

            # API endpoints - moderate limits
            elif any(prefix in endpoint for prefix in ['watchlist.', 'portfolio.', 'alerts.']):
                limiter.limit("100 per minute")(lambda: None)()

    # Initialize modules
    stock_fetcher = LiveStockFetcher()
    price_fetcher = RealTimePriceFetcher()
    tech_analyzer = TechnicalAnalyzer()
    backtesting = BacktestingEngine()
    predictor = AdvancedStockPredictor()
    feature_engineer = FeatureEngineer()
    news_fetcher = StockNewsFetcher()
    actions_tracker = CorporateActionsTracker()

    # ==================== MAIN ROUTES ====================

    @app.route('/api/health')
    def health():
        return jsonify({
            'status': 'online',
            'app': 'StockPulse',
            'version': '3.0.0',
            'chat_enabled': CHAT_ENABLED,
            'websocket_enabled': socketio_instance is not None
        })

    @app.route('/api/stocks/list/<exchange>')
    @limiter.limit("30 per minute")
    def get_stocks(exchange):
        stocks = stock_fetcher.fetch_nse_stocks() if exchange.upper() == 'NSE' else stock_fetcher.fetch_bse_stocks()
        return jsonify({'exchange': exchange, 'total': len(stocks), 'stocks': stocks})

    @app.route('/api/stocks/search')
    @limiter.limit("60 per minute")
    def search_stocks():
        query = request.args.get('q', '')
        exchange = request.args.get('exchange', 'NSE')

        if len(query) < 2:
            return jsonify({'results': []})

        results = stock_fetcher.search_stock(query, exchange)
        return jsonify({'results': results})

    @cached(ttl=300)
    def get_cached_analysis(symbol, exchange):
        try:
            hist_data = price_fetcher.get_historical_data(symbol, exchange, period='2y')

            if hist_data is None or hist_data.empty:
                return None

            hist_data = feature_engineer.create_features(hist_data)
            hist_data = hist_data.dropna()

            if len(hist_data) < 100:
                print(f"Insufficient data after feature engineering: {len(hist_data)}")
                return None

            hist_data = tech_analyzer.calculate_indicators(hist_data)

            current_price = float(hist_data['Close'].iloc[-1])
            prev_price = float(hist_data['Close'].iloc[-2])

            model_loaded = predictor.load_model(symbol)

            if not model_loaded:
                feature_cols = feature_engineer.select_features()
                feature_cols = [f for f in feature_cols if f in hist_data.columns]

                try:
                    predictor.train(hist_data, feature_cols, validation_split=0.2)
                    predictor.save_model(symbol)
                except Exception as e:
                    print(f"Training failed for {symbol}: {e}")
                    return None

            feature_cols = predictor.feature_names
            predictions = predictor.predict_multi_horizon(hist_data, feature_cols, current_price)
            signals = tech_analyzer.generate_signals(hist_data)

            import yfinance as yf
            ticker = yf.Ticker(f"{symbol}.{exchange[:2]}")
            info = ticker.info

            return {
                'symbol': symbol,
                'name': info.get('longName', symbol),
                'exchange': exchange,
                'currentPrice': round(current_price, 2),
                'change': round(((current_price - prev_price) / prev_price) * 100, 2),
                'changePercent': f"{round(((current_price - prev_price) / prev_price) * 100, 2)}%",
                'predictions': predictions,
                'model_trained': True,
                'features_used': len(feature_cols),
                'technical': {
                    'rsi': round(float(hist_data['RSI'].iloc[-1]), 2),
                    'macd': round(float(hist_data['MACD'].iloc[-1]), 2),
                    'ema20': round(float(hist_data['EMA_20'].iloc[-1]), 2),
                    'signal': signals['overall']
                },
                'signals': signals['signals'],
                'fundamentals': {
                    'pe': info.get('trailingPE'),
                    'eps': info.get('trailingEps'),
                    'marketCap': info.get('marketCap')
                }
            }

        except Exception as e:
            print(f"Analysis error for {symbol}: {e}")
            import traceback
            traceback.print_exc()
            return None

    @app.route('/api/analyze', methods=['POST'])
    @limiter.limit("10 per minute")
    @jwt_required()
    def analyze_stock_body():
        data = request.json
        symbol = data.get('symbol')
        exchange = data.get('exchange', 'NSE')

        result = get_cached_analysis(symbol, exchange)
        if result:
            try:
                backtesting.log_prediction(
                    symbol=symbol,
                    exchange=exchange,
                    predictions=result['predictions'],
                    current_price=result['currentPrice'],
                    model_info={'features_used': result.get('features_used', 28)}
                )
            except Exception as e:
                print(f"Failed to log prediction: {e}")

            return jsonify(result)

        return jsonify({'error': 'Analysis failed'}), 500

    @app.route('/api/analyze/<symbol>', methods=['GET'])
    @limiter.limit("10 per minute")
    @jwt_required()
    def analyze_stock_get(symbol):
        exchange = request.args.get('exchange', 'NSE')

        result = get_cached_analysis(symbol, exchange)
        if result:
            try:
                backtesting.log_prediction(
                    symbol=symbol,
                    exchange=exchange,
                    predictions=result['predictions'],
                    current_price=result['currentPrice'],
                    model_info={'features_used': result.get('features_used', 28)}
                )
            except Exception as e:
                print(f"Failed to log prediction: {e}")

            return jsonify(result)

        return jsonify({'error': 'Analysis failed'}), 500

    # ==================== NEWS ROUTES ====================

    @app.route('/api/news/stock/<symbol>', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_stock_news(symbol):
        exchange = request.args.get('exchange', 'NSE')
        limit = int(request.args.get('limit', 10))
        try:
            news = news_fetcher.get_stock_news(symbol, limit)
            for item in news:
                item['relative_time'] = news_fetcher.get_relative_time(item['published_date'])
                item['published_date'] = item['published_date'].isoformat()
            return jsonify({'symbol': symbol, 'news': news, 'total': len(news)})
        except Exception as e:
            print(f"News fetch error: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/news/market', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_market_news():
        limit = int(request.args.get('limit', 20))
        try:
            news = news_fetcher.get_market_news(limit)
            for item in news:
                item['relative_time'] = news_fetcher.get_relative_time(item['published_date'])
                item['published_date'] = item['published_date'].isoformat()
            return jsonify({'news': news, 'total': len(news)})
        except Exception as e:
            print(f"Market news fetch error: {e}")
            return jsonify({'error': str(e)}), 500

    # ==================== CORPORATE ACTIONS ====================

    @app.route('/api/corporate-actions/<symbol>', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_corporate_actions(symbol):
        exchange = request.args.get('exchange', 'NSE')
        try:
            actions = actions_tracker.get_corporate_actions(symbol, exchange)
            if not actions:
                return jsonify({'error': 'No data available'}), 404
            return jsonify({'symbol': symbol, 'exchange': exchange, 'actions': actions})
        except Exception as e:
            print(f"Corporate actions error: {e}")
            return jsonify({'error': str(e)}), 500

    # ==================== BACKTESTING ROUTES ====================

    @app.route('/api/backtest/stats', methods=['GET'])
    @limiter.limit("30 per minute")
    @jwt_required()
    def get_backtest_stats():
        symbol = request.args.get('symbol')
        timeframe = request.args.get('timeframe')
        days = int(request.args.get('days', 30))
        try:
            stats = backtesting.get_accuracy_stats(symbol, timeframe, days)
            return jsonify(stats)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/backtest/recent', methods=['GET'])
    @limiter.limit("30 per minute")
    @jwt_required()
    def get_recent_predictions():
        limit = int(request.args.get('limit', 20))
        try:
            predictions = backtesting.get_recent_predictions(limit)
            return jsonify({'predictions': predictions, 'total': len(predictions)})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/backtest/validate', methods=['POST'])
    @limiter.limit("5 per hour")
    @jwt_required()
    def validate_predictions_now():
        try:
            count = backtesting.validate_predictions()
            return jsonify({'message': f'Validated {count} predictions', 'count': count})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # ==================== ANALYSIS HISTORY ROUTES (NEW) ====================

    @app.route('/api/analysis-history', methods=['GET'])
    @limiter.limit("60 per minute")
    @jwt_required()
    def get_analysis_history():
        """Get user's stock analysis history"""
        try:
            current_user = get_jwt_identity()
            period = request.args.get('period', '7d')

            print(f"📊 Fetching analysis history for {current_user}, period: {period}")

            # Calculate date range based on period
            days_map = {'7d': 7, '30d': 30, '90d': 90, 'all': None}
            days = days_map.get(period, 7)

            # Query based on period - USE IMPORTED MODEL
            if days:
                start_date = datetime.now(datetime.UTC) - timedelta(days=days)
                analyses = AnalysisHistory.query.filter(
                    AnalysisHistory.user_id == current_user,
                    AnalysisHistory.analyzed_at >= start_date
                ).order_by(AnalysisHistory.analyzed_at.desc()).all()
            else:
                analyses = AnalysisHistory.query.filter_by(
                    user_id=current_user
                ).order_by(AnalysisHistory.analyzed_at.desc()).all()

            # Convert to dict using the model's to_dict method
            history = [a.to_dict() for a in analyses]

            print(f"✅ Found {len(history)} analyses")
            return jsonify({'history': history}), 200

        except Exception as e:
            print(f"❌ Error fetching analysis history: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': 'Failed to fetch analysis history', 'details': str(e)}), 500


    @app.route('/api/save-analysis', methods=['POST'])
    @limiter.limit("60 per minute")
    @jwt_required()
    def save_analysis():
        """Save stock analysis to user's history"""
        try:
            current_user = get_jwt_identity()
            data = request.json

            print(f"💾 Saving analysis for {current_user}: {data.get('symbol')}")

            # Validate required fields
            if not data.get('symbol'):
                return jsonify({'error': 'Symbol is required'}), 400

            # Create analysis record - USE IMPORTED MODEL
            analysis = AnalysisHistory(
                user_id=current_user,
                symbol=data.get('symbol'),
                name=data.get('name', data.get('symbol')),
                exchange=data.get('exchange', 'NSE'),
                analyzed_at=datetime.utcnow(),
                current_price=data.get('currentPrice', 0),
                predictions=data.get('predictions', {}),
                technical=data.get('technical', {})
            )

            db.session.add(analysis)
            db.session.commit()

            print(f"✅ Analysis saved: {data.get('symbol')} with ID {analysis.id}")

            return jsonify({
                'success': True,
                'message': 'Analysis saved successfully',
                'id': analysis.id
            }), 201

        except Exception as e:
            db.session.rollback()
            print(f"❌ Error saving analysis: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': 'Failed to save analysis', 'details': str(e)}), 500

    # Create database tables
    with app.app_context():
        db.create_all()
        print("✅ Database tables created")

    return app, socketio_instance


if __name__ == '__main__':
    try:
        app, socketio = create_app(os.getenv('FLASK_ENV', 'development'))
        print("=" * 60)
        print("StockPulse Backend v3.0 - Advanced AI + Real-Time Chat")
        print("Features: Auth, Watchlist, Alerts, Portfolio, Advanced LSTM")
        print("          News, Corporate Actions, Analysis History")
        if socketio:
            print("Real-Time Chat: WebSocket (supports 10,000+ concurrent users)")
        else:
            print("Real-Time Chat: HTTP Polling (fallback)")
        print("Server: http://localhost:5000")
        print("=" * 60)

        # Run with SocketIO if available, otherwise regular Flask
        if socketio:
            socketio.run(app, host='0.0.0.0', port=5000, debug=True)
        else:
            app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        input("Press Enter to exit...")