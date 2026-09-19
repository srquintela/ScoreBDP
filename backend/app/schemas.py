from pydantic import BaseModel
from typing import Dict, Optional
from pydantic import BaseModel
from datetime import date


class Factors(BaseModel):
    potencial: float
    vocacion: float
    complejidad: float
    riesgo_climatico: float
    perfil_financiero: float


class ScoreRequest(BaseModel):
    user_id: str
    factors: Factors


class ScoreResponse(BaseModel):
    raw_score: float
    final_score: float
    contributions: Dict[str, float]


class SolicitudCreate(BaseModel):
    ci: str
    nombre: str
    primer_apellido: str
    segundo_apellido: Optional[str] = None
    fechanac: Optional[date] = None
    genero: Optional[str] = None
    direccion: Optional[str] = None
    departamento: Optional[str] = None
    municipio: Optional[str] = None
    producto: Optional[str] = None  # descripcion of product
    caedec: Optional[str] = None    # actividad text
    fecha_siembra: Optional[date] = None
    monto: Optional[float] = None
    messiembra: Optional[str] = None


class PesosCreate(BaseModel):
    perfil_financiero: Optional[float] = None
    viabilidad: Optional[float] = None
    adopcion: Optional[float] = None
    mercado: Optional[float] = None
    riesgo_climatico: Optional[float] = None
