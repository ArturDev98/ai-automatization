# BUG-019 · El mensaje de un cliente con sesión sale con el nombre en blanco y sin correo

- **Requisito:** REQ-004
- **Casos:** TC-010
- **Ambiente:** ui-bugs · https://with-bugs.practicesoftwaretesting.com
- **Severidad:** Media

**Prioridad: Media.** El cliente con sesión no escribe su nombre (CA-6 lo exime), y el mensaje sale con el nombre en blanco y sin correo. La API asocia el mensaje a la cuenta (`user_id`, según `03-ejecucion.md`), así que la tienda puede localizar al cliente, pero el mensaje no lleva su nombre ni su correo. Por eso es Media y no Alta.

## Pasos para reproducir

1. Registrar un cliente con `POST /users/register` y entrar con ese cliente por la pantalla de acceso (`https://with-bugs.practicesoftwaretesting.com/#/auth/login`).
2. Abrir la pantalla de contacto con la sesión iniciada. Sin escribir nombre ni correo, elegir el asunto `Payments` y escribir un mensaje válido.
3. Pulsar Send y leer el cuerpo de `POST /messages`.

Con la suite: `npm run -s test:bugs -- -g "@REQ-004.*@TC-010"`.

## Resultado esperado

El cuerpo de `POST /messages` lleva el nombre del cliente (contiene su nombre de pila y su apellido, no una cadena vacía).

## Resultado obtenido

Mensaje real del fallo (`results/results-bugs.json`, `ui-bugs`):

`expect(received).toContain(expected)` — Expected substring: `"Marta"`. Received string: `" "`.

Según `03-ejecucion.md`: el cuerpo lleva `"name":" "` y `"email":""`. La API guarda el mensaje con `"email":null` y `user_id` del cliente.

## Evidencia

- Contexto del fallo (existe en el repo): `test-results/contacto-sesion-Formulario-1b86f-esión-identifica-al-cliente-ui-bugs/error-context.md`.
- Traza: no versionada. Se regenera con `npm run -s test:bugs -- -g "@REQ-004" --trace=on` (comando de `03-ejecucion.md`).
