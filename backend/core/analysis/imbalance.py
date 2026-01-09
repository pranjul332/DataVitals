import pandas as pd
import numpy as np

class ImbalanceAnalyzer:
    """
    Class imbalance detection.
    Only when target exists. Pure detection, no suggestions.
    """
    
    def __init__(self, df, target_col):
        self.df = df
        self.target_col = target_col
        
    def analyze(self):
        """Returns class imbalance analysis for target column."""
        
        # No target = no analysis
        if not self.target_col or self.target_col not in self.df.columns:
            return {
                'exists': False,
                'message': 'No target column specified or found'
            }
        
        target_series = self.df[self.target_col].dropna()
        
        if len(target_series) == 0:
            return {
                'exists': True,
                'error': 'Target column is entirely missing'
            }
        
        # Determine if classification or regression
        n_unique = target_series.nunique()
        is_classification = n_unique <= 20  # Heuristic
        
        if not is_classification:
            # For regression, check distribution
            return self._analyze_regression_target(target_series)
        else:
            # For classification, check imbalance
            return self._analyze_classification_target(target_series)
    
    def _analyze_classification_target(self, target_series):
        """Analyze classification target imbalance."""
        
        value_counts = target_series.value_counts()
        n_classes = len(value_counts)
        
        # Class distribution
        class_distribution = []
        for cls, count in value_counts.items():
            percentage = (count / len(target_series) * 100)
            class_distribution.append({
                'class': str(cls),
                'count': int(count),
                'percentage': round(percentage, 2)
            })
        
        # Imbalance metrics
        majority_class_count = int(value_counts.iloc[0])
        minority_class_count = int(value_counts.iloc[-1])
        majority_pct = (majority_class_count / len(target_series) * 100)
        minority_pct = (minority_class_count / len(target_series) * 100)
        
        # Imbalance ratio
        imbalance_ratio = majority_class_count / minority_class_count if minority_class_count > 0 else float('inf')
        
        # Severity flag
        if imbalance_ratio < 1.5:
            severity = 'balanced'
        elif imbalance_ratio < 3:
            severity = 'mild'
        elif imbalance_ratio < 10:
            severity = 'moderate'
        else:
            severity = 'severe'
        
        # Multi-class or binary
        task_type = 'binary' if n_classes == 2 else 'multiclass'
        
        return {
            'exists': True,
            'task_type': 'classification',
            'classification_type': task_type,
            'n_classes': int(n_classes),
            'class_distribution': class_distribution,
            'imbalance': {
                'majority_class': str(value_counts.index[0]),
                'majority_count': majority_class_count,
                'majority_percentage': round(majority_pct, 2),
                'minority_class': str(value_counts.index[-1]),
                'minority_count': minority_class_count,
                'minority_percentage': round(minority_pct, 2),
                'ratio': round(imbalance_ratio, 2),
                'severity': severity
            }
        }
    
    def _analyze_regression_target(self, target_series):
        """Analyze regression target distribution."""
        
        # Basic statistics
        mean_val = float(target_series.mean())
        median_val = float(target_series.median())
        std_val = float(target_series.std())
        min_val = float(target_series.min())
        max_val = float(target_series.max())
        
        # Skewness
        from scipy import stats
        skewness = float(stats.skew(target_series))
        
        if abs(skewness) < 0.5:
            skew_flag = 'normal'
        elif abs(skewness) < 1:
            skew_flag = 'moderate'
        else:
            skew_flag = 'high'
        
        # Range
        value_range = max_val - min_val
        
        # Outliers
        q1 = target_series.quantile(0.25)
        q3 = target_series.quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        outliers = target_series[(target_series < lower_bound) | (target_series > upper_bound)]
        outlier_count = len(outliers)
        outlier_pct = (outlier_count / len(target_series) * 100)
        
        return {
            'exists': True,
            'task_type': 'regression',
            'statistics': {
                'mean': round(mean_val, 4),
                'median': round(median_val, 4),
                'std': round(std_val, 4),
                'min': round(min_val, 4),
                'max': round(max_val, 4),
                'range': round(value_range, 4)
            },
            'distribution': {
                'skewness': round(skewness, 3),
                'skewness_flag': skew_flag
            },
            'outliers': {
                'count': int(outlier_count),
                'percentage': round(outlier_pct, 2),
                'lower_bound': round(float(lower_bound), 4),
                'upper_bound': round(float(upper_bound), 4)
            }
        }