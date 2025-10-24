"""
Database models for StockPulse
Complete and updated version with all tables
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    """User accounts"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    # Relationships
    watchlists = db.relationship('Watchlist', backref='user', lazy=True, cascade='all, delete-orphan')
    alerts = db.relationship('Alert', backref='user', lazy=True, cascade='all, delete-orphan')
    portfolio = db.relationship('Portfolio', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None
        }


class Watchlist(db.Model):
    """User watchlists"""
    __tablename__ = 'watchlist'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    symbol = db.Column(db.String(20), nullable=False)
    exchange = db.Column(db.String(10), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user_id', 'symbol', 'exchange', name='unique_watchlist'),)

    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'exchange': self.exchange,
            'added_at': self.added_at.isoformat()
        }


class Alert(db.Model):
    """Price and technical alerts"""
    __tablename__ = 'alerts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    symbol = db.Column(db.String(20), nullable=False)
    exchange = db.Column(db.String(10), nullable=False)
    alert_type = db.Column(db.String(20), nullable=False)  # price, rsi, macd
    condition = db.Column(db.String(10), nullable=False)  # above, below, equals
    threshold = db.Column(db.Float, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    triggered_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'exchange': self.exchange,
            'alert_type': self.alert_type,
            'condition': self.condition,
            'threshold': self.threshold,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'triggered_at': self.triggered_at.isoformat() if self.triggered_at else None
        }


class Portfolio(db.Model):
    """User portfolio holdings"""
    __tablename__ = 'portfolio'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    symbol = db.Column(db.String(20), nullable=False)
    exchange = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    buy_price = db.Column(db.Float, nullable=False)
    buy_date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'exchange': self.exchange,
            'quantity': self.quantity,
            'buy_price': self.buy_price,
            'buy_date': self.buy_date.isoformat(),
            'notes': self.notes
        }


class SearchHistory(db.Model):
    """Track user search history"""
    __tablename__ = 'search_history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    symbol = db.Column(db.String(20), nullable=False)
    exchange = db.Column(db.String(10), nullable=False)
    searched_at = db.Column(db.DateTime, default=datetime.utcnow)


class PredictionLog(db.Model):
    """AI prediction logs for backtesting"""
    __tablename__ = 'prediction_logs'

    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(20), nullable=False, index=True)
    exchange = db.Column(db.String(10), nullable=False)

    # Prediction details
    prediction_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    timeframe = db.Column(db.String(20), nullable=False)  # intraday, weekly, monthly, longterm
    predicted_price = db.Column(db.Float, nullable=False)
    predicted_change_pct = db.Column(db.Float, nullable=False)
    confidence = db.Column(db.Integer, nullable=False)
    current_price_at_prediction = db.Column(db.Float, nullable=False)

    # Actual results (filled later)
    target_date = db.Column(db.DateTime, nullable=False, index=True)
    actual_price = db.Column(db.Float)
    actual_change_pct = db.Column(db.Float)

    # Accuracy metrics (calculated later)
    is_accurate = db.Column(db.Boolean, default=False)  # Within 5% margin
    accuracy_pct = db.Column(db.Float)
    profit_if_followed = db.Column(db.Float)  # If user acted on prediction

    # NEW FIELDS - REQUIRED FOR BACKTESTING
    profit_loss_pct = db.Column(db.Float)  # Simulated P&L with stop loss
    is_validated = db.Column(db.Boolean, default=False, index=True, nullable=False)
    validated_at = db.Column(db.DateTime)

    # Metadata
    model_version = db.Column(db.String(20), default='v3.0')
    features_used = db.Column(db.Integer, default=28)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'exchange': self.exchange,
            'prediction_date': self.prediction_date.isoformat(),
            'timeframe': self.timeframe,
            'predicted_price': self.predicted_price,
            'predicted_change_pct': self.predicted_change_pct,
            'confidence': self.confidence,
            'current_price_at_prediction': self.current_price_at_prediction,
            'target_date': self.target_date.isoformat() if self.target_date else None,
            'actual_price': self.actual_price,
            'actual_change_pct': self.actual_change_pct,
            'is_accurate': self.is_accurate,
            'accuracy_pct': self.accuracy_pct,
            'profit_if_followed': self.profit_if_followed,
            'profit_loss_pct': self.profit_loss_pct,
            'is_validated': self.is_validated,
            'validated_at': self.validated_at.isoformat() if self.validated_at else None,
            'model_version': self.model_version,
            'features_used': self.features_used
        }

    def __repr__(self):
        return f'<PredictionLog {self.symbol} {self.timeframe} {self.prediction_date}>'