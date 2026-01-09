from typing import Dict, Any
from datetime import datetime

class ReportGenerator:
    """
    Generates human-readable reports for preprocessing pipelines.
    Works for any task/domain.
    """
    
    @staticmethod
    def generate_full_report(
        profile: Dict[str, Any],
        plan: Dict[str, Any],
        execution_result: Dict[str, Any],
        purpose: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate comprehensive preprocessing report"""
        
        return {
            "metadata": ReportGenerator._generate_metadata(),
            "dataset_summary": ReportGenerator._summarize_dataset(profile),
            "task_info": ReportGenerator._summarize_task(purpose),
            "pipeline_plan": ReportGenerator._summarize_plan(plan),
            "execution_results": ReportGenerator._summarize_execution(execution_result),
            "quality_metrics": ReportGenerator._calculate_quality_metrics(
                profile, 
                execution_result
            ),
            "recommendations": ReportGenerator._generate_recommendations(
                profile,
                plan,
                execution_result
            )
        }
    
    @staticmethod
    def _generate_metadata() -> Dict[str, Any]:
        """Generate report metadata"""
        return {
            "generated_at": datetime.now().isoformat(),
            "system": "Generic LLM-Driven Data Preparation Engine",
            "version": "1.0.0"
        }
    
    @staticmethod
    def _summarize_dataset(profile: Dict[str, Any]) -> Dict[str, Any]:
        """Summarize original dataset"""
        basic = profile.get("basic_info", {})
        quality = profile.get("quality", {})
        
        return {
            "original_shape": f"{basic.get('rows', 0)} rows × {basic.get('columns', 0)} columns",
            "total_cells": basic.get('rows', 0) * basic.get('columns', 0),
            "duplicate_rows": basic.get("duplicates", 0),
            "data_quality": {
                "completeness": f"{quality.get('completeness_percent', 0):.2f}%",
                "duplicates": f"{quality.get('duplicate_percent', 0):.2f}%",
                "columns_with_missing": quality.get("columns_with_missing", 0)
            }
        }
    
    @staticmethod
    def _summarize_task(purpose: Dict[str, Any]) -> Dict[str, Any]:
        """Summarize task configuration"""
        return {
            "task_type": purpose.get("task_type", "Unknown"),
            "description": purpose.get("description", ""),
            "key_constraints": list(purpose.get("constraints", {}).keys())
        }
    
    @staticmethod
    def _summarize_plan(plan: Dict[str, Any]) -> Dict[str, Any]:
        """Summarize preprocessing plan"""
        steps = plan.get("steps", [])
        
        operation_counts = {}
        for step in steps:
            op = step.get("op", "unknown")
            operation_counts[op] = operation_counts.get(op, 0) + 1
        
        return {
            "total_steps": len(steps),
            "operations_used": operation_counts,
            "reasoning": plan.get("reasoning", ""),
            "warnings": plan.get("warnings", [])
        }
    
    @staticmethod
    def _summarize_execution(execution_result: Dict[str, Any]) -> Dict[str, Any]:
        """Summarize execution results"""
        summary = execution_result.get("summary", {})
        execution_log = execution_result.get("execution_log", [])
        
        # Identify problematic steps
        failed_steps = [
            log for log in execution_log 
            if log.get("status") == "failed"
        ]
        
        high_impact_steps = [
            log for log in execution_log 
            if log.get("status") == "success" and 
            abs(log.get("rows_changed", 0)) > summary.get("original_shape", (0, 0))[0] * 0.1
        ]
        
        return {
            "final_shape": f"{summary.get('final_shape', (0, 0))[0]} rows × {summary.get('final_shape', (0, 0))[1]} columns",
            "data_reduction": f"{summary.get('rows_removed_percent', 0):.2f}% rows removed",
            "columns_added": summary.get("columns_added", 0),
            "execution_success": {
                "successful_steps": summary.get("successful_steps", 0),
                "failed_steps": summary.get("failed_steps", 0),
                "skipped_steps": summary.get("skipped_steps", 0)
            },
            "failed_operations": [
                {"step": step["step"], "operation": step["operation"], "error": step.get("error")}
                for step in failed_steps
            ],
            "high_impact_operations": [
                {"step": step["step"], "operation": step["operation"], "rows_changed": step.get("rows_changed")}
                for step in high_impact_steps
            ]
        }
    
    @staticmethod
    def _calculate_quality_metrics(
        profile: Dict[str, Any],
        execution_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate data quality improvements"""
        original_quality = profile.get("quality", {})
        summary = execution_result.get("summary", {})
        
        original_rows = summary.get("original_shape", (0, 0))[0]
        final_rows = summary.get("final_shape", (0, 0))[0]
        
        # Calculate improvements
        duplicate_reduction = original_quality.get("duplicate_rows", 0)
        
        return {
            "data_retained": f"{(final_rows / original_rows * 100):.2f}%" if original_rows > 0 else "0%",
            "duplicates_removed": duplicate_reduction,
            "quality_improvement": "Calculated based on execution results"
        }
    
    @staticmethod
    def _generate_recommendations(
        profile: Dict[str, Any],
        plan: Dict[str, Any],
        execution_result: Dict[str, Any]
    ) -> list:
        """Generate recommendations for next steps"""
        recommendations = []
        
        summary = execution_result.get("summary", {})
        execution_log = execution_result.get("execution_log", [])
        
        # Check for failed steps
        failed_steps = [log for log in execution_log if log.get("status") == "failed"]
        if failed_steps:
            recommendations.append({
                "type": "warning",
                "message": f"{len(failed_steps)} step(s) failed during execution. Review failed operations."
            })
        
        # Check for high data loss
        rows_removed_percent = summary.get("rows_removed_percent", 0)
        if rows_removed_percent > 30:
            recommendations.append({
                "type": "warning",
                "message": f"High data loss detected ({rows_removed_percent:.1f}% rows removed). Consider reviewing outlier removal and filtering steps."
            })
        
        # Check for no changes
        if summary.get("rows_removed", 0) == 0 and summary.get("columns_added", 0) == 0:
            recommendations.append({
                "type": "info",
                "message": "No significant changes were made to the dataset. Consider reviewing the preprocessing plan."
            })
        
        # General recommendations
        recommendations.append({
            "type": "success",
            "message": f"Dataset is now ready for {plan.get('purpose', {}).get('task_type', 'ML')} task."
        })
        
        return recommendations
    
    @staticmethod
    def generate_text_report(report: Dict[str, Any]) -> str:
        """Generate human-readable text report"""
        lines = []
        
        lines.append("=" * 60)
        lines.append("DATA PREPROCESSING REPORT")
        lines.append("=" * 60)
        lines.append("")
        
        # Dataset summary
        ds = report.get("dataset_summary", {})
        lines.append("ORIGINAL DATASET")
        lines.append(f"  Shape: {ds.get('original_shape', 'Unknown')}")
        lines.append(f"  Duplicates: {ds.get('duplicate_rows', 0)}")
        lines.append("")
        
        # Task info
        task = report.get("task_info", {})
        lines.append(f"TASK: {task.get('task_type', 'Unknown').upper()}")
        lines.append(f"  {task.get('description', '')}")
        lines.append("")
        
        # Pipeline
        plan = report.get("pipeline_plan", {})
        lines.append(f"PREPROCESSING PIPELINE ({plan.get('total_steps', 0)} steps)")
        for op, count in plan.get("operations_used", {}).items():
            lines.append(f"  - {op}: {count}x")
        lines.append("")
        
        # Results
        results = report.get("execution_results", {})
        lines.append("EXECUTION RESULTS")
        lines.append(f"  Final shape: {results.get('final_shape', 'Unknown')}")
        lines.append(f"  Data reduction: {results.get('data_reduction', 'Unknown')}")
        exec_success = results.get("execution_success", {})
        lines.append(f"  Successful steps: {exec_success.get('successful_steps', 0)}")
        lines.append(f"  Failed steps: {exec_success.get('failed_steps', 0)}")
        lines.append("")
        
        # Recommendations
        lines.append("RECOMMENDATIONS")
        for rec in report.get("recommendations", []):
            lines.append(f"  [{rec.get('type', 'info').upper()}] {rec.get('message', '')}")
        
        lines.append("")
        lines.append("=" * 60)
        
        return "\n".join(lines)