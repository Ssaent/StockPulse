"""Authentication and user management"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
from database.models import db, User

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()
jwt = JWTManager()

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register new user"""
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    # Check if user exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    # Hash password
    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    # Create user
    user = User(email=email, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()

    # Generate token
    access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(days=7))

    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict(),
        'access_token': access_token
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    # Find user
    user = User.query.filter_by(email=email).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()

    # Generate token
    access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(days=7))

    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token
    })

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({'user': user.to_dict()})