import json
from .db import get_connection

def get_weights_by_user(user_id: str):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT potencial, vocacion, complejidad, riesgo_climatico, perfil_financiero
            FROM weights
            WHERE user_id = :uid
        """, uid=user_id)
        row = cur.fetchone()
        if row:
            return {
                "potencial": float(row[0]),
                "vocacion": float(row[1]),
                "complejidad": float(row[2]),
                "riesgo_climatico": float(row[3]),
                "perfil_financiero": float(row[4]),
            }
        return None
    finally:
        try:
            conn.close()
        except Exception:
            pass

def save_weights_for_user(user_id: str, weights: dict):
    conn = get_connection()
    try:
        cur = conn.cursor()
        # MERGE for upsert
        cur.execute("""
            MERGE INTO weights w
            USING (SELECT :uid AS user_id FROM dual) src
            ON (w.user_id = src.user_id)
            WHEN MATCHED THEN
              UPDATE SET potencial=:p, vocacion=:v, complejidad=:c, riesgo_climatico=:r, perfil_financiero=:f
            WHEN NOT MATCHED THEN
              INSERT (user_id,potencial,vocacion,complejidad,riesgo_climatico,perfil_financiero)
              VALUES (:uid,:p,:v,:c,:r,:f)
        """, uid=user_id,
             p=weights["potencial"], v=weights["vocacion"], c=weights["complejidad"],
             r=weights["riesgo_climatico"], f=weights["perfil_financiero"])
        conn.commit()
    finally:
        try:
            conn.close()
        except Exception:
            pass

def save_score_record(user_id: str, raw: float, final: float, contributions: dict):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO scores (id, user_id, created_at, raw_score, final_score, contributions)
            VALUES (scores_seq.NEXTVAL, :uid, SYSTIMESTAMP, :raw, :final, :contrib)
        """, uid=user_id, raw=raw, final=final, contrib=json.dumps(contributions, ensure_ascii=False))
        conn.commit()
    finally:
        try:
            conn.close()
        except Exception:
            pass
