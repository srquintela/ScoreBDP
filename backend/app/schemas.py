from pydantic import BaseModel
from typing import Dict

class Factors(BaseModel):
    potencial: float
    vocacion: float
    complejidad: float
    riesgo_climatico: float
    perfil_financiero: float

class ScoreRequest(BaseModel):
    user_id: str
    factors: Factors

class WeightsRequest(BaseModel):
    user_id: str
    weights: Factors

class ScoreResponse(BaseModel):
    raw_score: float
    final_score: float
    contributions: Dict[str, float]
