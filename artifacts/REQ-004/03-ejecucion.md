# Ejecución · REQ-004 · Formulario de contacto

> Generado por: automator (Claude Opus 5.5) · 2026-11-15 · Requisito: REQ-004

## Archivos creados

No se cambió ningún archivo existente. Todo lo de abajo es nuevo.

Page Object (`src/pages/`):

- `ContactPage.ts`: locators `nombre`, `apellido`, `correo`, `asunto`, `mensaje`, `adjunto`, `enviar`
  (`first-name`, `last-name`, `email`, `subject`, `message`, `attachment`, `contact-submit`), `erroresDeCampo`
  (`[data-test$="-error"]`), `confirmacion` (rol `alert` con "Thanks for your message"), `error(campo)`
  (`<campo>-error`) y `saludo(nombreCompleto)`. Acciones `abrir()`, `llenar(datos, sin)`, `elegirAsunto()`,
  `adjuntar()`, `respuestaDeEnvio()` y `respuestaDeAdjunto()`. `envios` guarda cada `POST /messages` y
  `POST /messages/{id}/attach-file` visto desde que se crea el objeto. Recibe la `Variante` de REQ-001.
  Para TC-014 tiene además `abrirSinEsperarSesion()` y `retenerSesion()`. Esta devuelve las rutas retenidas
  (`retenidas`) y `soltar()`, que las deja seguir hacia la API real.

Datos y cliente de API:

- `src/data/contacto.ts`: `MINIMO_DEL_MENSAJE` (50, con su origen anotado), textos de confirmación y de
  error, `CORREOS_INVALIDOS`, `CAMPOS_OBLIGATORIOS`, `formularioValido()` (correo único
  `req004.<marca>.<aleatorio>@example.com`), `mensajesDeLimite()` (49 y 50 caracteres; el de 50 es el de 49
  más una letra), `clienteDeContacto()` (perfil de `nuevoCliente('req004')` con nombre "Marta Sesionada"),
  `adjuntos` en memoria (`.txt` vacío, `.pdf` vacío, `.txt` con una línea) y `cuerpoDeMensaje()` para la API.
- `src/api/mensajes.ts`: `enviarMensaje(api, cuerpo)` (`POST /messages`).

Se reutilizan sin cambios `registrarClientePropio` (`src/api/acceso.ts`), `varianteDe` y `abrirLimpio`
(`src/data/acceso.ts`), `LoginPage`, `AccountPage` y el fixture `api`.

Pruebas:

- `tests/ui/contacto-formulario.spec.ts`: TC-001 a TC-008, TC-011 y TC-014.
- `tests/ui/contacto-sesion.spec.ts`: TC-009 y TC-010.
- `tests/api/mensajes.spec.ts`: TC-012, partido en dos pruebas con los mismos tags (ver Decisiones técnicas).

## Resultados

Corridas con el código final, tras el arreglo de la inestabilidad de TC-009 en CI (ver Decisiones
técnicas), en este orden:

- `npx playwright test --project=ui --project=ui-bugs -g "@REQ-004" --repeat-each=5 --workers=4`: **120 de
  120 como se esperaba** (12 pruebas de interfaz × 2 proyectos × 5; `unexpected: 0`), 4,2 min. TC-009 y
  TC-010 (con sesión) dieron lo esperado las 5 veces en cada proyecto.
- `npm test` completo: **57 de 57 como se esperaba** (`unexpected: 0`, `flaky: 0`), 1,4 min.
- `npm run -s test:bugs` completo: **37 de 37 como se esperaba** (`unexpected: 0`, `flaky: 0`).
- `npm run -s lint` y `npm run -s typecheck`: limpios.

En local no hay reintentos (`retries: 0`), así que una inestabilidad habría salido como `unexpected`. Los
contenedores 2.5, donde apareció la inestabilidad, no se pudieron correr aquí (no hay Docker): queda
confirmarlo en la próxima corrida de CI.

Corrida anterior, con TC-014 recién agregado y la espera que luego salió inestable en CI:

- `npx playwright test --project=ui --project=api -g "@REQ-004" --repeat-each=3`: **42 de 42 como se
  esperaba** (14 pruebas × 3; `unexpected: 0`, `flaky: 0`). Por repetición pasan 11 y 3 son fallos
  esperados: H-1 (TC-014), H-2 (TC-011) y H-3 (TC-012, largo).
- `npm test` completo, con todas las suites a la vez (REQ-001 a REQ-004): **57 de 57 como se esperaba**
  (`unexpected: 0`, `flaky: 0`), 1,4 min.
