from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="python-api")


@app.get("/health")
def health():
    return {"status": "ok"}


class HelloResp(BaseModel):
    message: str


@app.get("/api/hello", response_model=HelloResp)
def hello():
    return {"message": "Hello from FastAPI"}
