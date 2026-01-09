import pandas as pd
import numpy as np

class DatasetProfiler:
    """
    Foundation layer: Basic dataset statistics.
    No interpretation. Just facts.
    """
    
    def __init__(self, df):
        self.df = df
        
    def profile(self):
        """Returns core dataset metrics."""
        
        # Basic shape
        n_rows, n_cols = self.df.shape
        
        # Data types
        dtypes_count = self.df.dtypes.value_counts().to_dict()
        dtypes_map = {col: str(dtype) for col, dtype in self.df.dtypes.items()}
        
        # Missing values
        total_cells = n_rows * n_cols
        missing_cells = self.df.isnull().sum().sum()
        missing_pct = (missing_cells / total_cells * 100) if total_cells > 0 else 0
        
        # Duplicates
        n_duplicates = self.df.duplicated().sum()
        duplicate_pct = (n_duplicates / n_rows * 100) if n_rows > 0 else 0
        
        # Memory
        memory_bytes = self.df.memory_usage(deep=True).sum()
        memory_mb = memory_bytes / (1024 ** 2)
        
        # Column types breakdown
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = self.df.select_dtypes(include=['object', 'category']).columns.tolist()
        datetime_cols = self.df.select_dtypes(include=['datetime64']).columns.tolist()
        
        return {
            'shape': {
                'rows': int(n_rows),
                'columns': int(n_cols)
            },
            'dtypes': {
                'summary': {str(k): int(v) for k, v in dtypes_count.items()},
                'columns': dtypes_map
            },
            'missing': {
                'total_cells': int(total_cells),
                'missing_cells': int(missing_cells),
                'missing_percentage': round(missing_pct, 2)
            },
            'duplicates': {
                'count': int(n_duplicates),
                'percentage': round(duplicate_pct, 2)
            },
            'memory': {
                'bytes': int(memory_bytes),
                'mb': round(memory_mb, 2)
            },
            'column_types': {
                'numeric': numeric_cols,
                'categorical': categorical_cols,
                'datetime': datetime_cols
            }
        }