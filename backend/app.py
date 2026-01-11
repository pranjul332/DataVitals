from flask import Blueprint, Flask, request, jsonify
from flask_cors import CORS
import json
import os
import sys
import numpy as np
import pandas as pd
from functools import wraps
from jose import jwt, JWTError
from urllib.request import urlopen, Request

from config import Config
from routes import health_bp, analysis_bp, preparation_bp, workflow_bp
from database.user import init_db, get_user_by_auth0_id, create_or_update_user
from routes.user_routes import user_bp
from routes.report_routes import report_bp
from database.analysis import init_reports_indexes


class NumpyEncoder(json.JSONEncoder):
    """Custom JSON encoder for numpy types"""
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.bool_):
            return bool(obj)
        if pd.isna(obj):
            return None
        return super(NumpyEncoder, self).default(obj)


def get_token_auth_header():
    """Obtains the Access Token from the Authorization Header"""
    auth = request.headers.get("Authorization", None)
    print(f"🔑 Authorization header: {auth[:50] if auth else 'None'}...", file=sys.stderr)
    
    if not auth:
        print("❌ No authorization header found", file=sys.stderr)
        return None

    parts = auth.split()
    if parts[0].lower() != "bearer":
        print(f"❌ Invalid auth scheme: {parts[0]}", file=sys.stderr)
        return None
    elif len(parts) == 1:
        print("❌ Token not found in header", file=sys.stderr)
        return None
    elif len(parts) > 2:
        print("❌ Invalid authorization header format", file=sys.stderr)
        return None

    token = parts[1]
    print(f"✅ Token extracted: {token[:20]}...", file=sys.stderr)
    return token


def verify_jwt(token):
    """Verifies the JWT token with Auth0"""
    try:
        auth0_domain = os.getenv('AUTH0_DOMAIN')
        api_audience = os.getenv('AUTH0_AUDIENCE')
        
        print("=" * 80, file=sys.stderr)
        print(f"🔐 JWT VERIFICATION DEBUG", file=sys.stderr)
        print("=" * 80, file=sys.stderr)
        print(f"   Auth0 Domain: {auth0_domain}", file=sys.stderr)
        print(f"   API Audience: {api_audience}", file=sys.stderr)
        
        if not auth0_domain or auth0_domain == 'YOUR_AUTH0_DOMAIN':
            print("❌ ERROR: AUTH0_DOMAIN not set properly!", file=sys.stderr)
            return None
            
        if not api_audience or api_audience == 'YOUR_API_IDENTIFIER':
            print("❌ ERROR: AUTH0_AUDIENCE not set properly!", file=sys.stderr)
            return None
        
        jwks_url = f"https://{auth0_domain}/.well-known/jwks.json"
        print(f"   Fetching JWKS from: {jwks_url}", file=sys.stderr)
        
        jsonurl = urlopen(jwks_url)
        jwks = json.loads(jsonurl.read())
        print(f"   ✓ JWKS fetched successfully", file=sys.stderr)
        
        unverified_header = jwt.get_unverified_header(token)
        print(f"   Token header: {unverified_header}", file=sys.stderr)
        
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                print(f"   ✓ Matching RSA key found: {key['kid']}", file=sys.stderr)
                break
        
        if not rsa_key:
            print(f"   ❌ No matching RSA key found", file=sys.stderr)
            return None
        
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=api_audience,
            issuer=f"https://{auth0_domain}/"
        )
        
        print(f"   ✅ Token verified successfully!", file=sys.stderr)
        print(f"   Payload sub: {payload.get('sub')}", file=sys.stderr)
        print("=" * 80, file=sys.stderr)
        
        return payload
        
    except JWTError as e:
        print("=" * 80, file=sys.stderr)
        print(f"❌ JWT VERIFICATION FAILED", file=sys.stderr)
        print(f"   Error: {str(e)}", file=sys.stderr)
        print("=" * 80, file=sys.stderr)
        return None
    except Exception as e:
        print("=" * 80, file=sys.stderr)
        print(f"❌ UNEXPECTED ERROR: {e}", file=sys.stderr)
        print("=" * 80, file=sys.stderr)
        return None


