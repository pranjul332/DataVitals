import pandas as pd
from typing import Dict, Any, List
from ops.cleaning_ops import CleaningOperations
from ops.feature_ops import FeatureOperations

class PipelineExecutor:
    """
    Deterministic execution engine for preprocessing pipelines.
    Works for ANY domain - the operations are generic.
    """
    
    def __init__(self):
        # Map operation names to functions
        self.operations = {
            # Cleaning operations
            "drop_duplicates": CleaningOperations.drop_duplicates,
            "drop_columns": CleaningOperations.drop_columns,
            "fill_missing": CleaningOperations.fill_missing,
            "remove_outliers": CleaningOperations.remove_outliers,
            "filter_rows": CleaningOperations.filter_rows,
            "sort_by": CleaningOperations.sort_by,
            "handle_missing_rows": CleaningOperations.handle_missing_rows,
            "handle_missing_columns": CleaningOperations.handle_missing_columns,
            
            # Feature operations
            "scale_numeric": FeatureOperations.scale_numeric,
            "encode_categorical": FeatureOperations.encode_categorical,
            "create_feature": FeatureOperations.create_feature,
            "extract_datetime_features": FeatureOperations.extract_datetime_features,
            "create_text_features": FeatureOperations.create_text_features,
            "aggregate_features": FeatureOperations.aggregate_features,
            "handle_high_cardinality": FeatureOperations.handle_high_cardinality
        }
    
    def execute(
        self, 
        df: pd.DataFrame, 
        plan: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute preprocessing pipeline on dataset.
        
        Returns:
            {
                "processed_df": DataFrame,
                "execution_log": [...],
                "summary": {...}
            }
        """
        steps = plan.get("steps", [])
        execution_log = []
        
        original_shape = df.shape
        current_df = df.copy()
        
        # Execute each step
        for i, step in enumerate(steps):
            op_name = step.get("op")
            params = step.get("params", {})
            
            try:
                # Get operation function
                if op_name not in self.operations:
                    execution_log.append({
                        "step": i + 1,
                        "operation": op_name,
                        "status": "skipped",
                        "reason": f"Unknown operation: {op_name}"
                    })
                    continue
                
                operation = self.operations[op_name]
                
                # Execute operation
                before_shape = current_df.shape
                current_df = operation(current_df, params)
                after_shape = current_df.shape
                
                # Log execution
                execution_log.append({
                    "step": i + 1,
                    "operation": op_name,
                    "params": params,
                    "status": "success",
                    "before_shape": before_shape,
                    "after_shape": after_shape,
                    "rows_changed": before_shape[0] - after_shape[0],
                    "columns_changed": after_shape[1] - before_shape[1]
                })
                
            except Exception as e:
                execution_log.append({
                    "step": i + 1,
                    "operation": op_name,
                    "status": "failed",
                    "error": str(e)
                })
        
        # Generate summary
        summary = self._generate_summary(original_shape, current_df.shape, execution_log)
        
        return {
            "processed_df": current_df,
            "execution_log": execution_log,
            "summary": summary
        }
    
    def _generate_summary(
        self, 
        original_shape: tuple, 
        final_shape: tuple,
        execution_log: List[Dict]
    ) -> Dict[str, Any]:
        """Generate execution summary"""
        
        successful_steps = sum(1 for log in execution_log if log["status"] == "success")
        failed_steps = sum(1 for log in execution_log if log["status"] == "failed")
        skipped_steps = sum(1 for log in execution_log if log["status"] == "skipped")
        
        rows_removed = original_shape[0] - final_shape[0]
        columns_added = final_shape[1] - original_shape[1]
        
        return {
            "original_shape": original_shape,
            "final_shape": final_shape,
            "rows_removed": rows_removed,
            "rows_removed_percent": (rows_removed / original_shape[0] * 100) if original_shape[0] > 0 else 0,
            "columns_added": columns_added,
            "total_steps": len(execution_log),
            "successful_steps": successful_steps,
            "failed_steps": failed_steps,
            "skipped_steps": skipped_steps
        }
    
    def execute_single_step(
        self,
        df: pd.DataFrame,
        step: Dict[str, Any]
    ) -> pd.DataFrame:
        """Execute a single preprocessing step"""
        op_name = step.get("op")
        params = step.get("params", {})
        
        if op_name not in self.operations:
            raise ValueError(f"Unknown operation: {op_name}")
        
        operation = self.operations[op_name]
        return operation(df, params)
    
    def dry_run(
        self,
        df: pd.DataFrame,
        plan: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Simulate execution without modifying data.
        Returns estimated impact.
        """
        steps = plan.get("steps", [])
        impact_log = []
        
        # Sample data for estimation (use smaller sample for speed)
        sample_size = min(1000, len(df))
        sample_df = df.sample(n=sample_size, random_state=42) if len(df) > sample_size else df.copy()
        
        current_df = sample_df.copy()
        
        for i, step in enumerate(steps):
            op_name = step.get("op")
            params = step.get("params", {})
            
            try:
                if op_name not in self.operations:
                    impact_log.append({
                        "step": i + 1,
                        "operation": op_name,
                        "impact": "unknown",
                        "reason": "Unknown operation"
                    })
                    continue
                
                operation = self.operations[op_name]
                before_shape = current_df.shape
                current_df = operation(current_df, params)
                after_shape = current_df.shape
                
                impact_log.append({
                    "step": i + 1,
                    "operation": op_name,
                    "estimated_rows_affected": before_shape[0] - after_shape[0],
                    "estimated_columns_affected": after_shape[1] - before_shape[1],
                    "impact_percent": ((before_shape[0] - after_shape[0]) / before_shape[0] * 100) if before_shape[0] > 0 else 0
                })
                
            except Exception as e:
                impact_log.append({
                    "step": i + 1,
                    "operation": op_name,
                    "impact": "error",
                    "error": str(e)
                })
        
        return {
            "sample_size": sample_size,
            "estimated_impact": impact_log,
            "estimated_final_shape": (
                int(df.shape[0] * (current_df.shape[0] / sample_df.shape[0])),
                current_df.shape[1]
            )
        }