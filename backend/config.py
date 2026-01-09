import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""

    # API Settings
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    MODEL_NAME = "gpt-4.1-mini"   # CHEAP + RELIABLE
    MAX_TOKENS = 1024             # you don't need 4096 for JSON

    # File Upload Settings
    UPLOAD_FOLDER = "uploads"
    ALLOWED_EXTENSIONS = {"csv"}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

    # Processing Settings
    MAX_ROWS = 1_000_000
    SAMPLE_SIZE = 10_000

    # Logging
    LOG_LEVEL = "INFO"

    @staticmethod
    def allowed_file(filename):
        return "." in filename and \
               filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS
