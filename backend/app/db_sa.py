import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

ORACLE_DSN = os.getenv("ORACLE_DSN")
ORACLE_USER = os.getenv("ORACLE_USER")
ORACLE_PASSWORD = os.getenv("ORACLE_PASSWORD")

# SQLAlchemy URL using oracledb dialect
# Example: oracle+oracledb://user:pass@host:port/service_name
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if ORACLE_DSN and ORACLE_USER is not None and ORACLE_PASSWORD is not None:
        DATABASE_URL = f"oracle+oracledb://{ORACLE_USER}:{ORACLE_PASSWORD}@{ORACLE_DSN}"
    else:
        DATABASE_URL = None

engine = None
SessionLocal = None
Base = declarative_base()

if DATABASE_URL:
    # echo can be turned on for SQL logging
    engine = create_engine(DATABASE_URL, echo=False)
    SessionLocal = sessionmaker(bind=engine)


def get_session():
    if SessionLocal is None:
        raise RuntimeError("Database not configured. Set ORACLE_DSN and credentials.")
    return SessionLocal()


def create_tables():
    if engine is None:
        raise RuntimeError("Database not configured. Set ORACLE_DSN and credentials.")
    # create tables from metadata
    Base.metadata.create_all(bind=engine)
    # ensure sequences declared in models are created in Oracle
    try:
        # import models module to scan for Sequence objects
        from . import models as _models
        from sqlalchemy import Sequence
        from sqlalchemy.sql import text
        with engine.connect() as conn:
            for name in dir(_models):
                attr = getattr(_models, name)
                if isinstance(attr, Sequence):
                    seqname = attr.name
                    # create sequence if not exists; ignore errors if it already exists
                    sql = f"CREATE SEQUENCE {seqname} START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE"
                    try:
                        conn.execute(text(sql))
                        conn.commit()
                    except Exception:
                        # ignore (likely sequence exists or insufficient privileges)
                        pass
    except Exception:
        # best-effort only; don't block table creation if sequence creation fails
        pass
