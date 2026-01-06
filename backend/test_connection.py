import requests
import json

def test_health_endpoint():
    """Test the health check endpoint."""
    print("=" * 60)
    print("Testing Health Endpoint")
    print("=" * 60)
    try:
        response = requests.get('http://localhost:5000/health')
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to backend. Make sure Flask is running on port 5000")
        return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_analyze_endpoint(csv_path, target_column=None):
    """Test the analyze endpoint with a CSV file."""
    print("\n" + "=" * 60)
    print("Testing Analyze Endpoint")
    print("=" * 60)
    print(f"CSV File: {csv_path}")
    print(f"Target Column: {target_column or 'None'}")
    
    try:
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
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result['success']:
                report = result['report']
                
                print("\n" + "=" * 60)
                print("ANALYSIS RESULTS")
                print("=" * 60)
                
                # Dataset Profile
                profile = report['profile']
                print(f"\n📊 DATASET PROFILE")
                print(f"   Shape: {profile['shape']['rows']} rows × {profile['shape']['columns']} columns")
                print(f"   Memory: {profile['memory']['mb']} MB")
                print(f"   Missing: {profile['missing']['missing_percentage']:.2f}%")
                print(f"   Duplicates: {profile['duplicates']['percentage']:.2f}% ({profile['duplicates']['count']} rows)")
                
                # Missing Value Analysis
                missing = report['missing']
                print(f"\n⚠️  MISSING VALUE ANALYSIS")
                print(f"   Columns with missing: {missing['summary']['columns_with_missing']}")
                print(f"   High severity columns: {missing['summary']['columns_high_missing']}")
                print(f"   Total missing cells: {missing['summary']['total_missing_cells']}")
                
                if missing['columns']:
                    print(f"\n   Top columns with missing data:")
                    for col_info in missing['columns'][:5]:
                        print(f"      • {col_info['column']}: {col_info['missing_percentage']:.2f}% ({col_info['missing_count']} cells) - {col_info['severity']}")
                
                # Feature Quality
                features = report['features']
                print(f"\n🔍 FEATURE QUALITY")
                print(f"   Constant features: {len(features['constant_features'])}")
                print(f"   Near-constant features: {len(features['near_constant_features'])}")
                print(f"   High cardinality features: {len(features['high_cardinality_features'])}")
                print(f"   Redundant pairs: {features['summary']['redundant_pairs']}")
                
                if features['constant_features']:
                    print(f"\n   Constant features: {', '.join(features['constant_features'])}")
                
                if features['near_constant_features']:
                    print(f"\n   Near-constant features: {', '.join(features['near_constant_features'])}")
                
                # Save full report
                output_file = 'full_health_report.json'
                with open(output_file, 'w') as f:
                    json.dump(result, f, indent=2)
                print(f"\n✅ Full report saved to: {output_file}")
                print("=" * 60)
                
            else:
                print(f"❌ Analysis failed: {result.get('error')}")
        else:
            print(f"❌ Server error: {response.text}")
            
    except FileNotFoundError:
        print(f"❌ ERROR: CSV file not found at {csv_path}")
        print("   Please provide a valid CSV file path")
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to backend. Make sure Flask is running on port 5000")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

if __name__ == '__main__':
    # Test health endpoint first
    if test_health_endpoint():
        print("\n✅ Backend is running and healthy!\n")
        
        # Now test with your CSV file
        # CHANGE THIS to your actual CSV file path
        csv_file = input("Enter path to your CSV file: ").strip()
        
        # Optional: specify target column
        target = input("Enter target column name (or press Enter to skip): ").strip()
        target = target if target else None
        
        test_analyze_endpoint(csv_file, target)
    else:
        print("\n❌ Backend health check failed. Please start the Flask server first.")
        print("   Run: python app.py")