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
import math


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



def get_baseline_score_by_ci(ci: str):
    """Lookup the latest bureau rating for `ci` and return the normalized baseline score (sbase).

    Returns a float (0.0..1.0) or None when not available.
    """
    if not ci:
        return None
    s = get_db_session()
    try:
        # prefer the latest bureau record by fecha if present
        buro = s.query(models.F_SCO_BURO).filter(models.F_SCO_BURO.ci == ci).order_by(models.F_SCO_BURO.fecha.desc()).first()
        if not buro or not buro.calif:
            return None
        cal = (buro.calif or '').strip().upper()
        mapping = {
            'A': 1.0,
            'B': 0.8,
            'C': 0.6,
            'D': 0.4,
            'E': 0.2,
            'F': 0.0,
        }
        return mapping.get(cal)
    finally:
        s.close()


@app.post('/api/score/generate/{solicitud_id}')
def generate_score(solicitud_id: int):
    """Generate and persist a score for the given solicitud id.

    The function reads the solicitud, computes component scores using the
    helper functions and the latest pesos, stores a new row in F_SCO_SCORE
    and returns the created score record.
    """
    s = get_db_session()
    try:
        solicitud = s.get(models.F_SCO_SOLICITUD, solicitud_id)
        if not solicitud:
            raise HTTPException(status_code=404, detail="solicitud not found")

        # baseline (financial profile) - helper now returns sbase (float) or None
        score_fin = get_baseline_score_by_ci(solicitud.ci) if solicitud.ci else None

        # product description for product-based helpers
        prod_name = None
        if solicitud.idproducto:
            prod = s.get(models.F_SCO_PRODUCTOS, solicitud.idproducto)
            if prod:
                prod_name = prod.descripcion

        # complejidad (viabilidad)
        score_via = get_complejidad_score_by_codmunicipio_producto(solicitud.codmunicipio, prod_name)

        # sector (adopcion) -> helper returns dict with 'sector_score'
        sector_res = get_sector_score_by_codmunicipio_producto(solicitud.codmunicipio, prod_name)
        score_adop = None
        if isinstance(sector_res, dict):
            score_adop = sector_res.get('sector_score')

        # vocacion (mercado)
        score_merc = get_vocacion_score_by_codmunicipio_producto(solicitud.codmunicipio, prod_name)

        # clima
        score_clima = get_clima_by_codmunicipio_mes(solicitud.codmunicipio, solicitud.messiembra)

        # latest pesos
        pesos = s.query(models.F_SCO_PESOS).order_by(models.F_SCO_PESOS.fecha.desc()).first()
        if pesos:
            pf = float(pesos.perfil_financiero or 0.0) / 100.0
            viab_w = float(pesos.viabilidad or 0.0) / 100.0
            adop_w = float(pesos.adopcion or 0.0) / 100.0
            merc_w = float(pesos.mercado or 0.0) / 100.0
            riesgo_w = float(pesos.riesgo_climatico or 0.0) / 100.0
        else:
            # sensible defaults if no pesos configured
            pf = viab_w = adop_w = merc_w = riesgo_w = 0.2

        # coerce component values to floats with safe defaults
        sf = float(score_fin) if score_fin is not None else 0.0
        sv = float(score_via) if score_via is not None else 0.0
        sa = float(score_adop) if score_adop is not None else 0.0
        sm = float(score_merc) if score_merc is not None else 0.0
        sc = float(score_clima) if score_clima is not None else 0.0

        # compute final score per formula (weights treated as fractions)
        try:
            final_score = 1000.0 * ((pf * sf) + (viab_w * sv) + (adop_w * sa) + (merc_w * sm) + (riesgo_w * (1.0 - sc)))
        except Exception:
            final_score = None

        # derive letter grade from normalized score (0..1)
        letter = None
        if final_score is not None:
            norm = final_score / 1000.0
            if norm >= 0.9:
                letter = 'A'
            elif norm >= 0.7:
                letter = 'B'
            elif norm >= 0.5:
                letter = 'C'
            elif norm >= 0.3:
                letter = 'D'
            elif norm >= 0.1:
                letter = 'E'
            else:
                letter = 'F'

        score_obj = models.F_SCO_SCORE(
            idsolicitud=solicitud.id,
            scorefinanciero=sf,
            scoreviabilidad=sv,
            scoreadopcion=sa,
            scoremercado=sm,
            scoreclima=sc,
            score=final_score,
            scoreletra=letter,
            fecha=datetime.utcnow()
        )

        s.add(score_obj)
        s.commit()
        s.refresh(score_obj)
        # include the pesos used (original values as stored, or defaults)
        pesos_values = None
        if pesos:
            pesos_values = {
                'perfil_financiero': float(pesos.perfil_financiero or 0.0),
                'viabilidad': float(pesos.viabilidad or 0.0),
                'adopcion': float(pesos.adopcion or 0.0),
                'mercado': float(pesos.mercado or 0.0),
                'riesgo_climatico': float(pesos.riesgo_climatico or 0.0),
            }
        else:
            pesos_values = {
                'perfil_financiero': 20.0,
                'viabilidad': 20.0,
                'adopcion': 20.0,
                'mercado': 20.0,
                'riesgo_climatico': 20.0,
            }
        return { 'status': 'ok', 'score': model_to_dict(score_obj), 'pesos': pesos_values }
    finally:
        s.close()


