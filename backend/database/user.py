from pymongo import MongoClient
from datetime import datetime
import os
from typing import Optional, Dict

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'datavitals')

client = None
db = None


def init_db():
    """Initialize MongoDB connection"""
    global client, db
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Create indexes
        db.users.create_index("auth0_id", unique=True)
        db.users.create_index("email")
        
        print(f"✓ Connected to MongoDB: {DB_NAME}")
        return db
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        return None


def get_db():
    """Get database instance"""
    global db
    if db is None:
        db = init_db()
    return db


def get_user_by_auth0_id(auth0_id: str) -> Optional[Dict]:
    """Get user by Auth0 ID"""
    try:
        database = get_db()
        user = database.users.find_one({"auth0_id": auth0_id})
        if user:
            user['_id'] = str(user['_id'])
        return user
    except Exception as e:
        print(f"Error getting user: {e}")
        return None


def get_user_by_email(email: str) -> Optional[Dict]:
    """Get user by email"""
    try:
        database = get_db()
        user = database.users.find_one({"email": email})
        if user:
            user['_id'] = str(user['_id'])
        return user
    except Exception as e:
        print(f"Error getting user: {e}")
        return None


def create_or_update_user(user_data: Dict) -> Optional[Dict]:
    """Create or update user in database"""
    try:
        database = get_db()
        auth0_id = user_data.get('auth0_id')
        
        if not auth0_id:
            return None
        
        # Prepare user document
        user_doc = {
            'auth0_id': auth0_id,
            'email': user_data.get('email'),
            'name': user_data.get('name'),
            'picture': user_data.get('picture'),
            'updated_at': datetime.utcnow()
        }
        
        # Check if user exists
        existing_user = database.users.find_one({"auth0_id": auth0_id})
        
        if existing_user:
            # Update existing user
            database.users.update_one(
                {"auth0_id": auth0_id},
                {"$set": user_doc}
            )
            user = database.users.find_one({"auth0_id": auth0_id})
        else:
            # Create new user with report tracking
            user_doc['created_at'] = datetime.utcnow()
            user_doc['datasets'] = []
            user_doc['api_calls'] = 0
            user_doc['subscription_tier'] = 'free'
            user_doc['total_reports'] = 0
            user_doc['last_analysis'] = None
            
            result = database.users.insert_one(user_doc)
            user = database.users.find_one({"_id": result.inserted_id})
        
        if user:
            user['_id'] = str(user['_id'])
        
        return user
    except Exception as e:
        print(f"Error creating/updating user: {e}")
        return None


def update_user_datasets(auth0_id: str, dataset_info: Dict) -> bool:
    """Add dataset to user's datasets list"""
    try:
        database = get_db()
        
        dataset_entry = {
            'filename': dataset_info.get('filename'),
            'upload_date': datetime.utcnow(),
            'rows': dataset_info.get('rows', 0),
            'columns': dataset_info.get('columns', 0),
            'health_score': dataset_info.get('health_score', None)
        }
        
        result = database.users.update_one(
            {"auth0_id": auth0_id},
            {
                "$push": {"datasets": dataset_entry},
                "$inc": {"api_calls": 1}
            }
        )
        
        return result.modified_count > 0
    except Exception as e:
        print(f"Error updating user datasets: {e}")
        return False


def increment_api_calls(auth0_id: str) -> bool:
    """Increment user's API call count"""
    try:
        database = get_db()
        result = database.users.update_one(
            {"auth0_id": auth0_id},
            {"$inc": {"api_calls": 1}}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Error incrementing API calls: {e}")
        return False


def get_user_stats(auth0_id: str) -> Optional[Dict]:
    """Get user statistics"""
    try:
        database = get_db()
        user = database.users.find_one({"auth0_id": auth0_id})
        
        if not user:
            return None
        
        return {
            'total_datasets': len(user.get('datasets', [])),
            'api_calls': user.get('api_calls', 0),
            'subscription_tier': user.get('subscription_tier', 'free'),
            'member_since': user.get('created_at'),
            'total_reports': user.get('total_reports', 0),
            'last_analysis': user.get('last_analysis')
        }
    except Exception as e:
        print(f"Error getting user stats: {e}")
        return None