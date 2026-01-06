import requests
import json

def test_health_endpoint():
    """Test the health check endpoint."""
    print("Testing health endpoint...")
    response = requests.get('http://localhost:5000/health')
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_analyze_endpoint(csv_path, target_column=None):
    """Test the analyze endpoint with a CSV file."""
    print(f"Analyzing: {csv_path}")
    print(f"Target column: {target_column}\n")
    
    with open(csv_path, 'rb') as f:
        files = {'file': f}
        data = {}
        if target_column:
            data['target_column'] = target_column
        
        response = requests.post(
            'http://localhost:5000/analyze',
            files=files,
            data=data
        )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        if result['success']:
            report = result['report']
            
            # Display Phase 1 results
            print("\n=== DATASET PROFILE ===")
            profile = report['profile']
            print(f"Shape: {profile['shape']['rows']} rows × {profile['shape']['columns']} columns")
            print(f"Memory: {profile['memory']['mb']} MB")
            print(f"Missing: {profile['missing']['missing_percentage']}%")
            print(f"Duplicates: {profile['duplicates']['percentage']}%")
            
            print("\n=== MISSING VALUE ANALYSIS ===")
            missing = report['missing']
            print(f"Columns with missing: {missing['summary']['columns_with_missing']}")
            print(f"High severity columns: {missing['summary']['columns_high_missing']}")
            if missing['target_analysis']:
                print(f"Target missing: {missing['target_analysis']}")
            
            print("\n=== FEATURE QUALITY ===")
            features = report['features']
            print(f"Constant features: {len(features['constant_features'])}")
            print(f"Near-constant features: {len(features['near_constant_features'])}")
            print(f"High cardinality features: {len(features['high_cardinality_features'])}")
            print(f"Redundant pairs: {features['summary']['redundant_pairs']}")
            
            # Save full report
            output_file = 'health_report_phase1.json'
            with open(output_file, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"\nFull report saved to: {output_file}")
        else:
            print(f"Error: {result.get('error')}")
    else:
        print(f"Error: {response.text}")

if __name__ == '__main__':
    # Test health
    test_health_endpoint()
    
    # Test with your CSV
    # Replace with your actual CSV path and target column
    csv_file = 'sample_data.csv'
    target = 'target'  # or None if no target
    
    test_analyze_endpoint(csv_file, target)