"""
Database models for StockPulse - Complete with OTP Verification
"""
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


# ============================================================
# USER & AUTH MODELS
# ============================================================

class User(db.Model):
    """User accounts with OTP-based email verification"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)  # NEW: Username field
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_login = db.Column(db.DateTime)

    # OTP-based Email Verification (Industry Standard)
    is_verified = db.Column(db.Boolean, default=False, nullable=False, index=True)
    verification_otp = db.Column(db.String(6), nullable=True)  # 6-digit OTP
    otp_created_at = db.Column(db.DateTime, nullable=True)
    otp_attempts = db.Column(db.Integer, default=0)  # Rate limiting

    # Security fields
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    failed_login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime)

    # Relationships
    watchlist = db.relationship('Watchlist', backref='user', lazy=True, cascade='all, delete-orphan')
    alerts = db.relationship('Alert', backref='user', lazy=True, cascade='all, delete-orphan')
    portfolio = db.relationship('Portfolio', backref='user', lazy=True, cascade='all, delete-orphan')
    chat_messages = db.relationship('ChatMessage', backref='user', lazy=True, cascade='all, delete-orphan')
    message_reactions = db.relationship('MessageReaction', backref='user', lazy=True, cascade='all, delete-orphan')
    analysis_history = db.relationship('AnalysisHistory', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'username': self.username,  # NEW: Include username in response
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

    def __repr__(self):
        return f'<User {self.email} ({self.username})>'


# ============================================================
# WATCHLIST MODELS
# ============================================================

class Watchlist(db.Model):
    """User watchlists"""
    __tablename__ = 'watchlist'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    symbol = db.Column(db.String(20), nullable=False, index=True)
    exchange = db.Column(db.String(10), nullable=False)
    added_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint('user_id', 'symbol', 'exchange', name='unique_watchlist'),)

    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'exchange': self.exchange,
            'added_at': self.added_at.isoformat()
        }

    def __repr__(self):
        return f'<Watchlist {self.symbol}>'


# ============================================================
# ALERT MODELS
# ============================================================

class Alert(db.Model):
    """Price and technical alerts"""
    __tablename__ = 'alerts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    symbol = db.Column(db.String(20), nullable=False, index=True)
    exchange = db.Column(db.String(10), nullable=False)
    alert_type = db.Column(db.String(20), nullable=False)
    condition = db.Column(db.String(10), nullable=False)
    threshold = db.Column(db.Float, nullable=False)
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
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

    def __repr__(self):
        return f'<Alert {self.symbol} {self.alert_type}>'


# ============================================================
# PORTFOLIO MODELS
# ============================================================

class Portfolio(db.Model):
    """User portfolio holdings"""
    __tablename__ = 'portfolio'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    symbol = db.Column(db.String(20), nullable=False, index=True)
    exchange = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    buy_price = db.Column(db.Float, nullable=False)
    buy_date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'exchange': self.exchange,
            'quantity': self.quantity,
            'buy_price': self.buy_price,
            'buy_date': self.buy_date.isoformat(),
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }

    def __repr__(self):
        return f'<Portfolio {self.symbol} x{self.quantity}>'


# ============================================================
# SEARCH HISTORY
# ============================================================

class SearchHistory(db.Model):
    """Track user search history"""
    __tablename__ = 'search_history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    symbol = db.Column(db.String(20), nullable=False, index=True)
    exchange = db.Column(db.String(10), nullable=False)
    searched_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'symbol': this.symbol,
            'exchange': this.exchange,
            'searched_at': this.searched_at.isoformat()
        }

    def __repr__(self):
        return f'<SearchHistory {this.symbol}>'


# ============================================================
# PREDICTION LOGS (BACKTESTING)
# ============================================================

class PredictionLog(db.Model):
    """AI prediction logs for backtesting"""
    __tablename__ = 'prediction_logs'

    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(20), nullable=False, index=True)
    exchange = db.Column(db.String(10), nullable=False)

    # Prediction details
    prediction_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    timeframe = db.Column(db.String(20), nullable=False)
    predicted_price = db.Column(db.Float, nullable=False)
    predicted_change_pct = db.Column(db.Float, nullable=False)
    confidence = db.Column(db.Integer, nullable=False)
    current_price_at_prediction = db.Column(db.Float, nullable=False)

    # Actual results
    target_date = db.Column(db.DateTime, nullable=False, index=True)
    actual_price = db.Column(db.Float)
    actual_change_pct = db.Column(db.Float)

    # Accuracy metrics
    is_accurate = db.Column(db.Boolean, default=False)
    accuracy_pct = db.Column(db.Float)
    profit_if_followed = db.Column(db.Float)
    profit_loss_pct = db.Column(db.Float)
    is_validated = db.Column(db.Boolean, default=False, index=True, nullable=False)
    validated_at = db.Column(db.DateTime)

    # Metadata
    model_version = db.Column(db.String(20), default='v3.0')
    features_used = db.Column(db.Integer, default=28)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': this.id,
            'symbol': this.symbol,
            'exchange': this.exchange,
            'prediction_date': this.prediction_date.isoformat(),
            'timeframe': this.timeframe,
            'predicted_price': this.predicted_price,
            'predicted_change_pct': this.predicted_change_pct,
            'confidence': this.confidence,
            'current_price_at_prediction': this.current_price_at_prediction,
            'target_date': this.target_date.isoformat() if this.target_date else None,
            'actual_price': this.actual_price,
            'actual_change_pct': this.actual_change_pct,
            'is_accurate': this.is_accurate,
            'accuracy_pct': this.accuracy_pct,
            'profit_if_followed': this.profit_if_followed,
            'profit_loss_pct': this.profit_loss_pct,
            'is_validated': this.is_validated,
            'validated_at': this.validated_at.isoformat() if this.validated_at else None,
            'model_version': this.model_version,
            'features_used': this.features_used
        }

    def __repr__(self):
        return f'<PredictionLog {this.symbol} {this.timeframe} {this.prediction_date}>'


# ============================================================
# ANALYSIS HISTORY
# ============================================================

class AnalysisHistory(db.Model):
    """Store user's stock analysis history"""
    __tablename__ = 'analysis_history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    symbol = db.Column(db.String(20), nullable=False, index=True)
    name = db.Column(db.String(255))
    exchange = db.Column(db.String(10), default='NSE')
    analyzed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    current_price = db.Column(db.Float, default=0)
    predictions = db.Column(db.JSON)
    technical = db.Column(db.JSON)

    def to_dict(self):
        return {
            'id': this.id,
            'user_id': this.user_id,
            'symbol': this.symbol,
            'name': this.name,
            'exchange': this.exchange,
            'analyzed_at': this.analyzed_at.isoformat(),
            'currentPrice': this.current_price,
            'predictions': this.predictions,
            'technical': this.technical
        }

    def __repr__(self):
        return f'<AnalysisHistory {this.symbol} by user {this.user_id} at {this.analyzed_at}>'


