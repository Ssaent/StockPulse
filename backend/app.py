"""
StockPulse Backend - Production-Ready Implementation
Industry-standard Flask application with proper logging and error handling
"""
import os
import sys
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from datetime import datetime, timezone, timedelta
import pandas as pd

# Fix path before imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging BEFORE other imports
def setup_logging(app):
    """Configure application logging"""
    log_level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO').upper(), logging.INFO)
    log_file = app.config.get('LOG_FILE')
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # File handler if log file specified
    if log_file:
        os.makedirs(os.path.dirname(log_file) if os.path.dirname(log_file) else '.', exist_ok=True)
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10485760,  # 10MB
            backupCount=10
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        ))
        logging.getLogger().addHandler(file_handler)
    
    return logging.getLogger(__name__)

# Initialize chat flags
CHAT_ENABLED = False
WEBSOCKET_ENABLED = False
chat_bp = None
init_socketio = None

# Try flexible imports
try:
    # Try importing from project root (when running from backend/)
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    from backend.config import get_config
    from backend.services.backtesting_service import BacktestingEngine
    from backend.services.news_fetcher import StockNewsFetcher
    from backend.services.corporate_actions import CorporateActionsTracker
    from backend.database.models import db, AnalysisHistory
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

    # Chat imports
    try:
        from backend.chat.chat_routes import chat_bp
        CHAT_ENABLED = True
        try:
            from backend.chat.chat_socketio import init_socketio
            WEBSOCKET_ENABLED = True
        except ImportError:
            WEBSOCKET_ENABLED = False
    except ImportError:
        CHAT_ENABLED = False
        WEBSOCKET_ENABLED = False

except ImportError as e:
    # Fallback: running from backend directory directly
    print(f"Warning: Import failed, trying fallback: {e}")
    
    from config import get_config
    from services.backtesting_service import BacktestingEngine
    from services.news_fetcher import StockNewsFetcher
    from services.corporate_actions import CorporateActionsTracker
    from database.models import db, AnalysisHistory
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

    try:
        from chat.chat_routes import chat_bp
        CHAT_ENABLED = True
        try:
            from chat.chat_socketio import init_socketio
            WEBSOCKET_ENABLED = True
        except ImportError:
            WEBSOCKET_ENABLED = False
    except ImportError:
        CHAT_ENABLED = False
        WEBSOCKET_ENABLED = False


