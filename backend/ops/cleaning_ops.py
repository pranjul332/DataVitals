import pandas as pd
import numpy as np
from typing import Dict, Any

class CleaningOperations:
    """
    Basic cleaning operations that work on ANY dataset.
    All operations are pure functions that return modified DataFrames.
    """
    
    @staticmethod
    def drop_duplicates(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Remove duplicate rows"""
        subset = params.get("subset", None)
        keep = params.get("keep", "first")
        
        return df.drop_duplicates(subset=subset, keep=keep)
    
    @staticmethod
    def drop_columns(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Drop specified columns"""
        columns = params.get("columns", [])
        
        # Only drop columns that exist
        columns_to_drop = [col for col in columns if col in df.columns]
        
        return df.drop(columns=columns_to_drop)
    
    @staticmethod
    def fill_missing(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Fill missing values in a column"""
        column = params.get("column")
        strategy = params.get("strategy", "mean")
        value = params.get("value", None)
        
        if column not in df.columns:
            return df
        
        df = df.copy()
        
        if strategy == "constant":
            df[column] = df[column].fillna(value)
        
        elif strategy == "mean":
            if pd.api.types.is_numeric_dtype(df[column]):
                df[column] = df[column].fillna(df[column].mean())
        
        elif strategy == "median":
            if pd.api.types.is_numeric_dtype(df[column]):
                df[column] = df[column].fillna(df[column].median())
        
        elif strategy == "mode":
            mode_val = df[column].mode()
            if len(mode_val) > 0:
                df[column] = df[column].fillna(mode_val[0])
        
        elif strategy == "forward":
            df[column] = df[column].fillna(method='ffill')
        
        elif strategy == "backward":
            df[column] = df[column].fillna(method='bfill')
        
        return df
    
    @staticmethod
    def remove_outliers(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Remove outliers from a numeric column"""
        column = params.get("column")
        method = params.get("method", "iqr")
        threshold = params.get("threshold", 1.5)
        
        if column not in df.columns:
            return df
        
        if not pd.api.types.is_numeric_dtype(df[column]):
            return df
        
        df = df.copy()
        
        if method == "iqr":
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - threshold * IQR
            upper_bound = Q3 + threshold * IQR
            df = df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]
        
        elif method == "zscore":
            z_scores = np.abs((df[column] - df[column].mean()) / df[column].std())
            df = df[z_scores < threshold]
        
        return df
    
    @staticmethod
    def filter_rows(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Filter rows based on condition"""
        column = params.get("column")
        operator = params.get("operator", "==")
        value = params.get("value")
        
        if column not in df.columns:
            return df
        
        df = df.copy()
        
        if operator == "==":
            df = df[df[column] == value]
        elif operator == "!=":
            df = df[df[column] != value]
        elif operator == ">":
            df = df[df[column] > value]
        elif operator == "<":
            df = df[df[column] < value]
        elif operator == ">=":
            df = df[df[column] >= value]
        elif operator == "<=":
            df = df[df[column] <= value]
        elif operator == "in":
            if isinstance(value, list):
                df = df[df[column].isin(value)]
        
        return df
    
    @staticmethod
    def sort_by(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Sort DataFrame by column"""
        column = params.get("column")
        ascending = params.get("ascending", True)
        
        if column not in df.columns:
            return df
        
        return df.sort_values(by=column, ascending=ascending).reset_index(drop=True)
    
    @staticmethod
    def handle_missing_rows(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Remove rows with too many missing values"""
        threshold = params.get("threshold", 0.5)  # 50% missing by default
        
        missing_ratio = df.isnull().sum(axis=1) / len(df.columns)
        return df[missing_ratio < threshold]
    
    @staticmethod
    def handle_missing_columns(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Remove columns with too many missing values"""
        threshold = params.get("threshold", 0.8)  # 80% missing by default
        
        missing_ratio = df.isnull().sum() / len(df)
        columns_to_keep = missing_ratio[missing_ratio < threshold].index
        return df[columns_to_keep]