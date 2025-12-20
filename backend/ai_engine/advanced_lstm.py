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

        # Scale features
        scaled_data = self.scaler.fit_transform(df[feature_cols])

        X, y = [], []

        for i in range(self.sequence_length, len(scaled_data)):
            X.append(scaled_data[i - self.sequence_length:i])
            y.append(scaled_data[i, feature_cols.index(target_col)])

        return np.array(X), np.array(y)

    def train(self, df, feature_cols, validation_split=0.2):
        """Train model with validation"""

        print(f"Training with {len(feature_cols)} features...")
        self.feature_names = feature_cols

        # Prepare data
        X, y = self.prepare_data(df, feature_cols)

        print(f"Training samples: {len(X)}")

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

        # Prepare input sequence
        scaled_data = self.scaler.transform(df[feature_cols].tail(self.sequence_length))
        X = scaled_data.reshape(1, self.sequence_length, len(feature_cols))

        # Base analysis
        pred_scaled = self.model.predict(X, verbose=0)[0][0]

        # Inverse transform
        dummy = np.zeros((1, len(feature_cols)))
        dummy[0, feature_cols.index('Close')] = pred_scaled
        pred_price = self.scaler.inverse_transform(dummy)[0, feature_cols.index('Close')]

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
            mc_analyses.append(price)

        # Calculate confidence from MC simulation
        std = np.std(mc_analyses)
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