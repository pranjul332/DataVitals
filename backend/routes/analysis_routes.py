"""
Dataset health analysis endpoints.
"""

from flask import Blueprint, request, jsonify
import pandas as pd
import io
import sys
import traceback

from core.analysis.profiler import DatasetProfiler as HealthProfiler
from core.analysis.missing import MissingAnalyzer
from core.analysis.features import FeatureQuality
from core.analysis.distribution import DistributionAnalyzer
from core.analysis.imbalance import ImbalanceAnalyzer
from core.analysis.leakage import LeakageDetector
from core.analysis.baseline import BaselineModel
from core.analysis.scoring import HealthScorer
from core.analysis.report import ReportGenerator as HealthReportGenerator

analysis_bp = Blueprint('analysis', __name__)


@analysis_bp.route('/analyze', methods=['POST'])
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