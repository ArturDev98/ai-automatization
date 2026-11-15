# BUG-013 · El envío antes de comprobar la sesión guarda el mensaje sin nombre ni correo

- **Requisito:** REQ-004
- **Casos:** TC-014
- **Ambiente:** ui · https://practicesoftwaretesting.com y ui-bugs · https://with-bugs.practicesoftwaretesting.com
- **Severidad:** Alta

**Prioridad: Alta.** El mensaje llega a la tienda sin nombre y sin correo del visitante, así que la tienda no puede responderle, y el formulario muestra la confirmación como si todo estuviera bien. Pasa en las dos versiones. La ventana es de 1,5 a 2 s después de cargar la pantalla (según `artifacts/REQ-004/03-ejecucion.md`), pero con un envío rápido se reproduce en 5 de 6 intentos.

## Pasos para reproducir

1. Sin sesión, abrir la pantalla de contacto (`/contact` en la tienda real; `#/contact` en la versión con bugs).
2. Enviar antes de que la pantalla termine de comprobar la sesión (`GET /users/me` aún no ha respondido): dejar vacíos nombre, apellido y correo, elegir un asunto y escribir un mensaje de más de 50 caracteres.
3. Pulsar Send.

Con la suite: `npx playwright test --project=ui -g "@REQ-004.*@TC-014"` y `npm run -s test:bugs -- -g "@REQ-004.*@TC-014"`. La prueba retiene la respuesta de `GET /users/me` para fijar el momento; no depende de esperas fijas.

## Resultado esperado

`first-name`, `last-name` y `email` muestran cada uno su error de campo obligatorio. No sale ningún `POST /messages`, el formulario sigue visible y no aparece la confirmación.

## Resultado obtenido

Mensaje real del fallo (`results/results.json`, `ui`; el mismo en `results/results-bugs.json`, `ui-bugs`):

`envío temprano: error de first-name` — `expect(locator).toBeVisible()` failed. Locator: `getByTestId('first-name-error')`. Expected: visible. Timeout: 10000ms. `Error: element(s) not found`.

Según `03-ejecucion.md` (el cuerpo de la petición no queda en el JSON): sale `POST /messages` → 200 con `"name":" Contacto"`, `"name":"Lucia "` o `"name":" "`, sin `email`, y aparece la confirmación.

## Evidencia

- Contexto del fallo (existen en el repo): `test-results/contacto-formulario-Formul-850a1-antalla-compruebe-la-sesión-ui/error-context.md` (ui) y `test-results/contacto-formulario-Formul-850a1-antalla-compruebe-la-sesión-ui-bugs/error-context.md` (ui-bugs).
- Traza: no versionada. Se regenera con `npx playwright test --project=ui -g "@REQ-004.*@TC-014" --trace=on` (derivado del comando de `03-ejecucion.md`, mismo patrón).
