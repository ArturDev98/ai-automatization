# Ejecución · REQ-001 · Acceso de clientes: inicio de sesión y registro

> Generado por: automator (Claude Opus 5.5) · 2026-11-14 · Requisito: REQ-001

## Archivos creados

Page Objects (`src/pages/`):

- `Menu.ts`: barra superior. Locators `iniciarSesion` (`nav-sign-in`), `menuCliente` (`nav-menu`, o
  `nav-user-menu` en la versión con bugs), `miCuenta` (`nav-my-account`) y `cerrarSesion` (`nav-sign-out`);
  acciones `abrirInicioDeSesion()` y `salir()`. No depende de la variante, así que REQ-002 puede usarlo tal cual.
- `LoginPage.ts`: `correo`, `clave`, `enviar`, `errorCorreo` (`email-error`), `errorClave` (`password-error`),
  `errorCredenciales` (`login-error`), `envios` (peticiones `POST /users/login` vistas) y `abrir()`, `intentar()`, `entrar()`.
- `RegisterPage.ts`: `llenar(cliente, sin)` rellena los campos marcados con `*` salvo `email`/`password`;
  `registrar()`, `errorCorreo`, `errorClave`, `erroresDeCampo` y `envios` (`POST /users/register`).
- `AccountPage.ts`: `titulo` (`page-title` con "My account") y `abrir()`.

Datos y precondiciones (archivos nuevos; no se editó nada de la base compartida):

- `src/data/acceso.ts`: `perfilAcceso()` (perfil de `nuevoCliente('req001')` con nombre "Valeria Acceso"),
  `clavesFueraDePolitica()` (cuatro claves derivadas de `claveSegura()`, cada una incumple una sola regla),
  `clavesDeLimite()` (7 y 8 caracteres; la de 8 es la de 7 más una letra), `NUMERO_DE_CASA`, y el soporte de
  variante: `varianteDe()`, `rutaDe()`, `abrirLimpio()` y `cuerpoDeRegistro()`.
- `src/api/acceso.ts`: `registrarClientePropio(api, cliente, variante)`. En la app actual delega en
  `registrarYEntrar`; en la versión con bugs envía el cuerpo con la dirección plana. Si falla, el error empieza por "Entorno:".

Pruebas:

- `tests/ui/acceso-login.spec.ts`: TC-001 a TC-005.
- `tests/ui/acceso-registro.spec.ts`: TC-006 a TC-009.
- `tests/ui/acceso-sesion.spec.ts`: TC-010 y TC-012.
- `tests/api/registro.spec.ts`: TC-011.

## Resultados

- `npx playwright test --project=ui --project=api -g "@REQ-001" --repeat-each=3`: **36 de 36 en verde**
  (12 pruebas × 3), en dos corridas seguidas con el código final (50 s y 1,0 min). Una corrida intermedia
  dio 11 timeouts en `fill`/`focus` y tardó 4,4 min, mientras corría en paralelo la suite de REQ-002; se
  repitió sin cambiar nada y salió en verde (ver Decisiones técnicas).
- `npx playwright test --project=ui-bugs -g "@REQ-001"`: **11 de 11 como se esperaba**: 5 pasan y 6 son
  fallos esperados por defectos confirmados (`unexpected: 0`).
- `npm run -s lint`: falla **solo** por `src/data/compra.ts:45` (`no-irregular-whitespace`), un archivo de
  REQ-002. Los archivos de REQ-001 pasan `eslint` limpios.
- `npm run -s typecheck`: falla **solo** por `tests/ui/catalogo.spec.ts` (líneas 73 y 79, `toEqual` sobre un
  assert web-first), de REQ-002. Los archivos de REQ-001 no tienen errores de tipos.

