from typing import Dict, Any, List, Tuple

class PipelineValidator:
    """
    Safety layer that validates LLM-generated pipelines.
    Prevents execution of invalid or dangerous operations.
    """
    
    VALID_OPERATIONS = {
        "drop_duplicates",
        "drop_columns",
        "fill_missing",
        "remove_outliers",
        "scale_numeric",
        "encode_categorical",
        "create_feature",
        "sort_by",
        "filter_rows"
    }
    
    FILL_STRATEGIES = {"mean", "median", "mode", "constant", "forward", "backward"}
    OUTLIER_METHODS = {"iqr", "zscore", "isolation_forest"}
    SCALING_METHODS = {"standard", "minmax", "robust"}
    ENCODING_METHODS = {"onehot", "label", "ordinal"}
    
    def __init__(self, profile: Dict[str, Any]):
        self.profile = profile
        self.available_columns = set(profile["basic_info"]["column_names"])
        self.column_types = {
            col: details["inferred_type"]
            for col, details in profile["columns"].items()
        }
    
    def validate(self, plan: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate a preprocessing pipeline.
        
        Returns:
            (is_valid, list_of_errors)
        """
        errors = []
        
        # Validate structure
        if "steps" not in plan:
            errors.append("Plan must contain 'steps' field")
            return False, errors
        
        if not isinstance(plan["steps"], list):
            errors.append("'steps' must be a list")
            return False, errors
        
        # Validate each step
        for i, step in enumerate(plan["steps"]):
            step_errors = self._validate_step(step, i)
            errors.extend(step_errors)
        
        # Validate step order logic
        order_errors = self._validate_step_order(plan["steps"])
        errors.extend(order_errors)
        
        return len(errors) == 0, errors
    
    def _validate_step(self, step: Dict[str, Any], index: int) -> List[str]:
        """Validate a single pipeline step"""
        errors = []
        prefix = f"Step {index + 1}"
        
        # Check required fields
        if "op" not in step:
            errors.append(f"{prefix}: Missing 'op' field")
            return errors
        
        op = step["op"]
        
        # Check valid operation
        if op not in self.VALID_OPERATIONS:
            errors.append(f"{prefix}: Unknown operation '{op}'")
            return errors
        
        # Validate operation-specific parameters
        params = step.get("params", {})
        
        if op == "drop_columns":
            errors.extend(self._validate_drop_columns(params, prefix))
        
        elif op == "fill_missing":
            errors.extend(self._validate_fill_missing(params, prefix))
        
        elif op == "remove_outliers":
            errors.extend(self._validate_remove_outliers(params, prefix))
        
        elif op == "scale_numeric":
            errors.extend(self._validate_scale_numeric(params, prefix))
        
        elif op == "encode_categorical":
            errors.extend(self._validate_encode_categorical(params, prefix))
        
        elif op == "sort_by":
            errors.extend(self._validate_sort_by(params, prefix))
        
        return errors
    
    def _validate_drop_columns(self, params: Dict, prefix: str) -> List[str]:
        """Validate drop_columns operation"""
        errors = []
        
        if "columns" not in params:
            errors.append(f"{prefix}: drop_columns requires 'columns' parameter")
            return errors
        
        columns = params["columns"]
        if not isinstance(columns, list):
            errors.append(f"{prefix}: 'columns' must be a list")
            return errors
        
        for col in columns:
            if col not in self.available_columns:
                errors.append(f"{prefix}: Column '{col}' does not exist")
        
        return errors
    
    def _validate_fill_missing(self, params: Dict, prefix: str) -> List[str]:
        """Validate fill_missing operation"""
        errors = []
        
        if "column" not in params:
            errors.append(f"{prefix}: fill_missing requires 'column' parameter")
            return errors
        
        column = params["column"]
        if column not in self.available_columns:
            errors.append(f"{prefix}: Column '{column}' does not exist")
            return errors
        
        strategy = params.get("strategy", "mean")
        if strategy not in self.FILL_STRATEGIES:
            errors.append(f"{prefix}: Invalid fill strategy '{strategy}'")
        
        # Validate strategy is compatible with column type
        col_type = self.column_types.get(column)
        if strategy in ["mean", "median"] and col_type not in ["numeric", "categorical_numeric"]:
            errors.append(f"{prefix}: Cannot use {strategy} strategy on non-numeric column '{column}'")
        
        return errors
    
    def _validate_remove_outliers(self, params: Dict, prefix: str) -> List[str]:
        """Validate remove_outliers operation"""
        errors = []
        
        if "column" not in params:
            errors.append(f"{prefix}: remove_outliers requires 'column' parameter")
            return errors
        
        column = params["column"]
        if column not in self.available_columns:
            errors.append(f"{prefix}: Column '{column}' does not exist")
            return errors
        
        # Must be numeric
        col_type = self.column_types.get(column)
        if col_type not in ["numeric", "categorical_numeric"]:
            errors.append(f"{prefix}: Cannot remove outliers from non-numeric column '{column}'")
        
        method = params.get("method", "iqr")
        if method not in self.OUTLIER_METHODS:
            errors.append(f"{prefix}: Invalid outlier method '{method}'")
        
        return errors
    
    def _validate_scale_numeric(self, params: Dict, prefix: str) -> List[str]:
        """Validate scale_numeric operation"""
        errors = []
        
        if "columns" not in params:
            errors.append(f"{prefix}: scale_numeric requires 'columns' parameter")
            return errors
        
        columns = params["columns"]
        if not isinstance(columns, list):
            errors.append(f"{prefix}: 'columns' must be a list")
            return errors
        
        for col in columns:
            if col not in self.available_columns:
                errors.append(f"{prefix}: Column '{col}' does not exist")
                continue
            
            col_type = self.column_types.get(col)
            if col_type not in ["numeric", "categorical_numeric"]:
                errors.append(f"{prefix}: Cannot scale non-numeric column '{col}'")
        
        method = params.get("method", "standard")
        if method not in self.SCALING_METHODS:
            errors.append(f"{prefix}: Invalid scaling method '{method}'")
        
        return errors
    
    def _validate_encode_categorical(self, params: Dict, prefix: str) -> List[str]:
        """Validate encode_categorical operation"""
        errors = []
        
        if "columns" not in params:
            errors.append(f"{prefix}: encode_categorical requires 'columns' parameter")
            return errors
        
        columns = params["columns"]
        if not isinstance(columns, list):
            errors.append(f"{prefix}: 'columns' must be a list")
            return errors
        
        for col in columns:
            if col not in self.available_columns:
                errors.append(f"{prefix}: Column '{col}' does not exist")
        
        method = params.get("method", "onehot")
        if method not in self.ENCODING_METHODS:
            errors.append(f"{prefix}: Invalid encoding method '{method}'")
        
        return errors
    
    def _validate_sort_by(self, params: Dict, prefix: str) -> List[str]:
        """Validate sort_by operation"""
        errors = []
        
        if "column" not in params:
            errors.append(f"{prefix}: sort_by requires 'column' parameter")
            return errors
        
        column = params["column"]
        if column not in self.available_columns:
            errors.append(f"{prefix}: Column '{column}' does not exist")
        
        return errors
    
    def _validate_step_order(self, steps: List[Dict]) -> List[str]:
        """Validate logical order of operations"""
        errors = []
        
        # Track which columns have been dropped
        dropped_columns = set()
        
        for i, step in enumerate(steps):
            op = step["op"]
            params = step.get("params", {})
            
            # Check if operation references dropped columns
            if op == "drop_columns":
                cols = params.get("columns", [])
                dropped_columns.update(cols)
            
            elif op in ["fill_missing", "remove_outliers", "sort_by"]:
                col = params.get("column")
                if col in dropped_columns:
                    errors.append(f"Step {i + 1}: References dropped column '{col}'")
            
            elif op in ["scale_numeric", "encode_categorical"]:
                cols = params.get("columns", [])
                for col in cols:
                    if col in dropped_columns:
                        errors.append(f"Step {i + 1}: References dropped column '{col}'")
        
        return errors