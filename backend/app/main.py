from fastapi import FastAPI, HTTPException
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .schemas import ScoreRequest, ScoreResponse
from .db import init_pool, get_connection
from .db_sa import create_tables, engine as sa_engine, get_session
from datetime import datetime
from . import models
from .schemas import SolicitudCreate, PesosCreate
from sqlalchemy import select, func


def model_to_dict(obj):
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


def get_db_session():
    """Obtain a SQLAlchemy session or raise HTTP 503 if DB not configured."""
    try:
        return get_session()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=f"Database not configured: {e}")

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
    # initialize Oracle pool (if env vars provided)
    try:
        init_pool()
    except Exception:
        # in dev environment the DB may not be available; ignore
        pass
    # attempt to create tables from SQLAlchemy models if engine configured
    try:
        if sa_engine is not None:
            create_tables()
    except Exception:
        pass


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


def get_baseline_score_by_ci(ci: str):
    """Lookup the latest bureau rating for `ci` and return normalized baseline score and risk text."""
    if not ci:
        return {"ci": None, "calif": None, "sbase": None, "risk": "ci missing"}
    s = get_db_session()
    try:
        # prefer the latest bureau record by fecha if present
        buro = s.query(models.F_SCO_BURO).filter(models.F_SCO_BURO.ci == ci).order_by(models.F_SCO_BURO.fecha.desc()).first()
        if not buro or not buro.calif:
            return {"ci": ci, "calif": None, "sbase": None, "risk": "Unknown"}
        cal = (buro.calif or '').strip().upper()
        mapping = {
            'A': (1.0, 'Very Low Risk'),
            'B': (0.8, 'Low Risk'),
            'C': (0.6, 'Moderate Risk'),
            'D': (0.4, 'Elevated Risk'),
            'E': (0.2, 'High Risk'),
            'F': (0.0, 'Default / Severe Risk')
        }
        sbase, risk = mapping.get(cal, (None, 'Unknown'))
        return {"ci": ci, "calif": cal, "sbase": sbase, "risk": risk}
    finally:
        s.close()


@app.get('/api/score/baseline')
def api_get_baseline(ci: str):
    """HTTP endpoint: GET /api/score/baseline?ci=... returns baseline score and risk interpretation."""
    return get_baseline_score_by_ci(ci)


@app.get("/demo")
def demo():
    """Simple demo endpoint for frontend testing."""
    return {
        "status": "ok",
        "message": "Demo endpoint reached",
        "time": datetime.utcnow().isoformat() + "Z",
        "sample_factors": {
            "potencial": 5,
            "vocacion": 4,
            "complejidad": 3,
            "riesgo_climatico": 2,
            "perfil_financiero": 1,
        },
    }


@app.get("/demo/db")
def demo_db():
    """Attempt to acquire a connection from the Oracle pool and run a simple query.
    Returns connection status for frontend diagnostics.
    """
    try:
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT 1 FROM dual")
            row = cur.fetchone()
            return {"status": "ok", "db": True, "query_result": row[0]}
        finally:
            try:
                conn.close()
            except Exception:
                pass
    except Exception as e:
        return {"status": "ok", "db": False, "error": str(e)}




@app.get("/api/municipios")
def list_municipios(departamento: str = None):
    s = get_db_session()
    try:
        q = s.query(models.F_SCO_MUNICIPIOS)
        if departamento:
            # case-insensitive match so input like "Chuquisaca" or "chuquisaca" works
            q = q.filter(models.F_SCO_MUNICIPIOS.departamento.ilike(f"%{departamento}%"))
        items = q.all()
        # return only the municipio and cod_municipio fields as requested
        return [{"codmunicipio": i.codmunicipio, "municipio": i.municipio} for i in items]
    finally:
        s.close()


@app.post('/api/pesos')
def create_pesos(payload: PesosCreate):
    s = get_db_session()
    try:
        # create pesos record
        pesos = models.F_SCO_PESOS(
            perfil_financiero=payload.perfil_financiero,
            viabilidad=payload.viabilidad,
            adopcion=payload.adopcion,
            mercado=payload.mercado,
            riesgo_climatico=payload.riesgo_climatico,
            fecha=datetime.utcnow()
        )
        s.add(pesos)
        s.commit()
        s.refresh(pesos)
        return { 'status': 'ok', 'pesos': model_to_dict(pesos) }
    finally:
        s.close()