def create_app(config_name=None):
    """Application factory pattern - industry standard"""
    app = Flask(__name__)
    
    # Get configuration
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    config_class = get_config()
    app.config.from_object(config_class)
    
    # Setup logging
    logger = setup_logging(app)
    logger.info(f"Starting StockPulse in {config_name} mode")
    
    # JWT Configuration
    app.config['JWT_SECRET_KEY'] = config_class.JWT_SECRET_KEY
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
    
    # Initialize Rate Limiter with environment-based limits
    rate_limit_default = config_class.RATE_LIMIT_DEFAULT.split(', ')
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=rate_limit_default,
        storage_uri=config_class.REDIS_URL if 'redis://' in config_class.REDIS_URL else "memory://",
        headers_enabled=True,
        strategy="fixed-window"
    )
    logger.info("Rate limiter initialized")

    # Initialize extensions
    db.init_app(app)
    
    try:
        blueprint_bcrypt.init_app(app)
    except Exception as e:
        logger.warning(f"Bcrypt initialization warning: {e}")

    try:
        jwt.init_app(app)
    except Exception as e:
        logger.error(f"JWT initialization failed: {e}")

    # CORS - Environment-based origins
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": config_class.CORS_ORIGINS,
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

    # Register chat blueprint
    if CHAT_ENABLED and chat_bp is not None:
        app.register_blueprint(chat_bp, url_prefix='/api/chat')
        limiter.exempt(chat_bp)
        logger.info("Chat REST API enabled")

    # Initialize WebSocket chat
    socketio_instance = None
    if WEBSOCKET_ENABLED and init_socketio is not None:
        try:
            socketio_instance = init_socketio(app)
            logger.info("WebSocket real-time chat enabled")
        except Exception as e:
            logger.error(f"WebSocket initialization failed: {e}", exc_info=True)
            socketio_instance = None

    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        logger.error(f"Internal server error: {error}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({'error': 'Rate limit exceeded', 'retry_after': e.description}), 429

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
        """Health check endpoint"""
        try:
            # Check database connectivity
            db.session.execute(db.text('SELECT 1'))
            db_status = 'ok'
        except Exception:
            db_status = 'error'
        
        return jsonify({
            'status': 'online',
            'app': 'StockPulse',
            'version': '3.0.0',
            'database': db_status,
            'chat_enabled': CHAT_ENABLED,
            'websocket_enabled': socketio_instance is not None,
            'environment': config_name
        })

    @app.route('/api/stocks/list/<exchange>')
    @limiter.limit("30 per minute")
    def get_stocks(exchange):
        """Get stock list by exchange"""
        try:
            exchange_upper = exchange.upper()
            if exchange_upper == 'NSE':
                stocks = stock_fetcher.fetch_nse_stocks()
            elif exchange_upper == 'BSE':
                stocks = stock_fetcher.fetch_bse_stocks()
            else:
                return jsonify({'error': 'Invalid exchange'}), 400
            
            return jsonify({'exchange': exchange_upper, 'total': len(stocks), 'stocks': stocks})
        except Exception as e:
            logger.error(f"Error fetching stocks: {e}", exc_info=True)
            return jsonify({'error': 'Failed to fetch stocks'}), 500

    @app.route('/api/stocks/search')
    @limiter.limit("60 per minute")
    def search_stocks():
        """Search stocks"""
        try:
            query = request.args.get('q', '').strip()
            exchange = request.args.get('exchange', 'NSE').upper()

            if len(query) < 2:
                return jsonify({'results': []})

            results = stock_fetcher.search_stock(query, exchange)
            return jsonify({'results': results})
        except Exception as e:
            logger.error(f"Error searching stocks: {e}", exc_info=True)
            return jsonify({'error': 'Search failed'}), 500

    @cached(ttl=300)
    def get_cached_analysis(symbol, exchange):
        """Get cached stock analysis"""
        try:
            hist_data = price_fetcher.get_historical_data(symbol, exchange, period='2y')

            if hist_data is None or hist_data.empty:
                return None

            hist_data = feature_engineer.create_features(hist_data)
            hist_data = hist_data.dropna()

            if len(hist_data) < 100:
                logger.warning(f"Insufficient data for {symbol}: {len(hist_data)} rows")
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
                    logger.error(f"Training failed for {symbol}: {e}", exc_info=True)
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
            logger.error(f"Analysis error for {symbol}: {e}", exc_info=True)
            return None

    @app.route('/api/analyze', methods=['POST'])
    @limiter.limit("10 per minute")
    @jwt_required()
    def analyze_stock_body():
        """Analyze stock via POST"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'Invalid request'}), 400
            
            symbol = data.get('symbol', '').strip().upper()
            exchange = data.get('exchange', 'NSE').upper()

            if not symbol:
                return jsonify({'error': 'Symbol is required'}), 400

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
                    logger.error(f"Failed to log prediction: {e}", exc_info=True)

                return jsonify(result)

            return jsonify({'error': 'Analysis failed'}), 500
        except Exception as e:
            logger.error(f"Analyze error: {e}", exc_info=True)
            return jsonify({'error': 'Analysis failed'}), 500

    @app.route('/api/analyze/<symbol>', methods=['GET'])
    @limiter.limit("10 per minute")
    @jwt_required()
    def analyze_stock_get(symbol):
        """Analyze stock via GET"""
        try:
            symbol = symbol.strip().upper()
            exchange = request.args.get('exchange', 'NSE').upper()

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
                    logger.error(f"Failed to log prediction: {e}", exc_info=True)

                return jsonify(result)

            return jsonify({'error': 'Analysis failed'}), 500
        except Exception as e:
            logger.error(f"Analyze error: {e}", exc_info=True)
            return jsonify({'error': 'Analysis failed'}), 500

    # ==================== NEWS ROUTES ====================

    @app.route('/api/news/stock/<symbol>', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_stock_news(symbol):
        """Get news for a specific stock"""
        try:
            exchange = request.args.get('exchange', 'NSE').upper()
            limit = min(max(int(request.args.get('limit', 10)), 1), 50)  # Clamp 1-50
            
            news = news_fetcher.get_stock_news(symbol, limit)
            for item in news:
                item['relative_time'] = news_fetcher.get_relative_time(item['published_date'])
                item['published_date'] = item['published_date'].isoformat()
            
            return jsonify({'symbol': symbol, 'news': news, 'total': len(news)})
        except ValueError:
            return jsonify({'error': 'Invalid limit parameter'}), 400
        except Exception as e:
            logger.error(f"News fetch error: {e}", exc_info=True)
            return jsonify({'error': 'Failed to fetch news'}), 500

    @app.route('/api/news/market', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_market_news():
        """Get general market news"""
        try:
            limit = min(max(int(request.args.get('limit', 20)), 1), 100)  # Clamp 1-100
            
            news = news_fetcher.get_market_news(limit)
            for item in news:
                item['relative_time'] = news_fetcher.get_relative_time(item['published_date'])
                item['published_date'] = item['published_date'].isoformat()
            
            return jsonify({'news': news, 'total': len(news)})
        except ValueError:
            return jsonify({'error': 'Invalid limit parameter'}), 400
        except Exception as e:
            logger.error(f"Market news fetch error: {e}", exc_info=True)
            return jsonify({'error': 'Failed to fetch market news'}), 500

    # ==================== CORPORATE ACTIONS ====================

    @app.route('/api/corporate-actions/<symbol>', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_corporate_actions(symbol):
        """Get corporate actions for a stock"""
        try:
            exchange = request.args.get('exchange', 'NSE').upper()
            actions = actions_tracker.get_corporate_actions(symbol, exchange)
            
            if not actions:
                return jsonify({'error': 'No data available'}), 404
            
            return jsonify({'symbol': symbol, 'exchange': exchange, 'actions': actions})
        except Exception as e:
            logger.error(f"Corporate actions error: {e}", exc_info=True)
            return jsonify({'error': 'Failed to fetch corporate actions'}), 500

    # ==================== BACKTESTING ROUTES ====================

    @app.route('/api/backtest/stats', methods=['GET'])
    @limiter.limit("30 per minute")
    @jwt_required()
    def get_backtest_stats():
        """Get backtesting statistics"""
        try:
            symbol = request.args.get('symbol')
            timeframe = request.args.get('timeframe')
            days = min(max(int(request.args.get('days', 30)), 1), 365)  # Clamp 1-365
            
            stats = backtesting.get_accuracy_stats(symbol, timeframe, days)
            return jsonify(stats)
        except ValueError:
            return jsonify({'error': 'Invalid days parameter'}), 400
        except Exception as e:
            logger.error(f"Backtest stats error: {e}", exc_info=True)
            return jsonify({'error': 'Failed to fetch statistics'}), 500

    @app.route('/api/backtest/recent', methods=['GET'])
    @limiter.limit("30 per minute")
    @jwt_required()
    def get_recent_predictions():
        """Get recent predictions"""
        try:
            limit = min(max(int(request.args.get('limit', 20)), 1), 100)  # Clamp 1-100
            
            predictions = backtesting.get_recent_predictions(limit)
            return jsonify({'predictions': predictions, 'total': len(predictions)})
        except ValueError:
            return jsonify({'error': 'Invalid limit parameter'}), 400
        except Exception as e:
            logger.error(f"Recent predictions error: {e}", exc_info=True)
            return jsonify({'error': 'Failed to fetch predictions'}), 500

    @app.route('/api/backtest/validate', methods=['POST'])
    @limiter.limit("5 per hour")
    @jwt_required()
    def validate_predictions_now():
        """Manually trigger prediction validation"""
        try:
            count = backtesting.validate_predictions()
            return jsonify({'message': f'Validated {count} predictions', 'count': count})
        except Exception as e:
            logger.error(f"Validation error: {e}", exc_info=True)
            return jsonify({'error': 'Validation failed'}), 500

    # ==================== ANALYSIS HISTORY ROUTES ====================

    @app.route('/api/analysis-history', methods=['GET'])
    @limiter.limit("60 per minute")
    @jwt_required()
    def get_analysis_history():
        """Get user's stock analysis history"""
        try:
            current_user = int(get_jwt_identity())
            period = request.args.get('period', '7d')

            # Calculate date range based on period
            days_map = {'7d': 7, '30d': 30, '90d': 90, 'all': None}
            days = days_map.get(period, 7)

            # Query based on period
            if days:
                start_date = datetime.now(timezone.utc) - timedelta(days=days)
                analyses = AnalysisHistory.query.filter(
                    AnalysisHistory.user_id == current_user,
                    AnalysisHistory.analyzed_at >= start_date
                ).order_by(AnalysisHistory.analyzed_at.desc()).all()
            else:
                analyses = AnalysisHistory.query.filter_by(
                    user_id=current_user
                ).order_by(AnalysisHistory.analyzed_at.desc()).all()

            history = [a.to_dict() for a in analyses]
            logger.info(f"Fetched {len(history)} analyses for user {current_user}")
            
            return jsonify({'history': history}), 200

        except ValueError:
            return jsonify({'error': 'Invalid user ID'}), 400
        except Exception as e:
            logger.error(f"Error fetching analysis history: {e}", exc_info=True)
            return jsonify({'error': 'Failed to fetch analysis history'}), 500

    @app.route('/api/save-analysis', methods=['POST'])
    @limiter.limit("60 per minute")
    @jwt_required()
    def save_analysis():
        """Save stock analysis to user's history"""
        try:
            current_user = int(get_jwt_identity())
            data = request.json

            if not data:
                return jsonify({'error': 'Invalid request'}), 400

            # Validate required fields
            symbol = data.get('symbol', '').strip().upper()
            if not symbol:
                return jsonify({'error': 'Symbol is required'}), 400

            # Create analysis record
            analysis = AnalysisHistory(
                user_id=current_user,
                symbol=symbol,
                name=data.get('name', symbol),
                exchange=data.get('exchange', 'NSE').upper(),
                analyzed_at=datetime.now(timezone.utc),
                current_price=data.get('currentPrice', 0),
                predictions=data.get('predictions', {}),
                technical=data.get('technical', {})
            )

            db.session.add(analysis)
            db.session.commit()

            logger.info(f"Analysis saved for user {current_user}: {symbol}")

            return jsonify({
                'success': True,
                'message': 'Analysis saved successfully',
                'id': analysis.id
            }), 201

        except ValueError:
            return jsonify({'error': 'Invalid user ID'}), 400
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error saving analysis: {e}", exc_info=True)
            return jsonify({'error': 'Failed to save analysis'}), 500

    # Create database tables
    with app.app_context():
        try:
            db.create_all()
            logger.info("Database tables created/verified")
        except Exception as e:
            logger.error(f"Database initialization error: {e}", exc_info=True)

    return app, socketio_instance


if __name__ == '__main__':
    try:
        config_name = os.getenv('FLASK_ENV', 'development')
        app, socketio = create_app(config_name)
        
        # Get configuration for server settings
        from backend.config import get_config
        config = get_config()
        
        host = config.HOST
        port = config.PORT
        debug = config.DEBUG
        
        logger = logging.getLogger(__name__)
        logger.info("=" * 60)
        logger.info("StockPulse Backend v3.0 - Advanced AI + Real-Time Chat")
        logger.info(f"Environment: {config_name}")
        logger.info(f"Features: Auth, Watchlist, Alerts, Portfolio, Advanced LSTM")
        logger.info(f"          News, Corporate Actions, Analysis History")
        if socketio:
            logger.info("Real-Time Chat: WebSocket (supports 10,000+ concurrent users)")
        else:
            logger.info("Real-Time Chat: HTTP Polling (fallback)")
        logger.info(f"Server: http://{host}:{port}")
        logger.info("=" * 60)

        # Run with SocketIO if available, otherwise regular Flask
        if socketio:
            socketio.run(app, host=host, port=port, debug=debug)
        else:
            app.run(host=host, port=port, debug=debug)
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.critical(f"FATAL ERROR: {e}", exc_info=True)
        import traceback
        traceback.print_exc()
        if os.getenv('FLASK_ENV') != 'production':
            input("Press Enter to exit...")