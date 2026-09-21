 # ScoreBDP — Scoring platform (BDP)

Este repositorio contiene una aplicación de demostración para el motor de
calificación crediticia agrícola "BDP Score". Incluye varias piezas:

- `backend/` — API en Python (FastAPI) con integración de persistencia y
  endpoints para generar y almacenar scores.
- `frontend_new/` — Aplicación Vue 3 (Vite) usada como interfaz principal de
  operaciones (Lista de solicitudes, SCORE modal, Dashboard simple).
- `frontend/` — (Next.js) implementación alternativa / histórico del UI.

Objetivo: mostrar el cálculo explicable del Score BDP, permitir generar
scorings desde el UI, y visualizar el desglose por componentes junto a
gráficos interactivos.

Principales componentes
- `backend/app/main.py` — rutas REST para cálculo y persistencia del score.
- `backend/app/models.py` — mapeo de tablas (SQLAlchemy) usado en la demo.
- `frontend_new/src/views/ListaSolicitudes.vue` — tabla de solicitudes y modal
  con desglose, chart y gauge (SVG).
- `frontend_new/src/views/Dashboard.vue` — vista de control con métricas.

Requisitos

- Python 3.10+ (para backend)
- Node.js 18+ and npm (para frontend)
- Docker & docker-compose (opcional)

Ejecutar localmente (rápido)

1) Backend (API)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

La API quedará en http://localhost:8000. El endpoint principal usado por el
frontend es `/api/score/generate/{solicitud_id}`.

2) Frontend (Vue app)

```bash
cd frontend_new
npm install
npm run dev
```

Por defecto Vite arranca en `http://localhost:5173` (ajusta la URL si es
necesario en tu entorno). La vista `Lista de solicitudes` usa la API en el
backend para generar y mostrar el score.

3) (Opcional) Frontend legacy (Next)

```bash
cd frontend
npm install
npm run dev
```

Despliegue con Docker (opcional)

El repositorio incluye un `docker-compose.yml` de ejemplo que construye
servicios desde `backend/python` y `frontend/vue`. Para levantar todo por
docker:

```bash
docker-compose up --build
```

Dependiendo de tu entorno quizás prefieras contenerizar cada servicio
separadamente o utilizar un servidor ASGI (uvicorn/gunicorn) y un proxy (nginx).

Variables de entorno relevantes

- Backend: revisa `backend/.env.example` (conexión DB, secretos, oracledb
  variables). Para pruebas locales la API puede correr con datos en memoria.
- Frontend: `frontend_new/.env` puede incluir `VITE_BACKEND_URL` para apuntar
  al backend (por defecto `http://localhost:8000`).

Arquitectura — visión general

```
[browser] <---> [frontend_new (Vue + Vite)] <---> [backend (FastAPI)]
                                           \-> [Oracle / DB (optional)]
                                           \-> [persistence layer / models]
```

Guía rápida de uso (handbook básico)

- Abrir `Lista de solicitudes` y localizar la fila deseada.
- Presionar el botón `SCORE` junto a la solicitud para invocar
  `/api/score/generate/{id}`. El backend calculará las capas y guardará la
  puntuación (según configuración de persistencia).
- Se abrirá un modal con:
  - columna izquierda: desglose por componente (scores y pesos) y etiquetas
    de riesgo;
  - columna central: gráfico de líneas con pesos y scores por componente;
  - columna derecha: semicírculo SVG mostrando el `Score BDP` numérico.

Interpretación rápida del Score
- Los componentes muestran valores normalizados (0..1) y pesos (%).
- El `Score BDP` final se presenta en la escala usada por el proyecto
  (en la demo el campo `final_score` puede estar en 0..1000 o 0..100; el UI
  normaliza para visualización). Confirma la unidad con tu equipo si vas a
  integrar en producción.

Contribuir

- Crear una rama por feature: `git checkout -b feat/mi-cambio`.
- Mantener commits pequeños y autoexplicativos.
- Ejecutar linters / tests si están configurados.

Soporte y notas finales

Si vas a conectar este proyecto a sistemas reales (producción), revisa
cuidadosamente las definiciones de tabla en `backend/app/models.py` y las
políticas de filtrado/validación en los endpoints. Los helpers de scoring son
puros y deben ser testeables y auditables antes de ser usados en un flujo
operativo.

- Backend: revisa `backend/.env.example` (conexión DB, secretos, oracledb
  variables). Para pruebas locales la API puede correr con datos en memoria.
- Frontend: `frontend_new/.env` puede incluir `VITE_BACKEND_URL` para apuntar
  al backend (por defecto `http://localhost:8000`).

Arquitectura — visión general

```
[browser] <---> [frontend_new (Vue + Vite)] <---> [backend (FastAPI)]
                                           \-> [Oracle / DB (optional)]
                                           \-> [persistence layer / models]
```

Guía rápida de uso (handbook básico)

- Abrir `Lista de solicitudes` y localizar la fila deseada.
- Presionar el botón `SCORE` junto a la solicitud para invocar
  `/api/score/generate/{id}`. El backend calculará las capas y guardará la
  puntuación (según configuración de persistencia).
- Se abrirá un modal con:
  - columna izquierda: desglose por componente (scores y pesos) y etiquetas
    de riesgo;
  - columna central: gráfico de líneas con pesos y scores por componente;
  - columna derecha: semicírculo SVG mostrando el `Score BDP` numérico.

Interpretación rápida del Score
- Los componentes muestran valores normalizados (0..1) y pesos (%).
- El `Score BDP` final se presenta en la escala usada por el proyecto
  (en la demo el campo `final_score` puede estar en 0..1000 o 0..100; el UI
  normaliza para visualización). Confirma la unidad con tu equipo si vas a
  integrar en producción.

Contribuir

- Crear una rama por feature: `git checkout -b feat/mi-cambio`.
- Mantener commits pequeños y autoexplicativos.
- Ejecutar linters / tests si están configurados.

Soporte y notas finales

Si vas a conectar este proyecto a sistemas reales (producción), revisa
cuidadosamente las definiciones de tabla en `backend/app/models.py` y las
políticas de filtrado/validación en los endpoints. Los helpers de scoring son
puros y deben ser testeables y auditables antes de ser usados en un flujo
operativo.