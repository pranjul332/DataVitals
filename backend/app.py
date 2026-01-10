from flask import Flask
from flask_cors import CORS
import json
import os
import numpy as np
import pandas as pd

from config import Config
from routes import health_bp, analysis_bp, preparation_bp, workflow_bp


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


def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    app.json_encoder = NumpyEncoder
    
    # Configuration
    app.config.from_object(Config)
    
    # Enable CORS with proper configuration
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Create upload folder if it doesn't exist
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    
    # Register blueprints (no URL prefix - routes define their own paths)
    if health_bp:
        app.register_blueprint(health_bp)
        print("✓ Registered health_bp")
    else:
        print("✗ Skipped health_bp (not available)")
    
    if analysis_bp:
        app.register_blueprint(analysis_bp)
        print("✓ Registered analysis_bp")
    else:
        print("✗ Skipped analysis_bp (not available)")
    
    if preparation_bp:
        app.register_blueprint(preparation_bp)
        print("✓ Registered preparation_bp")
    else:
        print("✗ Skipped preparation_bp (not available)")
    
    if workflow_bp:
        app.register_blueprint(workflow_bp)
        print("✓ Registered workflow_bp")
    else:
        print("✗ Skipped workflow_bp (not available)")
    
    # Debug: Print all registered routes
    print("\n" + "=" * 60)
    print("REGISTERED ROUTES:")
    print("=" * 60)
    for rule in app.url_map.iter_rules():
        print(f"{rule.methods} {rule.rule}")
    print("=" * 60 + "\n")
    
    # Add OPTIONS handler for all routes
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    return app


# Create app instance
app = create_app()

# Share sessions dict between blueprints
# In production, use Redis or a proper database
from routes.preparation_routes import get_sessions as prep_sessions
from routes.workflow_routes import get_sessions as workflow_sessions

# Get references and sync them
sessions = {}
prep_sessions_dict = prep_sessions()
workflow_sessions_dict = workflow_sessions()

# This is a simple way to share state - in production use proper state management
import routes.preparation_routes as prep_module
import routes.workflow_routes as workflow_module
prep_module.sessions = sessions
workflow_module.sessions = sessions


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)