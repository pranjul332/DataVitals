from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
import io
import os
import json
import traceback
import sys
from io import BytesIO
from werkzeug.utils import secure_filename

# Health Analysis imports
from core.analysis.profiler import DatasetProfiler as HealthProfiler
from core.analysis.missing import MissingAnalyzer
from core.analysis.features import FeatureQuality
from core.analysis.distribution import DistributionAnalyzer
from core.analysis.imbalance import ImbalanceAnalyzer
from core.analysis.leakage import LeakageDetector
from core.analysis.baseline import BaselineModel
from core.analysis.scoring import HealthScorer
from core.analysis.report import ReportGenerator as HealthReportGenerator

# LLM Preparation imports
from config import Config
from core.cleaning.profiler import DatasetProfiler as PrepProfiler
from core.cleaning.purpose import PurposeSchema
from core.cleaning.planner import LLMPlanner
from core.cleaning.validator import PipelineValidator
from core.cleaning.executor import PipelineExecutor
from core.cleaning.report import ReportGenerator as PrepReportGenerator


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


app = Flask(__name__)
app.json_encoder = NumpyEncoder
CORS(app)

# Configuration
app.config.from_object(Config)

# Create upload folder if it doesn't exist
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

# Global storage for session data (in production, use Redis or database)
sessions = {}


# ============================================================================
# HEALTH CHECK & INFO ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
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


@app.route('/tasks', methods=['GET'])
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


# ============================================================================
# DATASET HEALTH ANALYSIS ENDPOINTS
# ============================================================================

@app.route('/analyze', methods=['POST'])
def analyze_dataset():
    """
    Comprehensive dataset health analysis.
    Returns health score, risks, and recommendations.
    """
    try:
        # ================= VALIDATION =================
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        target_col = request.form.get('target_column')

        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400

        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'Only CSV files are supported'}), 400

        # ================= READ CSV =================
        try:
            csv_content = file.read().decode('utf-8')
            df = pd.read_csv(io.StringIO(csv_content))

            if df.empty:
                return jsonify({'error': 'CSV file is empty'}), 400

            if len(df.columns) == 0:
                return jsonify({'error': 'CSV file has no columns'}), 400

        except UnicodeDecodeError:
            return jsonify({'error': 'CSV must be UTF-8 encoded'}), 400
        except pd.errors.EmptyDataError:
            return jsonify({'error': 'CSV is empty or invalid'}), 400
        except Exception as e:
            return jsonify({'error': f'CSV parse error: {str(e)}'}), 400

        # ================= TARGET VALIDATION =================
        if target_col and target_col not in df.columns:
            return jsonify({
                'error': f"Target column '{target_col}' not found",
                'available_columns': list(df.columns)
            }), 400

        analysis_report = {}

        # ================= ANALYSIS PIPELINE =================
        try:
            profiler = HealthProfiler(df)
            analysis_report['profile'] = profiler.profile()

            missing = MissingAnalyzer(df, target_col)
            analysis_report['missing'] = missing.analyze()

            features = FeatureQuality(df, target_col)
            analysis_report['features'] = features.analyze()

            distribution = DistributionAnalyzer(df, target_col)
            analysis_report['distribution'] = distribution.analyze()

            imbalance = ImbalanceAnalyzer(df, target_col)
            analysis_report['imbalance'] = imbalance.analyze()

            leakage = LeakageDetector(df, target_col)
            analysis_report['leakage'] = leakage.analyze()

            baseline = BaselineModel(df, target_col)
            analysis_report['baseline'] = baseline.analyze()

            scorer = HealthScorer(analysis_report)
            health_score = scorer.calculate_score()

            report_generator = HealthReportGenerator(analysis_report, health_score)
            final_report = report_generator.generate()

        except Exception as e:
            return jsonify({
                'error': 'Analysis failed',
                'details': str(e),
                'traceback': traceback.format_exc()
            }), 500

        # ================= METADATA =================
        analysis_report['metadata'] = {
            'filename': file.filename,
            'target_column': target_col,
            'phase': 'complete',
            'columns': list(df.columns),
            'dtypes': {c: str(t) for c, t in df.dtypes.items()}
        }

        # ================= FINAL RESPONSE =================
        full_response = {
            'success': True,
            'verdict': final_report['verdict'],
            'health_score': final_report['health_score'],
            'grade': final_report['grade'],
            'top_risks': final_report['top_risks'],
            'recommendations': final_report['recommendations'],
            'summary': final_report['summary'],
            'component_scores': final_report['component_breakdown'],
            'detailed_analysis': analysis_report
        }

        # ================= DEBUG LOGS =================
        print("\n" + "=" * 60, file=sys.stderr)
        print("DEBUG: Health Analysis Response", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        print(f"Health Score: {full_response['health_score']}", file=sys.stderr)
        print(f"Grade: {full_response['grade']}", file=sys.stderr)
        print(f"Top Risks: {len(full_response.get('top_risks', []))}", file=sys.stderr)
        print("=" * 60 + "\n", file=sys.stderr)

        return jsonify(full_response)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


# ============================================================================
# LLM-DRIVEN DATA PREPARATION ENDPOINTS
# ============================================================================

@app.route('/upload', methods=['POST'])
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


@app.route('/plan', methods=['POST'])
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


@app.route('/validate', methods=['POST'])
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


@app.route('/execute', methods=['POST'])
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


@app.route('/dry-run', methods=['POST'])
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


@app.route('/download', methods=['POST'])
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


@app.route('/report/text', methods=['POST'])
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


@app.route('/regenerate-plan', methods=['POST'])
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


# ============================================================================
# COMBINED WORKFLOW ENDPOINT
# ============================================================================

@app.route('/full-workflow', methods=['POST'])
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


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)