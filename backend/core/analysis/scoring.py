import numpy as np

class HealthScorer:
    """
    Health score calculator (0-100).
    Simple. Explainable. Defensible.
    
    Inputs: All analysis results from Phase 1-3
    Output: Single score + breakdown
    """
    
    def __init__(self, report):
        self.report = report
        
    def calculate_score(self):
        """Calculate overall health score (0-100)."""
        
        scores = {}
        weights = {}
        
        # === PHASE 1: FOUNDATION (30 points) ===
        
        # 1. Missing value score (10 points)
        missing_score = self._score_missing()
        scores['missing'] = missing_score
        weights['missing'] = 10
        
        # 2. Feature quality score (10 points)
        feature_score = self._score_features()
        scores['features'] = feature_score
        weights['features'] = 10
        
        # 3. Data size score (10 points)
        size_score = self._score_data_size()
        scores['data_size'] = size_score
        weights['data_size'] = 10
        
        # === PHASE 2: STATISTICAL DEPTH (20 points) ===
        
        # 4. Distribution score (10 points)
        distribution_score = self._score_distribution()
        scores['distribution'] = distribution_score
        weights['distribution'] = 10
        
        # 5. Imbalance score (10 points)
        imbalance_score = self._score_imbalance()
        scores['imbalance'] = imbalance_score
        weights['imbalance'] = 10
        
        # === PHASE 3: ML RISK (50 points - CRITICAL) ===
        
        # 6. Leakage score (30 points - MOST CRITICAL)
        leakage_score = self._score_leakage()
        scores['leakage'] = leakage_score
        weights['leakage'] = 30
        
        # 7. Baseline model score (20 points)
        baseline_score = self._score_baseline()
        scores['baseline'] = baseline_score
        weights['baseline'] = 20
        
        # Calculate weighted total
        total_score = 0
        total_weight = 0
        
        for component, score in scores.items():
            if score is not None:
                total_score += score * weights[component]
                total_weight += weights[component]
        
        # Normalize to 0-100
        final_score = (total_score / total_weight * 100) if total_weight > 0 else 0
        
        return {
            'overall_score': round(final_score, 1),
            'component_scores': {
                k: round(v * weights[k], 1) if v is not None else None 
                for k, v in scores.items()
            },
            'component_scores_normalized': {
                k: round(v, 3) if v is not None else None 
                for k, v in scores.items()
            },
            'weights': weights,
            'grade': self._assign_grade(final_score)
        }
    
    def _score_missing(self):
        """Score based on missing values (0-1)."""
        if 'missing' not in self.report:
            return None
        
        missing = self.report['missing']
        
        # Target missing is critical
        if missing.get('target_analysis', {}).get('critical'):
            return 0.0
        
        # Check overall missing percentage
        profile = self.report.get('profile', {})
        overall_missing = profile.get('missing', {}).get('missing_percentage', 0)
        
        # Check high severity columns
        high_missing_cols = missing.get('summary', {}).get('columns_high_missing', 0)
        total_cols = profile.get('shape', {}).get('columns', 1)
        high_missing_ratio = high_missing_cols / total_cols if total_cols > 0 else 0
        
        # Scoring logic
        if overall_missing < 1:
            score = 1.0
        elif overall_missing < 5:
            score = 0.9
        elif overall_missing < 10:
            score = 0.7
        elif overall_missing < 20:
            score = 0.5
        else:
            score = 0.3
        
        # Penalty for high missing columns
        score *= (1 - high_missing_ratio * 0.3)
        
        return max(0, min(1, score))
    
    def _score_features(self):
        """Score based on feature quality (0-1)."""
        if 'features' not in self.report:
            return None
        
        features = self.report['features']
        summary = features.get('summary', {})
        
        total_features = summary.get('total_features', 1)
        quality_issues = summary.get('quality_issues', 0)
        
        # Constant/near-constant features are critical
        constant = len(features.get('constant_features', []))
        near_constant = len(features.get('near_constant_features', []))
        
        if total_features == 0:
            return 0.5
        
        # Score based on issue ratio
        issue_ratio = quality_issues / total_features
        
        if issue_ratio < 0.05:
            score = 1.0
        elif issue_ratio < 0.15:
            score = 0.8
        elif issue_ratio < 0.3:
            score = 0.6
        else:
            score = 0.3
        
        # Heavy penalty for constant features
        if constant > 0:
            score *= 0.5
        
        return max(0, min(1, score))
    
    def _score_data_size(self):
        """Score based on dataset size (0-1)."""
        if 'profile' not in self.report:
            return None
        
        profile = self.report['profile']
        n_rows = profile.get('shape', {}).get('rows', 0)
        n_cols = profile.get('shape', {}).get('columns', 0)
        
        # Check row sufficiency
        if n_rows < 100:
            row_score = 0.3
        elif n_rows < 500:
            row_score = 0.6
        elif n_rows < 1000:
            row_score = 0.8
        else:
            row_score = 1.0
        
        # Check column sanity
        if n_cols < 2:
            col_score = 0.0
        elif n_cols > 1000:
            col_score = 0.7  # Too many features can be problematic
        else:
            col_score = 1.0
        
        return row_score * col_score
    
    def _score_distribution(self):
        """Score based on distribution quality (0-1)."""
        if 'distribution' not in self.report:
            return None
        
        dist = self.report['distribution']
        summary = dist.get('summary', {})
        
        skewed = summary.get('skewed_features', 0)
        outlier_features = summary.get('outlier_features', 0)
        total = summary.get('total_analyzed', 1)
        
        if total == 0:
            return 0.5
        
        skewed_ratio = skewed / total
        outlier_ratio = outlier_features / total
        
        # Scoring
        score = 1.0
        
        # Penalty for skewness
        if skewed_ratio > 0.5:
            score *= 0.7
        elif skewed_ratio > 0.3:
            score *= 0.85
        
        # Penalty for outliers
        if outlier_ratio > 0.3:
            score *= 0.7
        elif outlier_ratio > 0.15:
            score *= 0.85
        
        return max(0, min(1, score))
    
    def _score_imbalance(self):
        """Score based on class imbalance (0-1)."""
        if 'imbalance' not in self.report:
            return None
        
        imbalance = self.report['imbalance']
        
        if not imbalance.get('exists'):
            return 1.0  # No target specified
        
        if imbalance.get('task_type') == 'classification':
            severity = imbalance.get('imbalance', {}).get('severity', 'balanced')
            
            if severity == 'balanced':
                return 1.0
            elif severity == 'mild':
                return 0.9
            elif severity == 'moderate':
                return 0.7
            else:  # severe
                return 0.4
        else:
            # Regression - check skewness
            skew_flag = imbalance.get('distribution', {}).get('skewness_flag', 'normal')
            
            if skew_flag == 'normal':
                return 1.0
            elif skew_flag == 'moderate':
                return 0.8
            else:  # high
                return 0.6
    
    def _score_leakage(self):
        """Score based on leakage detection (0-1). MOST CRITICAL."""
        if 'leakage' not in self.report:
            return None
        
        leakage = self.report['leakage']
        
        if not leakage.get('exists'):
            return 1.0  # No target specified, skip
        
        summary = leakage.get('summary', {})
        critical = summary.get('critical_leakage', 0)
        high_risk = summary.get('high_risk_leakage', 0)
        
        # ANY critical leakage = severe penalty
        if critical > 0:
            return 0.0  # ZERO score
        
        # High risk leakage
        if high_risk > 3:
            return 0.3
        elif high_risk > 1:
            return 0.5
        elif high_risk == 1:
            return 0.7
        else:
            return 1.0
    
    def _score_baseline(self):
        """Score based on baseline model performance (0-1)."""
        if 'baseline' not in self.report:
            return None
        
        baseline = self.report['baseline']
        
        if not baseline.get('exists'):
            return 1.0  # No target specified, skip
        
        overfitting = baseline.get('overfitting', {})
        severity = overfitting.get('severity', 'none')
        
        if severity == 'none':
            return 1.0
        elif severity == 'mild':
            return 0.8
        elif severity == 'moderate':
            return 0.5
        else:  # severe
            return 0.2
    
    def _assign_grade(self, score):
        """Assign letter grade based on score."""
        if score >= 90:
            return 'A'
        elif score >= 80:
            return 'B'
        elif score >= 70:
            return 'C'
        elif score >= 60:
            return 'D'
        else:
            return 'F'