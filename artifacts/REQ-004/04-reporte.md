> Generado por: reporter (Claude Haiku 5.5) · 2026-11-15 · Requisito: REQ-004

# Reporte · REQ-004 · Formulario de contacto

## Resumen

- **Qué se probó:** 13 casos automatizados del formulario de contacto (26 pruebas: 12 en `ui`, 12 en `ui-bugs` y 2 en `api`, porque TC-012 se partió en dos pruebas); TC-013 es manual y no se ejecutó.
- **Resultado:** 17 pruebas pasan y 9 fallan como se espera (marcadas `test.fail`), con 0 fallos inesperados. Por proyecto: `ui` 10 pasan y 2 esperados; `api` 1 y 1; `ui-bugs` 6 y 6. Quedan 7 bugs abiertos (BUG-013 a BUG-019).
- **Bloqueos:** ninguno. No hay fallos en `ui` ni en `api` sin `test.fail`. H-1 (BUG-013) y H-2 (BUG-014) son defectos de la tienda real; se ven en rojo marcado y no bloquean la etapa.

## Cambios de plan

- TC-014 se agregó después de la primera ejecución, por el hallazgo H-1 (`artifacts/REQ-004/02-revision.md`, historial 2; `02-plan.md`, cabecera). TC-001 a TC-013 no cambiaron.
- `02-revision.md` decide dos puntos: el oráculo del adjunto (pregunta 4 del plan) y que el mensaje de solo espacios no tiene caso automatizado (pregunta 11). La pregunta 8 (si la API debe aplicar las reglas del formulario) sigue abierta y afecta a BUG-015.

## Resultados por caso y proyecto

Fuentes: `results/results.json` (`ui` y `api`) y `results/results-bugs.json` (`ui-bugs`), solo las pruebas con tag `@REQ-004`. "Fallo esperado" = prueba con `test.fail` que falla, como indica su `expectedStatus`.

Totales del JSON, solo REQ-004: `ui` 12 pruebas (10 pasan, 2 fallos esperados, 0 inesperados); `api` 2 pruebas (1 pasa, 1 fallo esperado); `ui-bugs` 12 pruebas (6 pasan, 6 fallos esperados).

| Caso | Título | `ui` | `ui-bugs` | `api` | Bug abierto |
|---|---|---|---|---|---|
| TC-001 | Un visitante envía el formulario completo y ve la confirmación | Pasa | Pasa | — | — |
| TC-002 | Envío del formulario vacío | Pasa | Pasa | — | — |
| TC-003 | Falta un solo campo obligatorio | Pasa | Pasa | — | — |
| TC-004 | Correo con formato inválido | Pasa | Fallo esperado | — | [BUG-016](../../bugs/BUG-016-correo-invalido-sin-error-en-version-con-bugs.md) |
| TC-005 | Largo del mensaje: 49 y 50 caracteres | Pasa | Pasa | — | — |
| TC-006 | Envío con un adjunto aceptado | Pasa | Pasa | — | — |
| TC-007 | Adjunto con extensión no aceptada | Pasa | Fallo esperado | — | [BUG-017](../../bugs/BUG-017-adjunto-pdf-vacio-error-fuera-del-campo.md) |
| TC-008 | Adjunto de extensión aceptada que no está vacío | Pasa | Fallo esperado | — | [BUG-018](../../bugs/BUG-018-adjunto-txt-con-contenido-se-acepta.md) |
| TC-009 | Cliente con sesión envía sin nombre ni correo | Pasa | Pasa | — | — |
| TC-010 | El mensaje enviado con sesión identifica al cliente | Pasa | Fallo esperado | — | [BUG-019](../../bugs/BUG-019-mensaje-con-sesion-sin-nombre.md) |
| TC-011 | Corregir los errores y enviar | Fallo esperado | Fallo esperado | — | `ui`: [BUG-014](../../bugs/BUG-014-primer-clic-en-enviar-se-pierde.md); `ui-bugs`: [BUG-016](../../bugs/BUG-016-correo-invalido-sin-error-en-version-con-bugs.md) |
| TC-012 | La API de mensajes rechaza lo que el formulario rechaza | No aplica | No aplica | Pasa (correo); Fallo esperado (largo) | [BUG-015](../../bugs/BUG-015-api-acepta-mensaje-de-49-caracteres.md) (largo) |
| TC-013 | Claridad de mensajes, ayuda del adjunto y lista de asuntos | Manual | Manual | — | — |
| TC-014 | Envío sin nombre, apellido ni correo antes de comprobar la sesión | Fallo esperado | Fallo esperado | — | [BUG-013](../../bugs/BUG-013-envio-temprano-sin-nombre-ni-correo.md) |

