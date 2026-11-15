# Ejecución · REQ-003 · API de productos, sesión y carrito

> Generado por: automator (Claude Opus 5.5) · 2026-11-14 · Requisito: REQ-003

## Archivos creados

Base compartida (la reutilizan REQ-001 y REQ-002):

- `src/data/clientes.ts`: `nuevoCliente()` (correo `qa-flow-{timestamp}-{hex}@example.com` y clave
  aleatoria que cumple la política), `correoInexistente()` y `sufijoUnico()`.
- `src/data/productos.ts`: id de producto inexistente, términos de búsqueda, categorías del filtro y token falso.
- `src/api/contexto.ts`: `API_URL` (`process.env.API_URL ?? 'https://api.practicesoftwaretesting.com'`) y `crearContextoApi()`.
- `src/api/usuarios.ts`: `registrar`, `login`, `perfil` y `registrarYEntrar` (precondición que devuelve el token).
- `src/api/productos.ts`: `leerPagina`, `leerTodas` (recorre hasta `last_page`), `primerProducto`, `buscarCategoria`.
- `src/api/carritos.ts`: crear, consultar, añadir, cambiar cantidad y eliminar.
- `src/api/errores.ts`: `textoDeError` (lee `message` o `error`).
- `src/fixtures/index.ts`: `test` y `expect` extendidos con los fixtures `api`, `cliente`, `token` y `carritos`.

Pruebas:

- `tests/api/productos.spec.ts`: TC-001 a TC-008.
- `tests/api/sesion.spec.ts`: TC-009, TC-010, TC-011 y TC-014.
- `tests/api/carrito.spec.ts`: TC-012 y TC-013.

## Resultados

`npx playwright test --project=api --repeat-each=3`: 51 de 51 en verde (17 pruebas × 3) en 37 s.
`npm run -s typecheck`: limpio. `npx eslint src tests`: limpio (ver Decisiones sobre `npm run -s lint`).

| Caso | Prueba | Resultado |
|---|---|---|
| TC-001 | `productos.spec.ts` · TC-001 paginación completa con metadatos coherentes y sin productos repetidos | Pasa |
| TC-002 | `productos.spec.ts` · TC-002 última página y página fuera de rango mantienen metadatos coherentes | Pasa |
| TC-003 | `productos.spec.ts` · TC-003 detalle de un producto existente devuelve el producto pedido con su contrato | Pasa |
| TC-004 | `productos.spec.ts` · TC-004 detalle de un id inexistente responde 404 | Pasa |
| TC-005 | `productos.spec.ts` · TC-005 búsqueda por texto devuelve solo productos que contienen el término | Pasa |
| TC-006 | `productos.spec.ts` · TC-006 filtro por categoría devuelve solo productos de esa categoría | Pasa |
| TC-007 | `productos.spec.ts` · TC-007 orden `price,asc` / `price,desc` / `name,asc` / `name,desc` (4 pruebas) | Pasa (4/4) |
| TC-008 | `productos.spec.ts` · TC-008 contrato del producto estable en todo el listado | Pasa |
| TC-009 | `sesion.spec.ts` · TC-009 login con cliente recién registrado entrega token y da acceso a /users/me | Pasa |
| TC-010 | `sesion.spec.ts` · TC-010 login con correo inexistente responde 401 sin token | Pasa |
| TC-011 | `sesion.spec.ts` · TC-011 /users/me sin token o con token inválido responde 401 | Pasa |
| TC-012 | `carrito.spec.ts` · TC-012 ciclo de vida del carrito | Pasa |
| TC-013 | `carrito.spec.ts` · TC-013 datos inválidos en el carrito responden 4xx con explicación y nunca 5xx | Pasa |
| TC-014 | `sesion.spec.ts` · TC-014 login con cuerpo incompleto responde 4xx con explicación y nunca 5xx | Pasa |

## Hallazgos

Ninguno contra el plan: la API real cumple todos los resultados esperados. No hay pruebas con `test.fail()`.

Observaciones para el reporter (no son fallos de un caso del plan):

- **Errores de validación sin `Accept: application/json` responden 302.** `POST /carts/{id}` con
  `quantity: -1` y `PUT /carts/{id}/product/quantity` con `{}`, enviados sin esa cabecera, responden
  `302` con una página HTML que redirige a la portada, en lugar de `422`. Con la cabecera responden 422
  con `message` y `errors`, como espera TC-013. Un integrador que no la envíe recibe un 3xx sin
  explicación, lo que choca con el espíritu de CA-7; se deja a criterio del dueño del requisito.
- **Cantidad negativa (pregunta abierta 6).** Responde 422 `The quantity field must be at least 1.`, igual que `quantity: 0`.
- **Inestabilidad puntual del servicio.** En la primera corrida 11 pruebas recibieron `500` en
  peticiones válidas (`GET /products`, `POST /carts`) a la vez; la corrida siguiente y las tres
  repeticiones salieron en verde sin cambiar nada. Además los ids de categoría ya no son los de la
  extracción (Hammer pasó de `01M7EBGKG2F6EYM9B8KQE8ZW3J` a `01M7EEYBDW9W0H48VP271BV7GN`), lo que
  apunta a que la demo se regenera periódicamente y responde 5xx mientras tanto.
- **Login válido.** Responde `{"access_token", "token_type", "expires_in"}`; `expires_in` es 300 s
  (pregunta abierta 2 resuelta: el campo es `access_token`).

## Casos no automatizados

Ninguno: los 14 casos del plan son `Automatizado` y todos tienen prueba.

## Decisiones técnicas

- **Contexto propio contra la API.** Las pruebas usan el fixture `api` (un `APIRequestContext` con
  baseURL `API_URL`) y no el `request` del proyecto, para que los mismos fixtures sirvan desde el proyecto
  `ui`, cuyo baseURL es la web. El contexto envía siempre `Accept: application/json` (ver observación del 302).
- **Fixtures de cliente.** `cliente` registra un cliente nuevo por prueba y `token` hace login con él;
  ambos comparten un único registro por prueba. TC-009 no los usa porque el registro y el login son sus
  propios pasos con assert. Las cuentas quedan en la demo (pregunta abierta 8); nunca se usa la cuenta de demostración.
- **Clave.** Se genera en ejecución (`Qf!{8 hex}#Zt9`), no se escribe en el repositorio ni en reportes.
- **Limpieza de carritos.** `carritos.crear()` apunta el id y la limpieza del fixture lo borra al
  terminar, pase o falle; acepta `204` o `404` (TC-012 ya lo borró) y falla con cualquier otro código.
- **TC-007** se parametrizó en cuatro pruebas, una por combinación de la tabla de decisión, todas con `@TC-007`.
- **Datos de catálogo** (ids, totales, páginas) se leen en cada corrida; las categorías se localizan
  por nombre en `GET /categories/tree`.
- **`npm run -s lint` falla por un archivo ajeno a este requisito**: `site/panel.js` (creado a las
  21:10 por otra etapa, fuera de `src/` y `tests/`) no está en el `tsconfig` y el `projectService` de
  ESLint no lo encuentra. No se tocó por estar fuera del alcance del automator; `src/` y `tests/` pasan
  lint limpios. Hay que añadir `site/` a los `ignores` de `eslint.config.mjs` o al `allowDefaultProject`.
