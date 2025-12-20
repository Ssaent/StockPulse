"""
STOCKPULSE - PRODUCTION READY
Analyzes NIFTY 50 + Mid-cap + Small-cap stocks
Generates real AI analyses for production use
"""

import sys
import os
import sqlite3
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from services.ai_predictor import StockPredictor
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import warnings
warnings.filterwarnings('ignore')

def get_db_path():
    """Get database path"""
    return os.path.join(os.path.dirname(__file__), '..', 'instance', 'stockpulse.db')

def get_nifty50_stocks():
    """Get NIFTY 50 stocks"""
    return [
        {'symbol': s, 'category': 'NIFTY 50'} for s in [
            'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'ITC',
            'SBIN', 'BHARTIARTL', 'BAJFINANCE', 'KOTAKBANK', 'LT', 'AXISBANK',
            'ASIANPAINT', 'MARUTI', 'TITAN', 'SUNPHARMA', 'ULTRACEMCO', 'NESTLEIND',
            'WIPRO', 'ONGC', 'NTPC', 'POWERGRID', 'TATAMOTORS', 'TATASTEEL', 'M&M',
            'TECHM', 'BAJAJFINSV', 'HCLTECH', 'ADANIPORTS', 'DRREDDY', 'COALINDIA',
            'INDUSINDBK', 'JSWSTEEL', 'GRASIM', 'DIVISLAB', 'APOLLOHOSP', 'EICHERMOT',
            'BRITANNIA', 'CIPLA', 'SHREECEM', 'SBILIFE', 'HEROMOTOCO', 'UPL',
            'HINDALCO', 'TATACONSUM', 'BAJAJ-AUTO', 'ADANIENT', 'BPCL', 'HDFCLIFE'
        ]
    ]

def get_midcap_stocks():
    """Get mid-cap stocks"""
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
    return [{'symbol': s, 'category': 'MID CAP'} for s in random.sample(midcaps, 50)]

def get_smallcap_stocks():
    """Get small-cap stocks"""
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
    return [{'symbol': s, 'category': 'SMALL CAP'} for s in random.sample(smallcaps, 50)]

def verify_analysis_quality(predicted_price, current_price, confidence):
    """Verify analysis quality"""
    if predicted_price == 0 or current_price == 0:
        return False, "Zero price detected"

    change_pct = ((predicted_price - current_price) / current_price) * 100

    if abs(change_pct) < 0.01:
        return False, f"Change too small: {change_pct:.4f}%"

    if abs(change_pct) > 50:
        return False, f"Change too large: {change_pct:.2f}%"

    if confidence < 50:
        return False, f"Confidence too low: {confidence}%"

    return True, f"Valid analysis: {change_pct:+.2f}%"

