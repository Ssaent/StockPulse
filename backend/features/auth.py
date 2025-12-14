"""
Authentication routes with OTP-based email verification (Industry Standard)
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta, timezone
import re
import secrets

try:
    from backend.database.models import db, User
    from backend.services.email_service import email_service
except ImportError:
    from database.models import db, User
    from services.email_service import email_service

auth_bp = Blueprint('auth', __name__)
jwt = JWTManager()
bcrypt = Bcrypt()


def generate_otp():
    """Generate 6-digit OTP"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])


def validate_email_address(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return "Invalid email format"
    if len(email) > 120:
        return "Email is too long"
    return None


def validate_username(username):
    """Validate username format - no numbers, no phone number patterns, professional"""
    username = username.strip()

    # Check length
    if len(username) < 3:
        return "Username must be at least 3 characters long"
    if len(username) > 30:
        return "Username must be less than 30 characters"

    # Check for only alphabets and optional underscores/hyphens
    if not re.match(r'^[a-zA-Z][a-zA-Z_-]*[a-zA-Z]$', username):
        return "Username can only contain letters, hyphens, or underscores (no numbers, no special characters at start/end)"

    # Check for phone number patterns (sequences of 10+ digits)
    if re.search(r'\d{10,}', username):
        return "Username cannot contain phone number patterns"

    # Check for common number sequences
    number_sequences = ['123', '1234', '12345', '000', '111', '222', '333', '444', '555', '666', '777', '888', '999']
    if any(seq in username for seq in number_sequences):
        return "Username cannot contain number sequences"

    # Check for inappropriate patterns
    inappropriate_patterns = [
        'admin', 'root', 'support', 'help', 'contact', 'service', 'test', 'demo'
    ]
    if username.lower() in inappropriate_patterns:
        return "This username is not allowed"

    return None


def validate_password_strength(password):
    """Validate password meets security requirements"""
    errors = []
    if len(password) < 8:
        errors.append("Password must be at least 8 characters")
    if len(password) > 128:
        errors.append("Password is too long")
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    if not re.search(r'\d', password):
        errors.append("Password must contain at least one number")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")
    return errors


# ==================== REGISTER ENDPOINT ====================

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register new user - Send OTP for email verification"""
    try:
        data = request.get_json()

        # FIX: Handle the specific nested data structure from frontend
        # Data is coming as: {'name': {'name': 'SaiTeja', 'email': 'test@email.com', 'username': 'ssae', 'password': 'pass'}}
        if isinstance(data, dict) and 'name' in data and isinstance(data['name'], dict):
            # Extract from nested structure
            name = data['name'].get('name', '').strip()
            email = data['name'].get('email', '').strip().lower()
            username = data['name'].get('username', '').strip()
            password = data['name'].get('password', '')
        else:
            # Normal flat data structure
            name = data.get('name', '').strip()
            email = data.get('email', '').strip().lower()
            username = data.get('username', '').strip()
            password = data.get('password', '')

        # Validate name
        if not name or len(name) < 2:
            return jsonify({'error': 'Name must be at least 2 characters'}), 400
        if len(name) > 100:
            return jsonify({'error': 'Name is too long'}), 400

        name = re.sub(r'[<>"\']', '', name)

        # Validate email
        if not email:
            return jsonify({'error': 'Email is required'}), 400

        email_error = validate_email_address(email)
        if email_error:
            return jsonify({'error': email_error}), 400

        # Validate username
        if not username:
            return jsonify({'error': 'Username is required'}), 400

        username_error = validate_username(username)
        if username_error:
            return jsonify({'error': username_error}), 400

        # Validate password
        if not password:
            return jsonify({'error': 'Password is required'}), 400

        password_errors = validate_password_strength(password)
        if password_errors:
            return jsonify({
                'error': 'Password requirements not met',
                'details': password_errors
            }), 400

        # Check if email exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 400

        # Check if username exists
        existing_username = User.query.filter_by(username=username).first()
        if existing_username:
            return jsonify({'error': 'Username already taken'}), 400

        # Hash password
        hashed_password = bcrypt.generate_password_hash(password, rounds=12).decode('utf-8')

        # Generate 6-digit OTP
        otp = generate_otp()
        otp_created_at = datetime.now(timezone.utc)

        # Create user (not verified yet)
        user = User(
            name=name,
            email=email,
            username=username,  # NEW: Store username
            password_hash=hashed_password,
            is_verified=False,
            verification_otp=otp,
            otp_created_at=otp_created_at,
            otp_attempts=0,
            created_at=datetime.now(timezone.utc)
        )

        db.session.add(user)
        db.session.commit()

        # Send OTP email
        email_sent = email_service.send_otp_email(
            user_email=email,
            user_name=name,
            otp=otp
        )

        return jsonify({
            'message': 'Registration successful! Please check your email for OTP.',
            'email': email,
            'username': username,
            'otp_sent': email_sent,
            'expires_in': '5 minutes'
        }), 201

    except Exception as e:
        db.session.rollback()
        # Add detailed error logging
        import traceback
        print(f"Registration error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Registration failed. Please try again.', 'details': str(e)}), 500


# ==================== VERIFY OTP ENDPOINT ====================

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP and activate user account"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        otp = data.get('otp', '').strip()

        if not email or not otp:
            return jsonify({'error': 'Email and OTP are required'}), 400

        # Find user
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Check if already verified
        if user.is_verified:
            # Still return token for already verified users
            access_token = create_access_token(
                identity=str(user.id),
                additional_claims={
                    'email': user.email,
                    'name': user.name,
                    'username': user.username,  # NEW: Include username in claims
                    'is_verified': True
                },
                expires_delta=timedelta(days=7)
            )
            return jsonify({
                'message': 'Email already verified',
                'token': access_token,
                'user': user.to_dict()
            }), 200

        # Check rate limiting (max 5 attempts)
        if user.otp_attempts >= 5:
            return jsonify({'error': 'Too many failed attempts. Please request a new OTP.'}), 429

        # Check OTP expiry (5 minutes)
        if user.otp_created_at:
            now = datetime.now(timezone.utc)
            otp_created = user.otp_created_at

            # Make otp_created_at timezone-aware if it's naive
            if otp_created.tzinfo is None:
                otp_created = otp_created.replace(tzinfo=timezone.utc)

            otp_age = now - otp_created

            if otp_age > timedelta(minutes=5):
                return jsonify({'error': 'OTP has expired. Please request a new one.'}), 400

        # Verify OTP
        if user.verification_otp != otp:
            user.otp_attempts += 1
            db.session.commit()
            remaining = 5 - user.otp_attempts
            return jsonify({
                'error': 'Invalid OTP',
                'attempts_remaining': remaining
            }), 400

        # OTP is valid - verify user
        user.is_verified = True
        user.verification_otp = None
        user.otp_created_at = None
        user.otp_attempts = 0
        db.session.commit()

        # Send welcome email
        email_service.send_welcome_email(user.email, user.name)

        # Create JWT token
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'email': user.email,
                'name': user.name,
                'username': user.username,  # NEW: Include username in claims
                'is_verified': True
            },
            expires_delta=timedelta(days=7)
        )

        return jsonify({
            'message': 'Email verified successfully! You can now login.',
            'token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'username': user.username,  # NEW: Include username in response
                'is_verified': True
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'OTP verification failed'}), 500


# ==================== RESEND OTP ENDPOINT ====================

@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    """Resend OTP for email verification"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        if user.is_verified:
            return jsonify({'message': 'Email already verified'}), 200

        # Generate new OTP
        otp = generate_otp()
        user.verification_otp = otp
        user.otp_created_at = datetime.now(timezone.utc)
        user.otp_attempts = 0
        db.session.commit()

        # Send OTP email
        email_sent = email_service.send_otp_email(
            user_email=user.email,
            user_name=user.name,
            otp=otp
        )

        return jsonify({
            'message': 'New OTP sent! Please check your email.',
            'otp_sent': email_sent,
            'expires_in': '5 minutes'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to resend OTP'}), 500


# ==================== FORGOT PASSWORD ENDPOINT ====================

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send password reset OTP"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        user = User.query.filter_by(email=email).first()

        # Don't reveal if user exists (security best practice)
        if not user:
            # Still return success to prevent email enumeration
            return jsonify({
                'message': 'If an account exists with this email, you will receive reset instructions.',
                'email': email
            }), 200

        # Generate reset OTP
        reset_otp = generate_otp()
        user.verification_otp = reset_otp
        user.otp_created_at = datetime.now(timezone.utc)
        user.otp_attempts = 0
        db.session.commit()

        # Send reset email
        email_sent = email_service.send_password_reset_email(
            user_email=user.email,
            user_name=user.name,
            otp=reset_otp
        )

        return jsonify({
            'message': 'Password reset instructions sent to your email.',
            'email': email,
            'otp_sent': email_sent
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to process request'}), 500


# ==================== RESET PASSWORD ENDPOINT ====================

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using OTP"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        otp = data.get('otp', '').strip()
        new_password = data.get('new_password', '')

        if not email or not otp or not new_password:
            return jsonify({'error': 'Email, OTP, and new password are required'}), 400

        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({'error': 'Invalid request'}), 400

        # Check rate limiting
        if user.otp_attempts >= 5:
            return jsonify({'error': 'Too many failed attempts. Please request a new reset code.'}), 429

        # Check OTP expiry (10 minutes for password reset)
        if user.otp_created_at:
            now = datetime.now(timezone.utc)
            otp_created = user.otp_created_at

            if otp_created.tzinfo is None:
                otp_created = otp_created.replace(tzinfo=timezone.utc)

            otp_age = now - otp_created

            if otp_age > timedelta(minutes=10):
                return jsonify({'error': 'Reset code has expired. Please request a new one.'}), 400

        # Verify OTP
        if user.verification_otp != otp:
            user.otp_attempts += 1
            db.session.commit()
            remaining = 5 - user.otp_attempts
            return jsonify({
                'error': 'Invalid reset code',
                'attempts_remaining': remaining
            }), 400

        # Validate new password
        password_errors = validate_password_strength(new_password)
        if password_errors:
            return jsonify({
                'error': 'Password requirements not met',
                'details': password_errors
            }), 400

        # Check if new password is same as old
        if bcrypt.check_password_hash(user.password_hash, new_password):
            return jsonify({'error': 'New password must be different from current password'}), 400

        # Update password
        user.password_hash = bcrypt.generate_password_hash(new_password, rounds=12).decode('utf-8')
        user.verification_otp = None
        user.otp_created_at = None
        user.otp_attempts = 0
        db.session.commit()

        # Send confirmation email
        email_service.send_password_changed_email(user.email, user.name)

        return jsonify({
            'message': 'Password reset successfully. You can now login with your new password.'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to reset password'}), 500


# ==================== LOGIN ENDPOINT ====================

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user - Only if email is verified"""
    try:
        data = request.get_json()

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400

        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401

        if not bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid email or password'}), 401

        # BLOCK LOGIN IF EMAIL NOT VERIFIED
        if not user.is_verified:
            return jsonify({
                'error': 'Email not verified',
                'message': 'Please verify your email before logging in. Check your inbox for OTP.',
                'email': user.email,
                'requires_verification': True
            }), 403

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        db.session.commit()

        # Create JWT token
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'email': user.email,
                'name': user.name,
                'username': user.username,  # NEW: Include username in claims
                'is_verified': user.is_verified
            },
            expires_delta=timedelta(days=7)
        )

        return jsonify({
            'message': 'Login successful',
            'token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'username': user.username,  # NEW: Include username in response
                'is_verified': user.is_verified
            }
        }), 200

    except Exception as e:
        # Add detailed error logging
        import traceback
        print(f"Login error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Login failed', 'details': str(e)}), 500


# ==================== GET CURRENT USER ====================

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'user': user.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch user'}), 500


# ==================== CHANGE PASSWORD ====================

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        old_password = data.get('old_password', '')
        new_password = data.get('new_password', '')

        if not bcrypt.check_password_hash(user.password_hash, old_password):
            return jsonify({'error': 'Current password is incorrect'}), 401

        password_errors = validate_password_strength(new_password)
        if password_errors:
            return jsonify({
                'error': 'Password requirements not met',
                'details': password_errors
            }), 400

        if bcrypt.check_password_hash(user.password_hash, new_password):
            return jsonify({'error': 'New password must be different'}), 400

        user.password_hash = bcrypt.generate_password_hash(new_password, rounds=12).decode('utf-8')
        db.session.commit()

        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to change password'}), 500


# ==================== UPDATE PROFILE ====================

@auth_bp.route('/update-profile', methods=['POST'])
@jwt_required()
def update_profile():
    """Update user profile information"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        name = data.get('name', '').strip()
        username = data.get('username', '').strip()

        # Validate name
        if name:
            if len(name) < 2:
                return jsonify({'error': 'Name must be at least 2 characters'}), 400
            if len(name) > 100:
                return jsonify({'error': 'Name is too long'}), 400
            user.name = re.sub(r'[<>"\']', '', name)

        # Validate and update username
        if username and username != user.username:
            username_error = validate_username(username)
            if username_error:
                return jsonify({'error': username_error}), 400

            # Check if username is taken
            existing_user = User.query.filter_by(username=username).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Username already taken'}), 400

            user.username = username

        db.session.commit()

        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile'}), 500