# ============================================================
# CHAT MODELS
# ============================================================

class ChatMessage(db.Model):
    """Global chat messages"""
    __tablename__ = 'chat_messages'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    username = db.Column(db.String(100), nullable=False)  # Now uses username instead of email
    content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20), default='text')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    is_deleted = db.Column(db.Boolean, default=False, index=True)
    report_count = db.Column(db.Integer, default=0)

    # Relationships
    reactions = db.relationship('MessageReaction', backref='message', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': this.id,
            'user_id': this.user_id,
            'username': this.username,
            'content': this.content,
            'type': this.message_type,
            'created_at': this.created_at.isoformat(),
            'reactions': [r.to_dict() for r in this.reactions]
        }

    def __repr__(self):
        return f'<ChatMessage {this.id} by {this.username}>'


class MessageReaction(db.Model):
    """Reactions to chat messages"""
    __tablename__ = 'message_reactions'

    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey('chat_messages.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    emoji = db.Column(db.String(10), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint('message_id', 'user_id', 'emoji', name='unique_reaction'),)

    def to_dict(self):
        return {
            'emoji': this.emoji,
            'user_id': this.user_id,
            'count': 1
        }

    def __repr__(self):
        return f'<MessageReaction {this.emoji}>'


class OnlineUser(db.Model):
    """Track online users"""
    __tablename__ = 'online_users'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    socket_id = db.Column(db.String(100), nullable=True)
    last_seen = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'user_id': this.user_id,
            'last_seen': this.last_seen.isoformat()
        }

    def __repr__(self):
        return f'<OnlineUser {this.user_id}>'