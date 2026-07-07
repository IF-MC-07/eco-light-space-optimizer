"""
app/db.py — SQLAlchemy Base and Session factory.

This module provides Base and SessionLocal for any code that uses the
SQLAlchemy ORM pattern.  The actual energy pipeline uses psycopg2 directly
via zona_loader.get_db_connection(), but this module exists so that
`from app.db import SessionLocal` and `from app.db import Base` do not
raise ImportError and crash the application.
"""

import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Build the database URL from environment variables.
# The primary path uses SUPABASE_DATABASE_URL (same as zona_loader).
# ---------------------------------------------------------------------------
DATABASE_URL = os.getenv("SUPABASE_DATABASE_URL")

if not DATABASE_URL:
    # Fallback: build a local PostgreSQL URL from individual vars
    DB_USER     = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "root")
    DB_HOST     = os.getenv("DB_HOST", "localhost")
    DB_PORT     = os.getenv("DB_PORT", "5432")
    DB_NAME     = os.getenv("DB_NAME", "ecolight")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    logger.warning(
        "⚠️ SUPABASE_DATABASE_URL not set. Falling back to local DB URL. "
        "Set SUPABASE_DATABASE_URL in .env for Supabase connectivity."
    )

# ---------------------------------------------------------------------------
# SQLAlchemy engine & session
# ---------------------------------------------------------------------------
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,          # Detect stale connections before use
    pool_size=5,
    max_overflow=10,
    connect_args={"sslmode": "require"} if "supabase" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    FastAPI/dependency-injection style DB session generator.
    Usage:
        from app.db import get_db
        db = next(get_db())
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
