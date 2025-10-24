"""
Dynamic Stock Analysis Script
Automatically fetches:
- NIFTY 50 stocks
- 50 Random mid-cap stocks
- 50 Random small-cap stocks
Total: 150 stocks analyzed
"""

import sys
import os
from datetime import datetime, timedelta
import random
import yfinance as yf
import pandas as pd

# Add backend to path
backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from app import create_app
from database.models import db, PredictionLog
from data_fetchers.price_fetcher import RealTimePriceFetcher
from ai_engine.advanced_lstm import AdvancedStockPredictor
from ai_engine.feature_engineer import FeatureEngineer
from ai_engine.technical_analyzer import TechnicalAnalyzer


def get_nifty50_stocks():
    """Fetch NIFTY 50 stocks dynamically"""
    print("📊 Fetching NIFTY 50 stocks...")

    try:
        # Get NIFTY 50 index data
        nifty = yf.Ticker("^NSEI")

        # NIFTY 50 constituent symbols (most common ones)
        nifty50 = [
            'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
            'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
            'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'TITAN',
            'SUNPHARMA', 'ULTRACEMCO', 'NESTLEIND', 'BAJFINANCE', 'WIPRO',
            'HCLTECH', 'POWERGRID', 'NTPC', 'TATAMOTORS', 'ONGC',
            'COALINDIA', 'ADANIPORTS', 'JSWSTEEL', 'TATASTEEL', 'GRASIM',
            'INDUSINDBK', 'M&M', 'TECHM', 'BRITANNIA', 'HINDALCO',
            'BAJAJFINSV', 'DRREDDY', 'HEROMOTOCO', 'CIPLA', 'EICHERMOT',
            'DIVISLAB', 'SHREECEM', 'APOLLOHOSP', 'BPCL', 'TATACONSUM',
            'ADANIENT', 'SBILIFE', 'HDFCLIFE', 'BAJAJ-AUTO', 'LTIM'
        ]

        # Verify stocks exist by checking if we can fetch their data
        verified_stocks = []
        for symbol in nifty50:
            try:
                ticker = yf.Ticker(f"{symbol}.NS")
                info = ticker.info
                if info and 'symbol' in info:
                    verified_stocks.append(symbol)
            except:
                continue

        print(f"✅ Found {len(verified_stocks)} NIFTY 50 stocks")
        return verified_stocks

    except Exception as e:
        print(f"⚠️  Error fetching NIFTY 50: {e}")
        print("Using fallback list...")
        return [
            'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
            'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
            'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'TITAN',
            'SUNPHARMA', 'ULTRACEMCO', 'NESTLEIND', 'BAJFINANCE', 'WIPRO'
        ]


def get_midcap_stocks(count=50):
    """Fetch random mid-cap stocks"""
    print(f"📊 Fetching {count} mid-cap stocks...")

    # Common mid-cap stocks
    midcap_universe = [
        'ABBOTINDIA', 'ACC', 'ADANIGREEN', 'ADANIPOWER', 'ALKEM',
        'AMBUJACEM', 'AUROPHARMA', 'BAJAJHLDNG', 'BANDHANBNK', 'BANKBARODA',
        'BERGEPAINT', 'BEL', 'BIOCON', 'BOSCHLTD', 'CANBK',
        'CHAMBLFERT', 'CHOLAFIN', 'COLPAL', 'CONCOR', 'COROMANDEL',
        'DABUR', 'DALBHARAT', 'DEEPAKNTR', 'DELTACORP', 'DLF',
        'ESCORTS', 'GAIL', 'GLENMARK', 'GODREJCP', 'GODREJPROP',
        'GUJGASLTD', 'HAVELLS', 'HDFCAMC', 'HINDPETRO', 'ICICIPRULI',
        'IDFCFIRSTB', 'INDHOTEL', 'INDIGO', 'IOC', 'JINDALSTEL',
        'L&TFH', 'LICHSGFIN', 'LUPIN', 'MARICO', 'MCDOWELL-N',
        'METROPOLIS', 'MFSL', 'MGL', 'MPHASIS', 'MRF',
        'NATIONALUM', 'NAUKRI', 'NMDC', 'OFSS', 'OIL',
        'PAGEIND', 'PEL', 'PETRONET', 'PFC', 'PIDILITIND',
        'PIIND', 'PNB', 'POLYCAB', 'RECLTD', 'SAIL',
        'SRF', 'SIEMENS', 'TORNTPHARM', 'TRENT', 'TVSMOTOR',
        'UBL', 'UNITDSPR', 'VEDL', 'VOLTAS', 'ZEEL'
    ]

    # Randomly select
    selected = random.sample(midcap_universe, min(count, len(midcap_universe)))
    print(f"✅ Selected {len(selected)} mid-cap stocks")
    return selected


