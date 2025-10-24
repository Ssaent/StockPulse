"""
Fixed Backtesting Service - backend/services/backtesting_service.py
Resolves timezone comparison issues and improves price matching
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from database.models import db, PredictionLog
import pandas as pd
import yfinance as yf

# Try to import StockPriceFetcher, create inline if not available
try:
    from services.price_fetcher import StockPriceFetcher
except ImportError:
    # Inline fallback if price_fetcher doesn't exist
    class StockPriceFetcher:
        def get_historical_data(self, symbol, exchange, period='1mo'):
            try:
                ticker_symbol = f"{symbol}.NS" if exchange == 'NSE' else f"{symbol}.BO"
                ticker = yf.Ticker(ticker_symbol)
                data = ticker.history(period=period)
                if not data.empty:
                    print(f"Successfully fetched {len(data)} days of data for {symbol}")
                return data if not data.empty else None
            except Exception as e:
                print(f"Error fetching {symbol}: {e}")
                return None


class BacktestingEngine:
    """Engine for validating AI predictions against actual market data"""

    def __init__(self):
        self.price_fetcher = StockPriceFetcher()

    def validate_predictions(self) -> int:
        """
        Validate all pending predictions whose target date has passed
        Returns number of predictions validated
        """
        now = datetime.now()

        # Get all unvalidated predictions where target date has passed
        pending = PredictionLog.query.filter(
            PredictionLog.is_validated == False,
            PredictionLog.target_date <= now
        ).all()

        print(f"Validating {len(pending)} predictions...")
        validated_count = 0

        for prediction in pending:
            try:
                # Get actual price at target date
                actual_price = self._get_price_at_date(
                    prediction.symbol,
                    prediction.exchange,
                    prediction.target_date
                )

                if actual_price is None:
                    print(f"⚠️ Could not get price for {prediction.symbol} at {prediction.target_date}")
                    continue

                # Calculate actual change
                actual_change_pct = (
                    (actual_price - prediction.current_price_at_prediction) /
                    prediction.current_price_at_prediction * 100
                )

                # Determine if prediction was accurate
                # Prediction is "accurate" if direction (up/down) was correct
                predicted_direction = 1 if prediction.predicted_change_pct > 0 else -1
                actual_direction = 1 if actual_change_pct > 0 else -1
                is_accurate = predicted_direction == actual_direction

                # Calculate profit/loss if user followed prediction
                # Assuming 5% stop loss
                profit_pct = actual_change_pct if is_accurate else max(actual_change_pct, -5.0)

                # Update prediction record
                prediction.actual_price = actual_price
                prediction.actual_change_pct = round(actual_change_pct, 2)
                prediction.is_accurate = is_accurate
                prediction.profit_loss_pct = round(profit_pct, 2)
                prediction.is_validated = True
                prediction.validated_at = datetime.now()

                db.session.commit()
                validated_count += 1

                accuracy_symbol = "✅" if is_accurate else "❌"
                print(f"{accuracy_symbol} {prediction.symbol}: Predicted {prediction.predicted_change_pct:+.2f}%, Actual {actual_change_pct:+.2f}%")

            except Exception as e:
                print(f"❌ Error validating {prediction.symbol}: {e}")
                db.session.rollback()
                continue

        print(f"\n✅ Validated {validated_count} predictions")
        return validated_count

    def _get_price_at_date(self, symbol: str, exchange: str, target_date: datetime) -> Optional[float]:
        """
        Get actual stock price at target date
        Fixed timezone handling to prevent comparison errors
        """
        try:
            # Get historical data around target date
            ticker = self.price_fetcher.get_historical_data(
                symbol,
                exchange,
                period='1mo'
            )

            if ticker is None or ticker.empty:
                print(f"No data available for {symbol}")
                return None

            # === TIMEZONE FIX: Normalize all dates to timezone-naive ===

            # 1. Normalize target_date
            if hasattr(target_date, 'tzinfo') and target_date.tzinfo is not None:
                target_date = target_date.replace(tzinfo=None)

            # 2. Normalize ticker index
            if hasattr(ticker.index, 'tz') and ticker.index.tz is not None:
                ticker.index = ticker.index.tz_localize(None)
            elif hasattr(ticker.index, 'tzinfo'):
                # Handle individual datetime objects
                ticker.index = pd.DatetimeIndex([
                    dt.replace(tzinfo=None) if hasattr(dt, 'tzinfo') and dt.tzinfo else dt
                    for dt in ticker.index
                ])

            # Convert target date to date-only string for matching
            target_date_str = target_date.strftime('%Y-%m-%d')

            # Try exact date match first
            for idx in ticker.index:
                idx_str = idx.strftime('%Y-%m-%d')
                if idx_str == target_date_str:
                    price = float(ticker.loc[idx]['Close'])
                    return price

            # If no exact match, find closest date within 3 days
            target_timestamp = target_date.timestamp()
            closest_date = None
            min_diff = float('inf')

            for idx in ticker.index:
                idx_timestamp = idx.timestamp()
                diff = abs(idx_timestamp - target_timestamp)

                # Only consider dates within 3 days
                if diff <= (3 * 24 * 3600) and diff < min_diff:
                    min_diff = diff
                    closest_date = idx

            if closest_date is not None:
                price = float(ticker.loc[closest_date]['Close'])
                days_diff = round(min_diff / (24 * 3600), 1)
                print(f"Using closest date {closest_date.strftime('%Y-%m-%d')} ({days_diff}d from target) for {symbol}")
                return price

            print(f"No price data within 3 days of {target_date_str} for {symbol}")
            return None

        except Exception as e:
            print(f"Error getting price for {symbol}: {e}")
            return None

    def get_accuracy_stats(self, days: int = 30, timeframe: Optional[str] = None) -> Dict:
        """
        Get accuracy statistics for validated predictions

        Args:
            days: Look back period in days
            timeframe: Filter by timeframe ('intraday', 'weekly', 'monthly')

        Returns:
            Dictionary with accuracy metrics
        """
        cutoff_date = datetime.now() - timedelta(days=days)

        query = PredictionLog.query.filter(
            PredictionLog.is_validated == True,
            PredictionLog.validated_at >= cutoff_date
        )

        if timeframe:
            query = query.filter(PredictionLog.timeframe == timeframe)

        predictions = query.all()

        if not predictions:
            return {
                'total': 0,
                'accurate': 0,
                'accuracy_rate': 0,
                'win_rate': 0,
                'total_profit_pct': 0,
                'avg_profit_pct': 0,
                'by_timeframe': {}
            }

        total = len(predictions)
        accurate = sum(1 for p in predictions if p.is_accurate)
        profitable = sum(1 for p in predictions if p.profit_loss_pct > 0)
        total_profit = sum(p.profit_loss_pct for p in predictions)

        # Group by timeframe
        by_timeframe = {}
        for p in predictions:
            tf = p.timeframe
            if tf not in by_timeframe:
                by_timeframe[tf] = {
                    'total': 0,
                    'accurate': 0,
                    'profit': 0
                }
            by_timeframe[tf]['total'] += 1
            if p.is_accurate:
                by_timeframe[tf]['accurate'] += 1
            by_timeframe[tf]['profit'] += p.profit_loss_pct

        # Calculate rates
        for tf in by_timeframe:
            stats = by_timeframe[tf]
            stats['accuracy_rate'] = round(stats['accurate'] / stats['total'] * 100, 1)
            stats['avg_profit'] = round(stats['profit'] / stats['total'], 2)

        return {
            'total': total,
            'accurate': accurate,
            'accuracy_rate': round(accurate / total * 100, 1),
            'win_rate': round(profitable / total * 100, 1),
            'total_profit_pct': round(total_profit, 2),
            'avg_profit_pct': round(total_profit / total, 2),
            'by_timeframe': by_timeframe
        }

    def get_prediction_history(
        self,
        limit: int = 50,
        timeframe: Optional[str] = None
    ) -> List[Dict]:
        """
        Get recent validated predictions with details

        Args:
            limit: Maximum number of predictions to return
            timeframe: Filter by timeframe

        Returns:
            List of prediction dictionaries
        """
        query = PredictionLog.query.filter(
            PredictionLog.is_validated == True
        ).order_by(PredictionLog.validated_at.desc())

        if timeframe:
            query = query.filter(PredictionLog.timeframe == timeframe)

        predictions = query.limit(limit).all()

        return [
            {
                'symbol': p.symbol,
                'exchange': p.exchange,
                'prediction_date': p.prediction_date.isoformat(),
                'target_date': p.target_date.isoformat(),
                'timeframe': p.timeframe,
                'predicted_price': p.predicted_price,
                'predicted_change_pct': p.predicted_change_pct,
                'actual_price': p.actual_price,
                'actual_change_pct': p.actual_change_pct,
                'is_accurate': p.is_accurate,
                'profit_loss_pct': p.profit_loss_pct,
                'confidence': p.confidence,
                'validated_at': p.validated_at.isoformat() if p.validated_at else None
            }
            for p in predictions
        ]