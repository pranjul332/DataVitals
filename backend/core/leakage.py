import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import roc_auc_score, r2_score
from sklearn.model_selection import train_test_split

class LeakageDetector:
    """
    Leakage detection: The standout feature.
    Techniques: Feature-target correlation, single-feature model performance.
    This is where light ML comes in.
    """
    
    def __init__(self, df, target_col):
        self.df = df
        self.target_col = target_col
        
    def analyze(self):
        """Returns leakage analysis with risk flags."""
        
        # No target = no leakage analysis
        if not self.target_col or self.target_col not in self.df.columns:
            return {
                'exists': False,
                'message': 'No target column specified for leakage detection'
            }
        
        # Remove rows with missing target
        df_clean = self.df.dropna(subset=[self.target_col])
        
        if len(df_clean) < 50:
            return {
                'exists': True,
                'error': 'Insufficient data after removing missing targets (need at least 50 rows)'
            }
        
        # Determine task type
        n_unique = df_clean[self.target_col].nunique()
        is_classification = n_unique <= 20
        
        if is_classification:
            return self._detect_classification_leakage(df_clean)
        else:
            return self._detect_regression_leakage(df_clean)
    
    def _detect_classification_leakage(self, df):
        """Detect leakage in classification tasks."""
        
        y = df[self.target_col]
        feature_cols = [col for col in df.columns if col != self.target_col]
        
        leakage_features = []
        correlation_results = []
        
        # Encode target if needed
        if y.dtype == 'object':
            le = LabelEncoder()
            y_encoded = le.fit_transform(y)
        else:
            y_encoded = y.values
        
        # Split data once for all single-feature models
        X_full = df[feature_cols]
        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X_full, y_encoded, test_size=0.3, random_state=42, stratify=y_encoded
            )
        except:
            # If stratify fails (class with only 1 sample), skip it
            X_train, X_test, y_train, y_test = train_test_split(
                X_full, y_encoded, test_size=0.3, random_state=42
            )
        
        for col in feature_cols:
            feature_data = df[col].dropna()
            
            if len(feature_data) < 10:
                continue
            
            # Correlation check (for numeric features)
            if pd.api.types.is_numeric_dtype(df[col]):
                aligned_feature = df.loc[feature_data.index, col]
                aligned_target = y.loc[feature_data.index]
                
                if pd.api.types.is_numeric_dtype(aligned_target):
                    corr = aligned_feature.corr(aligned_target)
                else:
                    # For categorical target, encode and correlate
                    le_temp = LabelEncoder()
                    aligned_target_encoded = le_temp.fit_transform(aligned_target)
                    corr = aligned_feature.corr(pd.Series(aligned_target_encoded, index=aligned_feature.index))
                
                correlation_results.append({
                    'feature': col,
                    'correlation': round(float(abs(corr)), 4) if not np.isnan(corr) else 0
                })
                
                # Flag high correlation
                if abs(corr) > 0.9:
                    leakage_features.append({
                        'feature': col,
                        'method': 'correlation',
                        'score': round(float(abs(corr)), 4),
                        'risk': 'critical'
                    })
            
            # Single-feature model check
            auc_score = self._single_feature_auc(col, X_train, X_test, y_train, y_test)
            
            if auc_score is not None:
                # Near-perfect predictor (AUC > 0.95)
                if auc_score > 0.95:
                    leakage_features.append({
                        'feature': col,
                        'method': 'single_feature_auc',
                        'score': round(auc_score, 4),
                        'risk': 'critical'
                    })
                # Suspiciously good (AUC > 0.85)
                elif auc_score > 0.85:
                    leakage_features.append({
                        'feature': col,
                        'method': 'single_feature_auc',
                        'score': round(auc_score, 4),
                        'risk': 'high'
                    })
        
        # Summary
        critical_count = sum(1 for x in leakage_features if x['risk'] == 'critical')
        high_count = sum(1 for x in leakage_features if x['risk'] == 'high')
        
        return {
            'exists': True,
            'task_type': 'classification',
            'leakage_features': sorted(leakage_features, key=lambda x: x['score'], reverse=True),
            'correlation_analysis': sorted(correlation_results, key=lambda x: x['correlation'], reverse=True)[:10],
            'summary': {
                'total_features_analyzed': len(feature_cols),
                'critical_leakage': critical_count,
                'high_risk_leakage': high_count,
                'total_suspicious': critical_count + high_count
            }
        }
    
    def _detect_regression_leakage(self, df):
        """Detect leakage in regression tasks."""
        
        y = df[self.target_col]
        feature_cols = [col for col in df.columns if col != self.target_col]
        
        leakage_features = []
        correlation_results = []
        
        # Split data
        X_full = df[feature_cols]
        X_train, X_test, y_train, y_test = train_test_split(
            X_full, y.values, test_size=0.3, random_state=42
        )
        
        for col in feature_cols:
            feature_data = df[col].dropna()
            
            if len(feature_data) < 10:
                continue
            
            # Correlation check (only for numeric)
            if pd.api.types.is_numeric_dtype(df[col]):
                aligned_feature = df.loc[feature_data.index, col]
                aligned_target = y.loc[feature_data.index]
                
                corr = aligned_feature.corr(aligned_target)
                
                correlation_results.append({
                    'feature': col,
                    'correlation': round(float(abs(corr)), 4) if not np.isnan(corr) else 0
                })
                
                # Flag high correlation
                if abs(corr) > 0.95:
                    leakage_features.append({
                        'feature': col,
                        'method': 'correlation',
                        'score': round(float(abs(corr)), 4),
                        'risk': 'critical'
                    })
            
            # Single-feature R² check
            r2 = self._single_feature_r2(col, X_train, X_test, y_train, y_test)
            
            if r2 is not None:
                # Near-perfect predictor (R² > 0.9)
                if r2 > 0.9:
                    leakage_features.append({
                        'feature': col,
                        'method': 'single_feature_r2',
                        'score': round(r2, 4),
                        'risk': 'critical'
                    })
                # Suspiciously good (R² > 0.7)
                elif r2 > 0.7:
                    leakage_features.append({
                        'feature': col,
                        'method': 'single_feature_r2',
                        'score': round(r2, 4),
                        'risk': 'high'
                    })
        
        # Summary
        critical_count = sum(1 for x in leakage_features if x['risk'] == 'critical')
        high_count = sum(1 for x in leakage_features if x['risk'] == 'high')
        
        return {
            'exists': True,
            'task_type': 'regression',
            'leakage_features': sorted(leakage_features, key=lambda x: x['score'], reverse=True),
            'correlation_analysis': sorted(correlation_results, key=lambda x: x['correlation'], reverse=True)[:10],
            'summary': {
                'total_features_analyzed': len(feature_cols),
                'critical_leakage': critical_count,
                'high_risk_leakage': high_count,
                'total_suspicious': critical_count + high_count
            }
        }
    
    def _single_feature_auc(self, col, X_train, X_test, y_train, y_test):
        """Train a simple model using only one feature and return AUC."""
        try:
            # Get single feature
            X_train_single = X_train[[col]].copy()
            X_test_single = X_test[[col]].copy()
            
            # Handle missing values
            X_train_single = X_train_single.fillna(X_train_single.mean() if pd.api.types.is_numeric_dtype(X_train_single[col]) else X_train_single.mode().iloc[0])
            X_test_single = X_test_single.fillna(X_test_single.mean() if pd.api.types.is_numeric_dtype(X_test_single[col]) else X_test_single.mode().iloc[0])
            
            # Encode categorical
            if X_train_single[col].dtype == 'object':
                le = LabelEncoder()
                X_train_single[col] = le.fit_transform(X_train_single[col].astype(str))
                X_test_single[col] = le.transform(X_test_single[col].astype(str))
            
            # Train simple model
            model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42, n_jobs=-1)
            model.fit(X_train_single, y_train)
            
            # Predict probabilities
            y_pred_proba = model.predict_proba(X_test_single)
            
            # Calculate AUC (handle binary and multiclass)
            if y_pred_proba.shape[1] == 2:
                auc = roc_auc_score(y_test, y_pred_proba[:, 1])
            else:
                auc = roc_auc_score(y_test, y_pred_proba, multi_class='ovr', average='macro')
            
            return float(auc)
        except:
            return None
    
    def _single_feature_r2(self, col, X_train, X_test, y_train, y_test):
        """Train a simple model using only one feature and return R²."""
        try:
            # Get single feature
            X_train_single = X_train[[col]].copy()
            X_test_single = X_test[[col]].copy()
            
            # Handle missing values
            X_train_single = X_train_single.fillna(X_train_single.mean() if pd.api.types.is_numeric_dtype(X_train_single[col]) else X_train_single.mode().iloc[0])
            X_test_single = X_test_single.fillna(X_test_single.mean() if pd.api.types.is_numeric_dtype(X_test_single[col]) else X_test_single.mode().iloc[0])
            
            # Encode categorical
            if X_train_single[col].dtype == 'object':
                le = LabelEncoder()
                X_train_single[col] = le.fit_transform(X_train_single[col].astype(str))
                X_test_single[col] = le.transform(X_test_single[col].astype(str))
            
            # Train simple model
            model = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42, n_jobs=-1)
            model.fit(X_train_single, y_train)
            
            # Predict and score
            y_pred = model.predict(X_test_single)
            r2 = r2_score(y_test, y_pred)
            
            return float(r2)
        except:
            return None