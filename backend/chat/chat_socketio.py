"""
Real-time WebSocket Chat using Flask-SocketIO
Standard approach used by Slack, Discord, etc.
"""
from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import decode_token
from datetime import datetime
import traceback

# Import models
try:
    from backend.database.models import db, User, ChatMessage, MessageReaction, OnlineUser
except ImportError:
    from database.models import db, User, ChatMessage, MessageReaction, OnlineUser

socketio = None


def init_socketio(app):
    """Initialize SocketIO with Flask app"""
    global socketio

    socketio = SocketIO(
        app,
        cors_allowed_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        async_mode='threading',
        ping_timeout=60,
        ping_interval=25,
        logger=True,
        engineio_logger=False
    )

    register_handlers()
    print("WebSocket initialized - Real-time chat enabled")
    return socketio


def register_handlers():
    """Register WebSocket event handlers"""

    @socketio.on('connect')
    def handle_connect(auth):
        """Handle new WebSocket connection"""
        try:
            # Get token from auth
            token = auth.get('token') if auth else None
            if not token:
                print("Connection rejected: No token")
                return False

            # Decode JWT to get user_id
            try:
                decoded = decode_token(token)
                user_id = decoded['sub']
            except Exception as e:
                print(f"Token decode failed: {e}")
                return False

            # Get user
            user = User.query.get(user_id)
            if not user:
                print(f"User {user_id} not found")
                return False

            # Store connection
            socket_id = request.sid

            # FIXED: Delete all old connections for this user first
            OnlineUser.query.filter_by(user_id=user_id).delete()
            db.session.commit()

            # Create new connection
            online_user = OnlineUser(
                user_id=user_id,
                socket_id=socket_id,
                last_seen=datetime.utcnow()
            )
            db.session.add(online_user)
            db.session.commit()

            # Join global chat room
            join_room('global_chat')

            # Get online count
            online_count = OnlineUser.query.count()

            # Notify others
            emit('user_joined', {
                'user_id': user_id,
                'username': user.name,
                'online_count': online_count,
                'timestamp': datetime.utcnow().isoformat()
            }, room='global_chat', skip_sid=socket_id)

            # Send online count to connecting user
            emit('online_count', {'count': online_count})

            print(f"[OK] {user.name} connected (Online: {online_count})")
            return True

        except Exception as e:
            print(f"Connection error: {e}")
            traceback.print_exc()
            return False

    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle WebSocket disconnection"""
        try:
            socket_id = request.sid

            # Find and remove user
            online_user = OnlineUser.query.filter_by(socket_id=socket_id).first()
            if online_user:
                user = User.query.get(online_user.user_id)
                username = user.name if user else "Unknown"

                db.session.delete(online_user)
                db.session.commit()

                # Notify others
                online_count = OnlineUser.query.count()
                emit('user_left', {
                    'username': username,
                    'online_count': online_count,
                    'timestamp': datetime.utcnow().isoformat()
                }, room='global_chat')

                print(f"[DISCONNECT] {username} left (Online: {online_count})")

        except Exception as e:
            print(f"Disconnect error: {e}")

    @socketio.on('send_message')
    def handle_send_message(data):
        """Handle incoming message - INSTANT broadcast"""
        try:
            socket_id = request.sid

            # Get user
            online_user = OnlineUser.query.filter_by(socket_id=socket_id).first()
            if not online_user:
                print(f"[ERROR] Message from unauthenticated socket: {socket_id}")
                emit('error', {'message': 'Not authenticated'})
                return

            user = User.query.get(online_user.user_id)
            if not user:
                print(f"[ERROR] User not found for socket: {socket_id}")
                emit('error', {'message': 'User not found'})
                return

            # Validate message
            content = data.get('content', '').strip()
            if not content or len(content) > 1000:
                emit('error', {'message': 'Invalid message length'})
                return

            # Basic content filtering
            BAD_WORDS = ['scam', 'fraud', 'pump', 'guaranteed returns', 'insider tip']
            content_lower = content.lower()
            for word in BAD_WORDS:
                if word in content_lower:
                    content = content.replace(word, '***')

            # Save to database
            message = ChatMessage(
                user_id=user.id,
                username=user.name,
                content=content,
                message_type='text'
            )
            db.session.add(message)
            db.session.commit()

            # Broadcast to ALL users INSTANTLY
            message_data = {
                'id': message.id,
                'user_id': message.user_id,
                'username': message.username,
                'content': message.content,
                'type': message.message_type,
                'created_at': message.created_at.isoformat(),
                'reactions': []
            }

            emit('new_message', message_data, room='global_chat')

            print(f"[MSG] {user.name}: {content[:50]}...")

        except Exception as e:
            print(f"Send message error: {e}")
            traceback.print_exc()
            emit('error', {'message': 'Failed to send message'})

    @socketio.on('typing')
    def handle_typing(data):
        """Handle typing indicator"""
        try:
            socket_id = request.sid
            online_user = OnlineUser.query.filter_by(socket_id=socket_id).first()

            if online_user:
                user = User.query.get(online_user.user_id)
                is_typing = data.get('typing', False)

                # Broadcast to others (not sender)
                emit('user_typing', {
                    'user_id': user.id,
                    'username': user.name,
                    'typing': is_typing
                }, room='global_chat', skip_sid=socket_id)

        except Exception as e:
            print(f"Typing error: {e}")

    @socketio.on('get_history')
    def handle_get_history(data):
        """Send recent chat history"""
        try:
            limit = min(data.get('limit', 100), 200)  # Max 200 messages

            # Get recent messages
            from datetime import timedelta
            cutoff_time = datetime.utcnow() - timedelta(hours=24)

            messages = ChatMessage.query.filter(
                ChatMessage.created_at >= cutoff_time,
                ChatMessage.is_deleted == False
            ).order_by(ChatMessage.created_at.desc()).limit(limit).all()

            # Reverse to show oldest first
            messages.reverse()

            # Send to requesting user only
            emit('chat_history', {
                'messages': [msg.to_dict() for msg in messages]
            })

            print(f"[HISTORY] Sent {len(messages)} messages")

        except Exception as e:
            print(f"Get history error: {e}")
            traceback.print_exc()

    @socketio.on('react_message')
    def handle_react(data):
        """Handle message reactions"""
        try:
            socket_id = request.sid
            online_user = OnlineUser.query.filter_by(socket_id=socket_id).first()

            if not online_user:
                return

            message_id = data.get('message_id')
            emoji = data.get('emoji')

            if not message_id or not emoji:
                return

            message = ChatMessage.query.get(message_id)
            if not message:
                return

            # Check if reaction exists
            existing = MessageReaction.query.filter_by(
                message_id=message_id,
                user_id=online_user.user_id,
                emoji=emoji
            ).first()

            if existing:
                # Remove reaction
                db.session.delete(existing)
                db.session.commit()
                action = 'removed'
            else:
                # Add reaction
                reaction = MessageReaction(
                    message_id=message_id,
                    user_id=online_user.user_id,
                    emoji=emoji
                )
                db.session.add(reaction)
                db.session.commit()
                action = 'added'

            # Broadcast reaction update
            emit('reaction_update', {
                'message_id': message_id,
                'emoji': emoji,
                'user_id': online_user.user_id,
                'action': action
            }, room='global_chat')

        except Exception as e:
            print(f"React error: {e}")