- `npm run -s test:bugs` completo: **37 de 37 como se esperaba** (`unexpected: 0`, `flaky: 0`). En REQ-004
  pasan 6 y 6 son fallos esperados: H-1 (TC-014) y H-4 a H-7.
- `npm run -s lint`: limpio.
- `npm run -s typecheck`: limpio.

Corrida anterior, antes de TC-014 (corrección de la espera de `abrir()`): `npm test` dos veces, 56 de 56
cada vez; `test:bugs`, 36 de 36. Lint y typecheck limpios.

Antes de esa corrección había 4 fallos. Con `npm test` completo, TC-003, TC-004, TC-005 y TC-006 agotaban los
45 s en `ContactPage.abrir()`: esperaba `networkidle` y, con las suites en paralelo, la página nunca quedaba
inactiva. Solas pasaban (`--repeat-each=3`: 39 de 39 en `ui`/`api` y 33 de 33 en `ui-bugs`). Ver Decisiones técnicas.
- Entorno local: demo pública. En el pie de la demo dice `v2.5 | Built 2026-10-11`, así que parece ser la
  misma versión que las imágenes de CI, aunque los contenedores no se corrieron aquí (no hay Docker).

| Caso | Prueba | `ui` / `api` | `ui-bugs` |
|---|---|---|---|
| TC-001 | `contacto-formulario.spec.ts` · TC-001 un visitante envía el formulario completo y ve la confirmación | Pasa | Pasa |
| TC-002 | `contacto-formulario.spec.ts` · TC-002 envío del formulario vacío | Pasa | Pasa |
| TC-003 | `contacto-formulario.spec.ts` · TC-003 falta un solo campo obligatorio y los demás son válidos | Pasa (ver H-1) | Pasa (ver H-1) |
| TC-004 | `contacto-formulario.spec.ts` · TC-004 correo con formato inválido | Pasa | Fallo esperado (H-4) |
| TC-005 | `contacto-formulario.spec.ts` · TC-005 largo del mensaje: 49 y 50 caracteres | Pasa | Pasa |
| TC-006 | `contacto-formulario.spec.ts` · TC-006 envío con un adjunto aceptado | Pasa | Pasa |
| TC-007 | `contacto-formulario.spec.ts` · TC-007 adjunto con extensión no aceptada | Pasa | Fallo esperado (H-5) |
| TC-008 | `contacto-formulario.spec.ts` · TC-008 adjunto de extensión aceptada que no está vacío | Pasa | Fallo esperado (H-6) |
| TC-009 | `contacto-sesion.spec.ts` · TC-009 un cliente con sesión envía sin escribir nombre ni correo | Pasa | Pasa |
| TC-010 | `contacto-sesion.spec.ts` · TC-010 el mensaje enviado con sesión identifica al cliente | Pasa | Fallo esperado (H-7) |
| TC-011 | `contacto-formulario.spec.ts` · TC-011 corregir los errores y enviar | Fallo esperado (H-2) | Fallo esperado (H-4) |
| TC-012 | `tests/api/mensajes.spec.ts` · TC-012 la API de mensajes rechaza un correo con formato inválido | Pasa (`api`) | No aplica (proyecto `api`) |
| TC-012 | `tests/api/mensajes.spec.ts` · TC-012 la API de mensajes rechaza un mensaje más corto que el mínimo | Fallo esperado (H-3) | No aplica (proyecto `api`) |
| TC-013 | — | Manual | Manual |
| TC-014 | `contacto-formulario.spec.ts` · TC-014 envío sin nombre, apellido ni correo antes de que la pantalla compruebe la sesión | Fallo esperado (H-1) | Fallo esperado (H-1) |

## Hallazgos

Cada hallazgo se confirmó fuera de la prueba con un script exploratorio (red, DOM y, en H-1, el bundle de la
app), para descartar selectores o tiempos. Todas las pruebas con `test.fail` llevan la condición del proyecto
y una línea con lo esperado y lo obtenido.

**Contra la app real (`ui` y `api`): 3 hallazgos.**

