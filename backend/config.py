import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "kravings-secret-2025")
    DEBUG      = os.getenv("DEBUG", "True").lower() == "true"

    # MySQL connection
    SQLALCHEMY_DATABASE_URI = (
        "mysql+pymysql://"
        + os.getenv("MYSQL_USER", "root")
        + ":"
        + os.getenv("MYSQL_PASSWORD", "vidyogit")
        + "@"
        + os.getenv("MYSQL_HOST", "localhost")
        + ":"
        + os.getenv("MYSQL_PORT", "3306")
        + "/"
        + os.getenv("MYSQL_DB", "kravings")
        + "?charset=utf8mb4"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_POOL_RECYCLE        = 280
    SQLALCHEMY_POOL_PRE_PING       = True

    JWT_SECRET_KEY            = os.getenv("JWT_SECRET_KEY", "kravings-jwt-2025")
    JWT_ACCESS_TOKEN_EXPIRES  = timedelta(hours=12)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    MAIL_SERVER         = os.getenv("MAIL_SERVER",   "smtp.gmail.com")
    MAIL_PORT           = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USE_TLS        = True
    MAIL_USERNAME       = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD       = os.getenv("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_SENDER",   "noreply@kravings.in")

    UPLOAD_FOLDER      = os.path.join(os.path.dirname(__file__), "uploads")
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf"}
