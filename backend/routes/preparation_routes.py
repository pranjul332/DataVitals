"""
LLM-driven data preparation endpoints.
"""

from flask import Blueprint, request, jsonify, send_file
import pandas as pd
import os
from io import BytesIO
from werkzeug.utils import secure_filename

from config import Config
from core.cleaning.profiler import DatasetProfiler as PrepProfiler
from core.cleaning.purpose import PurposeSchema
from core.cleaning.planner import LLMPlanner
from core.cleaning.validator import PipelineValidator
from core.cleaning.executor import PipelineExecutor
from core.cleaning.report import ReportGenerator as PrepReportGenerator

preparation_bp = Blueprint('preparation', __name__)

# Session storage (shared with main app)
# In production, use Redis or database
sessions = {}


def get_sessions():
    """Get reference to sessions dict"""
    return sessions


@preparation_bp.route('/upload', methods=['POST'])
def upload_dataset():
    """
    Upload and profile a dataset for preparation.
    Returns: session_id and dataset profile
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not Config.allowed_file(file.filename):
        return jsonify({"error": "Only CSV files are allowed"}), 400
    
    try:
        # Read CSV
        df = pd.read_csv(file)
        
        # Check size limits
        if len(df) > Config.MAX_ROWS:
            return jsonify({
                "error": f"Dataset too large. Maximum {Config.MAX_ROWS} rows allowed."
            }), 400
        
        # Generate session ID
        session_id = os.urandom(16).hex()
        
        # Profile dataset
        profiler = PrepProfiler(df)
        profile = profiler.profile()
        
        # Store session data
        sessions[session_id] = {
            "df": df,
            "profile": profile,
            "filename": secure_filename(file.filename)
        }
        
        return jsonify({
            "session_id": session_id,
            "filename": file.filename,
            "profile": profile
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to process file: {str(e)}"}), 500


@preparation_bp.route('/plan', methods=['POST'])
def generate_plan():
    """
    Generate preprocessing pipeline using LLM.
    
    Request body:
    {
        "session_id": "...",
        "task_type": "regression",
        "target_column": "price" (optional)
    }
    """
    data = request.json
    
    session_id = data.get('session_id')
    task_type = data.get('task_type')
    target_column = data.get('target_column')
    
    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 400
    
    if not task_type:
        return jsonify({"error": "task_type is required"}), 400
    
    try:
        session = sessions[session_id]
        profile = session['profile']
        
        # Get purpose schema
        purpose = PurposeSchema.get_schema(task_type)
        
        # Validate task compatibility
        compatibility = PurposeSchema.validate_task_compatibility(task_type, profile)
        
        if not compatibility['compatible']:
            return jsonify({
                "warning": "Dataset may not be optimal for this task",
                "issues": compatibility['warnings'],
                "purpose": purpose
            }), 200
        
        # Generate plan using LLM
        planner = LLMPlanner()
        plan = planner.generate_plan(profile, purpose, target_column)
        
        # Validate plan
        validator = PipelineValidator(profile)
        is_valid, errors = validator.validate(plan)
        
        if not is_valid:
            return jsonify({
                "error": "Generated plan is invalid",
                "validation_errors": errors,
                "plan": plan
            }), 400
        
        # Store plan in session
        sessions[session_id]['plan'] = plan
        sessions[session_id]['purpose'] = purpose
        
        return jsonify({
            "session_id": session_id,
            "plan": plan,
            "purpose": purpose,
            "validation": {
                "valid": is_valid,
                "errors": errors
            }
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to generate plan: {str(e)}"}), 500


@preparation_bp.route('/validate', methods=['POST'])
def validate_plan():
    """
    Validate a preprocessing plan.
    
    Request body:
    {
        "session_id": "...",
        "plan": {...}
    }
    """
    data = request.json
    
    session_id = data.get('session_id')
    plan = data.get('plan')
    
    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 400
    
    if not plan:
        return jsonify({"error": "Plan is required"}), 400
    
    try:
        profile = sessions[session_id]['profile']
        
        validator = PipelineValidator(profile)
        is_valid, errors = validator.validate(plan)
        
        return jsonify({
            "valid": is_valid,
            "errors": errors
        })
        
    except Exception as e:
        return jsonify({"error": f"Validation failed: {str(e)}"}), 500


@preparation_bp.route('/execute', methods=['POST'])
def execute_pipeline():
    """
    Execute preprocessing pipeline.
    
    Request body:
    {
        "session_id": "...",
        "plan": {...} (optional, uses stored plan if not provided)
    }
    """
    data = request.json
    
    session_id = data.get('session_id')
    plan = data.get('plan')
    
    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 400
    
    session = sessions[session_id]
    
    # Use provided plan or stored plan
    if not plan:
        plan = session.get('plan')
    
    if not plan:
        return jsonify({"error": "No plan available"}), 400
    
    try:
        df = session['df']
        profile = session['profile']
        
        # Validate plan first
        validator = PipelineValidator(profile)
        is_valid, errors = validator.validate(plan)
        
        if not is_valid:
            return jsonify({
                "error": "Invalid plan",
                "validation_errors": errors
            }), 400
        
        # Execute pipeline
        executor = PipelineExecutor()
        result = executor.execute(df, plan)
        
        # Store processed dataframe
        sessions[session_id]['processed_df'] = result['processed_df']
        sessions[session_id]['execution_result'] = result
        
        # Generate report
        purpose = session.get('purpose', {})
        report_gen = PrepReportGenerator()
        report = report_gen.generate_full_report(profile, plan, result, purpose)
        
        sessions[session_id]['report'] = report
        
        return jsonify({
            "session_id": session_id,
            "execution_log": result['execution_log'],
            "summary": result['summary'],
            "report": report
        })
        
    except Exception as e:
        return jsonify({"error": f"Execution failed: {str(e)}"}), 500


@preparation_bp.route('/dry-run', methods=['POST'])
def dry_run():
    """
    Simulate pipeline execution without modifying data.
    Returns estimated impact.
    """
    data = request.json
    
    session_id = data.get('session_id')
    plan = data.get('plan')
    
    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 400
    
    if not plan:
        plan = sessions[session_id].get('plan')
    
    if not plan:
        return jsonify({"error": "No plan available"}), 400
    
    try:
        df = sessions[session_id]['df']
        
        executor = PipelineExecutor()
        impact = executor.dry_run(df, plan)
        
        return jsonify({
            "session_id": session_id,
            "estimated_impact": impact
        })
        
    except Exception as e:
        return jsonify({"error": f"Dry run failed: {str(e)}"}), 500


@preparation_bp.route('/download', methods=['POST'])
def download_processed_data():
    """
    Download processed dataset as CSV.
    
    Request body:
    {
        "session_id": "..."
    }
    """
    data = request.json
    
    session_id = data.get('session_id')
    
    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 400
    
    session = sessions[session_id]
    
    if 'processed_df' not in session:
        return jsonify({"error": "No processed data available"}), 400
    
    try:
        df = session['processed_df']
        
        # Create CSV in memory
        output = BytesIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        filename = f"processed_{session['filename']}"
        
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({"error": f"Download failed: {str(e)}"}), 500


@preparation_bp.route('/report/text', methods=['POST'])
def get_text_report():
    """
    Get human-readable text report.
    
    Request body:
    {
        "session_id": "..."
    }
    """
    data = request.json
    
    session_id = data.get('session_id')
    
    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 400
    
    session = sessions[session_id]
    
    if 'report' not in session:
        return jsonify({"error": "No report available. Execute pipeline first."}), 400
    
    try:
        report = session['report']
        text_report = PrepReportGenerator.generate_text_report(report)
        
        return jsonify({
            "session_id": session_id,
            "report": text_report
        })
        
    except Exception as e:
        return jsonify({"error": f"Report generation failed: {str(e)}"}), 500


@preparation_bp.route('/regenerate-plan', methods=['POST'])
def regenerate_plan():
    """
    Regenerate plan based on user feedback.
    
    Request body:
    {
        "session_id": "...",
        "feedback": "Remove the outlier removal step"
    }
    """
    data = request.json
    
    session_id = data.get('session_id')
    feedback = data.get('feedback')
    
    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 400
    
    if not feedback:
        return jsonify({"error": "Feedback is required"}), 400
    
    session = sessions[session_id]
    
    if 'plan' not in session:
        return jsonify({"error": "No previous plan found"}), 400
    
    try:
        profile = session['profile']
        purpose = session['purpose']
        previous_plan = session['plan']
        
        planner = LLMPlanner()
        new_plan = planner.regenerate_plan(profile, purpose, feedback, previous_plan)
        
        # Validate new plan
        validator = PipelineValidator(profile)
        is_valid, errors = validator.validate(new_plan)
        
        if is_valid:
            sessions[session_id]['plan'] = new_plan
        
        return jsonify({
            "session_id": session_id,
            "plan": new_plan,
            "validation": {
                "valid": is_valid,
                "errors": errors
            }
        })
        
    except Exception as e:
        return jsonify({"error": f"Plan regeneration failed: {str(e)}"}), 500