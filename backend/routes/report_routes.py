"""
Report history endpoints.
"""

from flask import Blueprint, request, jsonify
from database.user import get_db
from database.analysis import (
    get_user_reports,
    get_report_by_id,
    delete_report,
    get_report_stats
)

report_bp = Blueprint('reports', __name__, url_prefix='/api/reports')


@report_bp.route('/history', methods=['GET'])
def get_report_history():
    """
    Get user's report history
    
    Query params:
        - limit: Max reports to return (default 50)
        - skip: Number to skip for pagination (default 0)
    """
    try:
        # Get current user from request context (set by requires_auth decorator)
        if not hasattr(request, 'current_user_db'):
            return jsonify({'error': 'User not authenticated'}), 401
        
        auth0_id = request.current_user_db.get('auth0_id')
        
        # Get pagination params
        limit = int(request.args.get('limit', 50))
        skip = int(request.args.get('skip', 0))
        
        # Validate params
        if limit > 100:
            limit = 100
        if limit < 1:
            limit = 10
        if skip < 0:
            skip = 0
        
        db = get_db()
        reports = get_user_reports(db, auth0_id, limit, skip)
        
        return jsonify({
            'success': True,
            'reports': reports,
            'count': len(reports),
            'limit': limit,
            'skip': skip
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@report_bp.route('/<report_id>', methods=['GET'])
def get_report(report_id):
    """Get a specific report by ID"""
    try:
        if not hasattr(request, 'current_user_db'):
            return jsonify({'error': 'User not authenticated'}), 401
        
        auth0_id = request.current_user_db.get('auth0_id')
        
        db = get_db()
        report = get_report_by_id(db, auth0_id, report_id)
        
        if not report:
            return jsonify({
                'success': False,
                'error': 'Report not found or access denied'
            }), 404
        
        return jsonify({
            'success': True,
            'report': report
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@report_bp.route('/<report_id>', methods=['DELETE'])
def delete_report_endpoint(report_id):
    """Delete a report"""
    try:
        if not hasattr(request, 'current_user_db'):
            return jsonify({'error': 'User not authenticated'}), 401
        
        auth0_id = request.current_user_db.get('auth0_id')
        
        db = get_db()
        success = delete_report(db, auth0_id, report_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Report not found or could not be deleted'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Report deleted successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@report_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get report statistics for the user"""
    try:
        if not hasattr(request, 'current_user_db'):
            return jsonify({'error': 'User not authenticated'}), 401
        
        auth0_id = request.current_user_db.get('auth0_id')
        
        db = get_db()
        stats = get_report_stats(db, auth0_id)
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500