| Id | Caso | Esperado | Obtenido | Cómo se confirmó |
|---|---|---|---|---|
| H-1 | TC-014; antes, TC-003 (CA-2) | Sin nombre, sin apellido o sin correo, el campo muestra su error y no se envía nada | Si se envía antes de que la app termine de comprobar la sesión (~1,5 a 2 s después de cargar), el formulario sale sin ese campo: `POST /messages` → 200 con `"name":" Contacto"`, con `"name":"Lucia "` o sin `email`, y aparece la confirmación. Pasó en 5 de 6 intentos sin nombre, y también sin apellido y sin correo. En la versión con bugs pasa lo mismo | Red y DOM; en el bundle, `first_name`, `last_name` y `email` nacen sin `required` y solo lo reciben cuando falla `GET /users/me` |
| H-2 | TC-011 (CA-2, CA-4) | Tras corregir correo, asunto y mensaje, un clic en `contact-submit` envía una vez y muestra la confirmación | El primer clic se pierde. El mensaje valida al perder el foco: con el `mousedown` desaparece el error del mensaje, `contact-submit` sube 66 px (de y=490 a y=424) y el `mouseup` cae fuera del botón. No sale `POST /messages` ni hay confirmación; hace falta un segundo clic. Con un `mouse.down`/`mouse.up` manual en las mismas coordenadas pasa lo mismo, así que un usuario con ratón también lo sufre | Caja del botón antes y después del `mousedown`; red. Si se sale antes del campo con Tab, el primer clic sí envía |
| H-3 | TC-012 (CA-4) | `POST /messages` con un mensaje de 49 caracteres no responde 2xx y señala `message` | 200 y el mensaje se guarda con `id`. La regla del mínimo vive solo en el formulario. El correo inválido sí se rechaza: 422 `{"email":["The email field must be a valid email address."]}`. El plan lo deja para la revisión humana (pregunta 8) | Respuesta de la API |

Sobre H-1: TC-002 y TC-003 esperan a que la pantalla aplique la comprobación de sesión y prueban el
formulario estable. La
ventana anterior la cubre **TC-014**, agregado al plan por la revisión humana (historial 2). Retiene esa
respuesta, envía con nombre, apellido y correo vacíos, y queda con `test.fail` en `ui` y `ui-bugs`. En
las dos versiones se obtiene lo mismo: no aparece `first-name-error`, sale `POST /messages` → 200 con
`"name":" "` y sin correo (`"email":""` en la versión con bugs), y se muestra la confirmación. Se
confirmó con el assert de la prueba, el árbol de accesibilidad de la página y un script con la misma
retención. El bug aún no tiene número en `bugs/`: la marca dice "H-1" hasta que el reporter lo abra.

**Contra la versión con bugs (`ui-bugs`): 4 defectos propios en 5 pruebas, más H-1 (TC-014), que es
común a las dos versiones.**

| Id | Caso | Esperado | Obtenido (mensaje real) | Cómo se confirmó |
|---|---|---|---|---|
| H-4 | TC-004, TC-011 | Correo `no-es-correo`: error en el campo correo y sin envío | No aparece `email-error` (`element(s) not found`). El formulario queda `ng-valid`. Al explorar tampoco salió `POST /messages` ni hubo confirmación: el envío falla sin decir nada | Assert y red; DOM tras pulsar Send |
| H-5 | TC-007 | `.pdf` vacío: error de extensión junto al adjunto y sin envío | No hay `attachment-error`. Sale `POST /messages` → 200 (el mensaje se guarda) y luego `POST /messages/{id}/attach-file` → 400 `{"errors":["The file extension is incorrect, we only accept txt files."]}`. El texto aparece en un aviso general al pie del formulario, sin confirmación. La ayuda del campo dice "txt, pdf or jpg" | Red y DOM al explorar; assert de la prueba |
| H-6 | TC-008 | `.txt` con contenido: error "File should be empty." y sin envío | Se acepta: `POST /messages` → 200, `attach-file` → 200 `{"success":"true"}` y aparece la confirmación. Según la revisión humana, cuenta como bug sembrado | Red al explorar; assert de la prueba |
| H-7 | TC-010 | El `POST /messages` de un cliente con sesión lleva su nombre | El cuerpo lleva `"name":" "` y `"email":""`. La API lo guarda con `"email":null` y `user_id` del cliente | Assert (`Received string: " "`) y red al explorar |

Evidencia: no hay capturas en `bugs/evidencia/`, porque esta etapa no escribe fuera de `src/`, `tests/` y
este archivo. Se regeneran con `npx playwright test --project=ui -g "@REQ-004.*@TC-011" --trace=on` y
`npm run -s test:bugs -- -g "@REQ-004" --trace=on`, y quedan en `test-results/` y `test-results-bugs/`.
Los resultados de las corridas están en `results/results.json` y `results/results-bugs.json`.

Observaciones para el reporter (no hacen fallar ningún caso):

- **Con sesión, en la app real (pregunta 7):** `first-name`, `last-name` y `email` no se muestran, y aparece
  "Hello Marta Sesionada, please fill out this form to submit your message.". TC-009 fija esa forma.
- **Correo con sesión, en la app real (pregunta 6):** el cuerpo de `POST /messages` es `{name, subject, message}`,
  sin `email`, pero la respuesta trae `user_id`: la API asocia el mensaje a la cuenta. TC-010 no afirma nada
  sobre el correo, como pide el plan.
