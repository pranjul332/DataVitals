from typing import Dict, Any, List

class PurposeSchema:
    """
    Domain-agnostic purpose schemas that describe task intent.
    These schemas guide the LLM planner WITHOUT hardcoding logic.
    """
    
    SCHEMAS = {
        "regression": {
            "task_type": "regression",
            "description": "Predicting continuous numeric values",
            "constraints": {
                "target_required": True,
                "target_numeric": True,
                "scale_features": False,  # Changed: no scaling by default
                "handle_outliers": True,
                "encode_categorical": False  # Changed: no encoding
            },
            "recommendations": [
                "Remove duplicate rows",
                "Remove or cap extreme outliers in target variable",
                "Fill missing values with appropriate strategies",
                "Keep original data structure - no encoding or scaling",
                "Remove columns with excessive missing values (>80%)"
            ]
        },
        
        "classification": {
            "task_type": "classification",
            "description": "Predicting categorical labels",
            "constraints": {
                "target_required": True,
                "target_categorical": True,
                "balance_classes": False,
                "encode_categorical": False,  # Changed: no encoding
                "scale_features": False  # Changed: no scaling
            },
            "recommendations": [
                "Remove duplicate rows",
                "Fill missing values appropriately",
                "Keep categorical values as-is",
                "Remove outliers in numeric features if needed",
                "Preserve original column structure"
            ]
        },
        
        "recommendation": {
            "task_type": "recommendation",
            "description": "Building recommender systems",
            "constraints": {
                "user_item_required": True,
                "deduplicate": True,
                "handle_sparse_ratings": True,
                "categorical_ids": False  # Changed: keep as-is
            },
            "recommendations": [
                "Remove duplicate user-item interactions",
                "Validate rating ranges",
                "Fill missing ratings appropriately",
                "Keep user and item IDs in original format"
            ]
        },
        
        "time_series": {
            "task_type": "time_series",
            "description": "Analyzing temporal data",
            "constraints": {
                "datetime_required": True,
                "sort_by_time": True,
                "handle_seasonality": False,
                "no_future_leakage": True
            },
            "recommendations": [
                "Sort data chronologically",
                "Handle missing timestamps",
                "Remove or interpolate outliers carefully",
                "Keep datetime in original format or convert to standard datetime"
            ]
        },
        
        "clustering": {
            "task_type": "clustering",
            "description": "Grouping similar data points",
            "constraints": {
                "scale_features": False,  # Changed
                "handle_outliers": True,
                "numeric_only": False,
                "encode_categorical": False  # Changed
            },
            "recommendations": [
                "Remove duplicate rows",
                "Handle outliers carefully",
                "Fill missing values",
                "Keep original data types"
            ]
        },
        
        "anomaly_detection": {
            "task_type": "anomaly_detection",
            "description": "Detecting outliers and anomalies",
            "constraints": {
                "preserve_outliers": True,
                "scale_features": False,  # Changed
                "handle_missing": True
            },
            "recommendations": [
                "Do NOT remove outliers (they're the signal)",
                "Fill missing values carefully",
                "Keep data in original format",
                "Ensure consistent data types"
            ]
        },
        
        "nlp": {
            "task_type": "nlp",
            "description": "Natural language processing tasks",
            "constraints": {
                "text_column_required": True,
                "preserve_text": True,
                "remove_duplicates": True
            },
            "recommendations": [
                "Remove duplicate texts",
                "Handle missing text entries",
                "Preserve original text",
                "Basic text cleaning only (trimming whitespace)"
            ]
        },
        
        "general_cleaning": {
            "task_type": "general_cleaning",
            "description": "Clean data without transformation",
            "constraints": {
                "minimal_transformation": True,
                "preserve_structure": True,
                "no_encoding": True,
                "no_scaling": True,
                "basic_cleaning_only": True
            },
            "recommendations": [
                "Remove duplicate rows only",
                "Fill missing values with simple strategies",
                "Remove columns with >90% missing data",
                "Handle obvious outliers only if extreme",
                "Keep all original columns and data types",
                "NO encoding, NO scaling, NO feature engineering"
            ]
        }
    }
    
    @classmethod
    def get_schema(cls, task_type: str) -> Dict[str, Any]:
        """Get purpose schema for a task type"""
        # FIXED: Use correct fallback key
        return cls.SCHEMAS.get(task_type, cls.SCHEMAS["general_cleaning"])
    
    @classmethod
    def get_all_tasks(cls) -> List[str]:
        """Get list of all supported task types"""
        return list(cls.SCHEMAS.keys())
    
    @classmethod
    def create_custom_schema(
        cls, 
        task_type: str,
        description: str,
        constraints: Dict[str, Any],
        recommendations: List[str]
    ) -> Dict[str, Any]:
        """Create a custom purpose schema"""
        return {
            "task_type": task_type,
            "description": description,
            "constraints": constraints,
            "recommendations": recommendations
        }
    
    @classmethod
    def enrich_with_target(
        cls, 
        schema: Dict[str, Any], 
        target_column: str = None
    ) -> Dict[str, Any]:
        """Add target column information to schema"""
        enriched = schema.copy()
        if target_column:
            enriched["target_column"] = target_column
        return enriched
    
    @classmethod
    def validate_task_compatibility(
        cls, 
        task_type: str, 
        profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate if dataset profile is compatible with task type.
        Returns validation result with warnings.
        """
        schema = cls.get_schema(task_type)
        constraints = schema.get("constraints", {})
        warnings = []
        
        columns = profile.get("basic_info", {}).get("column_names", [])
        column_analysis = profile.get("columns", {})
        
        # Check numeric features for tasks requiring them
        if constraints.get("scale_features"):
            numeric_cols = [col for col, info in column_analysis.items() 
                           if info.get("inferred_type") in ["numeric", "categorical_numeric"]]
            if not numeric_cols:
                warnings.append("No numeric features found for scaling")
        
        # Check for datetime in time series tasks
        if constraints.get("datetime_required"):
            datetime_cols = [col for col, info in column_analysis.items() 
                            if info.get("inferred_type") == "datetime"]
            if not datetime_cols:
                warnings.append("No datetime column found for time series task")
        
        # Check for text columns in NLP tasks
        if constraints.get("text_column_required"):
            text_cols = [col for col, info in column_analysis.items() 
                        if info.get("inferred_type") == "text"]
            if not text_cols:
                warnings.append("No text column found for NLP task")
        
        return {
            "compatible": len(warnings) == 0,
            "warnings": warnings,
            "schema": schema
        }