# Contratos para integrar ScoreBDP

## Existentes, usados por la interfaz

| Operación | Ruta FastAPI | Contrato |
| --- | --- | --- |
| Municipios | GET /api/municipios?departamento=... | [{codmunicipio, municipio}] |
| Productos | GET /api/productos | [{id, descripcion, ...}] |
| CAEDEC | GET /api/caedec | [{caedec, actividad, ...}] |
| Crear | POST /api/solicitud | Persona + municipio y producto por nombre, CAEDEC, monto y messiembra; respuesta {solicitud:{id,...},...} |
| Listar | GET /api/solicitudes?item_id=... | [{id,municipio,producto,monto,fecha,ci,nombre,primer_apellido}] |
| Calcular | POST /api/score/generate/{id} | {score:{idsolicitud,scorefinanciero,scoreviabilidad,scoreadopcion,scoremercado,scoreclima,score,scoreletra,fecha},pesos:{perfil_financiero,viabilidad,adopcion,mercado,riesgo_climatico}} |
| Guardar pesos | POST /api/pesos | Los cinco pesos en porcentaje |
| Leer pesos | GET /api/F_SCO_PESOS | Registros con id, fecha y cinco pesos; limitado a 200 |

El cliente conserva el contrato de creación actual (municipio/producto por nombre),
aunque una futura API debería aceptar identificadores estables. El catálogo DEMO
no tiene códigos oficiales ni representa cobertura territorial real.

## Datos complementarios propuestos (no enviados al backend actual)

- plazo: meses; cuota: Bs/mes; ingresos: Bs/mes; egresos: Bs/mes SIN cuotas.
- deuda: saldo total Bs; cuotasExistentes: Bs/mes.
- experiencia: años; superficie: ha; rendimiento: kg/ha.
- costo: Bs/campaña; precio: Bs/kg.

En esta entrega estos campos son opcionales y se guardan solo en la sesión. No
mezclar saldos con flujos ni ingresos estacionales con disponibilidad mensual.
Todavía falta acordar fecha/campaña, fuentes y verificación antes de usarlos como
entradas de un factor financiero o productivo.

## Pendientes para el backend y Oracle

1. Recuperar un expediente completo por solicitud, incluidos datos adicionales.
2. Guardar esos datos con unidades, periodo, fuente y fecha.
3. Vincular parcela Kobo y geometría, y evidencia climática de Open-Meteo.
4. Devolver disponibilidad de cada factor; un cero no distingue ausencia en la API actual.
5. Corregir ausencia de clima: actualmente se sustituye por 0 y se usa 1 − riesgo.
6. Validar factores 0–1 y pesos no negativos que sumen 100 en servidor.
7. Guardar pesos y versión de reglas en cada evaluación.
8. Incorporar GET de pesos vigentes, historial por solicitud y control de duplicados.
9. La propuesta 70/5/5/5/15 NO se aplica al servidor automáticamente. El score API
   muestra los pesos efectivamente devueltos por el backend.

Los factores DEMO son ilustrativos y distintos del motor AgroScore. El modo API
muestra el resultado recibido, con una advertencia sobre la completitud no
verificable mientras el backend transforme faltantes en ceros.


## Captura agrícola local (versión 1; contrato propuesto)

| Campo | Tipo / unidad | Requerido en captura | Origen / relación |
| --- | --- | --- | --- |
| solicitudId | entero | Sí | Solicitud existente |
| savedAt | fecha ISO | Sí | Generado al guardar |
| application | contrato de solicitud | Sí | Declarado; copia local |
| financial | importes Bs y plazo meses | Sí | Declarado; solicitud |
| period | MONTHLY / SEASONAL | Sí | Declarado; compatibilidad de flujos |
| purpose | texto | Sí | Destino declarado |
| parcel | ubicación, superficie ha, geometría GeoJSON | Sí | Manual / Kobo / DEMO |
| productive | rendimiento t/ha, producción t, precio Bs/t, costos e ingreso Bs | Sí | Declarado |
| climate | observación con coordenadas, periodo, cobertura y unidades | No | Consulta Open-Meteo, evidencia contextual |
| origin | DECLARED / SYNTHETIC | Sí | Identifica ejemplo de demostración |

`financial` conserva nombres heredados para compatibilidad. El bloque productivo
canónico de esta captura usa toneladas. El adaptador del resumen anterior convierte
explícitamente t/ha a kg/ha y Bs/t a Bs/kg; no se mezclan valores sin conversión.
Este contrato todavía no es un endpoint ni una migración Oracle aplicada.