def analyze_stock(symbol, category, predictor, cursor):
    """Analyze stock and save directly to SQLite"""
    try:
        print(f"\n{'='*60}")
        print(f"🔍 Analyzing {symbol} ({category})")
        print(f"{'='*60}")

        # Fetch current price
        ticker = yf.Ticker(f"{symbol}.NS")
        hist = ticker.history(period='1d')

        if hist.empty:
            print(f"❌ No data available for {symbol}")
            return 0

        current_price = float(hist['Close'].iloc[-1])
        print(f"💰 Current Price: ₹{current_price:.2f}")

        if current_price <= 0:
            print(f"❌ Invalid price: ₹{current_price}")
            return 0

        # Generate analyses
        print(f"🤖 Generating analyses...")
        analyses = {
            'intraday': predictor.predict(symbol, 'intraday'),
            'weekly': predictor.predict(symbol, 'weekly'),
            'monthly': predictor.predict(symbol, 'monthly')
        }

        valid_analyses = 0

        for timeframe, analysis_data in analyses.items():
            predicted_price = analysis_data['predicted_price']
            confidence = analysis_data['confidence']

            change_pct = ((predicted_price - current_price) / current_price) * 100

            is_valid, message = verify_analysis_quality(predicted_price, current_price, confidence)

            status = "✅" if is_valid else "⚠️"
            print(f"{status} {timeframe.upper():8} → ₹{predicted_price:.2f} ({change_pct:+.2f}%) | Conf: {confidence}% | {message}")

            if is_valid:
                valid_analyses += 1

                # Calculate target date
                if timeframe == 'intraday':
                    days = 1
                elif timeframe == 'weekly':
                    days = 7
                else:
                    days = 30

                target_date = datetime.now() + timedelta(days=days)

                # Save directly to SQLite
                cursor.execute("""
                    INSERT INTO prediction_logs 
                    (symbol, exchange, prediction_date, timeframe, predicted_price, 
                     predicted_change_pct, confidence, current_price_at_prediction, 
                     target_date, model_version, features_used, is_validated)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    symbol, 'NSE', datetime.now(), timeframe, predicted_price,
                    change_pct, confidence, current_price, target_date,
                    'v3.0', 28, False
                ))

        return valid_analyses

    except Exception as e:
        print(f"❌ Error analyzing {symbol}: {str(e)}")
        return 0

def main():
    print("="*60)
    print("STOCKPULSE - PRODUCTION ANALYSIS")
    print("Analyzing NIFTY 50 + Mid-cap + Small-cap stocks")
    print("="*60)

    db_path = get_db_path()
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found: {db_path}")
        return

    print(f"📊 Using database: {db_path}")

    # Initialize predictor
    print("\n🤖 Initializing AI Predictor...")
    predictor = StockPredictor()

    # Get all stocks (PRODUCTION: Full analysis)
    print("\n📊 Building complete stock list...")
    nifty_stocks = get_nifty50_stocks()
    midcap_stocks = get_midcap_stocks()
    smallcap_stocks = get_smallcap_stocks()

    all_stocks = nifty_stocks + midcap_stocks + smallcap_stocks

    print(f"\n📈 Total stocks to analyze: {len(all_stocks)}")
    print(f"  - NIFTY 50: {len(nifty_stocks)}")
    print(f"  - MID CAP: {len(midcap_stocks)}")
    print(f"  - SMALL CAP: {len(smallcap_stocks)}")

    # Production warning
    print(f"\n⚠️  PRODUCTION RUN: This will analyze {len(all_stocks)} stocks")
    print(f"   Estimated time: {len(all_stocks) * 0.5:.0f} minutes")
    response = input("\n⚠️  Continue with full production analysis? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Cancelled")
        return

    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    results = {'NIFTY 50': 0, 'MID CAP': 0, 'SMALL CAP': 0}
    total_processed = 0

    try:
        for i, stock in enumerate(all_stocks, 1):
            print(f"\n[{i}/{len(all_stocks)}] Processing {stock['category']} - {stock['symbol']}...")

            valid_count = analyze_stock(stock['symbol'], stock['category'], predictor, cursor)

            if valid_count > 0:
                results[stock['category']] += 1

            total_processed += 1

            # Progress update every 10 stocks
            if i % 10 == 0:
                progress = (i / len(all_stocks)) * 100
                print(f"\n📊 Progress: {progress:.1f}% | Processed: {i}/{len(all_stocks)} | Success: {sum(results.values())}")

        # Commit all changes
        conn.commit()
        print("\n✅ All analyses saved to database!")
        
        # Final summary
        total_success = sum(results.values())
        print(f"\n✅ Successfully analyzed: {total_success} stocks")
        print(f"❌ Failed: {total_processed - total_success} stocks")
        print(f"📈 Success Rate: {(total_success / len(all_stocks) * 100):.1f}%")

        print(f"\n📊 By Category:")
        for category, success_count in results.items():
            total_in_category = len([s for s in all_stocks if s['category'] == category])
            rate = (success_count / total_in_category * 100) if total_in_category > 0 else 0
            print(f"  {category}: Success: {success_count}/{total_in_category} ({rate:.1f}%)")

        # Database summary
        cursor.execute("SELECT COUNT(*) FROM prediction_logs")
        total_analyses = cursor.fetchone()[0]
        print(f"\n💾 Database Status:")
        print(f"  Total Analyses: {total_analyses}")

        # Timeframe breakdown
        cursor.execute("SELECT timeframe, COUNT(*) FROM prediction_logs GROUP BY timeframe")
        timeframe_counts = cursor.fetchall()
        for timeframe, count in timeframe_counts:
            print(f"  {timeframe.upper()}: {count}")

        print(f"\n🎯 PRODUCTION COMPLETE!")
        print(f"  Users can now see {total_analyses} AI analyses on the dashboard")
        print(f"  Analyses will be validated automatically over time")
        print(f"  View accuracy: http://localhost:5173/backtesting")

        print("\n" + "="*60)

    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    main()