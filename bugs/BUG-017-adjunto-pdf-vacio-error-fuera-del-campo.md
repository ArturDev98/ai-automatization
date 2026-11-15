# BUG-017 · Adjunto .pdf vacío: el mensaje se guarda y el error de extensión sale fuera del campo

- **Requisito:** REQ-004
- **Casos:** TC-007
- **Ambiente:** ui-bugs · https://with-bugs.practicesoftwaretesting.com
- **Severidad:** Media

**Prioridad: Media.** El formulario guarda el mensaje antes de validar el adjunto. Cuando aparece el error, el mensaje ya está en la tienda sin su archivo, y el aviso no está junto al campo. El visitante cree que algo falló en el envío y no sabe qué corregir.

## Pasos para reproducir

1. Abrir `https://with-bugs.practicesoftwaretesting.com/#/contact`.
2. Llenar nombre, apellido, correo, asunto y un mensaje válido.
3. Cargar en `attachment` un archivo `.pdf` de 0 bytes (la prueba lo carga directamente, sin pasar por el diálogo).
4. Pulsar Send.

Con la suite: `npm run -s test:bugs -- -g "@REQ-004.*@TC-007"`.

## Resultado esperado

Junto al adjunto aparece un error que explica que la extensión no se acepta. No sale ningún `POST /messages`, no aparece la confirmación.

## Resultado obtenido

Mensaje real del fallo (`results/results-bugs.json`, `ui-bugs`):

`Error: element(s) not found` en `expect(locator).toBeVisible()`, Locator: `getByTestId('attachment-error')`, Timeout: 10000ms.

Según `03-ejecucion.md`: sale `POST /messages` → 200 (el mensaje se guarda); después `POST /messages/{id}/attach-file` → 400 con `{"errors":["The file extension is incorrect, we only accept txt files."]}`, que aparece en un aviso general al pie del formulario, sin confirmación. La ayuda del campo dice "txt, pdf or jpg".

## Evidencia

- Contexto del fallo (existe en el repo): `test-results/contacto-formulario-Adjunt-e92a1-o-con-extensión-no-aceptada-ui-bugs/error-context.md`.
- Traza: no versionada. Se regenera con `npm run -s test:bugs -- -g "@REQ-004" --trace=on` (comando de `03-ejecucion.md`).
