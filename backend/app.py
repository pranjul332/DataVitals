from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import io
import traceback

from core.profiler import DatasetProfiler
from core.missing import MissingAnalyzer
from core.features import FeatureQuality
from core.distribution import DistributionAnalyzer
from core.imbalance import ImbalanceAnalyzer
from core.leakage import LeakageDetector
from core.baseline import BaselineModel

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    return jsonify({'status': 'healthy', 'version': '3.0.0'})

@app.route('/analyze', methods=['POST'])
def analyze_dataset():
    """
    Main analysis endpoint.
    Accepts: CSV file + optional target column
    Returns: Complete health report (Phase 1 + 2 + 3)
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
            
            # Basic validation
            if df.empty:
                return jsonify({'error': 'CSV file is empty'}), 400
            
            if len(df.columns) == 0:
                return jsonify({'error': 'CSV file has no columns'}), 400
                
        except UnicodeDecodeError:
            return jsonify({'error': 'Failed to decode CSV. Please ensure file is UTF-8 encoded'}), 400
        except pd.errors.EmptyDataError:
            return jsonify({'error': 'CSV file is empty or invalid'}), 400
        except Exception as e:
            return jsonify({'error': f'Failed to parse CSV: {str(e)}'}), 400
        
        # Validate target column if provided
        if target_col and target_col not in df.columns:
            return jsonify({
                'error': f"Target column '{target_col}' not found in dataset",
                'available_columns': list(df.columns)
            }), 400
        
        # Run Full Analysis (Phase 1 + 2 + 3)
        report = {}
        
        try:
            # === PHASE 1: FOUNDATION ===
            
            # 1. Dataset Profile
            profiler = DatasetProfiler(df)
            report['profile'] = profiler.profile()
            
            # 2. Missing Value Analysis
            missing_analyzer = MissingAnalyzer(df, target_col)
            report['missing'] = missing_analyzer.analyze()
            
            # 3. Feature Quality Analysis
            feature_analyzer = FeatureQuality(df, target_col)
            report['features'] = feature_analyzer.analyze()
            
            # === PHASE 2: STATISTICAL DEPTH ===
            
            # 4. Distribution & Outlier Analysis
            distribution_analyzer = DistributionAnalyzer(df, target_col)
            report['distribution'] = distribution_analyzer.analyze()
            
            # 5. Class Imbalance Analysis
            imbalance_analyzer = ImbalanceAnalyzer(df, target_col)
            report['imbalance'] = imbalance_analyzer.analyze()
            
            # === PHASE 3: ML-BASED RISK DETECTION ===
            
            # 6. Leakage Detection (CORE FLEX)
            leakage_detector = LeakageDetector(df, target_col)
            report['leakage'] = leakage_detector.analyze()
            
            # 7. Baseline Sanity Model
            baseline_model = BaselineModel(df, target_col)
            report['baseline'] = baseline_model.analyze()
            
        except Exception as e:
            return jsonify({
                'error': f'Analysis failed: {str(e)}',
                'traceback': traceback.format_exc()
            }), 500
        
        # Add metadata
        report['metadata'] = {
            'filename': file.filename,
            'target_column': target_col,
            'phase': 'phase_3_complete',
            'columns': list(df.columns),
            'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()}
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