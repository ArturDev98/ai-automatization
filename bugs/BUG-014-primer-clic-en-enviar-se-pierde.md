# BUG-014 · El primer clic en Enviar se pierde tras corregir los errores

- **Requisito:** REQ-004
- **Casos:** TC-011
- **Ambiente:** ui · https://practicesoftwaretesting.com
- **Severidad:** Media

**Prioridad: Media.** Los datos ya están bien y el visitante hace lo correcto, pero el primer clic no hace nada y no hay aviso; hace falta un segundo clic. No pierde datos. Afecta a cualquier usuario con ratón, según la confirmación de `03-ejecucion.md`. Por eso es Media y no Baja.

## Pasos para reproducir

1. Abrir la pantalla de contacto sin sesión.
2. Escribir nombre y apellido, correo `no-es-correo`, dejar el asunto sin elegir y escribir un mensaje de 49 caracteres. Pulsar Send: aparecen los errores de correo, asunto y mensaje.
3. Sin recargar, corregir el correo, elegir un asunto y completar el mensaje hasta 50 caracteres.
4. Pulsar Send una sola vez con el ratón.

Con la suite: `npx playwright test --project=ui -g "@REQ-004.*@TC-011"`.

## Resultado esperado

Un solo clic envía el formulario: sale un `POST /messages`, aparece la confirmación y el formulario deja de verse.

## Resultado obtenido

Mensaje real del fallo (`results/results.json`, `ui`):

`expect(locator).toHaveText()` failed. Locator: `getByRole('alert').filter({ hasText: 'Thanks for your message' })`. Expected: `"Thanks for your message! We will contact you shortly."`. Timeout: 10000ms. `Error: element(s) not found`.

Según `03-ejecucion.md`: con el `mousedown` desaparece el error del mensaje, Send sube 66 px (de y=490 a y=424) y el `mouseup` cae fuera del botón. No sale `POST /messages`. Si antes se sale del campo con Tab, el primer clic sí envía.

## Evidencia

- Contexto del fallo (existe en el repo): `test-results/contacto-formulario-Formul-0b3c2-rregir-los-errores-y-enviar-ui/error-context.md`.
- Traza: no versionada. Se regenera con `npx playwright test --project=ui -g "@REQ-004.*@TC-011" --trace=on`.
