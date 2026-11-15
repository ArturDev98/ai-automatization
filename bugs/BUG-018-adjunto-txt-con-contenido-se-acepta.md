# BUG-018 · Adjunto .txt con contenido se acepta aunque la app dice que debe estar vacío

- **Requisito:** REQ-004
- **Casos:** TC-008
- **Ambiente:** ui-bugs · https://with-bugs.practicesoftwaretesting.com
- **Severidad:** Baja

**Prioridad: Baja.** No se pierde ni se falsea ningún dato: el archivo se acepta y el mensaje llega con él. Lo que falla es la coherencia con la regla que la propia app anuncia ("File should be empty."). Si la regla de 0 bytes resulta ser un error de producto y no una decisión, la severidad sube; esa decisión está en la revisión humana (`artifacts/REQ-004/02-plan.md`, pregunta 4; `02-revision.md`, decisión 1).

## Pasos para reproducir

1. Abrir `https://with-bugs.practicesoftwaretesting.com/#/contact`.
2. Llenar nombre, apellido, correo, asunto y un mensaje válido.
3. Cargar en `attachment` un `.txt` con una línea de texto ficticio.
4. Pulsar Send.

Con la suite: `npm run -s test:bugs -- -g "@REQ-004.*@TC-008"`.

## Resultado esperado

Junto al adjunto aparece el error "File should be empty." (o el texto equivalente que la app use). No sale ningún `POST /messages` y no aparece la confirmación.

## Resultado obtenido

Mensaje real del fallo (`results/results-bugs.json`, `ui-bugs`):

`Error: element(s) not found` en `expect(locator).toBeVisible()`, Locator: `getByTestId('attachment-error')`, Timeout: 10000ms.

Según `03-ejecucion.md`: `POST /messages` → 200, `POST /messages/{id}/attach-file` → 200 con `{"success":"true"}`, y aparece la confirmación.

## Evidencia

- Contexto del fallo (existe en el repo): `test-results/contacto-formulario-Adjunt-515da--aceptada-que-no-está-vacío-ui-bugs/error-context.md`.
- Traza: no versionada. Se regenera con `npm run -s test:bugs -- -g "@REQ-004" --trace=on` (comando de `03-ejecucion.md`).
