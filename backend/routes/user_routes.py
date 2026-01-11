from flask import Blueprint, request, jsonify
from functools import wraps
import sys

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

# We'll get the requires_auth decorator from the app after it's created
# For now, define routes and we'll wrap them in app.py

@user_bp.route('/stats', methods=['GET', 'OPTIONS'])
def get_user_stats():
    """Get user statistics - requires authentication"""
    print("📊 GET USER STATS ENDPOINT CALLED", file=sys.stderr)
    print(f"📊 Request object attributes: {dir(request)}", file=sys.stderr)
    print(f"📊 Has current_user? {hasattr(request, 'current_user')}", file=sys.stderr)
    print(f"📊 Has current_user_db? {hasattr(request, 'current_user_db')}", file=sys.stderr)
    
    if hasattr(request, 'current_user'):
        print(f"📊 current_user: {request.current_user}", file=sys.stderr)
    
    if hasattr(request, 'current_user_db'):
        print(f"📊 current_user_db: {request.current_user_db}", file=sys.stderr)
    else:
        print("❌ No current_user_db found in request", file=sys.stderr)
        # Try to get it from current_user at least
        if hasattr(request, 'current_user'):
            auth0_id = request.current_user.get('sub')
            print(f"📊 Trying to get user from auth0_id: {auth0_id}", file=sys.stderr)
            
            # Import here to avoid circular dependency
            from database.user import get_user_by_auth0_id
            user = get_user_by_auth0_id(auth0_id)
            
            if user:
                print(f"✓ Found user in database: {user}", file=sys.stderr)
                request.current_user_db = user
            else:
                print("❌ User not found in database", file=sys.stderr)
                return jsonify({
                    "error": "user_not_found",
                    "message": "User not found in database"
                }), 404
        else:
            return jsonify({
                "error": "unauthorized",
                "message": "User not authenticated"
            }), 401
    
    user = request.current_user_db
    print(f"📊 User from request: {user}", file=sys.stderr)
    print(f"📊 User type: {type(user)}", file=sys.stderr)
    
    # Handle both dict and object responses from database
    if isinstance(user, dict):
        user_id = str(user.get('_id'))  # MongoDB uses _id
        auth0_id = user.get('auth0_id')
    else:
        user_id = str(getattr(user, '_id', None))
        auth0_id = getattr(user, 'auth0_id', None)
    
    print(f"📊 User ID: {user_id}", file=sys.stderr)
    print(f"📊 Auth0 ID: {auth0_id}", file=sys.stderr)
    
    # For now, return mock stats
    stats = {
        "user_id": str(user_id) if user_id else None,
        "auth0_id": auth0_id,
        "total_datasets": 0,
        "api_calls": 0,
        "last_login": None
    }
    
    print(f"✅ Returning stats: {stats}", file=sys.stderr)
    
    return jsonify(stats), 200


@user_bp.route('/profile', methods=['GET'])
def get_user_profile():
    """Get user profile - requires authentication"""
    print("👤 GET USER PROFILE ENDPOINT CALLED", file=sys.stderr)
    
    if not hasattr(request, 'current_user_db'):
        if hasattr(request, 'current_user'):
            from database.user import get_user_by_auth0_id
            auth0_id = request.current_user.get('sub')
            user = get_user_by_auth0_id(auth0_id)
            if user:
                request.current_user_db = user
            else:
                return jsonify({
                    "error": "user_not_found",
                    "message": "User not found in database"
                }), 404
        else:
            return jsonify({
                "error": "unauthorized",
                "message": "User not authenticated"
            }), 401
    
    user = request.current_user_db
    
    # Handle both dict and object responses
    if isinstance(user, dict):
        profile = {
            "id": str(user.get('id')) if user.get('id') else None,
            "auth0_id": user.get('auth0_id'),
            "email": user.get('email'),
            "name": user.get('name'),
            "picture": user.get('picture'),
            "created_at": str(user.get('created_at')) if user.get('created_at') else None
        }
    else:
        profile = {
            "id": str(getattr(user, 'id', None)) if getattr(user, 'id', None) else None,
            "auth0_id": getattr(user, 'auth0_id', None),
            "email": getattr(user, 'email', None),
            "name": getattr(user, 'name', None),
            "picture": getattr(user, 'picture', None),
            "created_at": str(getattr(user, 'created_at', None)) if getattr(user, 'created_at', None) else None
        }
    
    return jsonify(profile), 200