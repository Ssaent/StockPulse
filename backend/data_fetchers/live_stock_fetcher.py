"""StockPulse - Live NSE/BSE Stock Data Fetcher"""
import requests
import pandas as pd
import yfinance as yf
import time
from datetime import datetime


class LiveStockFetcher:
    def __init__(self):
        self.nse_cache = None
        self.bse_cache = None
        self.cache_timestamp = None
        self.cache_duration = 3600

    def fetch_nse_stocks(self, force_refresh=False):
        """Fetch all NSE stocks from NSE India"""
        if not force_refresh and self.nse_cache and self._is_cache_valid():
            print(f"Using cached NSE data ({len(self.nse_cache)} stocks)")
            return self.nse_cache

        print("Fetching NSE stocks from official source...")

        try:
            url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"
            df = pd.read_csv(url)

            stocks = []
            for _, row in df.iterrows():
                stocks.append({
                    'symbol': str(row['SYMBOL']),
                    'name': str(row['NAME OF COMPANY']),
                    'exchange': 'NSE',
                    'yf_symbol': f"{row['SYMBOL']}.NS"
                })

            self.nse_cache = stocks
            self.cache_timestamp = time.time()
            print(f"Successfully loaded {len(stocks)} NSE stocks")
            return stocks

        except Exception as e:
            print(f"Error fetching NSE: {e}")
            return self._get_fallback_stocks()

    def fetch_bse_stocks(self, force_refresh=False):
        """Fetch BSE stocks"""
        if not force_refresh and self.bse_cache and self._is_cache_valid():
            return self.bse_cache

        print("Using BSE fallback list...")
        # BSE API is limited, using major stocks
        major_bse = ['500325', '532540', '500180', '500209']  # Reliance, TCS, HDFC, Infosys BSE codes

        stocks = [{'symbol': code, 'name': code, 'exchange': 'BSE', 'yf_symbol': f"{code}.BO"}
                  for code in major_bse]

        self.bse_cache = stocks
        self.cache_timestamp = time.time()
        return stocks

    def search_stock(self, query, exchange='NSE'):
        """Search stocks by symbol or name"""
        query = query.upper().strip()
        stocks = self.fetch_nse_stocks() if exchange == 'NSE' else self.fetch_bse_stocks()

        results = [s for s in stocks if query in s['symbol'].upper() or query in s['name'].upper()]
        return results[:20]

    def _is_cache_valid(self):
        if not self.cache_timestamp:
            return False
        return (time.time() - self.cache_timestamp) < self.cache_duration

    def _get_fallback_stocks(self):
        """Fallback major NSE stocks"""
        major = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN',
                 'BHARTIARTL', 'ITC', 'HINDUNILVR', 'KOTAKBANK']

        return [{'symbol': s, 'name': s, 'exchange': 'NSE', 'yf_symbol': f"{s}.NS"}
                for s in major]