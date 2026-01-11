from flask import Blueprint, jsonify
import sys

health_bp = Blueprint('health', __name__, url_prefix='/api')

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Public health check endpoint - no authentication required"""
    print("🏥 Health check endpoint called", file=sys.stderr)
    
    return jsonify({
        'status': 'healthy',
        'message': 'API is running',
        'version': '1.0.0'
    }), 200

@health_bp.route('/status', methods=['GET'])
def status():
    """Detailed status endpoint"""
    print("📊 Status endpoint called", file=sys.stderr)
    
    return jsonify({
        'status': 'ok',
        'database': 'connected',
        'api': 'operational'
    }), 200