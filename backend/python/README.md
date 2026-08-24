Python FastAPI service

Quick start:

1. Create a virtualenv and install dependencies:

   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt

2. Run locally:

   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

3. Docker:

   docker build -t python-api ./backend/python
   docker run -p 8000:8000 python-api
