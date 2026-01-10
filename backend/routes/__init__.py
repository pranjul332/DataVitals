"""
Routes package initialization.
Imports all route blueprints for registration.
"""

try:
    from .health_routes import health_bp
    print("✓ health_bp imported successfully")
except Exception as e:
    print(f"✗ Failed to import health_bp: {e}")
    health_bp = None

try:
    from .analysis_routes import analysis_bp
    print("✓ analysis_bp imported successfully")
except Exception as e:
    print(f"✗ Failed to import analysis_bp: {e}")
    analysis_bp = None

try:
    from .preparation_routes import preparation_bp
    print("✓ preparation_bp imported successfully")
except Exception as e:
    print(f"✗ Failed to import preparation_bp: {e}")
    preparation_bp = None

try:
    from .workflow_routes import workflow_bp
    print("✓ workflow_bp imported successfully")
except Exception as e:
    print(f"✗ Failed to import workflow_bp: {e}")
    workflow_bp = None

__all__ = ['health_bp', 'analysis_bp', 'preparation_bp', 'workflow_bp']