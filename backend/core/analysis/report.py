class ReportGenerator:
    """
    Final report generator.
    Synthesizes all analyses into clear verdict + top risks.
    """
    
    def __init__(self, report, health_score):
        self.report = report
        self.health_score = health_score
        
    def generate(self):
        """Generate final health report with verdict and recommendations."""
        
        overall_score = self.health_score.get('overall_score', 0)
        grade = self.health_score.get('grade', 'F')
        
        # Determine verdict
        verdict = self._determine_verdict(overall_score)
        
        # Extract top risks
        risks = self._identify_top_risks()
        
        # Generate recommendations
        recommendations = self._generate_recommendations(risks)
        
        # Summary stats
        summary = self._generate_summary()
        
        return {
            'verdict': verdict,
            'health_score': overall_score,
            'grade': grade,
            'top_risks': risks[:3],  # Top 3 only
            'recommendations': recommendations,
            'summary': summary,
            'component_breakdown': self.health_score.get('component_scores', {})
        }
    
    def _determine_verdict(self, score):
        """Determine overall verdict based on score."""
        if score >= 85:
            return {
                'status': 'EXCELLENT',
                'safe_to_train': True,
                'message': 'Dataset is in excellent health. Safe to proceed with model training.',
                'color': 'green'
            }
        elif score >= 70:
            return {
                'status': 'GOOD',
                'safe_to_train': True,
                'message': 'Dataset is in good health with minor issues. Safe to train after reviewing warnings.',
                'color': 'blue'
            }
        elif score >= 50:
            return {
                'status': 'FAIR',
                'safe_to_train': False,
                'message': 'Dataset has significant issues. Address critical problems before training.',
                'color': 'orange'
            }
        else:
            return {
                'status': 'POOR',
                'safe_to_train': False,
                'message': 'Dataset is NOT safe for training. Critical issues detected.',
                'color': 'red'
            }
    
    def _identify_top_risks(self):
        """Identify and rank all risks across all analyses."""
        risks = []
        
        # === CRITICAL RISKS (Priority 1) ===
        
        # 1. Data Leakage (HIGHEST PRIORITY)
        if self.report.get('leakage', {}).get('exists'):
            leakage = self.report['leakage']
            critical_leakage = leakage.get('summary', {}).get('critical_leakage', 0)
            high_risk_leakage = leakage.get('summary', {}).get('high_risk_leakage', 0)
            
            if critical_leakage > 0:
                leakage_features = leakage.get('leakage_features', [])[:3]
                feature_names = [f['feature'] for f in leakage_features if f['risk'] == 'critical']
                
                risks.append({
                    'type': 'CRITICAL_LEAKAGE',
                    'severity': 'critical',
                    'priority': 1,
                    'title': 'Critical Data Leakage Detected',
                    'description': f'{critical_leakage} feature(s) show near-perfect prediction ability: {", ".join(feature_names[:3])}',
                    'impact': 'Model will appear perfect but fail in production',
                    'action': 'Remove or investigate these features immediately'
                })
            elif high_risk_leakage > 0:
                risks.append({
                    'type': 'HIGH_RISK_LEAKAGE',
                    'severity': 'high',
                    'priority': 2,
                    'title': 'Suspicious Features Detected',
                    'description': f'{high_risk_leakage} feature(s) show unusually high predictive power',
                    'impact': 'Potential leakage or data quality issues',
                    'action': 'Investigate feature engineering and data collection process'
                })
        
        # 2. Target Missing Values
        if self.report.get('missing', {}).get('target_analysis', {}).get('critical'):
            target_analysis = self.report['missing']['target_analysis']
            missing_pct = target_analysis.get('missing_percentage', 0)
            
            risks.append({
                'type': 'TARGET_MISSING',
                'severity': 'critical',
                'priority': 1,
                'title': 'Target Column Has Missing Values',
                'description': f'{missing_pct}% of target values are missing',
                'impact': 'Cannot train model with missing targets',
                'action': 'Remove rows with missing targets or obtain correct labels'
            })
        
        # 3. Severe Overfitting
        if self.report.get('baseline', {}).get('exists'):
            baseline = self.report['baseline']
            overfitting = baseline.get('overfitting', {})
            
            if overfitting.get('severity') == 'severe':
                gap = overfitting.get('gap', 0)
                
                risks.append({
                    'type': 'SEVERE_OVERFITTING',
                    'severity': 'critical',
                    'priority': 1,
                    'title': 'Severe Overfitting Detected',
                    'description': f'Train-test performance gap: {gap:.2%}',
                    'impact': 'Model will not generalize to new data',
                    'action': 'Increase data size, reduce model complexity, or add regularization'
                })
        
        # === HIGH PRIORITY RISKS (Priority 2) ===
        
        # 4. Constant Features
        constant_features = self.report.get('features', {}).get('constant_features', [])
        if len(constant_features) > 0:
            feature_names = [f['column'] for f in constant_features]
            
            risks.append({
                'type': 'CONSTANT_FEATURES',
                'severity': 'high',
                'priority': 2,
                'title': 'Constant Features Detected',
                'description': f'{len(constant_features)} feature(s) have only one value: {", ".join(feature_names[:3])}',
                'impact': 'Zero information content, waste of resources',
                'action': 'Remove these features'
            })
        
        # 5. High Missing Data
        if self.report.get('profile', {}).get('missing', {}).get('missing_percentage', 0) > 20:
            missing_pct = self.report['profile']['missing']['missing_percentage']
            
            risks.append({
                'type': 'HIGH_MISSING',
                'severity': 'high',
                'priority': 2,
                'title': 'High Missing Data Percentage',
                'description': f'{missing_pct}% of all values are missing',
                'impact': 'Imputation may introduce bias, reduced effective sample size',
                'action': 'Investigate data collection process or consider dropping high-missing columns'
            })
        
        # 6. Severe Class Imbalance
        if self.report.get('imbalance', {}).get('exists'):
            imbalance = self.report['imbalance']
            if imbalance.get('task_type') == 'classification':
                severity = imbalance.get('imbalance', {}).get('severity')
                
                if severity == 'severe':
                    ratio = imbalance.get('imbalance', {}).get('ratio', 0)
                    minority_pct = imbalance.get('imbalance', {}).get('minority_percentage', 0)
                    
                    risks.append({
                        'type': 'SEVERE_IMBALANCE',
                        'severity': 'high',
                        'priority': 2,
                        'title': 'Severe Class Imbalance',
                        'description': f'Class ratio: {ratio:.1f}:1, minority class: {minority_pct}%',
                        'impact': 'Model may ignore minority class, poor recall',
                        'action': 'Consider resampling, class weights, or collecting more minority samples'
                    })
        
        # === MEDIUM PRIORITY RISKS (Priority 3) ===
        
        # 7. Small Dataset
        n_rows = self.report.get('profile', {}).get('shape', {}).get('rows', 0)
        if n_rows < 500:
            risks.append({
                'type': 'SMALL_DATASET',
                'severity': 'medium',
                'priority': 3,
                'title': 'Small Dataset Size',
                'description': f'Only {n_rows} rows available',
                'impact': 'High variance, poor generalization',
                'action': 'Collect more data or use simpler models'
            })
        
        # 8. High Outlier Ratio
        outlier_features = self.report.get('distribution', {}).get('summary', {}).get('outlier_features', 0)
        total_features = self.report.get('distribution', {}).get('summary', {}).get('total_analyzed', 1)
        
        if outlier_features / total_features > 0.3 if total_features > 0 else False:
            risks.append({
                'type': 'HIGH_OUTLIERS',
                'severity': 'medium',
                'priority': 3,
                'title': 'High Outlier Ratio',
                'description': f'{outlier_features} features have significant outliers (>5%)',
                'impact': 'May skew model predictions',
                'action': 'Review outliers for data errors or consider robust scaling'
            })
        
        # 9. Moderate Overfitting
        if self.report.get('baseline', {}).get('exists'):
            baseline = self.report['baseline']
            overfitting = baseline.get('overfitting', {})
            
            if overfitting.get('severity') == 'moderate':
                risks.append({
                    'type': 'MODERATE_OVERFITTING',
                    'severity': 'medium',
                    'priority': 3,
                    'title': 'Moderate Overfitting',
                    'description': 'Noticeable train-test performance gap',
                    'impact': 'Model may not generalize well',
                    'action': 'Add regularization or increase data size'
                })
        
        # Sort by priority, then severity
        severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        risks.sort(key=lambda x: (x['priority'], severity_order.get(x['severity'], 99)))
        
        return risks
    
    def _generate_recommendations(self, risks):
        """Generate actionable recommendations based on risks."""
        recommendations = []
        
        # Group by action type
        if any(r['type'].endswith('LEAKAGE') for r in risks[:3]):
            recommendations.append({
                'category': 'Data Leakage',
                'priority': 'critical',
                'actions': [
                    'Audit feature engineering pipeline for temporal leakage',
                    'Verify features do not contain post-event information',
                    'Review data collection timestamps',
                    'Remove or isolate suspicious features'
                ]
            })
        
        if any(r['type'] in ['HIGH_MISSING', 'TARGET_MISSING'] for r in risks[:3]):
            recommendations.append({
                'category': 'Missing Data',
                'priority': 'high',
                'actions': [
                    'Investigate root cause of missing values',
                    'Consider dropping columns with >30% missing',
                    'Use appropriate imputation strategies',
                    'Document missing data patterns'
                ]
            })
        
        if any(r['type'] in ['SEVERE_OVERFITTING', 'MODERATE_OVERFITTING'] for r in risks[:3]):
            recommendations.append({
                'category': 'Model Generalization',
                'priority': 'high',
                'actions': [
                    'Collect more training data',
                    'Use cross-validation for model selection',
                    'Add regularization (L1/L2)',
                    'Reduce model complexity'
                ]
            })
        
        if any(r['type'] == 'SEVERE_IMBALANCE' for r in risks[:3]):
            recommendations.append({
                'category': 'Class Imbalance',
                'priority': 'medium',
                'actions': [
                    'Use stratified sampling for train/test split',
                    'Apply class weights in model training',
                    'Consider SMOTE or other resampling techniques',
                    'Use appropriate evaluation metrics (F1, ROC-AUC)'
                ]
            })
        
        return recommendations
    
    def _generate_summary(self):
        """Generate high-level summary statistics."""
        profile = self.report.get('profile', {})
        metadata = self.report.get('metadata', {})
        
        return {
            'dataset_shape': profile.get('shape', {}),
            'memory_usage': profile.get('memory', {}),
            'missing_percentage': profile.get('missing', {}).get('missing_percentage', 0),
            'duplicate_percentage': profile.get('duplicates', {}).get('percentage', 0),
            'has_target': metadata.get('target_column') is not None,
            'analysis_phase': metadata.get('phase', 'complete')
        }