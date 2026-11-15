# Reporte · REQ-003 · API de productos, sesión y carrito

> Generado por: reporter (Claude Haiku 5.5) · 2026-11-14 · Requisito: REQ-003

## Resumen

- **Qué se probó:** la API pública de Toolshop (`https://api.practicesoftwaretesting.com`) en 14 casos (CA-1 a CA-7): paginación, detalle y 404, búsqueda, filtro por categoría, orden, contrato del producto, sesión, carrito y respuestas de error.
- **Resultado:** 17 de 17 pruebas del requisito pasan en el proyecto `api` (14 casos; TC-007 tiene 4 pruebas, una por combinación de orden). Ningún caso falla y no hay bugs abiertos.
- **Bloqueos:** ninguno. Quedan tres observaciones para decidir por el dueño del requisito (ver sección Observaciones); no son fallos de los casos.

## Resultados por caso y proyecto

Proyecto `api` (fuente: `results/results.json`). `ui` y `ui-bugs` no aplican a este requisito.

| Caso | Título | Pruebas en `results.json` | `api` |
|---|---|---|---|
| TC-001 | Paginación completa con metadatos coherentes y sin productos repetidos | 1 | pasa |
| TC-002 | Última página y página fuera de rango mantienen metadatos coherentes | 1 | pasa |
| TC-003 | Detalle de un producto existente devuelve el producto pedido con su contrato | 1 | pasa |
| TC-004 | Detalle de un id inexistente responde 404 | 1 | pasa |
| TC-005 | Búsqueda por texto devuelve solo productos que contienen el término | 1 | pasa |
| TC-006 | Filtro por categoría devuelve solo productos de esa categoría | 1 | pasa |
| TC-007 | Orden por precio y por nombre, ascendente y descendente | 4 (`price,asc`, `price,desc`, `name,asc`, `name,desc`) | pasa (4/4) |
| TC-008 | Contrato del producto estable en todo el listado | 1 | pasa |
| TC-009 | Login con cliente recién registrado entrega token y da acceso a /users/me | 1 | pasa |
| TC-010 | Login con correo inexistente responde 401 sin token | 1 | pasa |
| TC-011 | /users/me sin token o con token inválido responde 401 | 1 | pasa |
| TC-012 | Ciclo de vida del carrito: crear, añadir, consultar, cambiar cantidad y eliminar | 1 | pasa |
| TC-013 | Datos inválidos en el carrito responden 4xx con explicación y nunca 5xx | 1 | pasa |
| TC-014 | Login con cuerpo incompleto responde 4xx con explicación y nunca 5xx | 1 | pasa |

Totales del proyecto `api` para REQ-003: 17 pruebas, 17 pasan, 0 fallan.

Nota de fuentes: `results/results.json` contiene una sola ejecución por prueba (todas `passed`). El automator informa en `03-ejecucion.md` 51 de 51 en verde con `--repeat-each=3` (17 pruebas × 3); esa cifra no se puede verificar desde `results.json`. Además, el proyecto `api` de ese archivo incluye una prueba de REQ-001 (`api\registro.spec.ts`, TC-011), que no entra en este reporte.

## Cobertura por criterio

Fuente: `results/trazabilidad.json`, filas con `req` = REQ-003. Todos los criterios figuran como `cubierto: true`.

| Criterio | Texto resumido | Casos | Estado `api` |
|---|---|---|---|
| CA-1 | Listado paginado, metadatos coherentes, sin repetidos | TC-001, TC-002 | pasa |
| CA-2 | Detalle del producto y 404 si no existe | TC-003, TC-004 | pasa |
| CA-3 | Búsqueda, filtro por categoría y orden | TC-005, TC-006, TC-007 | pasa |
| CA-4 | Contrato estable del producto | TC-003, TC-008 | pasa |
| CA-5 | Login con token, 401 sin credenciales válidas, `/users/me` exige token | TC-009, TC-010, TC-011 | pasa |
| CA-6 | Ciclo de vida del carrito | TC-012 | pasa |
| CA-7 | Datos inválidos: 4xx con explicación, nunca 5xx | TC-013, TC-014 | pasa |

Criterios sin cubrir: ninguno. Problemas registrados en la matriz: ninguno (`problemas: []`).

## Bugs abiertos

Ninguno para REQ-003. El automator no registró hallazgos contra el plan, no se crearon archivos en `bugs/` y no hay archivos en `bugs/` que mencionen REQ-003.

## Casos manuales pendientes de ejecutar

Ninguno. El plan define los 14 casos como `Automatizado` y la matriz no contiene casos manuales de REQ-003.

## Observaciones

Son asuntos que el dueño del requisito debe decidir. No son bugs abiertos y no se han registrado en `bugs/`.

1. **Errores de validación sin cabecera `Accept: application/json` responden 302.** Según `03-ejecucion.md`, `POST /carts/{id}` con `quantity: -1` y `PUT /carts/{id}/product/quantity` con `{}`, enviados sin esa cabecera, responden 302 con una página HTML que redirige a la portada, en vez de 422. Con la cabecera responden 422 con `message` y `errors`. Las pruebas siempre envían la cabecera (`src/api/contexto.ts`), así que este caso no está cubierto por ninguna prueba. Un integrador que no la envíe recibe un 3xx sin explicación, lo que contradice el espíritu de CA-7. Decide el dueño si es un defecto del servicio o si la cabecera es un requisito del contrato.
2. **Inestabilidad puntual del servicio.** En la primera corrida, según `03-ejecucion.md`, 11 pruebas recibieron `500` en peticiones válidas (`GET /products`, `POST /carts`) a la vez. La corrida siguiente y las tres repeticiones salieron en verde sin cambios. Esa primera corrida no aparece en `results/results.json`, que solo contiene la ejecución correcta, y no hay más datos en las entradas sobre su causa.
3. **Ids de categoría que cambian.** El id de Hammer pasó de `01M7EBGKG2F6EYM9B8KQE8ZW3J` (extracción) a `01M7EEYBDW9W0H48VP271BV7GN` (ejecución). El plan ya evitaba fijar ids: las pruebas los leen en cada corrida. El automator sugiere que la demo se regenera periódicamente y responde 5xx mientras tanto; esa causa es una suposición del automator, no un dato verificado.

Asuntos menores del propio plan (ya resueltos por el automator, sin acción pendiente): la cantidad negativa responde 422 `The quantity field must be at least 1.` (pregunta abierta 6); el login válido devuelve `access_token` con `expires_in` de 300 s (pregunta abierta 2). La limpieza de las cuentas registradas por TC-009 no está resuelta: las cuentas quedan en la demo (pregunta abierta 8).

## Fuentes

- `artifacts/REQ-003/02-plan.md`
- `artifacts/REQ-003/03-ejecucion.md`
- `results/trazabilidad.json` (filas REQ-003)
- `results/results.json` (proyecto `api`, pruebas REQ-003)
