# BUG-015 · La API de mensajes acepta un mensaje de 49 caracteres

- **Requisito:** REQ-004
- **Casos:** TC-012
- **Ambiente:** api · https://api.practicesoftwaretesting.com
- **Severidad:** Media

**Prioridad: Media.** El formulario rechaza 49 caracteres, pero la API guarda el mensaje igual, así que el mínimo solo existe en el navegador y cualquier llamada directa lo salta. La decisión de si la API debe aplicar las reglas del formulario está pendiente en la revisión humana (`artifacts/REQ-004/02-plan.md`, pregunta 8); el bug se abre por el hallazgo y su severidad puede revisarse con esa decisión.

## Pasos para reproducir

1. Enviar `POST https://api.practicesoftwaretesting.com/messages` sin sesión, con los campos `name`, `subject`, `email` (válido) y `message` de 49 caracteres.
2. Leer la respuesta.

Con la suite: `npx playwright test --project=api -g "@REQ-004.*@TC-012"`.

## Resultado esperado

La API responde sin éxito (no 2xx) y señala `message` como el campo causante, como hace el formulario con 49 caracteres.

## Resultado obtenido

Mensaje real del fallo (`results/results.json`, `api`):

`Error: mensaje de 49 caracteres: 200` — `expect(received).toBe(expected)`, Expected: `false`, Received: `true` (`tests/api/mensajes.spec.ts:34`).

Según `03-ejecucion.md`: la API responde 200 y el mensaje se guarda con `id`. El mismo cuerpo con correo `no-es-correo` sí se rechaza (422, `{"email":["The email field must be a valid email address."]}`), así que la regla del correo sí vive en la API.

## Evidencia

- Contexto del fallo (existe en el repo): `test-results/mensajes-API-de-mensajes-T-99642-aje-más-corto-que-el-mínimo-api/error-context.md`.
- Traza: no versionada. Se regenera con `npx playwright test --project=api -g "@REQ-004.*@TC-012" --trace=on` (derivado del patrón de `03-ejecucion.md`).
