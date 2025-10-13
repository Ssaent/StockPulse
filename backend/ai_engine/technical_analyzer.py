"""Technical Analysis Engine"""
import pandas as pd
import ta


class TechnicalAnalyzer:

    @staticmethod
    def calculate_indicators(df):
        """Calculate technical indicators"""
        # Moving Averages
        df['SMA_20'] = ta.trend.sma_indicator(df['Close'], window=20)
        df['EMA_20'] = ta.trend.ema_indicator(df['Close'], window=20)
        df['SMA_50'] = ta.trend.sma_indicator(df['Close'], window=50)

        # MACD
        macd = ta.trend.MACD(df['Close'])
        df['MACD'] = macd.macd()
        df['MACD_signal'] = macd.macd_signal()
        df['MACD_diff'] = macd.macd_diff()

        # RSI
        df['RSI'] = ta.momentum.rsi(df['Close'], window=14)

        # Bollinger Bands
        bollinger = ta.volatility.BollingerBands(df['Close'])
        df['BB_upper'] = bollinger.bollinger_hband()
        df['BB_lower'] = bollinger.bollinger_lband()

        # ATR
        df['ATR'] = ta.volatility.average_true_range(df['High'], df['Low'], df['Close'])

        return df

    @staticmethod
    def generate_signals(df):
        """Generate buy/sell signals"""
        latest = df.iloc[-1]
        signals = []
        score = 0

        # RSI
        rsi_val = round(float(latest['RSI']), 2)
        if rsi_val < 30:
            signals.append({'indicator': 'RSI', 'signal': 'STRONG BUY', 'value': rsi_val})
            score += 2
        elif rsi_val > 70:
            signals.append({'indicator': 'RSI', 'signal': 'SELL', 'value': rsi_val})
            score -= 2
        else:
            signals.append({'indicator': 'RSI', 'signal': 'NEUTRAL', 'value': rsi_val})

        # MACD
        macd_val = round(float(latest['MACD']), 2)
        if latest['MACD_diff'] > 0:
            signals.append({'indicator': 'MACD', 'signal': 'BUY', 'value': macd_val})
            score += 1
        else:
            signals.append({'indicator': 'MACD', 'signal': 'SELL', 'value': macd_val})
            score -= 1

        # Overall
        if score >= 3:
            overall = 'STRONG BUY'
        elif score >= 1:
            overall = 'BUY'
        elif score <= -3:
            overall = 'STRONG SELL'
        elif score <= -1:
            overall = 'SELL'
        else:
            overall = 'HOLD'

        return {'signals': signals, 'overall': overall, 'score': score}