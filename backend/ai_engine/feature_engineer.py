"""Advanced feature engineering for stock analysis"""
import pandas as pd
import numpy as np
import ta


class FeatureEngineer:
    """Create 50+ features for ML model"""

    @staticmethod
    def create_features(df):
        """Generate comprehensive feature set"""

        # Validate minimum data requirements
        min_required = 50  # Need at least 50 data points for reliable features
        if len(df) < min_required:
            raise ValueError(f"Insufficient data for feature engineering: {len(df)} rows (need at least {min_required})")

        # Also check after basic processing
        if df[['High', 'Low', 'Close', 'Volume']].isnull().any().any():
            # If we have some NaN values, try to fill them
            df = df.fillna(method='ffill').fillna(method='bfill')
            # Drop any remaining NaN rows
            df = df.dropna(subset=['High', 'Low', 'Close', 'Volume'])

        if len(df) < 30:  # Minimum after cleaning
            raise ValueError(f"Insufficient clean data for features: {len(df)} rows (need at least 30)")

        # Price-based features
        df['returns'] = df['Close'].pct_change()
        df['log_returns'] = np.log(df['Close'] / df['Close'].shift(1))

        # Lagged features
        for i in [1, 2, 3, 5, 10]:
            df[f'close_lag_{i}'] = df['Close'].shift(i)
            df[f'volume_lag_{i}'] = df['Volume'].shift(i)
            df[f'return_lag_{i}'] = df['returns'].shift(i)

        # Rolling statistics
        for window in [5, 10, 20, 50]:
            df[f'close_mean_{window}'] = df['Close'].rolling(window).mean()
            df[f'close_std_{window}'] = df['Close'].rolling(window).std()
            df[f'volume_mean_{window}'] = df['Volume'].rolling(window).mean()
            df[f'return_mean_{window}'] = df['returns'].rolling(window).mean()
            df[f'return_std_{window}'] = df['returns'].rolling(window).std()

        # Technical indicators
        # Trend
        df['SMA_20'] = ta.trend.sma_indicator(df['Close'], window=20)
        df['SMA_50'] = ta.trend.sma_indicator(df['Close'], window=50)
        df['SMA_200'] = ta.trend.sma_indicator(df['Close'], window=200)
        df['EMA_12'] = ta.trend.ema_indicator(df['Close'], window=12)
        df['EMA_26'] = ta.trend.ema_indicator(df['Close'], window=26)

        # MACD
        macd = ta.trend.MACD(df['Close'])
        df['MACD'] = macd.macd()
        df['MACD_signal'] = macd.macd_signal()
        df['MACD_diff'] = macd.macd_diff()

        # Momentum
        df['RSI'] = ta.momentum.rsi(df['Close'], window=14)
        df['RSI_slow'] = ta.momentum.rsi(df['Close'], window=21)

        stoch = ta.momentum.StochasticOscillator(df['High'], df['Low'], df['Close'])
        df['Stoch_K'] = stoch.stoch()
        df['Stoch_D'] = stoch.stoch_signal()

        df['Williams_R'] = ta.momentum.williams_r(df['High'], df['Low'], df['Close'])
        df['ROC'] = ta.momentum.roc(df['Close'], window=12)

        # Volatility
        df['ATR'] = ta.volatility.average_true_range(df['High'], df['Low'], df['Close'])

        bollinger = ta.volatility.BollingerBands(df['Close'])
        df['BB_upper'] = bollinger.bollinger_hband()
        df['BB_middle'] = bollinger.bollinger_mavg()
        df['BB_lower'] = bollinger.bollinger_lband()
        df['BB_width'] = df['BB_upper'] - df['BB_lower']
        df['BB_position'] = (df['Close'] - df['BB_lower']) / df['BB_width']

        keltner = ta.volatility.KeltnerChannel(df['High'], df['Low'], df['Close'])
        df['Keltner_upper'] = keltner.keltner_channel_hband()
        df['Keltner_lower'] = keltner.keltner_channel_lband()

        # Volume
        df['Volume_ratio'] = df['Volume'] / df['Volume'].rolling(20).mean()
        df['OBV'] = ta.volume.on_balance_volume(df['Close'], df['Volume'])
        df['CMF'] = ta.volume.chaikin_money_flow(df['High'], df['Low'], df['Close'], df['Volume'])
        df['MFI'] = ta.volume.money_flow_index(df['High'], df['Low'], df['Close'], df['Volume'])

        # Trend strength
        adx = ta.trend.ADXIndicator(df['High'], df['Low'], df['Close'])
        df['ADX'] = adx.adx()
        df['DI_plus'] = adx.adx_pos()
        df['DI_minus'] = adx.adx_neg()

        # CCI
        df['CCI'] = ta.trend.cci(df['High'], df['Low'], df['Close'])

        # Price patterns
        df['high_low_ratio'] = df['High'] / df['Low']
        df['close_open_ratio'] = df['Close'] / df['Open']
        df['intraday_change'] = (df['Close'] - df['Open']) / df['Open']

        # Volatility measures
        df['volatility_5'] = df['returns'].rolling(5).std()
        df['volatility_20'] = df['returns'].rolling(20).std()
        df['volatility_50'] = df['returns'].rolling(50).std()

        # Price momentum
        df['momentum_5'] = df['Close'] / df['Close'].shift(5) - 1
        df['momentum_10'] = df['Close'] / df['Close'].shift(10) - 1
        df['momentum_20'] = df['Close'] / df['Close'].shift(20) - 1

        # Support/Resistance levels
        df['resistance_20'] = df['High'].rolling(20).max()
        df['support_20'] = df['Low'].rolling(20).min()
        df['price_position'] = (df['Close'] - df['support_20']) / (df['resistance_20'] - df['support_20'])

        # Time-based features
        df['day_of_week'] = pd.to_datetime(df.index).dayofweek
        df['month'] = pd.to_datetime(df.index).month
        df['quarter'] = pd.to_datetime(df.index).quarter

        return df

    @staticmethod
    def select_features():
        """Return list of most important features"""
        return [
            'Close', 'Volume', 'returns',
            'SMA_20', 'SMA_50', 'EMA_12', 'EMA_26',
            'MACD', 'MACD_signal', 'RSI',
            'ATR', 'BB_position', 'BB_width',
            'Stoch_K', 'Williams_R',
            'Volume_ratio', 'OBV', 'MFI',
            'ADX', 'CCI',
            'volatility_20', 'momentum_10',
            'close_mean_20', 'close_std_20',
            'return_mean_10', 'return_std_10',
            'high_low_ratio', 'price_position'
        ]