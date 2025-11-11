"""
Real-time Market Data API
Provides live NIFTY 50, SENSEX, Gold, and Silver data
backend/features/market.py
"""

from flask import Blueprint, jsonify
import yfinance as yf
from datetime import datetime
import pytz

market_bp = Blueprint('market', __name__)


@market_bp.route('/live', methods=['GET'])
def get_market_data():
    """
    Get live market data for NIFTY 50 and SENSEX
    Returns current prices, changes, and market status
    """
    try:
        # Fetch NIFTY 50 data
        nifty = yf.Ticker("^NSEI")
        nifty_info = nifty.info
        nifty_hist = nifty.history(period='1d')

        # Fetch SENSEX data
        sensex = yf.Ticker("^BSESN")
        sensex_info = sensex.info
        sensex_hist = sensex.history(period='1d')

        # Extract NIFTY values
        nifty_price = nifty_info.get('regularMarketPrice', 0)
        nifty_prev_close = nifty_info.get('previousClose', 0)

        # Fallback to history if info doesn't have current price
        if nifty_price == 0 and not nifty_hist.empty:
            nifty_price = float(nifty_hist['Close'].iloc[-1])
            nifty_prev_close = float(nifty_hist['Open'].iloc[-1])

        nifty_change = nifty_price - nifty_prev_close
        nifty_change_percent = (nifty_change / nifty_prev_close * 100) if nifty_prev_close else 0

        # Extract SENSEX values
        sensex_price = sensex_info.get('regularMarketPrice', 0)
        sensex_prev_close = sensex_info.get('previousClose', 0)

        # Fallback to history if info doesn't have current price
        if sensex_price == 0 and not sensex_hist.empty:
            sensex_price = float(sensex_hist['Close'].iloc[-1])
            sensex_prev_close = float(sensex_hist['Open'].iloc[-1])

        sensex_change = sensex_price - sensex_prev_close
        sensex_change_percent = (sensex_change / sensex_prev_close * 100) if sensex_prev_close else 0

        # Determine market status
        ist = pytz.timezone('Asia/Kolkata')
        now_ist = datetime.now(ist)
        current_time = now_ist.hour * 60 + now_ist.minute
        market_open = 9 * 60 + 15  # 9:15 AM
        market_close = 15 * 60 + 30  # 3:30 PM
        is_weekend = now_ist.weekday() >= 5  # Saturday = 5, Sunday = 6

        # Check if market is open
        if is_weekend:
            status = "Closed"
        elif market_open <= current_time <= market_close:
            status = "Open"
        else:
            status = "Closed"

        return jsonify({
            'status': status,
            'timestamp': now_ist.isoformat(),
            'nifty': {
                'value': round(nifty_price, 2),
                'change': round(nifty_change, 2),
                'changePercent': round(nifty_change_percent, 2)
            },
            'sensex': {
                'value': round(sensex_price, 2),
                'change': round(sensex_change, 2),
                'changePercent': round(sensex_change_percent, 2)
            }
        }), 200

    except Exception as e:
        print(f"Error fetching market data: {e}")
        return jsonify({
            'error': 'Failed to fetch market data',
            'message': str(e)
        }), 500


@market_bp.route('/indices', methods=['GET'])
def get_market_indices():
    """
    Get real-time market indices including NIFTY, SENSEX, Gold, and Silver
    Returns comprehensive market data for ticker display
    """
    try:
        # Fetch NIFTY 50
        nifty = yf.Ticker("^NSEI")
        nifty_hist = nifty.history(period='2d')

        # Fetch SENSEX
        sensex = yf.Ticker("^BSESN")
        sensex_hist = sensex.history(period='2d')

        # Fetch Gold (GC=F is Gold Futures in USD/oz)
        gold = yf.Ticker("GC=F")
        gold_hist = gold.history(period='2d')

        # Fetch Silver (SI=F is Silver Futures in USD/oz)
        silver = yf.Ticker("SI=F")
        silver_hist = silver.history(period='2d')

        # Helper function to calculate change
        def calculate_change(data):
            if len(data) >= 2:
                current = float(data['Close'].iloc[-1])
                previous = float(data['Close'].iloc[-2])
                change = current - previous
                change_percent = (change / previous) * 100
                return {
                    'value': round(current, 2),
                    'change': round(change, 2),
                    'changePercent': round(change_percent, 2)
                }
            elif len(data) == 1:
                # If only one day of data, use Open as previous
                current = float(data['Close'].iloc[-1])
                previous = float(data['Open'].iloc[-1])
                change = current - previous
                change_percent = (change / previous) * 100 if previous else 0
                return {
                    'value': round(current, 2),
                    'change': round(change, 2),
                    'changePercent': round(change_percent, 2)
                }
            return {'value': 0, 'change': 0, 'changePercent': 0}

        # Calculate NIFTY
        nifty_data = calculate_change(nifty_hist)

        # Calculate SENSEX
        sensex_data = calculate_change(sensex_hist)

        # Calculate Gold (convert from USD/oz to INR/10g)
        # 1 troy ounce = 31.1035 grams
        # Current USD to INR rate (approximate - you can use a live API)
        usd_to_inr = 83.0  # Update this with live rate if needed
        gold_raw = calculate_change(gold_hist)
        gold_data = {
            'value': round(gold_raw['value'] * usd_to_inr / 31.1035 * 10, 0),  # Per 10 grams
            'change': round(gold_raw['change'] * usd_to_inr / 31.1035 * 10, 0),
            'changePercent': gold_raw['changePercent']
        }

        # Calculate Silver (convert from USD/oz to INR/kg)
        silver_raw = calculate_change(silver_hist)
        silver_data = {
            'value': round(silver_raw['value'] * usd_to_inr / 31.1035 * 1000, 0),  # Per kilogram
            'change': round(silver_raw['change'] * usd_to_inr / 31.1035 * 1000, 0),
            'changePercent': silver_raw['changePercent']
        }

        # Get current timestamp in IST
        ist = pytz.timezone('Asia/Kolkata')
        now_ist = datetime.now(ist)

        return jsonify({
            'nifty': nifty_data,
            'sensex': sensex_data,
            'gold': gold_data,
            'silver': silver_data,
            'timestamp': now_ist.isoformat(),
            'currency': {
                'gold': 'INR per 10g',
                'silver': 'INR per kg'
            }
        }), 200

    except Exception as e:
        print(f"Error fetching market indices: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to fetch market indices',
            'message': str(e)
        }), 500


@market_bp.route('/status', methods=['GET'])
def get_market_status():
    """
    Get just the market open/closed status
    """
    try:
        ist = pytz.timezone('Asia/Kolkata')
        now_ist = datetime.now(ist)
        current_time = now_ist.hour * 60 + now_ist.minute
        market_open = 9 * 60 + 15  # 9:15 AM IST
        market_close = 15 * 60 + 30  # 3:30 PM IST
        is_weekend = now_ist.weekday() >= 5

        if is_weekend:
            status = "Closed"
            reason = "Weekend"
        elif current_time < market_open:
            status = "Closed"
            reason = "Before market hours"
        elif current_time > market_close:
            status = "Closed"
            reason = "After market hours"
        else:
            status = "Open"
            reason = "Trading hours"

        return jsonify({
            'status': status,
            'reason': reason,
            'timestamp': now_ist.isoformat(),
            'market_hours': {
                'open': '09:15 AM IST',
                'close': '03:30 PM IST'
            }
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get market status',
            'message': str(e)
        }), 500