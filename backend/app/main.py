from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .schemas import ScoreRequest, WeightsRequest, ScoreResponse
from .db import init_pool
from .crud import get_weights_by_user, save_weights_for_user, save_score_record

load_dotenv()

app = FastAPI(title="ScoreBDP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_pool()

def compute(raw_factors: dict, weights: dict):
    contributions = {}
    raw_score = 0.0
    for k, v in raw_factors.items():
        w = float(weights.get(k, 0.0))
        contributions[k] = v * w
        raw_score += contributions[k]
    total_weight = sum(float(weights.get(k, 0.0)) for k in weights)
    final_score = raw_score / total_weight if total_weight > 0 else raw_score
    return raw_score, final_score, contributions

@app.post("/weights")
def post_weights(payload: WeightsRequest):
    save_weights_for_user(payload.user_id, payload.weights.dict())
    return {"status": "success", "message": "Weights saved"}

@app.post("/score", response_model=ScoreResponse)
def post_score(payload: ScoreRequest):
    weights = get_weights_by_user(payload.user_id)
    if weights is None:
        weights = {k: 1.0 for k in payload.factors.dict().keys()}
    raw_score, final_score, contributions = compute(payload.factors.dict(), weights)
    try:
        save_score_record(payload.user_id, raw_score, final_score, contributions)
    except Exception:
        pass
    return {"raw_score": raw_score, "final_score": final_score, "contributions": contributions}
