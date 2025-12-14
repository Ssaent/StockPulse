"""
Real-time WebSocket Chat using Flask-SocketIO
Industry-standard implementation with proper session management
"""
import os
import logging
from flask import request, current_app
from flask_socketio import SocketIO, emit, join_room, leave_room, Namespace
from flask_jwt_extended import decode_token
from datetime import datetime, timezone, timedelta

# Import models
try:
    from backend.database.models import db, User, ChatMessage, MessageReaction, OnlineUser
except ImportError:
    from database.models import db, User, ChatMessage, MessageReaction, OnlineUser

# Configure logging
logger = logging.getLogger(__name__)

socketio = None

# Configuration from environment
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')
CHAT_BAD_WORDS = os.getenv('CHAT_BAD_WORDS', 'scam,fraud,pump,guaranteed returns,insider tip').split(',')
MAX_MESSAGE_LENGTH = int(os.getenv('MAX_MESSAGE_LENGTH', 1000))
MAX_HISTORY_LIMIT = int(os.getenv('MAX_HISTORY_LIMIT', 200))
HISTORY_HOURS = int(os.getenv('CHAT_HISTORY_HOURS', 24))

# In-memory cache for socket_id -> user_id mapping (fallback)
_socket_user_cache = {}


def init_socketio(app):
    """Initialize SocketIO with Flask app"""
    global socketio

    socketio = SocketIO(
        app,
        cors_allowed_origins=CORS_ORIGINS,
        async_mode='gevent',
        ping_timeout=60,
        ping_interval=25,
        logger=False,
        engineio_logger=False,
        allow_upgrades=True,
        transports=['websocket', 'polling'],
        manage_session=True  # Important: Let SocketIO manage sessions
    )

    register_handlers()
    logger.info("WebSocket initialized - Real-time chat enabled")
    return socketio


def get_user_from_socket(socket_id):
    """
    Industry-standard: Get user from socket with proper session management
    Uses multiple strategies to ensure reliability across gevent contexts
    Returns (user, online_user) or (None, None) if not found
    """
    try:
        # Strategy 1: Check in-memory cache first (fastest)
        if socket_id in _socket_user_cache:
            user_id = _socket_user_cache[socket_id]
            try:
                user = User.query.get(user_id)
                if user:
                    # Verify OnlineUser still exists
                    online_user = OnlineUser.query.filter_by(
                        socket_id=socket_id,
                        user_id=user_id
                    ).first()
                    if online_user:
                        # Update last_seen
                        online_user.last_seen = datetime.now(timezone.utc)
                        db.session.commit()
                        return user, online_user
                    else:
                        # Cache is stale, remove it
                        del _socket_user_cache[socket_id]
            except Exception:
                db.session.rollback()
        
        # Strategy 2: Query database with fresh session
        # Close any existing session and start fresh
        db.session.close()
        
        # Query with explicit session handling
        online_user = OnlineUser.query.filter_by(socket_id=socket_id).first()
        
        if not online_user:
            logger.debug(f"No OnlineUser found for socket: {socket_id}")
            return None, None
        
        # Get user
        user = User.query.get(online_user.user_id)
        if not user:
            logger.warning(f"User {online_user.user_id} not found for socket {socket_id}")
            # Clean up orphaned record
            db.session.delete(online_user)
            db.session.commit()
            return None, None
        
        # Update cache
        _socket_user_cache[socket_id] = user.id
        
        # Update last_seen
        online_user.last_seen = datetime.now(timezone.utc)
        db.session.commit()
        
        return user, online_user
        
    except Exception as e:
        logger.error(f"Error getting user from socket: {e}", exc_info=True)
        db.session.rollback()
        return None, None


