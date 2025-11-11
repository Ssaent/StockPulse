"""
Chat REST API Routes (HTTP Polling)
Rate limiting is handled in app.py - these routes are exempt from limits
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

# FLEXIBLE IMPORTS - works from both root and backend directory
try:
    from backend.database.models import db, User, ChatMessage, MessageReaction, OnlineUser
except ImportError:
    from database.models import db, User, ChatMessage, MessageReaction, OnlineUser

chat_bp = Blueprint('chat', __name__)

# Bad words filter (basic)
BAD_WORDS = ['scam', 'fraud', 'pump', 'guaranteed', 'insider', 'tip-off']


def filter_content(content):
    """Filter inappropriate content"""
    content_lower = content.lower()
    for word in BAD_WORDS:
        if word in content_lower:
            content = content.replace(word, '***')
    return content


@chat_bp.route('/messages', methods=['GET'])
@jwt_required()
def get_messages():
    """Get recent chat messages (last 1 hour)"""
    try:
        current_user_id = get_jwt_identity()

        # Update user's last seen
        online_user = OnlineUser.query.filter_by(user_id=current_user_id).first()
        if online_user:
            online_user.last_seen = datetime.utcnow()
        else:
            online_user = OnlineUser(user_id=current_user_id, last_seen=datetime.utcnow())
            db.session.add(online_user)
        db.session.commit()

        # Get messages from last 1 hour
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        messages = ChatMessage.query.filter(
            ChatMessage.created_at >= one_hour_ago,
            ChatMessage.is_deleted == False
        ).order_by(ChatMessage.created_at.asc()).all()

        # Clean up old online users (inactive for 2 minutes)
        two_minutes_ago = datetime.utcnow() - timedelta(minutes=2)
        OnlineUser.query.filter(OnlineUser.last_seen < two_minutes_ago).delete()
        db.session.commit()

        # Get online count
        online_count = OnlineUser.query.count()

        return jsonify({
            'messages': [msg.to_dict() for msg in messages],
            'online_count': online_count,
            'typing_users': []
        }), 200

    except Exception as e:
        print(f"Error fetching messages: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    """Send a new message"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.json
        content = data.get('content', '').strip()
        message_type = data.get('type', 'text')

        if not content:
            return jsonify({'error': 'Content cannot be empty'}), 400

        if len(content) > 1000:
            return jsonify({'error': 'Message too long (max 1000 characters)'}), 400

        # Filter bad words
        content = filter_content(content)

        # Create message
        message = ChatMessage(
            user_id=user.id,
            username=user.name,
            content=content,
            message_type=message_type
        )

        db.session.add(message)
        db.session.commit()

        return jsonify({
            'message': message.to_dict(),
            'success': True
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error sending message: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/react/<int:message_id>', methods=['POST'])
@jwt_required()
def react_to_message(message_id):
    """Add reaction to a message"""
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        emoji = data.get('emoji')

        if not emoji:
            return jsonify({'error': 'Emoji required'}), 400

        message = ChatMessage.query.get(message_id)
        if not message:
            return jsonify({'error': 'Message not found'}), 404

        existing = MessageReaction.query.filter_by(
            message_id=message_id,
            user_id=current_user_id,
            emoji=emoji
        ).first()

        if existing:
            db.session.delete(existing)
            db.session.commit()
            return jsonify({'message': 'Reaction removed'}), 200

        reaction = MessageReaction(
            message_id=message_id,
            user_id=current_user_id,
            emoji=emoji
        )
        db.session.add(reaction)
        db.session.commit()

        return jsonify({'message': 'Reaction added'}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error reacting: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/report/<int:message_id>', methods=['POST'])
@jwt_required()
def report_message(message_id):
    """Report inappropriate message"""
    try:
        message = ChatMessage.query.get(message_id)
        if not message:
            return jsonify({'error': 'Message not found'}), 404

        message.report_count += 1

        # Auto-delete if reported 3+ times
        if message.report_count >= 3:
            message.is_deleted = True

        db.session.commit()

        return jsonify({
            'message': 'Message reported',
            'deleted': message.is_deleted
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error reporting: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/delete/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    """Delete own message"""
    try:
        current_user_id = get_jwt_identity()
        message = ChatMessage.query.get(message_id)

        if not message:
            return jsonify({'error': 'Message not found'}), 404

        if message.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        message.is_deleted = True
        db.session.commit()

        return jsonify({'message': 'Message deleted'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error deleting: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/online', methods=['GET'])
@jwt_required()
def get_online_users():
    """Get count of online users"""
    try:
        # Clean up old online users (inactive for 2 minutes)
        two_minutes_ago = datetime.utcnow() - timedelta(minutes=2)
        OnlineUser.query.filter(OnlineUser.last_seen < two_minutes_ago).delete()
        db.session.commit()

        online_count = OnlineUser.query.count()

        return jsonify({'online_count': online_count}), 200

    except Exception as e:
        print(f"Error getting online users: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500