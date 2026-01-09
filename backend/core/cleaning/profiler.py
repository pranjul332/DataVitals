import pandas as pd
import numpy as np
from typing import Dict, Any

class DatasetProfiler:
    """
    Task-independent dataset profiling engine.
    Analyzes any CSV and returns comprehensive statistics.
    """
    
    def __init__(self, df: pd.DataFrame):
        self.df = df
        
    def profile(self) -> Dict[str, Any]:
        """Generate complete dataset profile"""
        return {
            "basic_info": self._basic_info(),
            "columns": self._column_analysis(),
            "quality": self._quality_metrics(),
            "statistics": self._statistical_summary(),
            "relationships": self._detect_relationships()
        }
    
    def _basic_info(self) -> Dict[str, Any]:
        """Basic dataset information"""
        return {
            "rows": len(self.df),
            "columns": len(self.df.columns),
            "column_names": list(self.df.columns),
            "memory_usage_mb": self.df.memory_usage(deep=True).sum() / (1024 * 1024),
            "duplicates": int(self.df.duplicated().sum())
        }
    
    def _column_analysis(self) -> Dict[str, Dict[str, Any]]:
        """Detailed per-column analysis"""
        analysis = {}
        
        for col in self.df.columns:
            col_data = self.df[col]
            
            analysis[col] = {
                "dtype": str(col_data.dtype),
                "inferred_type": self._infer_type(col_data),
                "missing_count": int(col_data.isnull().sum()),
                "missing_percent": float(col_data.isnull().mean() * 100),
                "unique_count": int(col_data.nunique()),
                "unique_ratio": float(col_data.nunique() / len(col_data)) if len(col_data) > 0 else 0.0,
                "sample_values": self._safe_sample_values(col_data)
            }
            
            # Add numeric-specific stats
            if pd.api.types.is_numeric_dtype(col_data):
                analysis[col].update(self._numeric_stats(col_data))
            
            # Add categorical-specific stats
            if col_data.nunique() < 50 or pd.api.types.is_object_dtype(col_data):
                analysis[col].update(self._categorical_stats(col_data))
                
        return analysis
    
    def _safe_sample_values(self, series: pd.Series) -> list:
        """Safely extract sample values, converting to JSON-serializable types"""
        try:
            samples = series.dropna().head(5).tolist()
            # Convert any numpy types to native Python types
            return [self._convert_to_json_serializable(x) for x in samples]
        except:
            return []
    
    def _convert_to_json_serializable(self, value):
        """Convert numpy/pandas types to JSON-serializable Python types"""
        if pd.isna(value):
            return None
        if isinstance(value, (np.integer, np.int64, np.int32)):
            return int(value)
        if isinstance(value, (np.floating, np.float64, np.float32)):
            return float(value)
        if isinstance(value, np.bool_):
            return bool(value)
        if isinstance(value, (np.ndarray, pd.Series)):
            return value.tolist()
        return value
    
    def _infer_type(self, series: pd.Series) -> str:
        """Infer semantic type of column"""
        # Check if ID-like
        if series.nunique() == len(series):
            return "identifier"
        
        # Check if datetime
        if pd.api.types.is_datetime64_any_dtype(series):
            return "datetime"
        
        # Check if numeric
        if pd.api.types.is_numeric_dtype(series):
            if series.nunique() < 10:
                return "categorical_numeric"
            return "numeric"
        
        # Check if categorical
        if series.nunique() / len(series) < 0.05:
            return "categorical"
        
        # Check if text
        if pd.api.types.is_object_dtype(series):
            avg_length = series.astype(str).str.len().mean()
            if avg_length > 50:
                return "text"
            return "categorical"
        
        return "unknown"
    
    def _numeric_stats(self, series: pd.Series) -> Dict[str, Any]:
        """Statistics for numeric columns"""
        clean_data = series.dropna()
        if len(clean_data) == 0:
            return {}
        
        return {
            "min": float(clean_data.min()),
            "max": float(clean_data.max()),
            "mean": float(clean_data.mean()),
            "median": float(clean_data.median()),
            "std": float(clean_data.std()),
            "q25": float(clean_data.quantile(0.25)),
            "q75": float(clean_data.quantile(0.75)),
            "skewness": float(clean_data.skew()),
            "has_outliers": bool(self._detect_outliers(clean_data))
        }
    
    def _categorical_stats(self, series: pd.Series) -> Dict[str, Any]:
        """Statistics for categorical columns"""
        value_counts = series.value_counts()
        
        # Convert to JSON-serializable dict
        top_values = {}
        for idx, val in value_counts.head(10).items():
            top_values[str(idx)] = int(val)
        
        return {
            "top_values": top_values,
            "cardinality": int(len(value_counts)),
            "most_frequent": str(value_counts.index[0]) if len(value_counts) > 0 else None,
            "most_frequent_count": int(value_counts.iloc[0]) if len(value_counts) > 0 else 0
        }
    
    def _detect_outliers(self, series: pd.Series) -> bool:
        """Detect if column has outliers using IQR method"""
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        outliers = ((series < lower_bound) | (series > upper_bound)).sum()
        return outliers > 0
    
    def _quality_metrics(self) -> Dict[str, Any]:
        """Overall data quality metrics"""
        total_cells = self.df.shape[0] * self.df.shape[1]
        missing_cells = self.df.isnull().sum().sum()
        
        return {
            "completeness_percent": float((1 - missing_cells / total_cells) * 100),
            "duplicate_rows": int(self.df.duplicated().sum()),
            "duplicate_percent": float(self.df.duplicated().mean() * 100),
            "columns_with_missing": int((self.df.isnull().sum() > 0).sum()),
            "fully_empty_columns": int((self.df.isnull().sum() == len(self.df)).sum())
        }
    
    def _statistical_summary(self) -> Dict[str, Any]:
        """Statistical summary of numeric columns"""
        numeric_df = self.df.select_dtypes(include=[np.number])
        
        if numeric_df.empty:
            return {"numeric_columns": 0}
        
        # Convert correlation matrix to JSON-serializable format
        corr_matrix = {}
        if len(numeric_df.columns) > 1:
            corr = numeric_df.corr()
            for col in corr.columns:
                corr_matrix[col] = {
                    k: float(v) for k, v in corr[col].items()
                }
        
        return {
            "numeric_columns": len(numeric_df.columns),
            "correlation_matrix": corr_matrix
        }
    
    def _detect_relationships(self) -> Dict[str, Any]:
        """Detect potential relationships between columns"""
        relationships = []
        
        # Check for potential ID columns
        id_columns = [col for col in self.df.columns 
                      if self.df[col].nunique() == len(self.df)]
        
        # Check for potential foreign keys
        for col in self.df.columns:
            if col not in id_columns and self.df[col].nunique() < len(self.df) * 0.5:
                relationships.append({
                    "column": col,
                    "type": "potential_foreign_key",
                    "cardinality": int(self.df[col].nunique())
                })
        
        return {
            "primary_key_candidates": id_columns,
            "foreign_key_candidates": relationships
        }