"""
Combined workflow endpoints.
"""

from flask import Blueprint, request, jsonify
import pandas as pd
import io
import os
import traceback

from core.analysis.profiler import DatasetProfiler as HealthProfiler
from core.analysis.missing import MissingAnalyzer
from core.analysis.features import FeatureQuality
from core.analysis.scoring import HealthScorer
from core.cleaning.profiler import DatasetProfiler as PrepProfiler
from core.cleaning.purpose import PurposeSchema
from core.cleaning.planner import LLMPlanner

workflow_bp = Blueprint('workflow', __name__)

# Session storage (shared with main app)
sessions = {}


def get_sessions():
    """Get reference to sessions dict"""
    return sessions


@workflow_bp.route('/full-workflow', methods=['POST'])
def full_workflow():
    """
    Combined endpoint: Analyze health, then prepare dataset.
    
    Request body (multipart/form-data):
    - file: CSV file
    - target_column: target column name
    - task_type: ML task type (regression, classification, etc.)
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        target_col = request.form.get('target_column')
        task_type = request.form.get('task_type')

        if not task_type:
            return jsonify({'error': 'task_type is required'}), 400

        # Read CSV once
        csv_content = file.read().decode('utf-8')
        df = pd.read_csv(io.StringIO(csv_content))

        # Step 1: Health Analysis
        health_profiler = HealthProfiler(df)
        health_report = {'profile': health_profiler.profile()}
        
        missing = MissingAnalyzer(df, target_col)
        health_report['missing'] = missing.analyze()
        
        features = FeatureQuality(df, target_col)
        health_report['features'] = features.analyze()
        
        scorer = HealthScorer(health_report)
        health_score = scorer.calculate_score()

        # Step 2: Preparation Pipeline
        session_id = os.urandom(16).hex()
        prep_profiler = PrepProfiler(df)
        profile = prep_profiler.profile()
        
        purpose = PurposeSchema.get_schema(task_type)
        planner = LLMPlanner()
        plan = planner.generate_plan(profile, purpose, target_col)
        
        # Store session
        sessions[session_id] = {
            "df": df,
            "profile": profile,
            "plan": plan,
            "purpose": purpose,
            "filename": file.filename,
            "health_score": health_score
        }

        return jsonify({
            "success": True,
            "session_id": session_id,
            "health_analysis": {
                "health_score": health_score,
                "summary": health_report
            },
            "preparation_plan": plan,
            "next_steps": [
                "Review the health analysis",
                "Modify plan if needed using /regenerate-plan",
                "Execute pipeline using /execute"
            ]
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500