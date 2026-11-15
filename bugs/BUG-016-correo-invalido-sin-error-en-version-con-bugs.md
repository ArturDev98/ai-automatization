# BUG-016 · Un correo con formato inválido no muestra error en la versión con bugs

- **Requisito:** REQ-004
- **Casos:** TC-004, TC-011
- **Ambiente:** ui-bugs · https://with-bugs.practicesoftwaretesting.com
- **Severidad:** Media

**Prioridad: Media.** El visitante escribe un correo mal formado y el formulario no le dice nada: no aparece error en el campo, no sale el envío y no hay confirmación. No llega ningún dato erróneo a la tienda, pero el visitante no sabe qué corregir. Es la causa de dos casos (TC-004 y TC-011), por eso va en un solo bug.

## Pasos para reproducir

1. Abrir `https://with-bugs.practicesoftwaretesting.com/#/contact`.
2. Escribir nombre, apellido, asunto y un mensaje válido; en correo, escribir `no-es-correo`.
3. Pulsar Send.

Con la suite: `npx playwright test --project=ui-bugs -g "@REQ-004.*@TC-004"`.

## Resultado esperado

Aparece un error junto al campo correo que dice que el formato no es válido. No sale ningún `POST /messages`, el formulario sigue visible y no aparece la confirmación.

## Resultado obtenido

Mensaje real del fallo (`results/results-bugs.json`, `ui-bugs`, TC-004 y TC-011):

`Error: element(s) not found` en `expect(locator).toBeVisible()`, Locator: `getByTestId('email-error')`, Timeout: 10000ms.

Según `03-ejecucion.md`: el formulario queda `ng-valid`, no sale `POST /messages` y no hay confirmación; el envío falla sin decir nada.

## Evidencia

- Contexto del fallo (existen en el repo): `test-results/contacto-formulario-Formul-c41c1-correo-con-formato-inválido-ui-bugs/error-context.md` (TC-004) y `test-results/contacto-formulario-Formul-0b3c2-rregir-los-errores-y-enviar-ui-bugs/error-context.md` (TC-011).
- Traza: no versionada. Se regenera con `npm run -s test:bugs -- -g "@REQ-004" --trace=on` (comando de `03-ejecucion.md`).
