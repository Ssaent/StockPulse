"""Price alert management"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.models import db, Alert
from datetime import datetime

alerts_bp = Blueprint('alerts', __name__)


@alerts_bp.route('', methods=['GET'])
@jwt_required()
def get_alerts():
    """Get user's alerts"""
    user_id = get_jwt_identity()

    alerts = Alert.query.filter_by(user_id=user_id, is_active=True).all()

    return jsonify({
        'alerts': [alert.to_dict() for alert in alerts],
        'total': len(alerts)
    })


@alerts_bp.route('', methods=['POST'])
@jwt_required()
def create_alert():
    """Create new price alert"""
    user_id = get_jwt_identity()
    data = request.json

    symbol = data.get('symbol')
    exchange = data.get('exchange', 'NSE')
    alert_type = data.get('alert_type', 'price')
    condition = data.get('condition')  # above, below
    threshold = data.get('threshold')

    if not all([symbol, condition, threshold]):
        return jsonify({'error': 'Missing required fields'}), 400

    alert = Alert(
        user_id=user_id,
        symbol=symbol,
        exchange=exchange,
        alert_type=alert_type,
        condition=condition,
        threshold=float(threshold)
    )

    db.session.add(alert)
    db.session.commit()

    return jsonify({
        'message': 'Alert created',
        'alert': alert.to_dict()
    }), 201


@alerts_bp.route('/<int:alert_id>', methods=['DELETE'])
@jwt_required()
def delete_alert(alert_id):
    """Delete alert"""
    user_id = int(get_jwt_identity())

    alert = Alert.query.filter_by(id=alert_id, user_id=user_id).first()

    if not alert:
        return jsonify({'error': 'Alert not found'}), 404

    db.session.delete(alert)
    db.session.commit()

    return jsonify({'message': 'Alert deleted'})


@alerts_bp.route('/check', methods=['POST'])
def check_alerts():
    """Check all active alerts (called by background job)"""
    from data_fetchers.price_fetcher import RealTimePriceFetcher

    price_fetcher = RealTimePriceFetcher()
    alerts = Alert.query.filter_by(is_active=True).all()

    triggered_alerts = []

    for alert in alerts:
        price_data = price_fetcher.get_live_price(alert.symbol, alert.exchange)

        if not price_data:
            continue

        current_price = price_data['price']
        triggered = False

        if alert.condition == 'above' and current_price > alert.threshold:
            triggered = True
        elif alert.condition == 'below' and current_price < alert.threshold:
            triggered = True

        if triggered:
            alert.is_active = False
            alert.triggered_at = datetime.utcnow()
            triggered_alerts.append({
                'alert_id': alert.id,
                'user_id': alert.user_id,
                'symbol': alert.symbol,
                'threshold': alert.threshold,
                'current_price': current_price
            })

    db.session.commit()

    return jsonify({
        'checked': len(alerts),
        'triggered': len(triggered_alerts),
        'alerts': triggered_alerts
    })