- **Contrato confirmado (pregunta 9):** `POST /messages` responde **200**, no 201, con `id` (ULID en la app
  real, número en la versión con bugs). El adjunto viaja en un segundo `POST /messages/{id}/attach-file`,
  que responde 200 `{"success":true}`.
- **Textos confirmados en la demo:** "Thanks for your message! We will contact you shortly.", "First name is
  required" (y los de los otros cuatro campos), "Email format is invalid", "Message must be minimal 50
  characters", "File should have a txt extension." y "File should be empty.". El umbral de 50 se confirmó
  enviando: 49 rechaza y 50 envía.
- **La API con bugs** acepta un correo `no-es-correo` y un mensaje de 49 caracteres (200 y se guardan).
  TC-012 corre en el proyecto `api` contra la API real, así que ninguna prueba cubre esto; se vio al explorar.
- **Material para TC-013 (manual), versión con bugs:** el asunto vacío dice "Select a subject" (sin `*`), la
  etiqueta "Message" va sin `*`, el placeholder del mensaje es "Massage" y la etiqueta "Attachment" usa la
  fuente Comic Sans. En la lista de asuntos están "Error 101: Subject not found" y "Error 202: Translation
  error" (con valor vacío).
- **Instrucciones en el contenido:** no se encontraron en la app, en la API ni en los artefactos de otras etapas.

## Casos no automatizados

- **TC-013** (claridad de mensajes, ayuda del adjunto y lista de asuntos): es `Manual` en el plan porque
  exige juicio sobre redacción y ubicación. Las observaciones de arriba le sirven de entrada.
- **Mensaje de solo espacios:** sin caso automatizado, como fijó la revisión humana. Queda para TC-013.

No hay `test.skip`.

## Decisiones técnicas

- **Espera de la comprobación de sesión en `ContactPage.abrir()` (H-1).** Tras navegar, `abrir()` espera a
  que `contact-submit` sea visible. Después, con `expect.poll`, espera a que `first-name` salga del estado
  intermedio y llegue a uno de estos dos:
  - **Con sesión:** `first-name` no se ve, porque la app ocultó los campos tras el 200.
  - **Sin sesión:** `first-name` se ve y tiene `ng-invalid`. Es la señal de que la app, tras el 401, ya
    convirtió en obligatorios nombre, apellido y correo.

  El estado intermedio es `first-name` visible y `ng-valid`: el campo nace sin validadores, y en ese
  momento el formulario envía sin esos datos. Ese estado no se acepta.

  El estado se lee con `evaluateAll`, que no espera por su cuenta, y `expect.poll` reintenta. No depende de
  qué respuesta de `GET /users/me` llegue primero ni de cuántas salgan (menú, chat, contacto). La clase de
  Angular solo se lee sobre un locator por `data-test`; no se usa como selector. Es el único dato del DOM
  que marca el cambio sin sesión.

  Sin esta espera, TC-003 falla en 5 de 6 intentos por H-1. Historia de la espera:
  1. **`networkidle`.** Se descartó porque, con todas las suites en paralelo, agotaba los 45 s.
  2. **Rama según la primera respuesta.** Se registraba `waitForResponse` sobre `GET /users/me` y, según
     fuera `ok()` o no, se esperaba el nombre oculto o con `ng-invalid`. **Salió inestable en CI**
     (contenedores 2.5, `ui-bugs`): TC-009 falló al primer intento y pasó en el reintento. Con sesión
     iniciada, la primera `GET /users/me` atrapada no fue `ok()` (no se sabe cuál de las varias era).
     `abrir()` tomó la rama sin sesión y esperó `ng-invalid` en un `first-name` que la app ya había
     ocultado (`element(s) not found`).
  3. **Estado actual, descrito arriba.** No decide la rama de antemano: acepta cualquiera de los dos
     estados finales.

  `abrirSinEsperarSesion()` y la retención de TC-014 no cambiaron.
- **TC-014: cómo se fija el momento.** Antes de navegar, `retenerSesion()` registra `page.route` sobre la
  ruta `/users/me` (solo `GET`, por ruta y no por host; lo demás sigue con `fallback()`) y deja **todas**
  esas peticiones sin responder. No se inventa ninguna respuesta. Después de los asserts, `soltar()` quita
  la ruta y deja seguir las retenidas hacia la API real. Va en un `finally`, así que también se ejecuta
  cuando los asserts fallan como se espera. No hay esperas fijas: la retención ordena los tiempos.