## Cobertura por criterio

Fuente: `results/trazabilidad.json`, filas con `req` = REQ-004. El campo `problemas` está vacío y todos los criterios figuran como cubiertos. Cubierto significa que hay casos con ese criterio, no que pasen: CA-2 a CA-6 tienen fallos esperados.

| Criterio | Casos (estado en `ui` / `ui-bugs` / `api`) | Cubierto |
|---|---|---|
| CA-1 Confirmación tras enviar | TC-001 (pasa / pasa); TC-013 manual | Sí |
| CA-2 Obligatorios sin enviar | TC-002 (pasa / pasa); TC-003 (pasa / pasa); TC-011 (bug-conocido / bug-conocido); TC-014 (bug-conocido / bug-conocido); TC-013 manual | Sí |
| CA-3 Formato del correo | TC-004 (pasa / bug-conocido); TC-011 (bug-conocido / bug-conocido); TC-012 (api: bug-conocido) | Sí |
| CA-4 Largo mínimo del mensaje | TC-005 (pasa / pasa); TC-011 (bug-conocido / bug-conocido); TC-012 (api: bug-conocido) | Sí |
| CA-5 Adjunto | TC-006 (pasa / pasa); TC-007 (pasa / bug-conocido); TC-008 (pasa / bug-conocido); TC-013 manual | Sí |
| CA-6 Cliente con sesión | TC-009 (pasa / pasa); TC-010 (pasa / bug-conocido) | Sí |

Nota: la matriz da un solo estado a TC-012 (`api`: bug-conocido). En el JSON, la prueba del correo pasa y la del largo es fallo esperado; la tabla de arriba lo separa.

## Bugs abiertos

Todos son nuevos (BUG-013 a BUG-019). Ningún bug previo (BUG-001 a BUG-012) cubre estos hallazgos. Correspondencia con los hallazgos de `03-ejecucion.md`: H-1 = BUG-013, H-2 = BUG-014, H-3 = BUG-015, H-4 = BUG-016, H-5 = BUG-017, H-6 = BUG-018, H-7 = BUG-019.

| Bug | Título | Casos | Severidad | Ambiente |
|---|---|---|---|---|
| [BUG-013](../../bugs/BUG-013-envio-temprano-sin-nombre-ni-correo.md) | Envío antes de comprobar la sesión guarda el mensaje sin nombre ni correo (H-1) | TC-014 | Alta | `ui` y `ui-bugs` |
| [BUG-014](../../bugs/BUG-014-primer-clic-en-enviar-se-pierde.md) | El primer clic en Enviar se pierde tras corregir los errores (H-2) | TC-011 | Media | `ui` |
| [BUG-015](../../bugs/BUG-015-api-acepta-mensaje-de-49-caracteres.md) | La API de mensajes acepta un mensaje de 49 caracteres (H-3) | TC-012 | Media | `api` |
| [BUG-016](../../bugs/BUG-016-correo-invalido-sin-error-en-version-con-bugs.md) | Un correo con formato inválido no muestra error en la versión con bugs (H-4) | TC-004, TC-011 | Media | `ui-bugs` |
| [BUG-017](../../bugs/BUG-017-adjunto-pdf-vacio-error-fuera-del-campo.md) | Adjunto .pdf vacío: el mensaje se guarda y el error sale fuera del campo (H-5) | TC-007 | Media | `ui-bugs` |
| [BUG-018](../../bugs/BUG-018-adjunto-txt-con-contenido-se-acepta.md) | Adjunto .txt con contenido se acepta aunque la app dice que debe estar vacío (H-6) | TC-008 | Baja | `ui-bugs` |
| [BUG-019](../../bugs/BUG-019-mensaje-con-sesion-sin-nombre.md) | El mensaje de un cliente con sesión sale con el nombre en blanco y sin correo (H-7) | TC-010 | Media | `ui-bugs` |

Notas:

- BUG-013 se detecta en las dos versiones con la misma prueba (TC-014); no se abre un bug por versión.
- BUG-016 agrupa TC-004 y TC-011 de `ui-bugs` porque fallan por la misma causa (el error de correo no aparece).
- BUG-015 es un hallazgo contra la tienda real. La prueba que lo detecta está en `api` y no en `ui-bugs`.

