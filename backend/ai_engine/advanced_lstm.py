"""Advanced LSTM model with attention mechanism"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import RobustScaler
from sklearn.model_selection import TimeSeriesSplit
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input, Attention, Concatenate, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from tensorflow.keras.optimizers import Adam
import joblib
import os


class AdvancedStockPredictor:
    """State-of-the-art LSTM predictor with attention"""

    def __init__(self, sequence_length=60, model_dir='data/models'):
        self.sequence_length = sequence_length
        self.model_dir = model_dir
        self.scaler = RobustScaler()  # More robust to outliers
        self.model = None
        self.feature_names = None

        os.makedirs(model_dir, exist_ok=True)

    def build_model(self, n_features):
        """Build LSTM with attention mechanism"""

        # Input
        inputs = Input(shape=(self.sequence_length, n_features))

        # First LSTM layer
        lstm1 = LSTM(128, return_sequences=True)(inputs)
        lstm1 = BatchNormalization()(lstm1)
        lstm1 = Dropout(0.3)(lstm1)

        # Second LSTM layer
        lstm2 = LSTM(64, return_sequences=True)(lstm1)
        lstm2 = BatchNormalization()(lstm2)
        lstm2 = Dropout(0.3)(lstm2)

        # Attention mechanism
        attention = Attention()([lstm2, lstm2])

        # Concatenate LSTM output with attention
        concat = Concatenate()([lstm2, attention])

        # Third LSTM layer
        lstm3 = LSTM(32, return_sequences=False)(concat)
        lstm3 = BatchNormalization()(lstm3)
        lstm3 = Dropout(0.2)(lstm3)

        # Dense layers
        dense1 = Dense(64, activation='relu')(lstm3)
        dense1 = Dropout(0.2)(dense1)
        dense2 = Dense(32, activation='relu')(dense1)

        # Output layer
        output = Dense(1)(dense2)

        # Create model
        model = Model(inputs=inputs, outputs=output)

        # Compile
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='huber',  # More robust to outliers
            metrics=['mae', 'mse']
        )

        self.model = model
        return model

    def prepare_data(self, df, feature_cols, target_col='Close'):
        """Prepare sequences for training"""

        # Clean data by handling NaN and infinite values
        cleaned_df = df.copy()

        # Replace infinite values with NaN first
        cleaned_df[feature_cols] = cleaned_df[feature_cols].replace([np.inf, -np.inf], np.nan)

        # Fill NaN values with forward fill, then backward fill, then mean
        for col in feature_cols:
            if cleaned_df[col].isnull().any():
                # Forward fill
                cleaned_df[col] = cleaned_df[col].fillna(method='ffill')
                # Backward fill for any remaining NaN at the beginning
                cleaned_df[col] = cleaned_df[col].fillna(method='bfill')
                # Fill any remaining NaN with mean
                if cleaned_df[col].isnull().any():
                    cleaned_df[col] = cleaned_df[col].fillna(cleaned_df[col].mean())

        # Final check - if still have NaN, drop those rows
        cleaned_df = cleaned_df.dropna(subset=feature_cols)

        if len(cleaned_df) < 50:  # Need minimum data
            raise ValueError(f"Insufficient clean data: {len(cleaned_df)} rows (need at least 50)")

        print(f"Data cleaned: {len(df) - len(cleaned_df)} rows with NaN/inf removed")

        # Scale features
        scaled_data = self.scaler.fit_transform(cleaned_df[feature_cols])

        # Check for NaN/inf in scaled data
        if np.isnan(scaled_data).any() or np.isinf(scaled_data).any():
            raise ValueError("Scaler produced NaN or infinite values")

        X, y = [], []

        for i in range(self.sequence_length, len(scaled_data)):
            X.append(scaled_data[i - self.sequence_length:i])
            y.append(scaled_data[i, feature_cols.index(target_col)])

        # Ensure we have enough data for training
        if len(X) < 10:
            raise ValueError(f"Insufficient training sequences: {len(X)} (need at least 10)")

        return np.array(X), np.array(y)

    def _fallback_predictions(self, df, current_price):
        """Provide basic predictions when model is not available"""
        print("Using trend-based fallback predictions")

        # Calculate recent momentum
        if 'Close' in df.columns and len(df) > 5:
            recent_trend = df['Close'].pct_change().tail(5).mean()
            if not np.isnan(recent_trend) and abs(recent_trend) < 0.1:  # Reasonable bounds
                momentum = recent_trend
            else:
                momentum = 0.0  # Neutral
        else:
            momentum = 0.0

        analyses = {}

        # Intraday (1 day) - small momentum
        intraday_pred = current_price * (1 + momentum * 0.5)
        intraday_change = ((intraday_pred - current_price) / current_price) * 100

        analyses['intraday'] = {
            'target': round(float(intraday_pred), 2),
            'change': round(float(intraday_change), 2),
            'confidence': 65  # Lower confidence for fallback
        }

        # Weekly (5 days) - moderate momentum
        weekly_pred = current_price * (1 + momentum * 2.5)
        weekly_change = ((weekly_pred - current_price) / current_price) * 100

        analyses['weekly'] = {
            'target': round(float(weekly_pred), 2),
            'change': round(float(weekly_change), 2),
            'confidence': 60
        }

        # Monthly (20 days) - full momentum
        monthly_pred = current_price * (1 + momentum * 10)
        monthly_change = ((monthly_pred - current_price) / current_price) * 100

        analyses['monthly'] = {
            'target': round(float(monthly_pred), 2),
            'change': round(float(monthly_change), 2),
            'confidence': 55
        }

        # Long-term (120 days) - extended momentum
        longterm_pred = current_price * (1 + momentum * 25)
        longterm_change = ((longterm_pred - current_price) / current_price) * 100

        analyses['longterm'] = {
            'target': round(float(longterm_pred), 2),
            'change': round(float(longterm_change), 2),
            'confidence': 50
        }

        return analyses

    def train(self, df, feature_cols, validation_split=0.2):
        """Train model with validation"""

        print(f"Training with {len(feature_cols)} features...")
        self.feature_names = feature_cols

        # Prepare data
        X, y = self.prepare_data(df, feature_cols)

        print(f"Training samples: {len(X)}")
        print(f"X shape: {X.shape}, y shape: {y.shape}")
        print(f"X contains NaN: {np.isnan(X).any()}, y contains NaN: {np.isnan(y).any()}")
        print(f"X contains inf: {np.isinf(X).any()}, y contains inf: {np.isinf(y).any()}")

        # Additional validation
        if len(X) == 0:
            raise ValueError("No training samples generated")

        if len(X) < 10:
            raise ValueError(f"Insufficient training data: {len(X)} samples (need at least 10)")

        if np.isnan(y).any() or np.isinf(y).any():
            raise ValueError("Target values contain NaN or infinite values")

        # Check for constant targets
        if np.std(y) == 0:
            raise ValueError("Target values are constant - no learning possible")

        # Build model
        if self.model is None:
            self.build_model(n_features=len(feature_cols))

        # Callbacks
        callbacks = [
            EarlyStopping(
                monitor='val_loss',
                patience=15,
                restore_best_weights=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=7,
                min_lr=1e-7,
                verbose=1
            ),
            ModelCheckpoint(
                os.path.join(self.model_dir, 'best_model.h5'),
                monitor='val_loss',
                save_best_only=True,
                verbose=1
            )
        ]

        # Train
        history = self.model.fit(
            X, y,
            validation_split=validation_split,
            epochs=100,
            batch_size=32,
            callbacks=callbacks,
            verbose=1
        )

        # Calculate training metrics
        train_loss = min(history.history['loss'])
        val_loss = min(history.history['val_loss'])

        print(f"\nTraining completed!")
        print(f"Best training loss: {train_loss:.6f}")
        print(f"Best validation loss: {val_loss:.6f}")

        return history

    def predict_multi_horizon(self, df, feature_cols, current_price):
        """Predict multiple timeframes with confidence"""

        # Check if model is available, if not use fallback predictions
        if self.model is None:
            print(f"Warning: Model not available - using trend-based fallback")
            return self._fallback_predictions(df, current_price)

        # Prepare input sequence
        input_data = df[feature_cols].tail(self.sequence_length)
        if input_data.isnull().any().any():
            print("Warning: Input data contains NaN values - using trend-based fallback")
            return self._fallback_predictions(df, current_price)

        try:
            scaled_data = self.scaler.transform(input_data)
        except Exception as e:
            print(f"Warning: Scaler transform failed: {e} - using trend-based fallback")
            return self._fallback_predictions(df, current_price)
        if np.isnan(scaled_data).any():
            raise ValueError("Scaler produced NaN values")

        X = scaled_data.reshape(1, self.sequence_length, len(feature_cols))

        try:
            # Base analysis
            pred_scaled = self.model.predict(X, verbose=0)[0][0]

            # Inverse transform
            dummy = np.zeros((1, len(feature_cols)))
            dummy[0, feature_cols.index('Close')] = pred_scaled
            pred_price = self.scaler.inverse_transform(dummy)[0, feature_cols.index('Close')]
        except Exception as e:
            print(f"Warning: Model prediction failed: {e} - using trend-based fallback")
            return self._fallback_predictions(df, current_price)

        # Handle NaN prediction with fallback
        if np.isnan(pred_price):
            print(f"Warning: Model prediction resulted in NaN, using trend-based fallback")
            # Use recent trend as fallback: simple momentum-based prediction
            recent_trend = df['Close'].pct_change().tail(5).mean()  # 5-day average return
            if not np.isnan(recent_trend):
                pred_price = current_price * (1 + recent_trend)
            else:
                # If no trend available, assume no change
                pred_price = current_price

        # Calculate analyses for different timeframes
        analyses = {}

        # Monte Carlo simulation for confidence
        mc_analyses = []
        for _ in range(50):
            # Add noise to input
            noise = np.random.normal(0, 0.01, X.shape)
            X_noisy = X + noise
            pred = self.model.predict(X_noisy, verbose=0)[0][0]

            dummy = np.zeros((1, len(feature_cols)))
            dummy[0, feature_cols.index('Close')] = pred
            price = self.scaler.inverse_transform(dummy)[0, feature_cols.index('Close')]

            # Only append valid (non-NaN) prices
            if not np.isnan(price):
                mc_analyses.append(price)

        # Calculate confidence from MC simulation
        if len(mc_analyses) == 0:
            # Fallback if no valid predictions
            confidence = 70
        else:
            std = np.std(mc_analyses)
            if np.isnan(std) or current_price == 0:
                confidence = 70  # Fallback confidence
            else:
                confidence = max(60, min(95, int(100 * (1 - std / current_price))))

        # Intraday (1 day)
        intraday_pred = pred_price
        intraday_change = ((intraday_pred - current_price) / current_price) * 100

        analyses['intraday'] = {
            'target': round(float(intraday_pred), 2),
            'change': round(float(intraday_change), 2),
            'confidence': confidence
        }

        # Weekly (5 days) - use momentum
        recent_momentum = df['momentum_5'].iloc[-1] if 'momentum_5' in df.columns else 0
        weekly_pred = current_price * (1 + recent_momentum * 5)
        weekly_change = ((weekly_pred - current_price) / current_price) * 100

        analyses['weekly'] = {
            'target': round(float(weekly_pred), 2),
            'change': round(float(weekly_change), 2),
            'confidence': max(65, confidence - 5)
        }

        # Monthly (20 days)
        monthly_pred = current_price * (1 + recent_momentum * 20)
        monthly_change = ((monthly_pred - current_price) / current_price) * 100

        analyses['monthly'] = {
            'target': round(float(monthly_pred), 2),
            'change': round(float(monthly_change), 2),
            'confidence': max(60, confidence - 10)
        }

        # Long-term (120 days)
        long_momentum = df['momentum_20'].iloc[-1] if 'momentum_20' in df.columns else recent_momentum
        longterm_pred = current_price * (1 + long_momentum * 6)
        longterm_change = ((longterm_pred - current_price) / current_price) * 100

        analyses['longterm'] = {
            'target': round(float(longterm_pred), 2),
            'change': round(float(longterm_change), 2),
            'confidence': max(55, confidence - 20)
        }

        return analyses

    def save_model(self, symbol):
        """Save model and scaler"""
        model_path = os.path.join(self.model_dir, f'{symbol}_model.h5')
        scaler_path = os.path.join(self.model_dir, f'{symbol}_scaler.pkl')
        features_path = os.path.join(self.model_dir, f'{symbol}_features.pkl')

        self.model.save(model_path)
        joblib.dump(self.scaler, scaler_path)
        joblib.dump(self.feature_names, features_path)

        print(f"Model saved: {model_path}")

    def load_model(self, symbol):
        """Load pre-trained model"""
        model_path = os.path.join(self.model_dir, f'{symbol}_model.h5')
        scaler_path = os.path.join(self.model_dir, f'{symbol}_scaler.pkl')
        features_path = os.path.join(self.model_dir, f'{symbol}_features.pkl')

        if os.path.exists(model_path):
            self.model = tf.keras.models.load_model(model_path)
            self.scaler = joblib.load(scaler_path)
            self.feature_names = joblib.load(features_path)
            print(f"Model loaded: {model_path}")
            return True

        return False