import pandas as pd
import numpy as np

class FeatureQuality:
    """
    Feature quality checks: Cut garbage early.
    Pure stats. No ML.
    """
    
    def __init__(self, df, target_col=None):
        self.df = df
        self.target_col = target_col
        
    def analyze(self):
        """Returns feature quality assessment."""
        
        constant_features = []
        near_constant_features = []
        high_cardinality_features = []
        redundant_features = []
        
        # Check each column
        for col in self.df.columns:
            if col == self.target_col:
                continue
                
            # Constant / near-constant check
            nunique = self.df[col].nunique()
            n_rows = len(self.df)
            
            if nunique == 1:
                constant_features.append({
                    'column': col,
                    'unique_values': int(nunique)
                })
            elif nunique <= 2 and n_rows > 100:
                # Near-constant: very low variance
                value_counts = self.df[col].value_counts()
                if len(value_counts) > 0:
                    dominant_pct = (value_counts.iloc[0] / n_rows * 100)
                    if dominant_pct > 95:
                        near_constant_features.append({
                            'column': col,
                            'unique_values': int(nunique),
                            'dominant_percentage': round(dominant_pct, 2)
                        })
            
            # High cardinality check (for categorical)
            if self.df[col].dtype == 'object' or self.df[col].dtype.name == 'category':
                cardinality_ratio = nunique / n_rows
                if cardinality_ratio > 0.5 and nunique > 50:
                    high_cardinality_features.append({
                        'column': col,
                        'unique_values': int(nunique),
                        'cardinality_ratio': round(cardinality_ratio, 2)
                    })
        
        # Redundant features (high correlation for numeric)
        numeric_df = self.df.select_dtypes(include=[np.number])
        if self.target_col in numeric_df.columns:
            numeric_df = numeric_df.drop(columns=[self.target_col])
        
        if len(numeric_df.columns) > 1:
            corr_matrix = numeric_df.corr().abs()
            
            # Get upper triangle
            upper = corr_matrix.where(
                np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
            )
            
            # Find highly correlated pairs
            for col in upper.columns:
                high_corr = upper[col][upper[col] > 0.95].index.tolist()
                for corr_col in high_corr:
                    redundant_features.append({
                        'column_1': col,
                        'column_2': corr_col,
                        'correlation': round(float(upper.loc[corr_col, col]), 3)
                    })
        
        # Summary
        total_features = len(self.df.columns) - (1 if self.target_col else 0)
        quality_issues = len(constant_features) + len(near_constant_features) + len(high_cardinality_features)
        
        return {
            'constant_features': constant_features,
            'near_constant_features': near_constant_features,
            'high_cardinality_features': high_cardinality_features,
            'redundant_features': redundant_features,
            'summary': {
                'total_features': int(total_features),
                'quality_issues': int(quality_issues),
                'redundant_pairs': len(redundant_features)
            }
        }