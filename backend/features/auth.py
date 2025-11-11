"""
Authentication routes
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from datetime import timedelta, datetime

# FLEXIBLE IMPORTS - works from both root and backend directory
try:
    from backend.database.models import db, User
except ImportError:
    from database.models import db, User

auth_bp = Blueprint('auth', __name__)
jwt = JWTManager()
bcrypt = Bcrypt()


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        name = data.get('name', email.split('@')[0] if email else 'User')

        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400

        # Check if user exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 400

        # Hash password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        # Create user
        user = User(
            email=email,
            password_hash=hashed_password
        )
        db.session.add(user)
        db.session.commit()

        # Create access token with STRING identity
        access_token = create_access_token(
            identity=str(user.id),  # ← Convert to string
            additional_claims={'email': user.email, 'name': user.name},
            expires_delta=timedelta(days=30)
        )

        return jsonify({
            'message': 'Registration successful',
            'token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Registration error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400

        # Find user
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401

        # Check password
        if not bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid email or password'}), 401

        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()

        # Create access token with STRING identity
        access_token = create_access_token(
            identity=str(user.id),  # ← Convert to string
            additional_claims={'email': user.email, 'name': user.name},
            expires_delta=timedelta(days=30)
        )

        return jsonify({
            'message': 'Login successful',
            'token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            }
        }), 200

    except Exception as e:
        print(f"Login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Login failed. Please try again.'}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        # Get identity as string and convert to int
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            }
        }), 200

    except Exception as e:
        print(f"Get user error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500