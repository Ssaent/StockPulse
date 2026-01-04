"""
Real-time Market Data API
Provides live NIFTY 50, SENSEX, Gold, and Silver data
backend/features/market.py
"""

from flask import Blueprint, jsonify, request
import yfinance as yf
from datetime import datetime
import pytz
from services.commodity_fetcher import CommodityPriceFetcher

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
    Get real-time market indices including NIFTY, SENSEX, Gold (22k & 24k), and Silver
    Returns comprehensive market data for ticker display
    """
    try:
        # Initialize commodity fetcher
        commodity_fetcher = CommodityPriceFetcher()

        # Fetch NIFTY 50
        nifty = yf.Ticker("^NSEI")
        nifty_hist = nifty.history(period='2d')

        # Fetch SENSEX
        sensex = yf.Ticker("^BSESN")
        sensex_hist = sensex.history(period='2d')

        # Fetch Gold and Silver from reliable Indian sources
        commodity_data = commodity_fetcher.get_gold_silver_prices()

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

        # Use commodity data for gold and silver
        gold_24k_data = commodity_data.get('gold_24k', {'value': 62450, 'change': 0, 'changePercent': 0})
        gold_22k_data = commodity_data.get('gold_22k', {'value': 57329, 'change': 0, 'changePercent': 0})
        silver_data = commodity_data.get('silver', {'value': 74320, 'change': 0, 'changePercent': 0})

        # Get current timestamp in IST
        ist = pytz.timezone('Asia/Kolkata')
        now_ist = datetime.now(ist)

        return jsonify({
            'nifty': nifty_data,
            'sensex': sensex_data,
            'gold_24k': gold_24k_data,
            'gold_22k': gold_22k_data,
            'silver': silver_data,
            'timestamp': now_ist.isoformat(),
            'source': commodity_data.get('source', 'Multiple Sources'),
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


@market_bp.route('/chart', methods=['GET'])
def get_chart_data():
    """
    Get intraday chart data for a specific stock/index
    Returns time series data for charting
    """
    try:
        symbol = request.args.get('symbol', '^NSEI')  # Default to Nifty 50
        period = request.args.get('period', '1d')
        interval = request.args.get('interval', '15m')

        # Map frontend periods to yfinance intervals
        interval_map = {
            '1m': '1m',
            '5m': '5m',
            '15m': '15m',
            '30m': '30m',
            '1h': '1h',
            '1d': '1d'
        }

        yf_interval = interval_map.get(interval, '15m')

        # Get intraday chart data
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period, interval=yf_interval)

        if data.empty:
            return jsonify({
                'error': 'No data available',
                'symbol': symbol
            }), 404

        # Convert to format suitable for frontend charts
        chart_data = []
        for timestamp, row in data.iterrows():
            chart_data.append({
                'time': timestamp.strftime('%H:%M'),
                'value': round(float(row['Close']), 2),
                'open': round(float(row['Open']), 2),
                'high': round(float(row['High']), 2),
                'low': round(float(row['Low']), 2),
                'volume': int(row['Volume'])
            })

        # Use EXACT same calculation as indices API
        # Get 2 days of data just like indices API does
        full_data = ticker.history(period='2d')

        # Use the calculate_change helper function from indices API
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

        change_data = calculate_change(full_data)

        # Summary with same structure as indices API
        summary = {
            'current': change_data['value'],
            'open': round(float(data['Open'].iloc[0]), 2),
            'high': round(float(data['High'].max()), 2),
            'low': round(float(data['Low'].min()), 2),
            'change': change_data['change'],
            'changePercent': change_data['changePercent'],
            'volume': int(data['Volume'].sum())
        }

        # Add closing price at 15:30 if market is closed and last point is not at 15:30
        if chart_data and chart_data[-1]['time'] != '15:30':
            # Use the current price from summary as the closing price
            closing_price = summary['current']
            # Use the last data point's high/low/open as fallback
            last_point = chart_data[-1]
            chart_data.append({
                'time': '15:30',
                'value': closing_price,
                'open': last_point['value'],  # Use previous close as open for closing candle
                'high': max(last_point['high'], closing_price),
                'low': min(last_point['low'], closing_price),
                'volume': last_point['volume']  # Keep same volume
            })

        return jsonify({
            'symbol': symbol,
            'period': period,
            'interval': interval,
            'data': chart_data,
            'summary': summary,
            'timestamp': datetime.now(pytz.timezone('Asia/Kolkata')).isoformat()
        }), 200

    except Exception as e:
        print(f"Error fetching chart data: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to fetch chart data',
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