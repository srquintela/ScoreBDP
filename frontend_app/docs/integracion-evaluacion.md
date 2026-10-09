# Evaluación agrícola completa — integración por funcionalidades

## Auditoría y reutilización

| Funcionalidad del origen | Destino | Ajuste |
| --- | --- | --- |
| Formulario productivo y tipos | features/formulario | Integrado como paso; unidades t/ha, t y Bs/t |
| Mapa y geometría | components/maps, lib/maps | Leaflet solo cliente; coordenadas editables y polígono |
| Parcela y ubicación | features/parcelas | Confirmación Kobo y captura manual |
| Importador geométrico Kobo | lib/kobo | Conserva id, centroide y área aproximada |
| Cliente Kobo | app/api/kobo/submissions | Reimplementado con variables propias, timeout, sin búsqueda de secretos vecinos |
| Clima y balance | features/clima, lib/climate | Conserva periodo, cobertura y disponibilidad; no altera el score |
| Gráficas | features/evaluaciones y features/clima | Recharts, aportes ponderados y acumulados reales disponibles |
| ScoreBDP | lib/scorebdp | Se mantiene el contrato actual; pesos reales y limitación de completitud visibles |

`features/evaluations` y `features/climate` del origen se reubicaron en las carpetas
formulario, parcelas y clima. No se llevó el motor AgroScore 0–100 al resultado
principal. El formulario comparte los componentes UI y la identidad BDP.

## Recorrido para demostrarlo sin Oracle

1. Iniciar con `NEXT_PUBLIC_DATA_MODE=demo`.
2. Abrir `/solicitudes/1/editar`.
3. Pulsar **Cargar caso piloto sintético**. Esto reemplaza la captura visible por
   un ejemplo identificado; no acredita propiedad ni producción real.
4. Revisar solicitante, crédito y finanzas. Para ingresos estacionales se suspende
   el análisis mensual: todavía se necesita un flujo por campaña.
5. Revisar parcela y polígono sintético. O elegir Kobo, seleccionar una captura y
   confirmar manualmente su correspondencia antes de importar.
6. Revisar producción; no confundir rendimiento t/ha con kg/ha ni precio Bs/t con Bs/kg.
7. Consultar Open-Meteo si hay conectividad. La consulta es independiente de Oracle;
   sin respuesta se mantiene el estado no disponible y se puede continuar.
8. Guardar captura local y abrir expediente: producción, mapa y clima son recuperables
   al recargar en la misma sesión. Otra sesión no tiene esas evidencias.
9. Ejecutar demostración. Factores sintéticos del caso #1 producen 760 con pesos
   70/5/5/5/15. Los factores institucionales DEMO no se derivan de la consulta de clima.
10. Crear una solicitud nueva para comprobar el caso incompleto: no tendrá factores
    externos y no recibirá un score inventado.

No hay una respuesta climática sintética precargada marcada REAL. Las respuestas
simuladas se utilizan únicamente en pruebas aisladas del navegador y tests.

## Guardado y edición

- La creación API envía solo el contrato existente de solicitud.
- Al editar un id existente, no se llama a POST /solicitud. Se completa una captura
  local; la API actual no actualiza estos datos ni los persiste en Oracle.
- La captura se guarda por modo + solicitud, con fecha, procedencia, parcela,
  producción, periodo financiero, información financiera y evidencia climática.
- Si falla el almacenamiento después de crear, se conserva el id en pantalla y un
  reintento no ejecuta otra creación. Una caída ambigua de red después de un POST
  sigue requiriendo verificación en la lista; el backend necesita idempotencia.
- Cambiar coordenadas manualmente elimina el vínculo geométrico anterior y descarta
  el clima incompatible. Importar otra parcela invalida también la evidencia.
- Superficie registrada y área geométrica aproximada se muestran por separado.

## Servicios externos

Kobo requiere `KOBO_API_TOKEN`, `KOBO_ASSET_UID`, `KOBO_BASE_URL` (HTTPS) y opcionalmente
`KOBO_GEOSHAPE_FIELD` (por defecto `Record_an_area`). La ruta devuelve únicamente
metadatos de captura y geometría; no expone token ni otros campos de la encuesta.
Devuelve hasta 100 capturas y avisa si hay más. No se copian credenciales del origen.

Open-Meteo recibe coordenadas y periodo, nunca documentos ni montos. El mapa requiere
conectividad al proveedor de teselas. Una falla visual no elimina los datos capturados.
La autenticación y autorización del despliegue con datos reales sigue siendo un
requisito previo: los endpoints locales no reemplazan controles de acceso.

## Validación y alcance

- Tests unitarios de pesos, fuentes, captura, geometría, clima y faltantes.
- Recorrido de navegador con respuesta Open-Meteo simulada, captura completa,
  edición, gráfico, recarga de sesión, modo oscuro y vista móvil.
- Servicios reales y Oracle: pendientes de disponibilidad/configuración. No se
  hicieron escrituras institucionales durante las pruebas.

La propuesta de pesos es 70/5/5/5/15. La interfaz muestra diferencias con los pesos
reales de la API y posibles discrepancias entre aportes redondeados y total recibido.
El backend aún convierte algunos faltantes en cero: la completitud se declara no
verificada. El historial persistido y la corrección metodológica requieren backend.