def get_smallcap_stocks(count=50):
    """Fetch random small-cap stocks"""
    print(f"📊 Fetching {count} small-cap stocks...")

    # Common small-cap stocks
    smallcap_universe = [
        'AAVAS', 'AARTIIND', 'ABCAPITAL', 'ABFRL', 'AEGISCHEM',
        'AFFLE', 'AIAENG', 'AJANTPHARM', 'ALKYLAMINE', 'APLLTD',
        'AMARAJABAT', 'ANANDRATHI', 'ANGELONE', 'APARINDS', 'ASAHIINDIA',
        'ASHOKLEY', 'ASTERDM', 'ATUL', 'AUROPHARMA', 'AVANTIFEED',
        'BALRAMCHIN', 'BASF', 'BATAINDIA', 'BHARATFORG', 'BIRLACORPN',
        'BLUEDART', 'BLUESTARCO', 'BSE', 'CAMPUS', 'CANFINHOME',
        'CAPLIPOINT', 'CARBORUNIV', 'CDSL', 'CEATLTD', 'CENTURYTEX',
        'CERA', 'CHALET', 'CHEMCON', 'CLEAN', 'COALINDIA',
        'COCHINSHIP', 'COFORGE', 'CROMPTON', 'CUMMINSIND', 'CYIENT',
        'DCMSHRIRAM', 'DEEPAKFERT', 'DHANI', 'DIXON', 'DMART',
        'EMAMILTD', 'ENDURANCE', 'FINEORG', 'GICRE', 'GILLETTE',
        'GLAXO', 'GLENMARK', 'GMM', 'GNFC', 'GODFRYPHLP',
        'GRANULES', 'GRAPHITE', 'GREAVESCOT', 'GRINDWELL', 'GSFC',
        'GSHIPPO', 'GULFOILLUB', 'HAL', 'HAPPSTMNDS', 'HATSUN',
        'HCG', 'HEG', 'HERITGFOOD', 'HFCL', 'HIKAL'
    ]

    # Randomly select
    selected = random.sample(smallcap_universe, min(count, len(smallcap_universe)))
    print(f"✅ Selected {len(selected)} small-cap stocks")
    return selected


def analyze_and_log_stock(symbol, exchange='NSE', category=''):
    """Analyze a stock and log predictions"""
    try:
        print(f"\n{'=' * 60}")
        print(f"[{category}] Analyzing {symbol}...")
        print(f"{'=' * 60}")

        # Initialize services
        price_fetcher = RealTimePriceFetcher()
        predictor = AdvancedStockPredictor()
        feature_engineer = FeatureEngineer()
        tech_analyzer = TechnicalAnalyzer()

        # Get historical data (2 years)
        print(f"📊 Fetching historical data...")
        hist_data = price_fetcher.get_historical_data(symbol, exchange, period='2y')

        if hist_data is None or hist_data.empty:
            print(f"❌ No data available for {symbol}")
            return False

        # Feature engineering
        print(f"🔧 Creating features...")
        hist_data = feature_engineer.create_features(hist_data)
        hist_data = hist_data.dropna()

        if len(hist_data) < 100:
            print(f"❌ Insufficient data: {len(hist_data)} rows")
            return False

        # Technical indicators
        hist_data = tech_analyzer.calculate_indicators(hist_data)

        # Get current price
        current_price = float(hist_data['Close'].iloc[-1])
        print(f"💰 Current Price: ₹{current_price:.2f}")

        # Train or load model
        model_loaded = predictor.load_model(symbol)

        if not model_loaded:
            print(f"🤖 Training new model...")
            feature_cols = feature_engineer.select_features()
            feature_cols = [f for f in feature_cols if f in hist_data.columns]

            predictor.train(hist_data, feature_cols, validation_split=0.2)
            predictor.save_model(symbol)
            print(f"✅ Model trained and saved")
        else:
            print(f"✅ Loaded pre-trained model")

        # Generate predictions
        print(f"🔮 Generating predictions...")
        feature_cols = predictor.feature_names
        predictions = predictor.predict_multi_horizon(hist_data, feature_cols, current_price)

        # Log predictions to database
        now = datetime.now()

        for timeframe, pred_data in predictions.items():
            # Calculate target date
            if timeframe == 'intraday':
                target_date = now + timedelta(days=1)
            elif timeframe == 'weekly':
                target_date = now + timedelta(days=7)
            elif timeframe == 'monthly':
                target_date = now + timedelta(days=30)
            else:
                continue

            prediction = PredictionLog(
                symbol=symbol,
                exchange=exchange,
                prediction_date=now,
                timeframe=timeframe,
                predicted_price=pred_data.get('price', current_price),
                predicted_change_pct=pred_data.get('change_pct', 0),
                confidence=pred_data.get('confidence', 0),
                current_price_at_prediction=current_price,
                target_date=target_date,
                model_version='v3.0',
                features_used=len(feature_cols),
                is_validated=False
            )

            db.session.add(prediction)

            print(f"  {timeframe.upper()}: {pred_data.get('change_pct', 0):+.2f}% "
                  f"(₹{pred_data.get('price', 0):.2f}) "
                  f"Confidence: {pred_data.get('confidence', 0)}%")

        db.session.commit()
        print(f"✅ Predictions logged for {symbol}")
        return True

    except Exception as e:
        print(f"❌ Error analyzing {symbol}: {e}")
        db.session.rollback()
        return False


