"""Real-time price fetcher"""
import yfinance as yf
from datetime import datetime
import pandas as pd

class RealTimePriceFetcher:

    @staticmethod
    def get_live_price(symbol, exchange='NSE'):
        """Get current price and stats"""
        yf_symbol = f"{symbol}.{exchange[:2]}"

        try:
            ticker = yf.Ticker(yf_symbol)
            hist = ticker.history(period='1d', interval='1m')

            if hist.empty:
                return None

            current = float(hist['Close'].iloc[-1])
            open_price = float(hist['Open'].iloc[0])

            return {
                'symbol': symbol,
                'price': round(current, 2),
                'open': round(open_price, 2),
                'high': round(float(hist['High'].max()), 2),
                'low': round(float(hist['Low'].min()), 2),
                'volume': int(hist['Volume'].sum()),
                'change': round(((current - open_price) / open_price) * 100, 2),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Price fetch error for {symbol}: {e}")
            return None

    @staticmethod
    def get_historical_data(symbol, exchange='NSE', period='5y'):  # Changed from 1y to 5y
        """Get historical data for analysis"""
        yf_symbol = f"{symbol}.{exchange[:2]}"

        try:
            ticker = yf.Ticker(yf_symbol)
            # Get 5 years of data instead of 1 year
            data = ticker.history(period=period)

            if data.empty:
                print(f"No data returned for {yf_symbol}")
                return None

            print(f"Successfully fetched {len(data)} days of data for {symbol}")
            return data

        except Exception as e:
            print(f"Historical data error for {symbol}: {e}")
            return None