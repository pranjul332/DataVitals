import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, roc_auc_score, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

class BaselineModel:
    """
    Baseline sanity model.
    Not for accuracy - for risk detection.
    Checks: train vs test gap, overfitting warning, noise estimate.
    """
    
    def __init__(self, df, target_col):
        self.df = df
        self.target_col = target_col
        
    def analyze(self):
        """Returns baseline model analysis with overfitting detection."""
        
        # No target = no baseline
        if not self.target_col or self.target_col not in self.df.columns:
            return {
                'exists': False,
                'message': 'No target column specified for baseline model'
            }
        
        # Remove rows with missing target
        df_clean = self.df.dropna(subset=[self.target_col])
        
        if len(df_clean) < 100:
            return {
                'exists': True,
                'error': 'Insufficient data for baseline model (need at least 100 rows)'
            }
        
        # Determine task type
        n_unique = df_clean[self.target_col].nunique()
        is_classification = n_unique <= 20
        
        if is_classification:
            return self._classification_baseline(df_clean)
        else:
            return self._regression_baseline(df_clean)
    
    def _classification_baseline(self, df):
        """Build baseline classification model."""
        
        y = df[self.target_col]
        feature_cols = [col for col in df.columns if col != self.target_col]
        X = df[feature_cols].copy()
        
        # Encode target
        if y.dtype == 'object':
            le_target = LabelEncoder()
            y_encoded = le_target.fit_transform(y)
        else:
            y_encoded = y.values
        
        # Prepare features
        X_processed = self._preprocess_features(X)
        
        # Split data
        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X_processed, y_encoded, test_size=0.3, random_state=42, stratify=y_encoded
            )
        except:
            X_train, X_test, y_train, y_test = train_test_split(
                X_processed, y_encoded, test_size=0.3, random_state=42
            )
        
        # Train simple baseline model
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=20,
            random_state=42,
            n_jobs=-1
        )
        
        model.fit(X_train, y_train)
        
        # Predictions
        y_train_pred = model.predict(X_train)
        y_test_pred = model.predict(X_test)
        
        # Metrics
        train_accuracy = accuracy_score(y_train, y_train_pred)
        test_accuracy = accuracy_score(y_test, y_test_pred)
        
        # AUC if binary
        train_auc = None
        test_auc = None
        if len(np.unique(y_encoded)) == 2:
            try:
                y_train_proba = model.predict_proba(X_train)[:, 1]
                y_test_proba = model.predict_proba(X_test)[:, 1]
                train_auc = roc_auc_score(y_train, y_train_proba)
                test_auc = roc_auc_score(y_test, y_test_proba)
            except:
                pass
        
        # Overfitting detection
        accuracy_gap = train_accuracy - test_accuracy
        
        if accuracy_gap > 0.15:
            overfitting_severity = 'severe'
        elif accuracy_gap > 0.08:
            overfitting_severity = 'moderate'
        elif accuracy_gap > 0.03:
            overfitting_severity = 'mild'
        else:
            overfitting_severity = 'none'
        
        # Feature importance
        feature_importance = []
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            for idx, col in enumerate(X_processed.columns):
                if idx < len(importances):
                    feature_importance.append({
                        'feature': col,
                        'importance': round(float(importances[idx]), 4)
                    })
        
        feature_importance = sorted(feature_importance, key=lambda x: x['importance'], reverse=True)[:10]
        
        # Noise estimate (inverse of test accuracy)
        noise_estimate = 1 - test_accuracy
        
        result = {
            'exists': True,
            'task_type': 'classification',
            'model': 'RandomForestClassifier',
            'metrics': {
                'train_accuracy': round(train_accuracy, 4),
                'test_accuracy': round(test_accuracy, 4),
                'accuracy_gap': round(accuracy_gap, 4)
            },
            'overfitting': {
                'severity': overfitting_severity,
                'gap': round(accuracy_gap, 4)
            },
            'noise_estimate': round(noise_estimate, 4),
            'feature_importance': feature_importance,
            'data_split': {
                'train_size': len(X_train),
                'test_size': len(X_test)
            }
        }
        
        # Add AUC if binary
        if train_auc is not None:
            result['metrics']['train_auc'] = round(train_auc, 4)
            result['metrics']['test_auc'] = round(test_auc, 4)
            result['metrics']['auc_gap'] = round(train_auc - test_auc, 4)
        
        return result
    
    def _regression_baseline(self, df):
        """Build baseline regression model."""
        
        y = df[self.target_col].values
        feature_cols = [col for col in df.columns if col != self.target_col]
        X = df[feature_cols].copy()
        
        # Prepare features
        X_processed = self._preprocess_features(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_processed, y, test_size=0.3, random_state=42
        )
        
        # Train simple baseline model
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=20,
            random_state=42,
            n_jobs=-1
        )
        
        model.fit(X_train, y_train)
        
        # Predictions
        y_train_pred = model.predict(X_train)
        y_test_pred = model.predict(X_test)
        
        # Metrics
        train_r2 = r2_score(y_train, y_train_pred)
        test_r2 = r2_score(y_test, y_test_pred)
        train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
        test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
        
        # Overfitting detection
        r2_gap = train_r2 - test_r2
        
        if r2_gap > 0.2:
            overfitting_severity = 'severe'
        elif r2_gap > 0.1:
            overfitting_severity = 'moderate'
        elif r2_gap > 0.05:
            overfitting_severity = 'mild'
        else:
            overfitting_severity = 'none'
        
        # Feature importance
        feature_importance = []
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            for idx, col in enumerate(X_processed.columns):
                if idx < len(importances):
                    feature_importance.append({
                        'feature': col,
                        'importance': round(float(importances[idx]), 4)
                    })
        
        feature_importance = sorted(feature_importance, key=lambda x: x['importance'], reverse=True)[:10]
        
        # Noise estimate (normalized RMSE)
        y_range = y.max() - y.min()
        noise_estimate = (test_rmse / y_range) if y_range > 0 else 1.0
        
        return {
            'exists': True,
            'task_type': 'regression',
            'model': 'RandomForestRegressor',
            'metrics': {
                'train_r2': round(train_r2, 4),
                'test_r2': round(test_r2, 4),
                'r2_gap': round(r2_gap, 4),
                'train_rmse': round(train_rmse, 4),
                'test_rmse': round(test_rmse, 4)
            },
            'overfitting': {
                'severity': overfitting_severity,
                'gap': round(r2_gap, 4)
            },
            'noise_estimate': round(noise_estimate, 4),
            'feature_importance': feature_importance,
            'data_split': {
                'train_size': len(X_train),
                'test_size': len(X_test)
            }
        }
    
    def _preprocess_features(self, X):
        """Simple preprocessing: encode categoricals, fill missing."""
        X_processed = X.copy()
        
        for col in X_processed.columns:
            # Fill missing
            if X_processed[col].isnull().any():
                if pd.api.types.is_numeric_dtype(X_processed[col]):
                    X_processed[col].fillna(X_processed[col].median(), inplace=True)
                else:
                    X_processed[col].fillna(X_processed[col].mode().iloc[0] if not X_processed[col].mode().empty else 'MISSING', inplace=True)
            
            # Encode categorical
            if X_processed[col].dtype == 'object':
                le = LabelEncoder()
                X_processed[col] = le.fit_transform(X_processed[col].astype(str))
        
        return X_processed