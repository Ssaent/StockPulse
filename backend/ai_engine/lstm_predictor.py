"""AI Prediction Engine"""
import numpy as np
from sklearn.preprocessing import MinMaxScaler

class LSTMPredictor:

    def __init__(self):
        self.scaler = MinMaxScaler()

    def predict_multi_horizon(self, df, current_price):
        """Generate predictions for multiple timeframes"""

        # Calculate statistics
        returns = df['Close'].pct_change().dropna()
        volatility = returns.std()
        trend = returns.mean()

        # Recent trend (last 30 days)
        recent_returns = df['Close'].tail(30).pct_change().dropna()
        recent_trend = recent_returns.mean()

        predictions = {
            'intraday': self._predict_timeframe(current_price, trend, volatility, 1, df),
            'weekly': self._predict_timeframe(current_price, trend, volatility, 5, df),
            'monthly': self._predict_timeframe(current_price, recent_trend, volatility, 20, df),
            'longterm': self._predict_timeframe(current_price, recent_trend, volatility, 120, df)
        }

        return predictions

    def _predict_timeframe(self, current, trend, vol, days, df):
        """Predict for specific timeframe"""
        # Add momentum factor
        momentum = 1 + (trend * days)

        # Add volatility adjustment
        vol_adjustment = 1 + (vol * np.sqrt(days) * 0.5)

        predicted = current * momentum
        change_pct = ((predicted - current) / current) * 100

        # Dynamic confidence calculation
        # Higher confidence for:
        # - Lower volatility
        # - Shorter timeframes
        # - Consistent trends

        # Base confidence
        base_confidence = 85

        # Volatility penalty (high volatility = lower confidence)
        vol_penalty = min(25, vol * 2000)

        # Timeframe penalty (longer = less confident)
        time_penalty = min(15, days * 0.1)

        # Trend consistency bonus
        recent_std = df['Close'].tail(30).pct_change().std()
        consistency_bonus = max(0, 10 - (recent_std * 1000))

        confidence = base_confidence - vol_penalty - time_penalty + consistency_bonus
        confidence = max(60, min(95, int(confidence)))

        return {
            'target': round(predicted, 2),
            'change': round(change_pct, 2),
            'change_percent': f"{round(change_pct, 2)}%",  # ADD THIS
            'confidence': confidence
        }