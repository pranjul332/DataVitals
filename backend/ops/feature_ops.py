import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from typing import Dict, Any, List

class FeatureOperations:
    """
    Feature engineering and transformation operations.
    Domain-agnostic and reusable across any ML task.
    """
    
    @staticmethod
    def scale_numeric(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Scale numeric features"""
        columns = params.get("columns", [])
        method = params.get("method", "standard")
        
        # Filter to existing numeric columns
        numeric_cols = [col for col in columns 
                       if col in df.columns and pd.api.types.is_numeric_dtype(df[col])]
        
        if not numeric_cols:
            return df
        
        df = df.copy()
        
        if method == "standard":
            scaler = StandardScaler()
        elif method == "minmax":
            scaler = MinMaxScaler()
        elif method == "robust":
            scaler = RobustScaler()
        else:
            return df
        
        df[numeric_cols] = scaler.fit_transform(df[numeric_cols])
        
        return df
    
    @staticmethod
    def encode_categorical(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Encode categorical variables"""
        columns = params.get("columns", [])
        method = params.get("method", "onehot")
        
        # Filter to existing columns
        valid_cols = [col for col in columns if col in df.columns]
        
        if not valid_cols:
            return df
        
        df = df.copy()
        
        if method == "label":
            for col in valid_cols:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
        
        elif method == "onehot":
            # Use pandas get_dummies for simplicity
            df = pd.get_dummies(df, columns=valid_cols, prefix=valid_cols, drop_first=True)
        
        elif method == "ordinal":
            # Simple ordinal encoding (sorts categories alphabetically)
            for col in valid_cols:
                categories = sorted(df[col].unique())
                mapping = {cat: i for i, cat in enumerate(categories)}
                df[col] = df[col].map(mapping)
        
        return df
    
    @staticmethod
    def create_feature(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Create new feature from existing columns"""
        name = params.get("name")
        expression = params.get("expression")
        feature_type = params.get("type", "arithmetic")
        
        df = df.copy()
        
        if feature_type == "arithmetic":
            # Simple arithmetic operations
            # Example: "col1 + col2", "col1 * col2"
            try:
                df[name] = df.eval(expression)
            except:
                pass
        
        elif feature_type == "binning":
            # Bin numeric column
            column = params.get("column")
            bins = params.get("bins", 5)
            if column in df.columns and pd.api.types.is_numeric_dtype(df[column]):
                df[name] = pd.cut(df[column], bins=bins, labels=False)
        
        elif feature_type == "interaction":
            # Create interaction features
            cols = params.get("columns", [])
            if len(cols) >= 2 and all(col in df.columns for col in cols):
                df[name] = df[cols[0]]
                for col in cols[1:]:
                    df[name] = df[name] * df[col]
        
        return df
    
    @staticmethod
    def extract_datetime_features(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Extract features from datetime columns"""
        column = params.get("column")
        features = params.get("features", ["year", "month", "day", "dayofweek"])
        
        if column not in df.columns:
            return df
        
        df = df.copy()
        
        # Convert to datetime if not already
        if not pd.api.types.is_datetime64_any_dtype(df[column]):
            try:
                df[column] = pd.to_datetime(df[column])
            except:
                return df
        
        # Extract features
        if "year" in features:
            df[f"{column}_year"] = df[column].dt.year
        if "month" in features:
            df[f"{column}_month"] = df[column].dt.month
        if "day" in features:
            df[f"{column}_day"] = df[column].dt.day
        if "dayofweek" in features:
            df[f"{column}_dayofweek"] = df[column].dt.dayofweek
        if "hour" in features:
            df[f"{column}_hour"] = df[column].dt.hour
        if "quarter" in features:
            df[f"{column}_quarter"] = df[column].dt.quarter
        
        return df
    
    @staticmethod
    def create_text_features(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Create basic text features"""
        column = params.get("column")
        
        if column not in df.columns:
            return df
        
        df = df.copy()
        
        # Ensure column is string type
        df[column] = df[column].astype(str)
        
        # Create features
        df[f"{column}_length"] = df[column].str.len()
        df[f"{column}_word_count"] = df[column].str.split().str.len()
        df[f"{column}_char_count"] = df[column].str.replace(" ", "").str.len()
        
        return df
    
    @staticmethod
    def aggregate_features(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Create aggregated features by grouping"""
        group_by = params.get("group_by")
        agg_column = params.get("agg_column")
        agg_func = params.get("agg_func", "mean")
        
        if group_by not in df.columns or agg_column not in df.columns:
            return df
        
        df = df.copy()
        
        # Create aggregated feature
        agg_name = f"{agg_column}_{agg_func}_by_{group_by}"
        agg_df = df.groupby(group_by)[agg_column].transform(agg_func)
        df[agg_name] = agg_df
        
        return df
    
    @staticmethod
    def handle_high_cardinality(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Handle high cardinality categorical columns"""
        column = params.get("column")
        threshold = params.get("threshold", 10)
        strategy = params.get("strategy", "top_n")
        
        if column not in df.columns:
            return df
        
        df = df.copy()
        
        if strategy == "top_n":
            # Keep top N categories, group others as "Other"
            top_categories = df[column].value_counts().head(threshold).index
            df[column] = df[column].apply(
                lambda x: x if x in top_categories else "Other"
            )
        
        elif strategy == "frequency_encode":
            # Replace with frequency
            freq_map = df[column].value_counts(normalize=True).to_dict()
            df[f"{column}_freq"] = df[column].map(freq_map)
        
        return df