def requires_auth(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return '', 204
        
        print("\n" + "🔒 " + "=" * 78, file=sys.stderr)
        print(f"🔒 AUTH CHECK: {request.method} {request.path}", file=sys.stderr)
        print("🔒 " + "=" * 78, file=sys.stderr)
        
        token = get_token_auth_header()
        
        if not token:
            print("🔒 ❌ No token found - returning 401", file=sys.stderr)
            response = jsonify({
                "error": "authorization_header_missing",
                "message": "Authorization header is expected"
            })
            response.status_code = 401
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response
        
        payload = verify_jwt(token)
        
        if not payload:
            print("🔒 ❌ Token verification failed - returning 401", file=sys.stderr)
            response = jsonify({
                "error": "invalid_token",
                "message": "Token is invalid"
            })
            response.status_code = 401
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response
        
        request.current_user = payload
        auth0_id = payload.get('sub')
        print(f"🔒 ✓ Token valid - Auth0 ID: {auth0_id}", file=sys.stderr)
        
        auth0_domain = os.getenv('AUTH0_DOMAIN')
        userinfo_url = f"https://{auth0_domain}/userinfo"
        
        try:
            req = Request(userinfo_url, headers={'Authorization': f'Bearer {token}'})
            userinfo_response = urlopen(req)
            userinfo = json.loads(userinfo_response.read())
        except Exception as e:
            print(f"🔒 ⚠️  Could not fetch user info: {e}", file=sys.stderr)
            userinfo = {}
        
        user_data = {
            'auth0_id': auth0_id,
            'email': userinfo.get('email') or payload.get('email'),
            'name': userinfo.get('name') or payload.get('name'),
            'picture': userinfo.get('picture') or payload.get('picture')
        }
        
        user = create_or_update_user(user_data)
        request.current_user_db = user
        print("🔒 " + "=" * 78 + "\n", file=sys.stderr)
        
        return f(*args, **kwargs)
    
    return decorated


def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    app.json_encoder = NumpyEncoder
    
    import logging
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        stream=sys.stderr
    )
    
    app.config.from_object(Config)
    
    print("\n" + "🚀 " + "=" * 78, file=sys.stderr)
    print("🚀 APPLICATION STARTUP - ENVIRONMENT CHECK", file=sys.stderr)
    print("🚀 " + "=" * 78, file=sys.stderr)
    print(f"🚀 AUTH0_DOMAIN: {os.getenv('AUTH0_DOMAIN', 'NOT SET')}", file=sys.stderr)
    print(f"🚀 AUTH0_AUDIENCE: {os.getenv('AUTH0_AUDIENCE', 'NOT SET')}", file=sys.stderr)
    print("🚀 " + "=" * 78 + "\n", file=sys.stderr)
    
    # CRITICAL: CORS must allow Authorization header for authenticated requests
    CORS(app, 
         resources={r"/*": {
             "origins": "*",
             "allow_headers": ["Content-Type", "Authorization", "X-User-Id"],
             "expose_headers": ["Content-Type"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "supports_credentials": False  # Set to False when using origins: "*"
         }})
    
    @app.before_request
    def handle_preflight():
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-User-Id'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Max-Age'] = '3600'
            return response
    
    @app.after_request
    def after_request(response):
        """Add CORS headers to all responses"""
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-User-Id'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        return response
    
    # Initialize database
    db = init_db()
    if db is not None:
        init_reports_indexes(db)
    
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    
    app.requires_auth = requires_auth
    
    # Register blueprints
    if health_bp:
        app.register_blueprint(health_bp)
        print("✓ Registered health_bp", file=sys.stderr)
    
    if user_bp:
        app.register_blueprint(user_bp)
        for endpoint in ['user.get_user_stats', 'user.get_user_profile']:
            if endpoint in app.view_functions:
                app.view_functions[endpoint] = requires_auth(app.view_functions[endpoint])
        print("✓ Registered user_bp", file=sys.stderr)
    
    if report_bp:
        app.register_blueprint(report_bp)
        # Apply auth to all report routes
        for endpoint in ['reports.get_report_history', 'reports.get_report', 
                        'reports.delete_report_endpoint', 'reports.get_stats']:
            if endpoint in app.view_functions:
                app.view_functions[endpoint] = requires_auth(app.view_functions[endpoint])
        print("✓ Registered report_bp (with auth)", file=sys.stderr)
    
    # **PROTECT ANALYSIS ROUTES**
    if analysis_bp:
        app.register_blueprint(analysis_bp)
        # Apply auth to analysis endpoint
        if 'analysis.analyze_dataset' in app.view_functions:
            app.view_functions['analysis.analyze_dataset'] = requires_auth(app.view_functions['analysis.analyze_dataset'])
            print("✓ Registered analysis_bp (with auth on /analyze)", file=sys.stderr)
        else:
            print("✓ Registered analysis_bp", file=sys.stderr)
    
    # **PROTECT PREPARATION ROUTES** (if they exist)
    if preparation_bp:
        app.register_blueprint(preparation_bp)
        # Apply auth to preparation endpoints if needed
        for endpoint in app.view_functions:
            if endpoint.startswith('preparation.'):
                app.view_functions[endpoint] = requires_auth(app.view_functions[endpoint])
        print("✓ Registered preparation_bp (with auth)", file=sys.stderr)
    
    # **PROTECT WORKFLOW ROUTES** (if they exist)
    if workflow_bp:
        app.register_blueprint(workflow_bp)
        # Apply auth to workflow endpoints if needed
        for endpoint in app.view_functions:
            if endpoint.startswith('workflow.'):
                app.view_functions[endpoint] = requires_auth(app.view_functions[endpoint])
        print("✓ Registered workflow_bp (with auth)", file=sys.stderr)
    
    print("\n" + "=" * 60, file=sys.stderr)
    print("REGISTERED ROUTES:", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    for rule in app.url_map.iter_rules():
        endpoint_name = rule.endpoint
        is_protected = endpoint_name in app.view_functions and hasattr(app.view_functions[endpoint_name], '__wrapped__')
        protection = "🔒 PROTECTED" if is_protected else "🌐 PUBLIC"
        print(f"{protection} | {rule.methods} {rule.rule}", file=sys.stderr)
    print("=" * 60 + "\n", file=sys.stderr)
    
    @app.errorhandler(Exception)
    def handle_error(e):
        print(f"❌ Error occurred: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        response = jsonify({
            "error": str(e),
            "message": "An error occurred"
        })
        response.status_code = 500
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
        return response
    
    return app


app = create_app()

sessions = {}
try:
    from routes.preparation_routes import get_sessions as prep_sessions
    from routes.workflow_routes import get_sessions as workflow_sessions
    import routes.preparation_routes as prep_module
    import routes.workflow_routes as workflow_module
    prep_module.sessions = sessions
    workflow_module.sessions = sessions
except ImportError:
    pass


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)