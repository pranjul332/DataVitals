import pandas as pd
import numpy as np
from scipy import stats

class DistributionAnalyzer:
    """
    Distribution & outlier analysis.
    Silent model killers detection.
    """
    
    def __init__(self, df, target_col=None):
        self.df = df
        self.target_col = target_col
        
    def analyze(self):
        """Returns distribution analysis for numeric and categorical features."""
        
        numeric_analysis = []
        categorical_analysis = []
        
        # Numeric features
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if col == self.target_col:
                continue
            
            analysis = self._analyze_numeric(col)
            if analysis:
                numeric_analysis.append(analysis)
        
        # Categorical features
        categorical_cols = self.df.select_dtypes(include=['object', 'category']).columns
        for col in categorical_cols:
            if col == self.target_col:
                continue
            
            analysis = self._analyze_categorical(col)
            if analysis:
                categorical_analysis.append(analysis)
        
        # Summary statistics
        total_features = len(numeric_analysis) + len(categorical_analysis)
        skewed_features = sum(1 for x in numeric_analysis if x.get('skewness_flag') in ['moderate', 'high'])
        outlier_features = sum(1 for x in numeric_analysis if x.get('outlier_percentage', 0) > 5)
        dominated_features = sum(1 for x in categorical_analysis if x.get('dominant_percentage', 0) > 80)
        
        return {
            'numeric_features': numeric_analysis,
            'categorical_features': categorical_analysis,
            'summary': {
                'total_analyzed': int(total_features),
                'numeric_count': len(numeric_analysis),
                'categorical_count': len(categorical_analysis),
                'skewed_features': int(skewed_features),
                'outlier_features': int(outlier_features),
                'dominated_categorical': int(dominated_features)
            }
        }
    
    def _analyze_numeric(self, col):
        """Analyze numeric column distribution."""
        series = self.df[col].dropna()
        
        if len(series) < 2:
            return None
        
        # Basic stats
        mean_val = float(series.mean())
        median_val = float(series.median())
        std_val = float(series.std())
        min_val = float(series.min())
        max_val = float(series.max())
        
        # Skewness (asymmetry)
        skewness = float(stats.skew(series))
        if abs(skewness) < 0.5:
            skew_flag = 'low'
        elif abs(skewness) < 1:
            skew_flag = 'moderate'
        else:
            skew_flag = 'high'
        
        # Kurtosis (tail heaviness)
        kurtosis = float(stats.kurtosis(series))
        if abs(kurtosis) < 1:
            kurt_flag = 'normal'
        elif abs(kurtosis) < 3:
            kurt_flag = 'moderate'
        else:
            kurt_flag = 'extreme'
        
        # IQR outlier detection
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        outliers = series[(series < lower_bound) | (series > upper_bound)]
        outlier_count = len(outliers)
        outlier_pct = (outlier_count / len(series) * 100) if len(series) > 0 else 0
        
        return {
            'column': col,
            'statistics': {
                'mean': round(mean_val, 4),
                'median': round(median_val, 4),
                'std': round(std_val, 4),
                'min': round(min_val, 4),
                'max': round(max_val, 4)
            },
            'skewness': round(skewness, 3),
            'skewness_flag': skew_flag,
            'kurtosis': round(kurtosis, 3),
            'kurtosis_flag': kurt_flag,
            'outliers': {
                'count': int(outlier_count),
                'percentage': round(outlier_pct, 2),
                'lower_bound': round(float(lower_bound), 4),
                'upper_bound': round(float(upper_bound), 4)
            },
            'outlier_percentage': round(outlier_pct, 2)
        }
    
    def _analyze_categorical(self, col):
        """Analyze categorical column distribution."""
        series = self.df[col].dropna()
        
        if len(series) == 0:
            return None
        
        value_counts = series.value_counts()
        n_unique = len(value_counts)
        
        # Dominant category
        top_value = value_counts.index[0]
        top_count = int(value_counts.iloc[0])
        top_percentage = (top_count / len(series) * 100)
        
        # Distribution entropy (measure of uniformity)
        proportions = value_counts / len(series)
        entropy = float(-np.sum(proportions * np.log2(proportions + 1e-10)))
        max_entropy = np.log2(n_unique) if n_unique > 1 else 1
        normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0
        
        # Top categories
        top_n = min(5, n_unique)
        top_categories = []
        for i in range(top_n):
            top_categories.append({
                'value': str(value_counts.index[i]),
                'count': int(value_counts.iloc[i]),
                'percentage': round(float(value_counts.iloc[i] / len(series) * 100), 2)
            })
        
        return {
            'column': col,
            'cardinality': int(n_unique),
            'dominant_category': {
                'value': str(top_value),
                'count': top_count,
                'percentage': round(top_percentage, 2)
            },
            'dominant_percentage': round(top_percentage, 2),
            'entropy': round(normalized_entropy, 3),
            'top_categories': top_categories
        }