def main():
    """Main execution"""
    print("\n" + "=" * 70)
    print("STOCKPULSE - COMPREHENSIVE MARKET ANALYSIS")
    print("=" * 70)
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    # Get stocks dynamically
    print("\n🔍 Fetching stock lists...")
    nifty50 = get_nifty50_stocks()
    midcap = get_midcap_stocks(50)
    smallcap = get_smallcap_stocks(50)

    # Combine all stocks
    all_stocks = []
    all_stocks.extend([('NIFTY 50', symbol) for symbol in nifty50])
    all_stocks.extend([('MID CAP', symbol) for symbol in midcap])
    all_stocks.extend([('SMALL CAP', symbol) for symbol in smallcap])

    print(f"\n📊 Total stocks to analyze: {len(all_stocks)}")
    print(f"  - NIFTY 50: {len(nifty50)}")
    print(f"  - Mid Cap: {len(midcap)}")
    print(f"  - Small Cap: {len(smallcap)}")
    print("=" * 70)

    # Confirm before proceeding
    response = input("\n⚠️  This will take 2-4 hours. Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("\n❌ Analysis cancelled.")
        return

    app = create_app()

    with app.app_context():
        success_count = 0
        fail_count = 0

        category_stats = {
            'NIFTY 50': {'success': 0, 'fail': 0},
            'MID CAP': {'success': 0, 'fail': 0},
            'SMALL CAP': {'success': 0, 'fail': 0}
        }

        for i, (category, symbol) in enumerate(all_stocks, 1):
            print(f"\n[{i}/{len(all_stocks)}] Processing {category} - {symbol}...")

            if analyze_and_log_stock(symbol, category=category):
                success_count += 1
                category_stats[category]['success'] += 1
            else:
                fail_count += 1
                category_stats[category]['fail'] += 1

            # Progress update every 10 stocks
            if i % 10 == 0:
                progress = (i / len(all_stocks)) * 100
                print(f"\n📊 Progress: {progress:.1f}% ({i}/{len(all_stocks)})")

            # Small delay to avoid overwhelming system
            import time
            time.sleep(2)

        # Final Summary
        print("\n" + "=" * 70)
        print("ANALYSIS COMPLETE")
        print("=" * 70)
        print(f"\n✅ Successfully analyzed: {success_count} stocks")
        print(f"❌ Failed: {fail_count} stocks")
        print(f"📈 Success Rate: {(success_count / len(all_stocks) * 100):.1f}%")

        print(f"\n📊 By Category:")
        for category, stats in category_stats.items():
            total = stats['success'] + stats['fail']
            rate = (stats['success'] / total * 100) if total > 0 else 0
            print(f"  {category}:")
            print(f"    Success: {stats['success']}/{total} ({rate:.1f}%)")

        # Database stats
        total_predictions = PredictionLog.query.count()
        by_timeframe = db.session.query(
            PredictionLog.timeframe,
            db.func.count(PredictionLog.id)
        ).group_by(PredictionLog.timeframe).all()

        print(f"\n💾 Database Status:")
        print(f"  Total Predictions: {total_predictions}")
        for timeframe, count in by_timeframe:
            print(f"  {timeframe.upper()}: {count}")

        print("\n🎯 Next Steps:")
        print("  1. Day 1: Run python scripts/validate_simple.py (intraday)")
        print("  2. Day 7: Run python scripts/validate_simple.py (weekly)")
        print("  3. Day 30: Run python scripts/validate_simple.py (monthly)")
        print("  4. View accuracy: http://localhost:5173/backtesting")
        print("\n" + "=" * 70 + "\n")


if __name__ == '__main__':
    main()