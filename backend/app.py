f"""
ONLY REPLACE THE IMPORT SECTION (Lines 1-24) of your backend/app.py
Keep everything else the same!
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from features.market import market_bp
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
import pandas as pd
import os
import sys


# Fix path before imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Try flexible imports (works from any execution context)
try:
    from backend.config import config
    from backend.services.backtesting_service import BacktestingEngine
    from backend.services.news_fetcher import StockNewsFetcher
    from backend.services.corporate_actions import CorporateActionsTracker
    from backend.database.models import db
    from backend.features.auth import auth_bp, jwt, bcrypt
    from backend.features.watchlist import watchlist_bp
    from backend.features.alerts import alerts_bp
    from backend.features.portfolio import portfolio_bp
    from backend.data_fetchers.live_stock_fetcher import LiveStockFetcher
    from backend.data_fetchers.price_fetcher import RealTimePriceFetcher
    from backend.ai_engine.technical_analyzer import TechnicalAnalyzer
    from backend.ai_engine.advanced_lstm import AdvancedStockPredictor
    from backend.ai_engine.feature_engineer import FeatureEngineer
    from backend.utils.cache import cached
except ImportError:
    # Fallback: running from backend directory
    from config import config
    from services.backtesting_service import BacktestingEngine
    from services.news_fetcher import StockNewsFetcher
    from services.corporate_actions import CorporateActionsTracker
    from database.models import db
    from features.auth import auth_bp, jwt, bcrypt
    from features.watchlist import watchlist_bp
    from features.alerts import alerts_bp
    from features.portfolio import portfolio_bp
    from data_fetchers.live_stock_fetcher import LiveStockFetcher
    from data_fetchers.price_fetcher import RealTimePriceFetcher
    from ai_engine.technical_analyzer import TechnicalAnalyzer
    from ai_engine.advanced_lstm import AdvancedStockPredictor
    from ai_engine.feature_engineer import FeatureEngineer
    from utils.cache import cached


def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # JWT Secret Key
    app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

    # --- bind extensions to this app (minimal fix) ---
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # CORS
    CORS(
        app,
        supports_credentials=True,
        origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
        allow_headers=['Content-Type', 'Authorization'],
        expose_headers=['Authorization']
    )

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(watchlist_bp, url_prefix='/api/watchlist')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
    app.register_blueprint(portfolio_bp, url_prefix='/api/portfolio')
    app.register_blueprint(market_bp, url_prefix='/api/market')

    # Initialize modules
    stock_fetcher = LiveStockFetcher()
    price_fetcher = RealTimePriceFetcher()
    tech_analyzer = TechnicalAnalyzer()
    backtesting = BacktestingEngine()
    predictor = AdvancedStockPredictor()
    feature_engineer = FeatureEngineer()
    news_fetcher = StockNewsFetcher()
    actions_tracker = CorporateActionsTracker()

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'online', 'app': 'StockPulse', 'version': '3.0.0'})

    @app.route('/api/stocks/list/<exchange>')
    def get_stocks(exchange):
        stocks = stock_fetcher.fetch_nse_stocks() if exchange.upper() == 'NSE' else stock_fetcher.fetch_bse_stocks()
        return jsonify({'exchange': exchange, 'total': len(stocks), 'stocks': stocks})

    @app.route('/api/stocks/search')
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
            # Get 2 years of data for better training
            hist_data = price_fetcher.get_historical_data(symbol, exchange, period='2y')

            if hist_data is None or hist_data.empty:
                return None

            # Feature engineering
            print(f"Creating features for {symbol}...")
            hist_data = feature_engineer.create_features(hist_data)
            hist_data = hist_data.dropna()

            if len(hist_data) < 100:
                print(f"Insufficient data after feature engineering: {len(hist_data)}")
                return None

            # Calculate technical indicators for display
            hist_data = tech_analyzer.calculate_indicators(hist_data)

            current_price = float(hist_data['Close'].iloc[-1])
            prev_price = float(hist_data['Close'].iloc[-2])

            # Try to load pre-trained model
            model_loaded = predictor.load_model(symbol)

            if not model_loaded:
                print(f"No pre-trained model found for {symbol}. Training new model...")

                # Get feature columns
                feature_cols = feature_engineer.select_features()
                feature_cols = [f for f in feature_cols if f in hist_data.columns]

                print(f"Training with {len(feature_cols)} features...")

                try:
                    # Train model (only happens once per stock)
                    predictor.train(hist_data, feature_cols, validation_split=0.2)
                    predictor.save_model(symbol)
                    print(f"✅ Model trained and saved for {symbol}")

                except Exception as e:
                    print(f"❌ Training failed for {symbol}: {e}")
                    return None
            else:
                print(f"✅ Loaded pre-trained model for {symbol}")

            # Generate predictions with trained model
            feature_cols = predictor.feature_names
            predictions = predictor.predict_multi_horizon(hist_data, feature_cols, current_price)

            # Technical signals
            signals = tech_analyzer.generate_signals(hist_data)

            # Get fundamentals
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
    def analyze_stock():
        data = request.json
        symbol = data.get('symbol')
        exchange = data.get('exchange', 'NSE')

        result = get_cached_analysis(symbol, exchange)
        if result:
            # LOG PREDICTION FOR BACKTESTING
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

    # NEWS ROUTES
    @app.route('/api/news/stock/<symbol>', methods=['GET'])
    def get_stock_news(symbol):
        """Get news for specific stock"""
        exchange = request.args.get('exchange', 'NSE')
        limit = int(request.args.get('limit', 10))

        try:
            news = news_fetcher.get_stock_news(symbol, limit)

            # Add relative time
            for item in news:
                item['relative_time'] = news_fetcher.get_relative_time(item['published_date'])
                item['published_date'] = item['published_date'].isoformat()

            return jsonify({
                'symbol': symbol,
                'news': news,
                'total': len(news)
            })
        except Exception as e:
            print(f"News fetch error: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/news/market', methods=['GET'])
    def get_market_news():
        """Get general market news"""
        limit = int(request.args.get('limit', 20))

        try:
            news = news_fetcher.get_market_news(limit)

            for item in news:
                item['relative_time'] = news_fetcher.get_relative_time(item['published_date'])
                item['published_date'] = item['published_date'].isoformat()

            return jsonify({
                'news': news,
                'total': len(news)
            })
        except Exception as e:
            print(f"Market news fetch error: {e}")
            return jsonify({'error': str(e)}), 500

    # CORPORATE ACTIONS
    @app.route('/api/corporate-actions/<symbol>', methods=['GET'])
    def get_corporate_actions(symbol):
        """Get corporate actions for stock"""
        exchange = request.args.get('exchange', 'NSE')

        try:
            actions = actions_tracker.get_corporate_actions(symbol, exchange)

            if not actions:
                return jsonify({'error': 'No data available'}), 404

            return jsonify({
                'symbol': symbol,
                'exchange': exchange,
                'actions': actions
            })
        except Exception as e:
            print(f"Corporate actions error: {e}")
            return jsonify({'error': str(e)}), 500

    # BACKTESTING ROUTES
    @app.route('/api/backtest/stats', methods=['GET'])
    def get_backtest_stats():
        """Get overall accuracy statistics"""
        symbol = request.args.get('symbol')
        timeframe = request.args.get('timeframe')
        days = int(request.args.get('days', 30))

        try:
            stats = backtesting.get_accuracy_stats(symbol, timeframe, days)
            return jsonify(stats)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/backtest/recent', methods=['GET'])
    def get_recent_predictions():
        """Get recent validated predictions"""
        limit = int(request.args.get('limit', 20))

        try:
            predictions = backtesting.get_recent_predictions(limit)
            return jsonify({
                'predictions': predictions,
                'total': len(predictions)
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/backtest/validate', methods=['POST'])
    def validate_predictions_now():
        """Manually trigger prediction validation"""
        try:
            count = backtesting.validate_predictions()
            return jsonify({
                'message': f'Validated {count} predictions',
                'count': count
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # Create database tables
    with app.app_context():
        db.create_all()
        print("Database tables created")

    return app


if __name__ == '__main__':
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    print("=" * 60)
    print("StockPulse Backend v3.0 - Advanced AI")
    print("Features: Auth, Watchlist, Alerts, Portfolio, Advanced LSTM, News, Corporate Actions")
    print("Server: http://localhost:5000")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)
