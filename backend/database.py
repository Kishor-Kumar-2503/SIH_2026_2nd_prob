from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# ============================================================
# DATABASE LOCATION
# ============================================================

# Always keep the SQLite database inside the backend folder.
# This prevents multiple database files being created depending
# on where Uvicorn is started from.

BASE_DIR = Path(__file__).resolve().parent

DATABASE_PATH = BASE_DIR / "charter_compass.db"

DATABASE_URL = f"sqlite:///{DATABASE_PATH}"


# ============================================================
# DATABASE ENGINE
# ============================================================

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False
    }
)


# ============================================================
# SESSION
# ============================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ============================================================
# BASE MODEL
# ============================================================

Base = declarative_base()


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()