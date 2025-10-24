"""
Stock Price Fetcher Service
Handles fetching historical and real-time stock data
"""

import yfinance as yf
import pandas as pd
from typing import Optional
from datetime import datetime, timedelta


class StockPriceFetcher:
    """Service for fetching stock price data"""

    def __init__(self):
        self.cache = {}
        self.cache_duration = timedelta(minutes=5)

    def get_historical_data(
            self,
            symbol: str,
            exchange: str = 'NSE',
            period: str = '1mo',
            interval: str = '1d'
    ) -> Optional[pd.DataFrame]:
        """
        Fetch historical stock data

        Args:
            symbol: Stock symbol (e.g., 'RELIANCE')
            exchange: Exchange code ('NSE' or 'BSE')
            period: Data period ('1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max')
            interval: Data interval ('1m', '5m', '15m', '1h', '1d', '1wk', '1mo')

        Returns:
            DataFrame with OHLCV data or None if fetch fails
        """
        try:
            # Format ticker symbol for yfinance
            if exchange.upper() == 'NSE':
                ticker_symbol = f"{symbol}.NS"
            elif exchange.upper() == 'BSE':
                ticker_symbol = f"{symbol}.BO"
            else:
                ticker_symbol = symbol

            # Check cache
            cache_key = f"{ticker_symbol}_{period}_{interval}"
            if cache_key in self.cache:
                cached_data, cached_time = self.cache[cache_key]
                if datetime.now() - cached_time < self.cache_duration:
                    return cached_data

            # Fetch data from yfinance
            ticker = yf.Ticker(ticker_symbol)
            data = ticker.history(period=period, interval=interval)

            if data.empty:
                print(f"No data available for {ticker_symbol}")
                return None

            # Cache the data
            self.cache[cache_key] = (data, datetime.now())

            print(f"Successfully fetched {len(data)} days of data for {symbol}")
            return data

        except Exception as e:
            print(f"Error fetching data for {symbol}: {e}")
            return None

    def get_current_price(
            self,
            symbol: str,
            exchange: str = 'NSE'
    ) -> Optional[float]:
        """
        Get current/latest price for a symbol

        Args:
            symbol: Stock symbol
            exchange: Exchange code

        Returns:
            Current price or None if unavailable
        """
        try:
            data = self.get_historical_data(symbol, exchange, period='1d', interval='1m')

            if data is None or data.empty:
                # Fallback to daily data
                data = self.get_historical_data(symbol, exchange, period='5d', interval='1d')

            if data is not None and not data.empty:
                return float(data['Close'].iloc[-1])

            return None

        except Exception as e:
            print(f"Error getting current price for {symbol}: {e}")
            return None

    def get_price_at_date(
            self,
            symbol: str,
            exchange: str,
            target_date: datetime
    ) -> Optional[float]:
        """
        Get stock price at a specific date

        Args:
            symbol: Stock symbol
            exchange: Exchange code
            target_date: Target date

        Returns:
            Price at date or None if unavailable
        """
        try:
            # Get data around target date
            start_date = target_date - timedelta(days=5)
            end_date = target_date + timedelta(days=5)

            # Format ticker
            if exchange.upper() == 'NSE':
                ticker_symbol = f"{symbol}.NS"
            elif exchange.upper() == 'BSE':
                ticker_symbol = f"{symbol}.BO"
            else:
                ticker_symbol = symbol

            # Download data
            ticker = yf.Ticker(ticker_symbol)
            data = ticker.history(start=start_date, end=end_date)

            if data.empty:
                return None

            # Normalize timezone
            if hasattr(data.index, 'tz') and data.index.tz is not None:
                data.index = data.index.tz_localize(None)

            if hasattr(target_date, 'tzinfo') and target_date.tzinfo is not None:
                target_date = target_date.replace(tzinfo=None)

            # Try exact match
            target_date_str = target_date.strftime('%Y-%m-%d')
            for idx in data.index:
                if idx.strftime('%Y-%m-%d') == target_date_str:
                    return float(data.loc[idx]['Close'])

            # Find closest date
            closest_date = None
            min_diff = float('inf')

            for idx in data.index:
                diff = abs((idx - target_date).total_seconds())
                if diff < min_diff:
                    min_diff = diff
                    closest_date = idx

            if closest_date is not None:
                return float(data.loc[closest_date]['Close'])

            return None

        except Exception as e:
            print(f"Error getting price at date for {symbol}: {e}")
            return None

    def clear_cache(self):
        """Clear the price data cache"""
        self.cache.clear()

    def get_multiple_stocks(
            self,
            symbols: list,
            exchange: str = 'NSE',
            period: str = '1mo'
    ) -> dict:
        """
        Fetch data for multiple stocks at once

        Args:
            symbols: List of stock symbols
            exchange: Exchange code
            period: Data period

        Returns:
            Dictionary mapping symbols to DataFrames
        """
        results = {}

        for symbol in symbols:
            data = self.get_historical_data(symbol, exchange, period)
            if data is not None:
                results[symbol] = data

        return results