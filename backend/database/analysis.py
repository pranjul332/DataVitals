from datetime import datetime
from typing import Optional, Dict, List
from bson import ObjectId


def save_analysis_report(db, auth0_id: str, report_data: Dict) -> Optional[str]:
    """
    Save analysis report for a user
    
    Args:
        db: MongoDB database instance
        auth0_id: User's Auth0 ID
        report_data: Complete analysis report data
        
    Returns:
        Report ID if successful, None otherwise
    """
    try:
        report_doc = {
            'auth0_id': auth0_id,
            'filename': report_data.get('filename'),
            'target_column': report_data.get('target_column'),
            'health_score': report_data.get('health_score'),
            'grade': report_data.get('grade'),
            'verdict': report_data.get('verdict'),
            'top_risks': report_data.get('top_risks', []),
            'recommendations': report_data.get('recommendations', []),
            'summary': report_data.get('summary', {}),
            'component_scores': report_data.get('component_scores', {}),
            'detailed_analysis': report_data.get('detailed_analysis', {}),
            'created_at': datetime.utcnow(),
            'dataset_info': {
                'rows': report_data.get('detailed_analysis', {}).get('profile', {}).get('shape', {}).get('rows', 0),
                'columns': report_data.get('detailed_analysis', {}).get('profile', {}).get('shape', {}).get('columns', 0),
                'size_mb': report_data.get('detailed_analysis', {}).get('profile', {}).get('size_mb', 0)
            }
        }
        
        result = db.reports.insert_one(report_doc)
        
        # Also update user's report count
        db.users.update_one(
            {"auth0_id": auth0_id},
            {
                "$inc": {"total_reports": 1},
                "$set": {"last_analysis": datetime.utcnow()}
            }
        )
        
        return str(result.inserted_id)
        
    except Exception as e:
        print(f"Error saving report: {e}")
        return None


def get_user_reports(db, auth0_id: str, limit: int = 50, skip: int = 0) -> List[Dict]:
    """
    Get all reports for a user
    
    Args:
        db: MongoDB database instance
        auth0_id: User's Auth0 ID
        limit: Maximum number of reports to return
        skip: Number of reports to skip (for pagination)
        
    Returns:
        List of report summaries
    """
    try:
        reports = db.reports.find(
            {"auth0_id": auth0_id}
        ).sort(
            "created_at", -1
        ).skip(skip).limit(limit)
        
        report_list = []
        for report in reports:
            report_list.append({
                'id': str(report['_id']),
                'filename': report.get('filename'),
                'target_column': report.get('target_column'),
                'health_score': report.get('health_score'),
                'grade': report.get('grade'),
                'verdict': report.get('verdict'),
                'created_at': report.get('created_at'),
                'dataset_info': report.get('dataset_info', {})
            })
        
        return report_list
        
    except Exception as e:
        print(f"Error getting reports: {e}")
        return []


def get_report_by_id(db, auth0_id: str, report_id: str) -> Optional[Dict]:
    """
    Get a specific report by ID
    
    Args:
        db: MongoDB database instance
        auth0_id: User's Auth0 ID (for security - ensure user owns report)
        report_id: Report ID
        
    Returns:
        Complete report data if found and owned by user, None otherwise
    """
    try:
        report = db.reports.find_one({
            "_id": ObjectId(report_id),
            "auth0_id": auth0_id
        })
        
        if report:
            report['_id'] = str(report['_id'])
            return report
        
        return None
        
    except Exception as e:
        print(f"Error getting report: {e}")
        return None


def delete_report(db, auth0_id: str, report_id: str) -> bool:
    """
    Delete a report
    
    Args:
        db: MongoDB database instance
        auth0_id: User's Auth0 ID (for security)
        report_id: Report ID to delete
        
    Returns:
        True if deleted, False otherwise
    """
    try:
        result = db.reports.delete_one({
            "_id": ObjectId(report_id),
            "auth0_id": auth0_id
        })
        
        if result.deleted_count > 0:
            # Decrement user's report count
            db.users.update_one(
                {"auth0_id": auth0_id},
                {"$inc": {"total_reports": -1}}
            )
            return True
        
        return False
        
    except Exception as e:
        print(f"Error deleting report: {e}")
        return False


def get_report_stats(db, auth0_id: str) -> Dict:
    """
    Get statistics about user's reports
    
    Args:
        db: MongoDB database instance
        auth0_id: User's Auth0 ID
        
    Returns:
        Dictionary with report statistics
    """
    try:
        total_reports = db.reports.count_documents({"auth0_id": auth0_id})
        
        # Get average health score
        pipeline = [
            {"$match": {"auth0_id": auth0_id}},
            {"$group": {
                "_id": None,
                "avg_score": {"$avg": "$health_score"},
                "min_score": {"$min": "$health_score"},
                "max_score": {"$max": "$health_score"}
            }}
        ]
        
        stats_result = list(db.reports.aggregate(pipeline))
        
        if stats_result:
            stats = stats_result[0]
            return {
                'total_reports': total_reports,
                'average_health_score': round(stats.get('avg_score', 0), 2),
                'min_health_score': round(stats.get('min_score', 0), 2),
                'max_health_score': round(stats.get('max_score', 0), 2)
            }
        
        return {
            'total_reports': total_reports,
            'average_health_score': 0,
            'min_health_score': 0,
            'max_health_score': 0
        }
        
    except Exception as e:
        print(f"Error getting report stats: {e}")
        return {}


def init_reports_indexes(db):
    """Initialize indexes for reports collection"""
    try:
        # Index for user queries
        db.reports.create_index([("auth0_id", 1), ("created_at", -1)])
        
        # Index for report lookups
        db.reports.create_index("_id")
        
        print("✓ Reports indexes created")
        return True
    except Exception as e:
        print(f"✗ Failed to create reports indexes: {e}")
        return False