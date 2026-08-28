import os
import oracledb
from dotenv import load_dotenv

load_dotenv()

ORACLE_DSN = os.getenv("ORACLE_DSN")
ORACLE_USER = os.getenv("ORACLE_USER")
ORACLE_PASSWORD = os.getenv("ORACLE_PASSWORD")

_pool = None

def init_pool(min=1, max=4, increment=1):
    global _pool
    if _pool is None:
        _pool = oracledb.create_pool(user=ORACLE_USER,
                                     password=ORACLE_PASSWORD,
                                     dsn=ORACLE_DSN,
                                     min=min, max=max, increment=increment)
    return _pool

def get_connection():
    if _pool is None:
        init_pool()
    return _pool.acquire()
