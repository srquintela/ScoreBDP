# BDP Score — Frontend

Frontend del motor de calificación crediticia agrícola **BDP Score** para el
Hackathon BDP Innovatec 2026. Calificación basada en reglas (no caja negra),
100% explicable, para créditos agrícolas de primer piso.

## Stack

- **Python
- **Vanilla javascript

## Requisitos

- Node.js 18.18 o superior (se probó con Node 24)
- npm

## Configuración `.env`

COnfigurar credenciales para oracledb en archivo .env

```bash
oracledb
```


## Instalación y arranque
Frontend

```bash
npm install
npm run dev        # http://localhost:3000
```

Backend

```bash
crear un venv
python -m uvicorn app.main:app --reload --port 8000
```



## Rutas

| Ruta                   | Descripción                                                                    |
| ---------------------- | ------------------------------------------------------------------------------- |
| `/dashboard`         | Cartera, % bajo umbral, distribución por capa, zonas con potencial desatendido |
| `/solicitudes`       | Listado de solicitudes con score                                               |
| `/solicitudes/nueva` | Alta multi-paso por capa de datos (cálculo en vivo)                            |
| `/configuracion`     | COnfiguracion de los pesos para la evaluacion de score                         |



## Notas sobre el motor de scoring