| Caso | Prueba | `ui` / `api` | `ui-bugs` |
|---|---|---|---|
| TC-001 | `acceso-login.spec.ts` · TC-001 inicio de sesión con correo y clave correctos | Pasa | Fallo esperado (H-1) |
| TC-002 | `acceso-login.spec.ts` · TC-002 inicio de sesión con un correo que no existe | Pasa | Pasa |
| TC-003 | `acceso-login.spec.ts` · TC-003 inicio de sesión con clave incorrecta de un cliente registrado | Pasa | Pasa |
| TC-004 | `acceso-login.spec.ts` · TC-004 inicio de sesión con correo y clave vacíos | Pasa | Fallo esperado (H-2) |
| TC-005 | `acceso-login.spec.ts` · TC-005 inicio de sesión con correo de formato inválido | Pasa | Fallo esperado (H-3) |
| TC-006 | `acceso-registro.spec.ts` · TC-006 registro válido e inicio de sesión con las credenciales creadas | Pasa | Fallo esperado (H-1) |
| TC-007 | `acceso-registro.spec.ts` · TC-007 registro con los campos obligatorios vacíos | Pasa | Pasa |
| TC-008 | `acceso-registro.spec.ts` · TC-008 registro con clave que incumple una regla de composición | Pasa | Fallo esperado (H-4) |
| TC-009 | `acceso-registro.spec.ts` · TC-009 longitud de la clave en el registro: 7 y 8 caracteres | Pasa | Fallo esperado (H-5) |
| TC-010 | `acceso-sesion.spec.ts` · TC-010 cierre de sesión y acceso directo a My account | Pasa | Pasa |
| TC-011 | `tests/api/registro.spec.ts` · TC-011 la API de registro rechaza una clave fuera de política | Pasa (`api`) | No aplica (proyecto `api`) |
| TC-012 | `acceso-sesion.spec.ts` · TC-012 botón atrás del navegador después de cerrar sesión | Pasa | Pasa |
| TC-013 | — | Manual | Manual |

## Hallazgos

**Contra la app real (`ui` y `api`): ninguno.** La app cumple todos los resultados esperados del plan.

**Contra la versión con bugs (`ui-bugs`): 5 defectos confirmados en 6 pruebas.** Cada prueba lleva
`test.fail(testInfo.project.name === 'ui-bugs', '<esperado; obtenido>')`, así que en `ui` sigue siendo estricta.
Cada uno se confirmó con el mensaje del assert, la captura o el árbol de accesibilidad y la red de la traza,
para descartar selectores o tiempos.

| Id | Caso | Esperado | Obtenido (mensaje real) | Cómo se confirmó |
|---|---|---|---|---|
| H-1 | TC-001, TC-006 | Tras entrar, el menú superior muestra el nombre del cliente ("Valeria") | `nav-user-menu` muestra `" User Data not found "` en `/#/account`, aunque `GET /users/me` responde 200. En TC-006 el cliente se registró por la propia UI, así que no se debe al cuerpo de registro por API | Captura con "My account" y "User Data not found"; red de la traza |
| H-2 | TC-004 | Correo y clave vacíos: un error en cada campo, sin petición de inicio de sesión | No aparece `email-error` (`element(s) not found`); sale `POST /users/login` → 401 y se muestra "Invalid email or password" | Assert y red de la traza (`POST /users/login 401`) |
| H-3 | TC-005 | Correo `cliente.example.com`: error de formato en el campo y sin envío | No aparece `email-error`; sale `POST /users/login` → 401. El campo es `type=text` y no hay validación en el cliente | Assert y red de la traza |
| H-4 | TC-008 | Una clave de 8 caracteres o más sin mayúscula no se acepta | `POST /users/register` → 201 y redirección a `/#/auth/login` (`password-error`: `element(s) not found`). Una prueba manual con el mismo perfil muestra que también se aceptan sin minúscula, sin número y sin símbolo: solo se exige la longitud | Árbol de accesibilidad en "Login"; red de la traza (`POST /users/register 201`); script exploratorio |
| H-5 | TC-009 | Una clave válida de 8 caracteres se acepta y lleva a `/auth/login` | Se queda en `/#/auth/register` con `Password must be minimal 10 characters long.`, sin petición de registro | Árbol de accesibilidad del error; red de la traza |

Evidencia: las capturas de cada defecto están en `bugs/evidencia/REQ-001-TC-00X.png`. Las trazas no se
versionan; se regeneran con `npx playwright test --project=ui-bugs -g "@REQ-001" --trace=on` y quedan en
`test-results/<prueba>-ui-bugs/trace.zip`. El resultado de la corrida está en `results/results-bugs.json`.

Observaciones para el reporter (no son fallos de un caso del plan):

- **La API con bugs acepta una clave sin símbolo** (`POST /users/register` → 201) y exige 9 caracteres
  (`The password field must be at least 9 characters.`). TC-011 corre en el proyecto `api` contra la API
  real, así que esto no lo cubre ninguna prueba; se vio al explorar.
- **Textos de error de la clave en la app real** (material para TC-013, manual): con 7 caracteres el
  formulario dice `Password must be minimal 6 characters long.`, aunque la política pide 8. Con una
  regla de composición incumplida dice `Password can not include invalid characters.`, que no indica qué
  regla falta. La API real sí la indica, por ejemplo `The password field must contain at least one symbol.`
