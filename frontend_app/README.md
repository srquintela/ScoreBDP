# BDP Score · Frontend Next.js

Frontend organizado por funcionalidad, con Next.js App Router, TypeScript,
Tailwind CSS y los componentes locales shadcn/ui/Radix del proyecto origen.
Mantiene el logo BDP y la paleta azul institucional. Reemplaza el clon Vue de
`frontend_app`; `frontend_new` sigue disponible como referencia.

## Arranque

```bash
cd frontend_app
npm ci
cp .env.example .env.local
npm run dev -- --port 5174
```

Abrir http://localhost:5174. No requiere Oracle en el modo predeterminado `demo`.
La instalación local inicial reutiliza las dependencias del proyecto Next.js de
origen. `package-lock.json` permite reinstalarlas con `npm ci`.

## Carpetas

```text
src/
  app/                     # Rutas, layout raíz y proxy de servidor
  features/
    dashboard/components/  # Indicadores derivados de solicitudes
    formulario/            # Captura, validación y datos complementarios
    solicitudes/components/# Listado y búsqueda
    evaluaciones/components/# Expediente, aportes y fuentes
    configuracion/components/# Pesos
  components/
    ui/                    # Componentes visuales reutilizables
    layout/                # Logo, navegación y marco de trabajo
    shared/                # Encabezados, avisos y formatos
  lib/
    scorebdp/              # Contratos, adaptadores DEMO/API y cálculo ilustrativo
```

Las páginas en `app` solo conectan rutas con sus funcionalidades. Cada módulo
conserva sus componentes bajo `features/<nombre>/components`.

## Modos de datos

- `NEXT_PUBLIC_DATA_MODE=demo`: sin llamadas a FastAPI; caso #1 sintético (760 con
  pesos 70/5/5/5/15). Solicitudes nuevas sin factores permanecen sin score. Cambiar
  pesos afecta futuras ejecuciones. Datos de sesión separados del modo API.
- `NEXT_PUBLIC_DATA_MODE=api`: utiliza el backend Python existente a través de
  `/api/scorebdp`. Configurar `SCOREBDP_API_URL=http://localhost:8000` solo en el
  servidor. Reiniciar desarrollo o reconstruir producción después de cambiar modo.
  No hay reemplazo automático por datos DEMO si falla el backend.

El backend completo está en `backend/app`. El Compose existente apunta a otro
backend de ejemplo en `backend/python`; comprobar el servicio que se ejecuta.

## Alcance de esta entrega

- Formulario completo en siete pasos: solicitante, crédito, finanzas, parcela,
  producción, clima y revisión.
- Captura manual, importación Kobo con confirmación y mapa Leaflet.
- Open-Meteo, balance hídrico y gráfica de acumulados con trazabilidad.
- Expediente con finanzas, producción, parcela, clima, fuentes y gráfico de aportes.
- Edición complementaria por solicitud, sin duplicar la solicitud en el backend.
- Identidad BDP, modo claro/oscuro y visualización móvil.
- Caso piloto sintético en `/solicitudes/1/editar` y escenarios sin factores.

La captura completa se conserva por solicitud en sessionStorage. Su persistencia
en Oracle, el historial institucional y los cambios de metodología del backend
siguen pendientes. No se copian secretos: configura Kobo con las variables de
`.env.example`. Open-Meteo y el mapa requieren conectividad.

Consulta `docs/integracion-evaluacion.md` para el recorrido demostrativo, la matriz
de componentes trasladados y la distinción entre consultas reales y pruebas.

El prototipo es para desarrollo local. Antes de desplegar con datos reales se
requiere autenticación/autorización, revisión del tratamiento de faltantes y
validaciones del backend; el proxy no sustituye esos controles.

## Validación

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

No se ejecutan operaciones de escritura contra Oracle durante estas comprobaciones.
El acceso real y la persistencia quedan pendientes del entorno de tu compañero.

Consulta `docs/contratos-scorebdp.md` para coordinar el trabajo del backend.
