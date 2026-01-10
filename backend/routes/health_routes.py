"""
Health check and informational endpoints.
"""

from flask import Blueprint, jsonify
from core.cleaning.purpose import PurposeSchema

health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Unified health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'version': '5.0.0',
        'services': [
            'Dataset Health Analysis',
            'LLM-Driven Data Preparation'
        ]
    })


@health_bp.route('/tasks', methods=['GET', 'OPTIONS'])
def get_supported_tasks():
    """Get list of supported ML tasks"""
    tasks = PurposeSchema.get_all_tasks()
    task_details = {
        task: PurposeSchema.get_schema(task)
        for task in tasks
    }
    return jsonify({
        "tasks": tasks,
        "details": task_details
    })