@app.get("/api/productos")
def list_productos():
    s = get_db_session()
    try:
        items = s.query(models.F_SCO_PRODUCTOS).all()
        return [{"id": i.id, "idproducto": i.idproducto, "descripcion": i.descripcion} for i in items]
    finally:
        s.close()


@app.get("/api/caedec")
def list_caedec():
    s = get_db_session()
    try:
        items = s.query(models.F_SCO_CAEDEC).all()
        return [{"id": i.id, "caedec": i.caedec, "actividad": i.actividad} for i in items]
    finally:
        s.close()

# This is the endpoint that records nuevas solicitudes inserting data into Personas and Solicitudes
@app.post("/api/solicitud")
def create_solicitud(payload: SolicitudCreate):
    s = get_db_session()
    try:
        # find municipio code by name
        cod_muni = None
        if payload.municipio:
            muni = s.query(models.F_SCO_MUNICIPIOS).filter(models.F_SCO_MUNICIPIOS.municipio == payload.municipio).first()
            if muni:
                cod_muni = muni.codmunicipio

        # find product id by descripcion
        prod_id = None
        if payload.producto:
            prod = s.query(models.F_SCO_PRODUCTOS).filter(models.F_SCO_PRODUCTOS.descripcion == payload.producto).first()
            if prod:
                prod_id = prod.id

        # find caedec code: accept either the code or the actividad text
        caedec_code = None
        if payload.caedec:
            # try as code first
            ce = s.query(models.F_SCO_CAEDEC).filter(models.F_SCO_CAEDEC.caedec == payload.caedec).first()
            if not ce:
                ce = s.query(models.F_SCO_CAEDEC).filter(models.F_SCO_CAEDEC.actividad == payload.caedec).first()
            if ce:
                caedec_code = ce.caedec

        # upsert persona by ci
        persona = s.query(models.F_SCO_PERSONAS).filter(models.F_SCO_PERSONAS.ci == payload.ci).first()
        if not persona:
            persona = models.F_SCO_PERSONAS(
                nombre=payload.nombre,
                primer_apellido=payload.primer_apellido,
                segundo_apellido=payload.segundo_apellido,
                fechanac=payload.fechanac,
                genero=payload.genero,
                ci=payload.ci,
                direccion=payload.direccion,
                codmunicipio=cod_muni,
            )
            s.add(persona)
            s.flush()
        else:
            persona.nombre = payload.nombre
            persona.primer_apellido = payload.primer_apellido
            persona.segundo_apellido = payload.segundo_apellido
            persona.fechanac = payload.fechanac
            persona.genero = payload.genero
            persona.direccion = payload.direccion
            persona.codmunicipio = cod_muni
            s.add(persona)

        # create F_SCO_SOLICITUD record
        # convert month name to number if provided
        mes_map = {
            'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
            'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
        }
        messiembra_num = None
        if payload.messiembra:
            # allow numeric or month name
            try:
                messiembra_num = int(payload.messiembra)
            except Exception:
                messiembra_num = mes_map.get(str(payload.messiembra), None)

        monto_val = None
        if payload.monto is not None:
            try:
                monto_val = float(payload.monto)
            except Exception:
                monto_val = None

        solicitud = models.F_SCO_SOLICITUD(
            ci=payload.ci,
            codmunicipio=cod_muni,
            idproducto=prod_id,
            caedec=caedec_code,
            monto=monto_val,
            messiembra=messiembra_num,
            fecha=datetime.utcnow()
        )
        s.add(solicitud)
        s.commit()
        s.refresh(persona)
        s.refresh(solicitud)
        return {"status": "ok", "persona": model_to_dict(persona), "solicitud": model_to_dict(solicitud)}
    finally:
        s.close()