@app.get('/api/score/baseline')
def api_get_baseline(ci: str):
    """HTTP endpoint: GET /api/score/baseline?ci=... returns baseline score and risk interpretation."""
    return get_baseline_score_by_ci(ci)


def get_sector_score_by_codmunicipio_producto(codmunicipio: str, producto: str):
    """Compute a normalized sector score for given codmunicipio and producto.

    Steps:
    - query F_SCO_SECTOR rows matching codmunicipio and producto
    - parse numeric `valor` values and compute the mean
    - apply normalization: sector_score = ((log10(mean_val) + 3.1549) / 12.9723)
    Returns dict with inputs, mean_val, sector_score (or None if unavailable).
    """
    if not codmunicipio or not producto:
        return {"codmunicipio": codmunicipio, "producto": producto, "mean_val": None, "sector_score": None}
    s = get_db_session()
    try:
        rows = s.query(models.F_SCO_SECTOR).filter(
            models.F_SCO_SECTOR.codmunicipio == codmunicipio,
            models.F_SCO_SECTOR.producto == producto
        ).all()
        vals = []
        for r in rows:
            raw = r.valor
            if raw is None:
                continue
            try:
                # allow commas as decimal separators
                txt = str(raw).strip().replace(',', '.')
                v = float(txt)
                if v > 0:
                    vals.append(v)
            except Exception:
                continue
        if not vals:
            return {"codmunicipio": codmunicipio, "producto": producto, "mean_val": None, "sector_score": None}
        mean_val = sum(vals) / len(vals)
        try:
            sector_score = ((math.log10(mean_val) + 3.1549) / 12.9723)
        except Exception:
            sector_score = None
        return {"codmunicipio": codmunicipio, "producto": producto, "mean_val": mean_val, "sector_score": sector_score}
    finally:
        s.close()


@app.get('/api/score/sector')
def api_get_sector_score(codmunicipio: str, producto: str):
    """HTTP endpoint: GET /api/score/sector?codmunicipio=...&producto=..."""
    return get_sector_score_by_codmunicipio_producto(codmunicipio, producto)


def get_vocacion_score_by_codmunicipio_producto(codmunicipio: str, producto: str):
    """Return the normalized vocacion score (float) for the given codmunicipio and producto.

    The function reads `vcr` values from `F_SCO_COMPLEJIDADES`, computes the mean
    and applies the normalization: vocacion_score = mean_vcr / (mean_vcr + 1).
    Returns a float or None when unavailable.
    """
    if not codmunicipio or not producto:
        return None
    s = get_db_session()
    try:
        rows = s.query(models.F_SCO_COMPLEJIDADES).filter(
            models.F_SCO_COMPLEJIDADES.codmunicipio == codmunicipio,
            models.F_SCO_COMPLEJIDADES.producto == producto
        ).all()
        vals = []
        for r in rows:
            raw = r.vcr
            if raw is None:
                continue
            try:
                v = float(raw)
                vals.append(v)
            except Exception:
                continue
        if not vals:
            return None
        mean_vcr = sum(vals) / len(vals)
        try:
            vocacion_score = mean_vcr / (mean_vcr + 1)
        except Exception:
            vocacion_score = None
        return vocacion_score
    finally:
        s.close()