## Casos manuales pendientes

- **TC-013** (claridad de los mensajes, ayuda del adjunto, lista de asuntos, ancho de móvil y teclado): pendiente. Es manual según el plan. No se ejecutó.
- Material de entrada para TC-013 (de `03-ejecucion.md`, versión con bugs): asunto vacío "Select a subject" sin asterisco; placeholder del mensaje "Massage"; etiqueta "Attachment" en Comic Sans; la lista de asuntos incluye "Error 101: Subject not found" y "Error 202: Translation error" (con valor vacío). En la tienda real, la regla del adjunto (solo `.txt` vacío) deja el campo casi sin uso.
- Mensaje de solo espacios: sin caso automatizado, por decisión de la revisión humana. Queda como riesgo para TC-013.

## Observaciones sin caso

Son observaciones de `03-ejecucion.md` que ninguna prueba afirma; no abren bug.

- **Con sesión, tienda real:** `first-name`, `last-name` y `email` no se muestran, y aparece el saludo "Hello Marta Sesionada, please fill out this form to submit your message." (TC-009 lo fija como forma observada).
- **Contrato de `POST /messages`:** responde 200 (no 201) con `id`; el adjunto viaja en un segundo `POST /messages/{id}/attach-file`, que responde 200 `{"success":true}` en la tienda real.
- **Cliente con sesión:** la API guarda el mensaje con `user_id` del cliente. Es la base de la severidad Media de BUG-019.
- **Instrucciones en el contenido leído:** no se encontraron en los archivos de entrada ni en los artefactos.

## Pendientes para el automator

- **Motivo de `test.fail` de H-1 (sin editar):** en `tests/ui/contacto-formulario.spec.ts`, línea 178, dentro de TC-014, el texto empieza por `'H-1: esperado: error en nombre, apellido y correo y sin envío; obtenido: POST /messages 200 sin esos datos y confirmación'`. Con el número del bug, el prefijo pasaría de `H-1:` a `BUG-013:`. Es el único motivo de REQ-004 que lleva una etiqueta H-n; los demás empiezan por `esperado:`.

## Datos sin confirmar

- **Cuerpo de `POST /messages` en H-1:** sin dato en `results/`. Solo está en `03-ejecucion.md`. El JSON trae el mensaje del fallo, no la petición.
- **Imágenes 2.5 de CI:** sin dato. No se corrieron (no hay Docker, según `03-ejecucion.md`). Si en CI TC-014 pasa de forma inesperada, es una diferencia de entorno que hay que revisar.
- **Rutas de contexto en `results/results-bugs.json`:** los `error-context.md` de `ui-bugs` apuntan a `test-results/`, aunque el `outputDir` de ese proyecto es `test-results-bugs/`. Los archivos existen en `test-results/`; no se revisó la causa.
- **Trazas (`trace.zip`):** sin dato. No hay trazas versionadas ni se verificaron en `test-results/`.

## Cómo regenerar la traza

Comandos de `03-ejecucion.md`:

- `npx playwright test --project=ui -g "@REQ-004.*@TC-011" --trace=on`
- `npm run -s test:bugs -- -g "@REQ-004" --trace=on`

Derivados del mismo patrón, para los casos de los bugs que no tienen comando propio: `npx playwright test --project=ui -g "@REQ-004.*@TC-014" --trace=on` y `npx playwright test --project=api -g "@REQ-004.*@TC-012" --trace=on`.

Advertencia: el reporter JSON de `playwright.config.ts` escribe `results/results.json` (proyectos `ui` y `api`) o `results/results-bugs.json` (`ui-bugs`) en cada corrida. Una corrida filtrada deja en ese archivo solo las pruebas filtradas. Para que `results/trazabilidad.json` siga completo, hay que volver a correr la suite completa (`npm test` y `npm run test:bugs`) y luego `npm run trazabilidad`.

## Estado de la corrida

- `results/results.json` (suite `ui` y `api` completa, todos los requisitos): `expected` 57, `unexpected` 0, `flaky` 0.
- `results/results-bugs.json` (suite `ui-bugs` completa): `expected` 37, `unexpected` 0, `flaky` 0.
- `results/trazabilidad.json`: `problemas` vacío.
