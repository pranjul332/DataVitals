import pandas as pd
import numpy as np

class MissingAnalyzer:
    """
    Missing value impact analysis.
    Not just counts - severity flags.
    """
    
    def __init__(self, df, target_col=None):
        self.df = df
        self.target_col = target_col
        
    def analyze(self):
        """Returns missing value analysis with severity flags."""
        
        # Column-wise missing
        col_missing = self.df.isnull().sum()
        col_missing_pct = (col_missing / len(self.df) * 100).round(2)
        
        column_analysis = []
        for col in self.df.columns:
            missing_count = int(col_missing[col])
            missing_pct = float(col_missing_pct[col])
            
            # Severity flag
            if missing_pct < 5:
                severity = 'low'
            elif missing_pct < 30:
                severity = 'medium'
            else:
                severity = 'high'
            
            column_analysis.append({
                'column': col,
                'missing_count': missing_count,
                'missing_percentage': missing_pct,
                'severity': severity
            })
        
        # Row-wise extreme missingness
        row_missing_pct = (self.df.isnull().sum(axis=1) / len(self.df.columns) * 100)
        extreme_missing_rows = (row_missing_pct > 50).sum()
        extreme_missing_pct = (extreme_missing_rows / len(self.df) * 100) if len(self.df) > 0 else 0
        
        # Target missing check (CRITICAL)
        target_missing = None
        if self.target_col:
            if self.target_col in self.df.columns:
                target_missing_count = int(self.df[self.target_col].isnull().sum())
                target_missing_pct = float((target_missing_count / len(self.df) * 100))
                target_missing = {
                    'exists': True,
                    'missing_count': target_missing_count,
                    'missing_percentage': round(target_missing_pct, 2),
                    'critical': target_missing_count > 0  # ANY missing in target is critical
                }
            else:
                target_missing = {
                    'exists': False,
                    'error': f"Target column '{self.target_col}' not found"
                }
        
        # Summary stats
        total_cols = len(self.df.columns)
        cols_with_missing = (col_missing > 0).sum()
        cols_high_missing = (col_missing_pct > 30).sum()
        
        return {
            'column_analysis': sorted(column_analysis, key=lambda x: x['missing_percentage'], reverse=True),
            'row_analysis': {
                'extreme_missing_rows': int(extreme_missing_rows),
                'extreme_missing_percentage': round(extreme_missing_pct, 2)
            },
            'target_analysis': target_missing,
            'summary': {
                'total_columns': int(total_cols),
                'columns_with_missing': int(cols_with_missing),
                'columns_high_missing': int(cols_high_missing)
            }
        }