@app.get('/api/score/vocacion')
def api_get_vocacion_score(codmunicipio: str, producto: str):
    """HTTP endpoint: GET /api/score/vocacion?codmunicipio=...&producto=..."""
    val = get_vocacion_score_by_codmunicipio_producto(codmunicipio, producto)
    return {"codmunicipio": codmunicipio, "producto": producto, "vocacion_score": val}


def get_complejidad_score_by_codmunicipio_producto(codmunicipio: str, producto: str):
    """Return the normalized complejidad score (float) for the given codmunicipio and producto.

    Reads `bs` values from `F_SCO_COMPLEJIDADES`, computes the mean and applies:
      complejidad_score = log10(1 + mean_bs) / 7.7482
    Returns a float or None when unavailable.
    """
    if not codmunicipio or not producto:
        return None
    s = get_db_session()
    try:
        rows = s.query(models.F_SCO_COMPLEJIDADES).filter(
            models.F_SCO_COMPLEJIDADES.codmunicipio == codmunicipio,
            models.F_SCO_COMPLEJIDADES.producto == producto
        ).all()
        vals = []
        for r in rows:
            raw = r.bs
            if raw is None:
                continue
            try:
                v = float(raw)
                vals.append(v)
            except Exception:
                continue
        if not vals:
            return None
        mean_bs = sum(vals) / len(vals)
        try:
            # ensure argument to log10 is positive
            arg = 1.0 + mean_bs
            if arg <= 0:
                return None
            complejidad_score = math.log10(arg) / 7.7482
        except Exception:
            complejidad_score = None
        return complejidad_score
    finally:
        s.close()


@app.get('/api/score/complejidad')
def api_get_complejidad_score(codmunicipio: str, producto: str):
    """HTTP endpoint: GET /api/score/complejidad?codmunicipio=...&producto=..."""
    val = get_complejidad_score_by_codmunicipio_producto(codmunicipio, producto)
    return {"codmunicipio": codmunicipio, "producto": producto, "complejidad_score": val}


def get_clima_by_codmunicipio_mes(codmunicipio: str, mes: int):
    """Return a clima score for a municipality and month.

    Reads matching rows from `F_SCO_CLIMA`, averages the `probhelada`, `probinundacion`,
    and `probsequia` fields (expected as percentages 0..100) and computes:
      clima_score = 1 - ((1 - p_h) * (1 - p_i) * (1 - p_s))
    where p_* = prob* * 0.01.
    Returns a float in [0,1] or None when unavailable.
    """
    if not codmunicipio or mes is None:
        return None
    s = get_db_session()
    try:
        rows = s.query(models.F_SCO_CLIMA).filter(
            models.F_SCO_CLIMA.codmunicipio == codmunicipio,
            models.F_SCO_CLIMA.mes == mes
        ).all()
        if not rows:
            return None
        heladas = []
        inundaciones = []
        sequias = []
        for r in rows:
            try:
                if r.probhelada is not None:
                    heladas.append(float(r.probhelada))
                if r.probinundacion is not None:
                    inundaciones.append(float(r.probinundacion))
                if r.probsequia is not None:
                    sequias.append(float(r.probsequia))
            except Exception:
                continue
        if not heladas and not inundaciones and not sequias:
            return None
        # use mean where available, default 0 when a specific prob is missing
        mean_h = (sum(heladas) / len(heladas)) if heladas else 0.0
        mean_i = (sum(inundaciones) / len(inundaciones)) if inundaciones else 0.0
        mean_s = (sum(sequias) / len(sequias)) if sequias else 0.0
        p_h = mean_h * 0.01
        p_i = mean_i * 0.01
        p_s = mean_s * 0.01
        try:
            clima_score = 1.0 - ((1.0 - p_h) * (1.0 - p_i) * (1.0 - p_s))
        except Exception:
            clima_score = None
        return clima_score
    finally:
        s.close()


@app.get('/api/score/clima')
def api_get_clima_score(codmunicipio: str, mes: int):
    """HTTP endpoint: GET /api/score/clima?codmunicipio=...&mes=..."""
    val = get_clima_by_codmunicipio_mes(codmunicipio, mes)
    return {"codmunicipio": codmunicipio, "mes": mes, "clima_score": val}


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
