"""Watchlist management"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.models import db, Watchlist, User
from data_fetchers.price_fetcher import RealTimePriceFetcher

watchlist_bp = Blueprint('watchlist', __name__)
price_fetcher = RealTimePriceFetcher()


@watchlist_bp.route('', methods=['GET'])
@jwt_required()
def get_watchlist():
    """Get user's watchlist with live prices"""
    user_id = int(get_jwt_identity())

    watchlist_items = Watchlist.query.filter_by(user_id=user_id).all()

    results = []
    for item in watchlist_items:
        # Get live price
        price_data = price_fetcher.get_live_price(item.symbol, item.exchange)

        result = item.to_dict()
        if price_data:
            result.update({
                'current_price': price_data['price'],
                'change': price_data['change'],
                'changePercent': f"{price_data['change']}%"
            })

        results.append(result)

    return jsonify({'watchlist': results, 'total': len(results)})


@watchlist_bp.route('', methods=['POST'])
@jwt_required()
def add_to_watchlist():
    """Add stock to watchlist"""
    user_id = get_jwt_identity()
    data = request.json

    symbol = data.get('symbol')
    exchange = data.get('exchange', 'NSE')

    if not symbol:
        return jsonify({'error': 'Symbol required'}), 400

    # Check if already in watchlist
    existing = Watchlist.query.filter_by(
        user_id=user_id,
        symbol=symbol,
        exchange=exchange
    ).first()

    if existing:
        return jsonify({'error': 'Already in watchlist'}), 409

    # Add to watchlist
    watchlist_item = Watchlist(
        user_id=user_id,
        symbol=symbol,
        exchange=exchange
    )

    db.session.add(watchlist_item)
    db.session.commit()

    return jsonify({
        'message': 'Added to watchlist',
        'item': watchlist_item.to_dict()
    }), 201


@watchlist_bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_watchlist(item_id):
    """Remove stock from watchlist"""
    user_id = get_jwt_identity()

    item = Watchlist.query.filter_by(id=item_id, user_id=user_id).first()

    if not item:
        return jsonify({'error': 'Item not found'}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({'message': 'Removed from watchlist'})