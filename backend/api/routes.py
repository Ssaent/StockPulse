from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from bson import ObjectId

# ✅ Make sure you have this Blueprint
api_bp = Blueprint('api', __name__)


# ... your existing routes (analyze, search, etc.) ...

# ✅ ADD THESE TWO NEW ROUTES:

@api_bp.route('/analysis-history', methods=['GET'])
@jwt_required()
def get_analysis_history():
    """Get user's stock analysis history"""
    try:
        from backend.database import db  # Adjust based on your import

        current_user = get_jwt_identity()
        period = request.args.get('period', '7d')

        print(f"📊 Fetching analysis history for {current_user}, period: {period}")

        # Calculate date range based on period
        days_map = {'7d': 7, '30d': 30, '90d': 90, 'all': None}
        days = days_map.get(period, 7)

        # Query based on period
        if days:
            start_date = datetime.utcnow() - timedelta(days=days)
            analyses = list(db.analysis_history.find({
                'user_id': current_user,
                'analyzed_at': {'$gte': start_date}
            }).sort('analyzed_at', -1))
        else:
            analyses = list(db.analysis_history.find({
                'user_id': current_user
            }).sort('analyzed_at', -1))

        # Convert ObjectId to string for JSON serialization
        for analysis in analyses:
            analysis['id'] = str(analysis['_id'])
            del analysis['_id']
            if isinstance(analysis.get('analyzed_at'), datetime):
                analysis['analyzed_at'] = analysis['analyzed_at'].isoformat()

        print(f"✅ Found {len(analyses)} analyses")
        return jsonify({'history': analyses}), 200

    except Exception as e:
        print(f"❌ Error fetching analysis history: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch analysis history', 'details': str(e)}), 500


@api_bp.route('/save-analysis', methods=['POST'])
@jwt_required()
def save_analysis():
    """Save stock analysis to user's history"""
    try:
        from backend.database import db  # Adjust based on your import

        current_user = get_jwt_identity()
        data = request.json

        print(f"💾 Saving analysis for {current_user}: {data.get('symbol')}")

        # Validate required fields
        if not data.get('symbol'):
            return jsonify({'error': 'Symbol is required'}), 400

        # Create analysis record
        analysis_record = {
            'user_id': current_user,
            'symbol': data.get('symbol'),
            'name': data.get('name', data.get('symbol')),
            'exchange': data.get('exchange', 'NSE'),
            'analyzed_at': datetime.utcnow(),
            'currentPrice': data.get('currentPrice', 0),
            'analysis': data.get('analysis', {}),
            'technical': data.get('technical', {})
        }

        # Insert into database
        result = db.analysis_history.insert_one(analysis_record)

        print(f"✅ Analysis saved: {data.get('symbol')} with ID {result.inserted_id}")

        return jsonify({
            'success': True,
            'message': 'Analysis saved successfully',
            'id': str(result.inserted_id)
        }), 201

    except Exception as e:
        print(f"❌ Error saving analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to save analysis', 'details': str(e)}), 500