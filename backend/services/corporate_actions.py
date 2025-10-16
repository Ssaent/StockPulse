"""
Corporate Actions Tracker
Tracks dividends, splits, bonuses, earnings dates
"""

import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd

class CorporateActionsTracker:
    """Track corporate actions for stocks"""

    def get_corporate_actions(self, symbol, exchange='NSE'):
        """Get all corporate actions for a stock"""
        yf_symbol = f"{symbol}.{exchange[:2]}"

        try:
            ticker = yf.Ticker(yf_symbol)

            actions = {
                'dividends': self._get_dividends(ticker),
                'splits': self._get_splits(ticker),
                'earnings': self._get_earnings_dates(ticker),
                'upcoming_events': self._get_upcoming_events(ticker, symbol)
            }

            return actions

        except Exception as e:
            print(f"Error fetching corporate actions: {e}")
            return None

    def _get_dividends(self, ticker):
        """Get dividend history"""
        try:
            dividends = ticker.dividends

            if dividends.empty:
                return []

            # Get last 5 dividends
            recent_dividends = dividends.tail(5)

            dividend_list = []
            for date, amount in recent_dividends.items():
                dividend_list.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'amount': round(float(amount), 2),
                    'type': 'Dividend',
                    'status': 'Paid',
                    'relative_time': self._get_relative_time(date)
                })

            return list(reversed(dividend_list))

        except Exception as e:
            print(f"Dividend fetch error: {e}")
            return []

    def _get_splits(self, ticker):
        """Get stock split history"""
        try:
            splits = ticker.splits

            if splits.empty:
                return []

            split_list = []
            for date, ratio in splits.items():
                split_list.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'ratio': f"1:{int(ratio)}",
                    'type': 'Stock Split',
                    'status': 'Completed',
                    'relative_time': self._get_relative_time(date)
                })

            return list(reversed(split_list))

        except Exception as e:
            print(f"Split fetch error: {e}")
            return []

    def _get_earnings_dates(self, ticker):
        """Get earnings calendar"""
        try:
            # Get upcoming earnings
            calendar = ticker.calendar

            if calendar is None or (hasattr(calendar, 'empty') and calendar.empty):
                return []

            earnings_list = []

            # Check if calendar is a DataFrame
            if isinstance(calendar, pd.DataFrame):
                # Earnings Date
                if 'Earnings Date' in calendar.index:
                    earnings_dates = calendar.loc['Earnings Date']

                    if not isinstance(earnings_dates, (list, tuple)):
                        earnings_dates = [earnings_dates]

                    for date in earnings_dates:
                        if pd.notna(date):
                            earnings_list.append({
                                'date': date.strftime('%Y-%m-%d') if hasattr(date, 'strftime') else str(date),
                                'type': 'Earnings Release',
                                'status': 'Upcoming',
                                'quarter': self._get_quarter(date)
                            })

            return earnings_list

        except Exception as e:
            print(f"Earnings fetch error: {e}")
            return []

    def _get_upcoming_events(self, ticker, symbol):
        """Get upcoming corporate events"""
        events = []

        try:
            info = ticker.info

            # Ex-Dividend Date
            if info.get('exDividendDate'):
                ex_date = datetime.fromtimestamp(info['exDividendDate'])
                if ex_date > datetime.now():
                    events.append({
                        'date': ex_date.strftime('%Y-%m-%d'),
                        'type': 'Ex-Dividend Date',
                        'amount': info.get('dividendRate', 0),
                        'status': 'Upcoming'
                    })

        except Exception as e:
            print(f"Upcoming events error: {e}")

        return events

    def _get_relative_time(self, date):
        """Convert date to relative time"""
        if not isinstance(date, datetime):
            date = pd.to_datetime(date)

        now = datetime.now()

        # Remove timezone
        if date.tzinfo:
            date = date.replace(tzinfo=None)

        diff = now - date

        if diff.days > 365:
            years = diff.days // 365
            return f"{years} year{'s' if years > 1 else ''} ago"
        elif diff.days > 30:
            months = diff.days // 30
            return f"{months} month{'s' if months > 1 else ''} ago"
        elif diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        else:
            return "Today"

    def _get_quarter(self, date):
        """Get quarter from date"""
        if not isinstance(date, datetime):
            date = pd.to_datetime(date)

        quarter = (date.month - 1) // 3 + 1
        return f"Q{quarter} {date.year}"