"""
Fixed Stock Analysis Script - Ensures Real Predictions
Analyzes NIFTY 50 + Random 100 stocks (mid-cap + small-cap)
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import create_app
from database.models import db, PredictionLog
from services.ai_predictor import StockPredictor
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import warnings
warnings.filterwarnings('ignore')

def get_nifty50_stocks():
    """Get NIFTY 50 stocks"""
    nifty50 = [
        'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'ITC',
        'SBIN', 'BHARTIARTL', 'BAJFINANCE', 'KOTAKBANK', 'LT', 'AXISBANK',
        'ASIANPAINT', 'MARUTI', 'TITAN', 'SUNPHARMA', 'ULTRACEMCO', 'NESTLEIND',
        'WIPRO', 'ONGC', 'NTPC', 'POWERGRID', 'TATAMOTORS', 'TATASTEEL', 'M&M',
        'TECHM', 'BAJAJFINSV', 'HCLTECH', 'ADANIPORTS', 'DRREDDY', 'COALINDIA',
        'INDUSINDBK', 'JSWSTEEL', 'GRASIM', 'DIVISLAB', 'APOLLOHOSP', 'EICHERMOT',
        'BRITANNIA', 'CIPLA', 'SHREECEM', 'SBILIFE', 'HEROMOTOCO', 'UPL',
        'HINDALCO', 'TATACONSUM', 'BAJAJ-AUTO', 'ADANIENT', 'BPCL', 'HDFCLIFE'
    ]
    return [{'symbol': s, 'category': 'NIFTY 50'} for s in nifty50]

def get_midcap_stocks(count=50):
    """Get random mid-cap stocks"""
    midcaps = [
        'CHOLAFIN', 'GODREJCP', 'MCDOWELL-N', 'DABUR', 'BANDHANBNK', 'VOLTAS',
        'GODREJPROP', 'INDIGO', 'HAVELLS', 'PIDILITIND', 'MARICO', 'MPHASIS',
        'INDUSTOWER', 'GAIL', 'BERGEPAINT', 'VEDL', 'BOSCHLTD', 'GLAND',
        'AMBUJACEM', 'ESCORTS', 'MUTHOOTFIN', 'OFSS', 'TATAPOWER', 'ALKEM',
        'IPCALAB', 'CONCOR', 'NMDC', 'RECLTD', 'INDHOTEL', 'LUPIN', 'CUMMINSIND',
        'SAIL', 'APOLLOTYRE', 'Dixon', 'JINDALSTEL', 'IRCTC', 'JUBLFOOD',
        'SUNTV', 'BATAINDIA', 'TRENT', 'IDEA', 'STAR', 'AUROPHARMA', 'BEL',
        'HAL', 'PERSISTENT', 'COFORGE', 'LICHSGFIN', 'CANFINHOME', 'ABCAPITAL',
        'PEL', 'DALBHARAT', 'LAURUSLABS', 'RAIN', 'MRF', 'BALKRISIND',
        'ATUL', 'KPITTECH', 'POLYCAB', 'TORNTPHARM', 'LTTS', 'ZYDUSLIFE',
        'SRF', 'PAGEIND', 'CASTROLIND', 'ENDURANCE', 'METROPOLIS', 'ASTRAL',
        'CHAMBLFERT', 'GMRINFRA', 'L&TFH', 'MOTHERSON'
    ]
    return [{'symbol': s, 'category': 'MID CAP'} for s in random.sample(midcaps, min(count, len(midcaps)))]

def get_smallcap_stocks(count=50):
    """Get random small-cap stocks"""
    smallcaps = [
        'IDFCFIRSTB', 'ZEEL', 'LINDEINDIA', 'NATIONALUM', 'RBLBANK', 'CROMPTON',
        'GODREJIND', 'ASHOKLEY', 'CENTRALBK', 'FEDERALBNK', 'APLAPOLLO',
        'CANBK', 'EDELWEISS', 'BHARATFORG', 'DELTACORP', 'CHOLAHLDNG', 'HATSUN',
        'IEX', 'NILASPACES', 'PNBHOUSING', 'ROUTE', 'SHYAMMETL', 'SOBHA',
        'SYNGENE', 'TIMKEN', 'UJJIVAN', 'VARROC', 'WELCORP', 'WHIRLPOOL',
        'GESHIP', 'IFBIND', 'JKCEMENT', 'KANSAINER', 'KAPSTON', 'KEI',
        'LALPATHLAB', 'MANAPPURAM', 'MRPL', 'NATCOPHARM', 'NAVINFLUOR',
        'NETWORK18', 'OBEROIRLTY', 'ORIENTELEC', 'PAISALO', 'PARAGMILK',
        'PGHH', 'PHOENIXLTD', 'PRSMJOHNSN', 'QUESS', 'RAJESHEXPO', 'RAMCOCEM',
        'RELAXO', 'SADBHAV', 'SCHNEIDER', 'SHARDACROP', 'SJVN', 'SKFINDIA',
        'SOUTHBANK', 'SPARC', 'SPICEJET', 'SRTRANSFIN', 'STARCEMENT', 'STLTECH',
        'SUNDRMFAST', 'SUPRAJIT', 'SUPREMEIND', 'SWANENERGY', 'SYMPHONY',
        'TATAELXSI', 'TCIEXP', 'TECHM', 'THERMAX', 'THYROCARE'
    ]
    return [{'symbol': s, 'category': 'SMALL CAP'} for s in random.sample(smallcaps, min(count, len(smallcaps)))]

def verify_prediction_quality(predicted_price, current_price, confidence):
    """Verify that prediction makes sense"""
    if predicted_price == 0 or current_price == 0:
        return False, "Zero price detected"

    change_pct = ((predicted_price - current_price) / current_price) * 100

    # Check if change is reasonable
    if abs(change_pct) < 0.01:
        return False, f"Change too small: {change_pct:.4f}%"

    if abs(change_pct) > 50:
        return False, f"Change too large: {change_pct:.2f}%"

    if confidence < 50:
        return False, f"Confidence too low: {confidence}%"

    return True, f"Valid prediction: {change_pct:+.2f}%"

def analyze_stock(symbol, category, predictor):
    """Analyze a single stock with detailed logging"""
    try:
        print(f"\n{'='*60}")
        print(f"🔍 Analyzing {symbol} ({category})")
        print(f"{'='*60}")

        # Fetch current price
        ticker = yf.Ticker(f"{symbol}.NS")
        hist = ticker.history(period='1d')

        if hist.empty:
            print(f"❌ No data available for {symbol}")
            return False

        current_price = float(hist['Close'].iloc[-1])
        print(f"💰 Current Price: ₹{current_price:.2f}")

        if current_price <= 0:
            print(f"❌ Invalid price: ₹{current_price}")
            return False

        # Generate predictions
        print(f"🤖 Generating predictions...")

        predictions = {
            'intraday': predictor.predict(symbol, 'intraday'),
            'weekly': predictor.predict(symbol, 'weekly'),
            'monthly': predictor.predict(symbol, 'monthly')
        }

        # Verify and log each prediction
        valid_predictions = 0

        for timeframe, pred_data in predictions.items():
            predicted_price = pred_data['predicted_price']
            confidence = pred_data['confidence']

            # Calculate change
            change_pct = ((predicted_price - current_price) / current_price) * 100

            # Verify quality
            is_valid, message = verify_prediction_quality(predicted_price, current_price, confidence)

            status = "✅" if is_valid else "⚠️"
            print(f"{status} {timeframe.upper():8} → ₹{predicted_price:.2f} ({change_pct:+.2f}%) | Conf: {confidence}% | {message}")

            if is_valid:
                valid_predictions += 1

                # Calculate target date
                if timeframe == 'intraday':
                    target_date = datetime.now() + timedelta(days=1)
                elif timeframe == 'weekly':
                    target_date = datetime.now() + timedelta(days=7)
                else:  # monthly
                    target_date = datetime.now() + timedelta(days=30)

                # Create prediction log
                prediction_log = PredictionLog(
                    symbol=symbol,
                    exchange='NSE',
                    prediction_date=datetime.now(),
                    timeframe=timeframe,
                    predicted_price=predicted_price,
                    predicted_change_pct=change_pct,
                    confidence=confidence,
                    current_price_at_prediction=current_price,
                    target_date=target_date,
                    model_version='v3.0',
                    features_used=28,
                    is_validated=False
                )

                db.session.add(prediction_log)

        if valid_predictions > 0:
            db.session.commit()
            print(f"✅ Logged {valid_predictions}/3 valid predictions for {symbol}")
            return True
        else:
            print(f"❌ No valid predictions for {symbol}")
            return False

    except Exception as e:
        print(f"❌ Error analyzing {symbol}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("="*60)
    print("STOCKPULSE - COMPREHENSIVE MARKET ANALYSIS")
    print("="*60)

    # Create Flask app context
    app = create_app()

    with app.app_context():
        # Initialize predictor
        print("\n🤖 Initializing AI Predictor...")
        predictor = StockPredictor()

        # Get stock lists
        print("\n📊 Building stock list...")
        nifty_stocks = get_nifty50_stocks()
        midcap_stocks = get_midcap_stocks(50)
        smallcap_stocks = get_smallcap_stocks(50)

        all_stocks = nifty_stocks + midcap_stocks + smallcap_stocks

        print(f"\n📈 Total stocks to analyze: {len(all_stocks)}")
        print(f"  - NIFTY 50: {len(nifty_stocks)}")
        print(f"  - MID CAP: {len(midcap_stocks)}")
        print(f"  - SMALL CAP: {len(smallcap_stocks)}")

        # Confirm
        response = input("\n⚠️  This will take 2-4 hours. Continue? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ Cancelled")
            return

        # Analyze all stocks
        results = {
            'NIFTY 50': {'success': 0, 'failed': 0},
            'MID CAP': {'success': 0, 'failed': 0},
            'SMALL CAP': {'success': 0, 'failed': 0}
        }

        for i, stock in enumerate(all_stocks, 1):
            print(f"\n[{i}/{len(all_stocks)}] Processing {stock['category']} - {stock['symbol']}...")

            success = analyze_stock(stock['symbol'], stock['category'], predictor)

            if success:
                results[stock['category']]['success'] += 1
            else:
                results[stock['category']]['failed'] += 1

            # Progress update every 10 stocks
            if i % 10 == 0:
                total_success = sum(r['success'] for r in results.values())
                progress = (i / len(all_stocks)) * 100
                print(f"\n📊 Progress: {progress:.1f}% | Successful: {total_success}/{i}")

        # Final summary
        print("\n" + "="*60)
        print("ANALYSIS COMPLETE")
        print("="*60)

        total_success = sum(r['success'] for r in results.values())
        total_failed = sum(r['failed'] for r in results.values())

        print(f"\n✅ Successfully analyzed: {total_success} stocks")
        print(f"❌ Failed: {total_failed} stocks")
        print(f"📈 Success Rate: {(total_success / len(all_stocks) * 100):.1f}%")

        print(f"\n📊 By Category:")
        for category, stats in results.items():
            total = stats['success'] + stats['failed']
            rate = (stats['success'] / total * 100) if total > 0 else 0
            print(f"  {category}: Success: {stats['success']}/{total} ({rate:.1f}%)")

        # Database summary
        total_predictions = PredictionLog.query.count()
        intraday = PredictionLog.query.filter_by(timeframe='intraday').count()
        weekly = PredictionLog.query.filter_by(timeframe='weekly').count()
        monthly = PredictionLog.query.filter_by(timeframe='monthly').count()

        print(f"\n💾 Database Status:")
        print(f"  Total Predictions: {total_predictions}")
        print(f"  INTRADAY: {intraday}")
        print(f"  WEEKLY: {weekly}")
        print(f"  MONTHLY: {monthly}")

        print(f"\n🎯 Next Steps:")
        print(f"  1. Day 1: Run python scripts/validate_simple.py (intraday)")
        print(f"  2. Day 7: Run python scripts/validate_simple.py (weekly)")
        print(f"  3. Day 30: Run python scripts/validate_simple.py (monthly)")
        print(f"  4. View accuracy: http://localhost:5173/backtesting")

        print("\n" + "="*60)

if __name__ == '__main__':
    main()