@app.get('/api/solicitudes')
def list_solicitudes(item_id: int = None):
    """List solicitudes with related display fields. Optional query param `item_id` filters by solicitud.id."""
    s = get_db_session()
    try:
        q = s.query(models.F_SCO_SOLICITUD)
        if item_id is not None:
            q = q.filter(models.F_SCO_SOLICITUD.id == item_id)
        items = q.order_by(models.F_SCO_SOLICITUD.fecha.desc()).all()
        results = []
        for it in items:
            municipio = None
            producto = None
            persona = None
            if it.codmunicipio:
                municipio = s.query(models.F_SCO_MUNICIPIOS).filter(models.F_SCO_MUNICIPIOS.codmunicipio == it.codmunicipio).first()
            if it.idproducto:
                producto = s.get(models.F_SCO_PRODUCTOS, it.idproducto)
            if it.ci:
                persona = s.query(models.F_SCO_PERSONAS).filter(models.F_SCO_PERSONAS.ci == it.ci).first()
            results.append({
                'id': it.id,
                'municipio': municipio.municipio if municipio else None,
                'producto': producto.descripcion if producto else None,
                'monto': float(it.monto) if it.monto is not None else None,
                'fecha': it.fecha.isoformat() if it.fecha is not None else None,
                'ci': it.ci,
                'nombre': persona.nombre if persona else None,
                'primer_apellido': persona.primer_apellido if persona else None
            })
        return results
    finally:
        s.close()


@app.post("/score", response_model=ScoreResponse)
def post_score(payload: ScoreRequest):
    # For now compute using equal weights (weights table removed).
    factors = payload.factors.dict()
    weights = {k: 1.0 for k in factors.keys()}
    raw_score, final_score, contributions = compute(factors, weights)
    return {"raw_score": raw_score, "final_score": final_score, "contributions": contributions}


# --- Generic CRUD endpoints for models ---


def register_generic_routes(prefix: str, model):
    """Register simple CRUD endpoints for a model under /api/{prefix}.
    This creates GET list, GET by id, POST create, PUT update, DELETE.
    """


@app.get("/api/{prefix}")
def list_generic(prefix: str):
    # normalize prefix to uppercase to match model keys
    prefix = prefix.upper()
    # map prefix to model
    mapping = {
        'F_SCO_PESOS': models.F_SCO_PESOS,
        'F_SCO_BURO': models.F_SCO_BURO,
        'F_SCO_PERSONAS': models.F_SCO_PERSONAS,
        'F_SCO_SECTOR': models.F_SCO_SECTOR,
        'F_SCO_SCORE': models.F_SCO_SCORE,
        'F_SCO_CAEDEC': models.F_SCO_CAEDEC,
        'F_SCO_MUNICIPIOS': models.F_SCO_MUNICIPIOS,
        'F_SCO_COMPLEJIDADES': models.F_SCO_COMPLEJIDADES,
        'F_SCO_CALPROD': models.F_SCO_CALPROD,
        'F_SCO_CLIMA': models.F_SCO_CLIMA,
    }
    Model = mapping.get(prefix)
    if Model is None:
        return {"error": "unknown prefix"}
    s = get_db_session()
    try:
        items = s.query(Model).limit(200).all()
        return [model_to_dict(i) for i in items]
    finally:
        s.close()


@app.get("/api/{prefix}/{item_id}")
def get_generic(prefix: str, item_id: int):
    prefix = prefix.upper()
    mapping = {
        'F_SCO_PESOS': models.F_SCO_PESOS,
        'F_SCO_BURO': models.F_SCO_BURO,
        'F_SCO_PERSONAS': models.F_SCO_PERSONAS,
        'F_SCO_SECTOR': models.F_SCO_SECTOR,
        'F_SCO_SCORE': models.F_SCO_SCORE,
        'F_SCO_CAEDEC': models.F_SCO_CAEDEC,
        'F_SCO_MUNICIPIOS': models.F_SCO_MUNICIPIOS,
        'F_SCO_COMPLEJIDADES': models.F_SCO_COMPLEJIDADES,
        'F_SCO_CALPROD': models.F_SCO_CALPROD,
        'F_SCO_CLIMA': models.F_SCO_CLIMA,
    }
    Model = mapping.get(prefix)
    if Model is None:
        return {"error": "unknown prefix"}
    s = get_db_session()
    try:
        it = s.get(Model, item_id)
        if not it:
            return {}
        return model_to_dict(it)
    finally:
        s.close()


