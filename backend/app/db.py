import os
import oracledb
from dotenv import load_dotenv
from urllib.parse import urlparse, parse_qs

load_dotenv()

ORACLE_DSN = os.getenv("ORACLE_DSN")
ORACLE_USER = os.getenv("ORACLE_USER")
ORACLE_PASSWORD = os.getenv("ORACLE_PASSWORD")
DATABASE_URL = os.getenv("DATABASE_URL")

# If explicit ORACLE_* vars are not provided, try to parse DATABASE_URL
if (not ORACLE_USER or not ORACLE_PASSWORD or not ORACLE_DSN) and DATABASE_URL:
    try:
        parsed = urlparse(DATABASE_URL)
        # urlparse will parse scheme like oracle+oracledb
        if parsed.username and not ORACLE_USER:
            ORACLE_USER = parsed.username
        if parsed.password and not ORACLE_PASSWORD:
            ORACLE_PASSWORD = parsed.password
        host = parsed.hostname
        port = parsed.port
        service = None
        # path may contain service name like /SERVICE or be empty
        if parsed.path and parsed.path != "/":
            service = parsed.path.lstrip('/')
        else:
            qs = parse_qs(parsed.query)
            # common query keys: service_name or service
            service = (qs.get('service_name') or qs.get('service') or [None])[0]
        if host and service:
            ORACLE_DSN = f"{host}:{port or 1521}/{service}"
    except Exception:
        # fallback silently; original env vars (if any) will be used
        pass

_pool = None

def init_pool(min=1, max=4, increment=1):
    global _pool
    if _pool is None:
        if not ORACLE_USER or not ORACLE_PASSWORD or not ORACLE_DSN:
            raise RuntimeError("Oracle connection not fully configured: set ORACLE_USER, ORACLE_PASSWORD and ORACLE_DSN or provide DATABASE_URL")
        _pool = oracledb.create_pool(user=ORACLE_USER,
                                     password=ORACLE_PASSWORD,
                                     dsn=ORACLE_DSN,
                                     min=min, max=max, increment=increment)
    return _pool

def get_connection():
    if _pool is None:
        init_pool()
    return _pool.acquire()
