from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import io
import traceback

from core.profiler import DatasetProfiler
from core.missing import MissingAnalyzer
from core.features import FeatureQuality
from core.distribution import DistributionAnalyzer

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    return jsonify({'status': 'healthy', 'version': '1.0.0'})

@app.route('/analyze', methods=['POST'])
def analyze_dataset():
    """
    Main analysis endpoint.
    Accepts: CSV file + optional target column
    Returns: Health report (Phase 1: profiling, missing, features)
    """
    try:
        # Validate request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        target_col = request.form.get('target_column', None)
        
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'Only CSV files are supported'}), 400
        
        # Read CSV
        try:
            csv_content = file.read().decode('utf-8')
            df = pd.read_csv(io.StringIO(csv_content))
        except Exception as e:
            return jsonify({'error': f'Failed to parse CSV: {str(e)}'}), 400
        
        # Validate target column
        if target_col and target_col not in df.columns:
            return jsonify({'error': f"Target column '{target_col}' not found in dataset"}), 400
        
        # Run Phase 1 Analysis
        report = {}
        
        # 1. Profile
        profiler = DatasetProfiler(df)
        report['profile'] = profiler.profile()
        
        # 2. Missing Analysis
        missing_analyzer = MissingAnalyzer(df, target_col)
        report['missing'] = missing_analyzer.analyze()
        
        # 3. Feature Quality
        feature_analyzer = FeatureQuality(df, target_col)
        report['features'] = feature_analyzer.analyze()
        
        # Metadata
        report['metadata'] = {
            'filename': file.filename,
            'target_column': target_col,
            'phase': 'phase_1'
        }
        
        return jsonify({
            'success': True,
            'report': report
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)