@app.post("/api/{prefix}")
def create_generic(prefix: str, payload: dict):
    prefix = prefix.upper()
    mapping = {
        'scores': models.Scores,
        'F_SCO_PESOS': models.F_SCO_PESOS,
        'F_SCO_BURO': models.F_SCO_BURO,
        'F_SCO_PERSONAS': models.F_SCO_PERSONAS,
        'F_SCO_SECTOR': models.F_SCO_SECTOR,
        'F_SCO_SCORE': models.F_SCO_SCORE,
        'F_SCO_CAEDEC': models.F_SCO_CAEDEC,
        'F_SCO_MUNICIPIOS': models.F_SCO_MUNICIPIOS,
        'F_SCO_COMPLEJIDADES': models.F_SCO_COMPLEJIDADES,
        'F_SCO_CALPROD': models.F_SCO_CALPROD,
        'F_SCO_CLIMA': models.F_SCO_CLIMA,
    }
    Model = mapping.get(prefix)
    if Model is None:
        return {"error": "unknown prefix"}
    s = get_db_session()
    try:
        obj = Model()
        for k, v in payload.items():
            if hasattr(obj, k):
                setattr(obj, k, v)
        s.add(obj)
        s.commit()
        s.refresh(obj)
        return model_to_dict(obj)
    finally:
        s.close()


@app.put("/api/{prefix}/{item_id}")
def update_generic(prefix: str, item_id: int, payload: dict):
    prefix = prefix.upper()
    mapping = {
        'scores': models.Scores,
        'F_SCO_PESOS': models.F_SCO_PESOS,
        'F_SCO_BURO': models.F_SCO_BURO,
        'F_SCO_PERSONAS': models.F_SCO_PERSONAS,
        'F_SCO_SECTOR': models.F_SCO_SECTOR,
        'F_SCO_SCORE': models.F_SCO_SCORE,
        'F_SCO_CAEDEC': models.F_SCO_CAEDEC,
        'F_SCO_MUNICIPIOS': models.F_SCO_MUNICIPIOS,
        'F_SCO_COMPLEJIDADES': models.F_SCO_COMPLEJIDADES,
        'F_SCO_CALPROD': models.F_SCO_CALPROD,
        'F_SCO_CLIMA': models.F_SCO_CLIMA,
    }
    Model = mapping.get(prefix)
    if Model is None:
        return {"error": "unknown prefix"}
    s = get_db_session()
    try:
        obj = s.get(Model, item_id)
        if not obj:
            return {"error": "not found"}
        for k, v in payload.items():
            if hasattr(obj, k):
                setattr(obj, k, v)
        s.add(obj)
        s.commit()
        return model_to_dict(obj)
    finally:
        s.close()


@app.delete("/api/{prefix}/{item_id}")
def delete_generic(prefix: str, item_id: int):
    prefix = prefix.upper()
    mapping = {
        'scores': models.Scores,
        'F_SCO_PESOS': models.F_SCO_PESOS,
        'F_SCO_BURO': models.F_SCO_BURO,
        'F_SCO_PERSONAS': models.F_SCO_PERSONAS,
        'F_SCO_SECTOR': models.F_SCO_SECTOR,
        'F_SCO_SCORE': models.F_SCO_SCORE,
        'F_SCO_CAEDEC': models.F_SCO_CAEDEC,
        'F_SCO_MUNICIPIOS': models.F_SCO_MUNICIPIOS,
        'F_SCO_COMPLEJIDADES': models.F_SCO_COMPLEJIDADES,
        'F_SCO_CALPROD': models.F_SCO_CALPROD,
        'F_SCO_CLIMA': models.F_SCO_CLIMA,
    }
    Model = mapping.get(prefix)
    if Model is None:
        return {"error": "unknown prefix"}
    s = get_db_session()
    try:
        obj = s.get(Model, item_id)
        if not obj:
            return {"error": "not found"}
        s.delete(obj)
        s.commit()
        return {"status": "deleted"}
    finally:
        s.close()