- **Códigos de rechazo de la API real (pregunta abierta 10):** 422 con `{"password": [...]}`. Con 7
  caracteres responde `The password field must be at least 8 characters.`
- **La versión con bugs valida el correo del registro contra mayúsculas** (`E-mail format is invalid.`
  para un correo con letras mayúsculas). Los correos de la suite son en minúscula y no les afecta.

## Casos no automatizados

- **TC-013** (claridad y ubicación de los mensajes de error): es `Manual` en el plan porque exige juicio
  sobre redacción, ubicación y legibilidad. Las observaciones de arriba le sirven de entrada.

No hay `test.skip`.

## Decisiones técnicas

- **Dos generaciones de la app.** `with-bugs.practicesoftwaretesting.com` no es la app actual con
  defectos sembrados: es una versión anterior. Usa rutas con hash (`/#/auth/login`; `/auth/login`
  responde 404), un formulario de registro con `address` y `postcode` (sin `street`, `house_number` ni
  `postal_code`), `nav-user-menu` en vez de `nav-menu` y una API con la dirección plana. Los Page Objects
  reciben una `Variante` (`varianteDe(testInfo.project.name)`) que resuelve estas diferencias. Los asserts son
  los mismos en ambas.
- **Formulario limpio en cada apertura.** Con rutas `#/`, `goto` a la misma URL no recarga y el formulario
  conserva lo escrito. Esto daba un falso fallo en TC-007 ("sin clave" con la clave del paso anterior).
  `abrirLimpio()` pasa por `about:blank` en esa variante. En la app actual no cambia nada.
- **País por teclado.** `RegisterPage` elige el país enfocando el `select` y escribiendo su etiqueta.
  En la versión con bugs, `selectOption` (y cualquier evento sintético: `input`, `change`, `blur`…) cambia
  el valor visible pero no el control de Angular, y el registro sigue con "Country is required". Solo
  funcionan los eventos de teclado reales. No se pudo comprobar con un clic real en el desplegable nativo
  (en headless no se puede), así que no se reporta como defecto. En la app actual el resultado es el mismo.
- **Precondición "cliente propio".** Cada caso que la necesita (TC-001, TC-003, TC-010 y TC-012) registra
  su propio `perfilAcceso()` con correo único mediante `registrarClientePropio`, y comprueba alta y login antes
  de empezar. No se usó el fixture `cliente` porque registra con el nombre genérico "Qa Flow", que no sirve
  para un assert distintivo del menú, y porque no conoce el cuerpo de la API con bugs.
- **Un solo intento fallido por cliente.** TC-003 hace un único `login-submit` sobre su cliente exclusivo y
  comprueba que salió una sola petición (`envios` de longitud 1). TC-008 hace un login por API por correo
  sin registrar. Ninguna prueba usa la cuenta de demostración.
- **"No se envía el formulario"** (TC-004, TC-005, TC-007) se verifica con las peticiones `POST`
  registradas por el Page Object desde que se crea, además de URL y mensajes.
- **Precondición de TC-010.** Se comprueba que hay sesión abierta (título "My account" y menú del cliente
  visibles), no el nombre en el menú. El nombre ya lo verifica TC-001. Así, en `ui-bugs`, el defecto H-1 no
  tapa la verificación del cierre de sesión, que en esa versión sí funciona. Los resultados esperados del caso no cambiaron.
- **TC-010/TC-012 en la app actual:** tras cerrar sesión, `/account`, el botón atrás y la recarga llevan a
  `/auth/login` (se confirma la suposición de la pregunta abierta 6).
- **TC-011** verifica que el rechazo no es 2xx, que el cuerpo no trae `id` y que trae errores en `password`.
  El control con clave válida responde 201.
- **Inestabilidad por carga.** La corrida de `--repeat-each=3` que coincidió con la suite de REQ-002 en la
  misma máquina dio 11 timeouts en acciones simples (`fill`/`focus` esperando "visible, enabled"). Las dos
  corridas siguientes, sin cambios, dieron 36 de 36. Si se repite en CI conviene limitar los workers cuando
  corren varias suites a la vez.
- **Selectores:** todos por `data-test`. Las excepciones son el sufijo `[data-test$="-error"]` de
  `erroresDeCampo` (para afirmar "sin mensajes de error" en TC-006) y `option[value="CO"]`, que solo sirve
  para leer la etiqueta del país.
