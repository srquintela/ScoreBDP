# BDP Score — Frontend

Frontend del motor de calificación crediticia agrícola **BDP Score** para el
Hackathon BDP Innovatec 2026. Calificación basada en reglas (no caja negra),
100% explicable, para créditos agrícolas de primer piso.

## Stack

- **Next.js 16.3.3** (App Router)
- **TypeScript** estricto
- **Tailwind CSS v4** (tokens vía `@theme` en `globals.css`)
- **React 19** (Server Components por defecto, Client Components solo donde hay interactividad)
- **Auth**: JWT firmado con `jose` en cookie HTTP-only, Secure, SameSite=Lax
- **Rutas protegidas**: `src/proxy.ts` (middleware) + revalidación por rol en el layout

## Requisitos

- Node.js 18.18 o superior (se probó con Node 24)
- npm

## Configuración `.env`

Copia `.env.example` a `.env.local` y define el secreto:

```bash
# .env.local
JWT_SECRET=genera_un_secreto_largo_aleatorio
```

Para generar un secreto:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Instalación y arranque

```bash
npm install
npm run dev        # http://localhost:3000
```

Build de producción y arranque:

```bash
npm run build
npm start
```

## Cuentas de demostración

| Rol                 | Usuario             | Contraseña      |
| ------------------- | ------------------- | ---------------- |
| Oficial de crédito | `oficial@bdp.bo`  | `oficial2026`  |
| Jefe de agencia     | `jefe@bdp.bo`     | `jefe2026`     |
| Analista de riesgo  | `analista@bdp.bo` | `analista2026` |

## Rutas

| Ruta                   | Descripción                                                                    |
| ---------------------- | ------------------------------------------------------------------------------- |
| `/login`             | Acceso                                                                          |
| `/dashboard`         | Cartera, % bajo umbral, distribución por capa, zonas con potencial desatendido |
| `/solicitudes`       | Listado de solicitudes con score                                                |
| `/solicitudes/nueva` | Alta multi-paso por capa de datos (cálculo en vivo)                            |
| `/solicitudes/[id]`  | Detalle: ScoreGauge, ScoreBreakdown, ExplanationPanel                           |
| `/auditoria`         | Placeholder de vista regulatoria (fuera de MVP)                                 |

## Arquitectura

```
src/
  app/
    (public)/login/        # acceso público
    (app)/                 # rutas protegidas (valida sesión en layout)
      dashboard/
      solicitudes/nueva, [id]
      auditoria/
  actions/
    auth.actions.ts        # login / logout (Server Actions)
    score.actions.ts       # crear solicitud
  lib/
    auth/                  # JWT (jose) + cookies
    scoring/
      engine.ts            # cálculo puro de las 4 capas (sin UI, testable)
      explain.ts           # clasificación de riesgo y narrativa
    data/solicitudes.ts    # repositorio mock en memoria
    types.ts               # tipos compartidos (sin `any`)
  components/
    score/                 # ScoreGauge, ScoreBreakdown, ExplanationPanel
    layout/                # Sidebar, TopBar
    ui/                    # primitivos (Button, Badge, Field)
    solicitud/             # SolicitudWizard
  proxy.ts                 # middleware — verifica JWT antes de rutas privadas
```

## Notas sobre el motor de scoring

`lib/scoring/engine.ts` es **puro** (no importa UI ni servidor): recibe un
`SolicitudInput` y devuelve un `ResultadoScore` con las 4 capas ponderadas
(Potencial 30%, Vocación 20%, Complejidad 20%, Perfil 30%). Cada capa expone su
puntaje bruto, su justificación y su aporte ponderado, lo que mantiene el
producto 100% explicable y testable por separado.

Los datos de solicitudes viven en un repositorio en memoria (`lib/data/`) para
la demo. Para conectar con el backend real de crédito de BDP, reemplaza las
funciones de `lib/data/solicitudes.ts` y la validación de `actions/auth.actions.ts`.
