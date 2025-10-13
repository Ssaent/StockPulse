"""Portfolio management"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.models import db, Portfolio
from data_fetchers.price_fetcher import RealTimePriceFetcher
from datetime import datetime

portfolio_bp = Blueprint('portfolio', __name__)
price_fetcher = RealTimePriceFetcher()


@portfolio_bp.route('', methods=['GET'])
@jwt_required()
def get_portfolio():
    """Get user's portfolio with P&L"""
    user_id = int(get_jwt_identity())

    holdings = Portfolio.query.filter_by(user_id=user_id).all()

    total_investment = 0
    total_current_value = 0
    holdings_data = []

    for holding in holdings:
        # Get current price
        price_data = price_fetcher.get_live_price(holding.symbol, holding.exchange)

        investment = holding.quantity * holding.buy_price

        if price_data:
            current_price = price_data['price']
            current_value = holding.quantity * current_price
            pnl = current_value - investment
            pnl_pct = (pnl / investment) * 100
        else:
            current_price = holding.buy_price
            current_value = investment
            pnl = 0
            pnl_pct = 0

        total_investment += investment
        total_current_value += current_value

        holdings_data.append({
            **holding.to_dict(),
            'current_price': current_price,
            'investment': round(investment, 2),
            'current_value': round(current_value, 2),
            'pnl': round(pnl, 2),
            'pnl_pct': round(pnl_pct, 2)
        })

    total_pnl = total_current_value - total_investment
    total_pnl_pct = (total_pnl / total_investment * 100) if total_investment > 0 else 0

    return jsonify({
        'holdings': holdings_data,
        'summary': {
            'total_investment': round(total_investment, 2),
            'current_value': round(total_current_value, 2),
            'total_pnl': round(total_pnl, 2),
            'total_pnl_pct': round(total_pnl_pct, 2)
        }
    })


@portfolio_bp.route('', methods=['POST'])
@jwt_required()
def add_holding():
    """Add stock to portfolio"""
    user_id = get_jwt_identity()
    data = request.json

    symbol = data.get('symbol')
    exchange = data.get('exchange', 'NSE')
    quantity = data.get('quantity')
    buy_price = data.get('buy_price')
    buy_date = data.get('buy_date')
    notes = data.get('notes', '')

    if not all([symbol, quantity, buy_price, buy_date]):
        return jsonify({'error': 'Missing required fields'}), 400

    holding = Portfolio(
        user_id=user_id,
        symbol=symbol,
        exchange=exchange,
        quantity=int(quantity),
        buy_price=float(buy_price),
        buy_date=datetime.fromisoformat(buy_date).date(),
        notes=notes
    )

    db.session.add(holding)
    db.session.commit()

    return jsonify({
        'message': 'Holding added',
        'holding': holding.to_dict()
    }), 201


@portfolio_bp.route('/<int:holding_id>', methods=['DELETE'])
@jwt_required()
def delete_holding(holding_id):
    """Delete holding"""
    user_id = get_jwt_identity()

    holding = Portfolio.query.filter_by(id=holding_id, user_id=user_id).first()

    if not holding:
        return jsonify({'error': 'Holding not found'}), 404

    db.session.delete(holding)
    db.session.commit()

    return jsonify({'message': 'Holding deleted'})