def register_handlers():
    """Register WebSocket event handlers"""

    @socketio.on('connect')
    def handle_connect(auth):
        """Handle new WebSocket connection with JWT authentication"""
        try:
            # Get token from auth
            token = auth.get('token') if auth else None
            if not token:
                logger.warning("Connection rejected: No token provided")
                return False

            # Decode JWT to get user_id
            try:
                decoded = decode_token(token)
                user_id = int(decoded['sub'])
            except (ValueError, KeyError, Exception) as e:
                logger.warning(f"Token decode failed: {e}")
                return False

            # Get user from database with fresh session
            db.session.close()  # Ensure fresh session
            user = User.query.get(user_id)
            if not user:
                logger.warning(f"User {user_id} not found")
                return False

            if not user.is_verified:
                logger.warning(f"Unverified user {user_id} attempted connection")
                return False

            # Store connection
            socket_id = request.sid

            # Industry-standard: Clean up old connections for this user
            try:
                old_connections = OnlineUser.query.filter_by(user_id=user_id).all()
                for old_conn in old_connections:
                    # Remove from cache if exists
                    if old_conn.socket_id in _socket_user_cache:
                        del _socket_user_cache[old_conn.socket_id]
                    db.session.delete(old_conn)
                db.session.commit()
            except Exception as e:
                logger.error(f"Error cleaning old connections: {e}")
                db.session.rollback()

            # Create new connection record
            try:
                online_user = OnlineUser(
                    user_id=user_id,
                    socket_id=socket_id,
                    last_seen=datetime.now(timezone.utc)
                )
                db.session.add(online_user)
                db.session.commit()
                
                # CRITICAL: Refresh to ensure it's in the session
                db.session.refresh(online_user)
                
                # Update cache
                _socket_user_cache[socket_id] = user_id
                
                logger.info(f"OnlineUser created: socket_id={socket_id}, user_id={user_id}")
                
            except Exception as e:
                logger.error(f"Error creating OnlineUser record: {e}", exc_info=True)
                db.session.rollback()
                return False

            # Join global chat room
            join_room('global_chat')

            # Get online count
            online_count = OnlineUser.query.count()

            # Notify others (excluding the connecting user)
            emit('user_joined', {
                'user_id': user_id,
                'username': user.username,
                'online_count': online_count,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }, room='global_chat', skip_sid=socket_id)

            # Send online count to connecting user
            emit('online_count', {'count': online_count})

            logger.info(f"User {user.username} (ID: {user_id}) connected. Online: {online_count}")
            return True

        except Exception as e:
            logger.error(f"Connection error: {e}", exc_info=True)
            return False

    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle WebSocket disconnection"""
        try:
            socket_id = request.sid
            
            # Remove from cache
            if socket_id in _socket_user_cache:
                user_id = _socket_user_cache[socket_id]
                del _socket_user_cache[socket_id]
            else:
                user_id = None
            
            # Get user info
            user, online_user = get_user_from_socket(socket_id)

            if online_user:
                username = user.username if user else "Unknown"

                # Remove from database
                db.session.delete(online_user)
                db.session.commit()

                # Notify others
                online_count = OnlineUser.query.count()
                emit('user_left', {
                    'username': username,
                    'online_count': online_count,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }, room='global_chat')

                logger.info(f"User {username} disconnected. Online: {online_count}")

        except Exception as e:
            logger.error(f"Disconnect error: {e}", exc_info=True)
            db.session.rollback()

    @socketio.on('send_message')
    def handle_send_message(data):
        """Handle incoming message with proper validation and authentication"""
        try:
            socket_id = request.sid

            # Industry-standard: Get user with proper session management
            user, online_user = get_user_from_socket(socket_id)
            
            if not user or not online_user:
                logger.warning(f"Unauthenticated message attempt from socket: {socket_id}")
                # Debug: Check what's in database
                all_online = OnlineUser.query.all()
                logger.debug(f"Total OnlineUser records: {len(all_online)}")
                logger.debug(f"Socket IDs in DB: {[u.socket_id for u in all_online]}")
                logger.debug(f"Cache entries: {list(_socket_user_cache.keys())}")
                
                emit('error', {'message': 'Not authenticated. Please reconnect.'})
                return

            # Validate message content
            content = data.get('content', '').strip()
            if not content:
                emit('error', {'message': 'Message cannot be empty'})
                return

            if len(content) > MAX_MESSAGE_LENGTH:
                emit('error', {'message': f'Message too long (max {MAX_MESSAGE_LENGTH} characters)'})
                return

            # Content filtering
            content_lower = content.lower()
            for word in CHAT_BAD_WORDS:
                if word.lower() in content_lower:
                    content = content.replace(word, '***')
                    logger.info(f"Filtered bad word in message from user {user.username}")

            # Save to database with proper error handling
            try:
                message = ChatMessage(
                    user_id=user.id,
                    username=user.username,
                    content=content,
                    message_type='text'
                )
                db.session.add(message)
                db.session.commit()
                db.session.refresh(message)
            except Exception as e:
                logger.error(f"Error saving message: {e}", exc_info=True)
                db.session.rollback()
                emit('error', {'message': 'Failed to save message'})
                return

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

            logger.info(f"Message sent by {user.username}: {content[:50]}...")

        except Exception as e:
            logger.error(f"Send message error: {e}", exc_info=True)
            db.session.rollback()
            emit('error', {'message': 'Failed to send message'})

    @socketio.on('typing')
    def handle_typing(data):
        """Handle typing indicator"""
        try:
            socket_id = request.sid
            user, online_user = get_user_from_socket(socket_id)

            if user and online_user:
                is_typing = data.get('typing', False)

                # Broadcast to others (not sender)
                emit('user_typing', {
                    'user_id': user.id,
                    'username': user.username,
                    'typing': is_typing
                }, room='global_chat', skip_sid=socket_id)

        except Exception as e:
            logger.error(f"Typing error: {e}", exc_info=True)

    @socketio.on('get_history')
    def handle_get_history(data):
        """Send recent chat history with proper limits"""
        try:
            # Validate and limit history request
            limit = min(max(int(data.get('limit', 100)), 1), MAX_HISTORY_LIMIT)

            # Get recent messages (last 24 hours by default)
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=HISTORY_HOURS)

            messages = ChatMessage.query.filter(
                ChatMessage.created_at >= cutoff_time,
                ChatMessage.is_deleted == False
            ).order_by(ChatMessage.created_at.desc()).limit(limit).all()

            # Reverse to show oldest first
            messages.reverse()

            # Send to requesting user only
            emit('chat_history', {
                'messages': [msg.to_dict() for msg in messages],
                'total': len(messages)
            })

            logger.info(f"Sent {len(messages)} messages to socket {request.sid}")

        except Exception as e:
            logger.error(f"Get history error: {e}", exc_info=True)
            emit('error', {'message': 'Failed to fetch chat history'})

    @socketio.on('react_message')
    def handle_react(data):
        """Handle message reactions with proper validation"""
        try:
            socket_id = request.sid
            user, online_user = get_user_from_socket(socket_id)

            if not user or not online_user:
                return

            message_id = data.get('message_id')
            emoji = data.get('emoji', '').strip()

            # Validate inputs
            if not message_id or not emoji:
                return

            # Validate emoji length (prevent abuse)
            if len(emoji) > 10:
                return

            # Get message
            message = ChatMessage.query.get(message_id)
            if not message:
                return

            # Check if reaction exists
            existing = MessageReaction.query.filter_by(
                message_id=message_id,
                user_id=user.id,
                emoji=emoji
            ).first()

            try:
                if existing:
                    # Remove reaction
                    db.session.delete(existing)
                    db.session.commit()
                    action = 'removed'
                else:
                    # Add reaction
                    reaction = MessageReaction(
                        message_id=message_id,
                        user_id=user.id,
                        emoji=emoji
                    )
                    db.session.add(reaction)
                    db.session.commit()
                    action = 'added'

                # Broadcast reaction update
                emit('reaction_update', {
                    'message_id': message_id,
                    'emoji': emoji,
                    'user_id': user.id,
                    'action': action
                }, room='global_chat')

            except Exception as e:
                logger.error(f"Error saving reaction: {e}", exc_info=True)
                db.session.rollback()

        except Exception as e:
            logger.error(f"React error: {e}", exc_info=True)