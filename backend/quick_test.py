import requests
import json

# Test the /analyze endpoint
def test_analyze():
    url = 'http://localhost:5000/analyze'
    
    # Use a sample CSV file - replace with your actual file path
    csv_file_path = 'C:\\Users\\pranjul saxena\\house-price-pred\\ml-services\\Bengaluru_House_Data.csv'

    
    with open(csv_file_path, 'rb') as f:
        files = {'file': f}
        data = {'target_column': 'price'}  # Change to your target column or remove
        
        print("Sending request to backend...")
        response = requests.post(url, files=files, data=data)
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Headers: {response.headers}")
        print(f"\nResponse Length: {len(response.text)} characters")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print("\n✅ SUCCESS! Backend returned valid JSON")
                print(f"\nVerdict: {result.get('verdict', {}).get('status')}")
                print(f"Health Score: {result.get('health_score')}")
                print(f"Grade: {result.get('grade')}")
                print(f"\nTop Risks: {len(result.get('top_risks', []))}")
                
                # Save full response
                with open('backend_response.json', 'w') as out:
                    json.dump(result, out, indent=2)
                print("\n📄 Full response saved to: backend_response.json")
                
            except json.JSONDecodeError as e:
                print(f"\n❌ ERROR: Response is not valid JSON")
                print(f"Error: {e}")
                print(f"Response text: {response.text[:500]}")
        else:
            print(f"\n❌ ERROR: Status {response.status_code}")
            print(f"Response: {response.text}")

if __name__ == '__main__':
    test_analyze()