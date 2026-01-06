import pandas as pd
import numpy as np

def generate_messy_dataset(n_rows=1000):
    """
    Generate a messy dataset to test health checks.
    Includes: missing values, outliers, constant features, high cardinality, etc.
    """
    np.random.seed(42)
    
    data = {
        # Good numeric feature
        'feature_clean': np.random.normal(100, 15, n_rows),
        
        # Numeric with missing (10%)
        'feature_missing': np.random.normal(50, 10, n_rows),
        
        # Numeric with outliers
        'feature_outliers': np.random.normal(0, 1, n_rows),
        
        # Constant feature (should be flagged)
        'feature_constant': ['constant_value'] * n_rows,
        
        # Near-constant (should be flagged)
        'feature_near_constant': ['A'] * 980 + ['B'] * 20,
        
        # High cardinality (should be flagged)
        'feature_high_card': [f'id_{i}' for i in range(n_rows)],
        
        # Redundant feature (highly correlated)
        'feature_redundant': None,  # Will set below
        
        # Categorical with reasonable cardinality
        'category': np.random.choice(['cat_A', 'cat_B', 'cat_C', 'cat_D'], n_rows),
        
        # Target (classification, imbalanced)
        'target': np.random.choice([0, 1], n_rows, p=[0.7, 0.3])
    }
    
    # Add missing values to feature_missing
    missing_indices = np.random.choice(n_rows, size=int(n_rows * 0.1), replace=False)
    data['feature_missing'] = pd.Series(data['feature_missing'])
    data['feature_missing'].iloc[missing_indices] = np.nan
    
    # Add extreme outliers
    outlier_indices = np.random.choice(n_rows, size=int(n_rows * 0.05), replace=False)
    data['feature_outliers'] = pd.Series(data['feature_outliers'])
    data['feature_outliers'].iloc[outlier_indices] = np.random.choice([-10, 10], len(outlier_indices))
    
    # Create redundant feature (highly correlated with feature_clean)
    data['feature_redundant'] = data['feature_clean'] + np.random.normal(0, 1, n_rows)
    
    df = pd.DataFrame(data)
    
    # Add some duplicate rows
    duplicate_indices = np.random.choice(n_rows, size=50, replace=False)
    df = pd.concat([df, df.iloc[duplicate_indices]], ignore_index=True)
    
    return df

if __name__ == '__main__':
    # Generate sample dataset
    df = generate_messy_dataset(1000)
    
    # Save to CSV
    output_file = 'sample_data.csv'
    df.to_csv(output_file, index=False)
    
    print(f"Generated messy dataset: {output_file}")
    print(f"Shape: {df.shape}")
    print(f"\nColumns:")
    for col in df.columns:
        print(f"  - {col}: {df[col].dtype}, {df[col].nunique()} unique values")
    print(f"\nThis dataset includes:")
    print("  ✓ Missing values (10% in feature_missing)")
    print("  ✓ Outliers (5% extreme in feature_outliers)")
    print("  ✓ Constant feature (feature_constant)")
    print("  ✓ Near-constant feature (feature_near_constant)")
    print("  ✓ High cardinality (feature_high_card)")
    print("  ✓ Redundant features (feature_clean & feature_redundant)")
    print("  ✓ Duplicate rows (~5%)")
    print("  ✓ Class imbalance (70/30 split)")
    print(f"\nReady to test with: python test_client.py")