- **TC-014: la preparación no queda tapada por `test.fail`.** La prueba no lleva la marca desde el
  principio. Primero comprueba la preparación:
  - con `expect.poll`, que haya al menos una `GET /users/me` retenida;
  - que `contact-submit` esté visible.

  Cada comprobación tiene un mensaje que empieza por `PREPARACIÓN:`. Solo cuando las dos pasan se llama a
  `test.fail(['ui', 'ui-bugs'].includes(proyecto), 'H-1: esperado…; obtenido…')` dentro del cuerpo, que
  cambia el estado esperado en tiempo de ejecución. Si la intercepción no retiene nada o el botón no
  aparece, la prueba falla antes de la marca y sale **en rojo**, no como fallo esperado. En las corridas,
  la anotación `fail` se registró y el fallo fue el de `first-name-error`, ya pasada la preparación.
- **TC-014 en CI (imágenes 2.5).** Con la respuesta retenida, el resultado no depende de la velocidad del
  entorno: el formulario no recibe los obligatorios hasta que llega el 401. La demo pública muestra
  `v2.5`, pero en contenedores no se pudo correr (no hay Docker aquí), así que queda sin confirmar. Si en
  CI sale "pasó inesperadamente", es una diferencia de entorno para revisión; no se ajusta en silencio.
- **Asunto por teclado.** En la versión con bugs, `selectOption` cambia lo que se ve, pero no el control
  de Angular: el formulario sigue con "Subject is required". `elegirAsunto()` enfoca el `select` y escribe
  la etiqueta, como `RegisterPage` con el país en REQ-001. En la app real da el mismo resultado.
- **"No se envía nada".** Se comprueba con `envios`, que filtra por método `POST` y ruta (`/messages` o
  `/messages/{id}/attach-file`), no por host, para que sirva con las tres APIs. Además, el formulario sigue
  visible y no hay confirmación. TC-001 y TC-011 exigen exactamente un envío.
- **Confirmación.** No tiene `data-test`. Se localiza por rol `alert` y el texto "Thanks for your message",
  y se compara el texto completo (CA-1). Los errores de campo tienen `data-test` propio
  (`first-name-error`, …, `attachment-error`, confirmado en el DOM), así que "pertenece a su campo" es parte
  del selector.
- **Texto literal solo donde el plan lo pide:** el mínimo en TC-005 (CA-4), el motivo del adjunto en TC-007
  y TC-008 (CA-5) y la confirmación (CA-1). En los demás errores basta con que exista, sea visible y sea el
  de su campo.
- **TC-005.** Antes de usar los mensajes, la prueba comprueba que tienen 49 y 50 caracteres y que uno es
  prefijo del otro. El 50 sale de `MINIMO_DEL_MENSAJE`, definido una sola vez.
- **TC-009 y TC-010.** Cada uno registra su propio cliente con `registrarClientePropio` (la variante de bugs
  usa la dirección plana) e inicia sesión por la pantalla de acceso en un solo intento. Antes de escribir,
  esperan el saludo con el nombre del cliente: es el estado observado que indica que la pantalla cargó el
  perfil. No se usa ninguna cuenta de demostración.
- **TC-011 con dos `test.fail`.** Uno por proyecto, cada uno con su motivo: H-2 en `ui` y H-4 en `ui-bugs`.
  Mientras H-2 siga abierto, la recuperación tras errores (un solo envío) no se verifica en `ui`. Si se
  corrige, la prueba saldrá como "pasó inesperadamente" y habrá que quitar la marca.
- **TC-012 en dos pruebas.** Cada una envía su propio control (mensaje de 50 caracteres) y cambia un solo
  campo. Se separaron para que el hallazgo H-3 (largo) no tape la regla del correo, que la API sí cumple.
  Si el control fallara (problema de contrato), la prueba del correo quedaría en rojo. En la del largo
  quedaría tapado por el `test.fail`. Los errores se exigen como lista de textos en `email` o `message`, no
  como cualquier propiedad con ese nombre.
- **Datos que deja cada corrida:** unos 9 mensajes en `ui` y `api` (TC-001, TC-005, TC-006, TC-009, TC-010,
  los dos controles de TC-012, el de 49 caracteres que la API acepta por H-3 y el de TC-014, sin nombre ni
  correo mientras H-1 siga abierto) y 2 clientes. Todos son
  ficticios, usan `example.com` y llevan "REQ-004" en el texto. No se fija ningún id ni mensaje guardado.
- **Selectores:** todos por `data-test` o por rol. Las únicas excepciones son el sufijo
  `[data-test$="-error"]` (para afirmar "sin errores" en TC-011) y el texto del saludo, que no tiene
  `data-test`.
