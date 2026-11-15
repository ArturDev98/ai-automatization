# Reporte · REQ-001 · Acceso de clientes: inicio de sesión y registro

> Generado por: reporter (Claude Haiku 5.5) · 2026-11-14 · Requisito: REQ-001

## Resumen

- **Qué se probó:** inicio de sesión, registro y cierre de sesión (CA-1 a CA-6): 12 pruebas automatizadas (11 de interfaz y 1 de API) y 1 caso manual (TC-013), contra la app real y contra la versión con bugs.
- **Resultado:** en la app real (`ui` y `api`) pasan 12 de 12. En `ui-bugs`, 5 pasan y 6 fallan como se esperaba por 5 defectos confirmados (BUG-001 a BUG-005). TC-013 sigue pendiente.
- **Bloqueos:** ninguno en la app real. Los fallos de `ui-bugs` son defectos de esa versión, no de la prueba ni de la app real. Hay observaciones de inestabilidad bajo carga, sin causa confirmada (ver al final).

## Resultados por caso y proyecto

Fuente: `results/results.json` (proyectos `ui` y `api`), `results/results-bugs.json` (proyecto `ui-bugs`) y la matriz `results/trazabilidad.json`. "Pasa" = prueba en verde; "Bug conocido" = fallo esperado por `test.fail` en `ui-bugs`.

| Caso | Título | Criterio | `ui` | `api` | `ui-bugs` |
|---|---|---|---|---|---|
| TC-001 | Inicio de sesión con correo y clave correctos | CA-1 | Pasa | — | Bug conocido (BUG-001) |
| TC-002 | Inicio de sesión con un correo que no existe | CA-2 | Pasa | — | Pasa |
| TC-003 | Inicio de sesión con clave incorrecta de un cliente registrado | CA-2 | Pasa | — | Pasa |
| TC-004 | Inicio de sesión con correo y clave vacíos | CA-3 | Pasa | — | Bug conocido (BUG-002) |
| TC-005 | Inicio de sesión con correo de formato inválido | CA-3 | Pasa | — | Bug conocido (BUG-003) |
| TC-006 | Registro válido e inicio de sesión con las credenciales creadas | CA-4 | Pasa | — | Bug conocido (BUG-001) |
| TC-007 | Registro con los campos obligatorios vacíos | CA-5 | Pasa | — | Pasa |
| TC-008 | Registro con clave que incumple una regla de composición | CA-5 | Pasa | — | Bug conocido (BUG-004) |
| TC-009 | Longitud de la clave en el registro: 7 y 8 caracteres | CA-5 | Pasa | — | Bug conocido (BUG-005) |
| TC-010 | Cierre de sesión y acceso directo a My account | CA-6 | Pasa | — | Pasa |
| TC-011 | La API de registro rechaza una clave fuera de política | CA-5 | — | Pasa | No aplica (solo proyecto `api`) |
| TC-012 | Botón atrás del navegador después de cerrar sesión | CA-6 | Pasa | — | Pasa |
| TC-013 | Claridad y ubicación de los mensajes de error en ambos formularios | CA-3, CA-5 | Manual, pendiente | — | Manual, pendiente |

Totales: `ui` 11 pruebas en verde (de 11). `api` 1 prueba en verde (de 1). `ui-bugs` 11 pruebas: 5 pasan, 6 bugs conocidos (fallos esperados; `unexpected: 0`).

Nota: la matriz marca `pasa` y `bug-conocido` por caso y proyecto; la tabla anterior sigue esos mismos estados. Las 12 pruebas automatizadas aparecen una vez en `results.json`. Según `03-ejecucion.md`, la corrida con `--repeat-each=3` dio 36 de 36 en verde en dos corridas seguidas; ese dato no está en los JSON de resultados.

## Cobertura por criterio

Tomada de `results/trazabilidad.json` (filas con `req` = REQ-001). Los 6 criterios figuran como cubiertos.

| Criterio | Casos | Estado en `ui` / `api` | Estado en `ui-bugs` |
|---|---|---|---|
| CA-1 · Entrar, llegar a My account y ver el nombre | TC-001 | Pasa | Bug conocido |
| CA-2 · Credenciales incorrectas no entran y muestran el mensaje | TC-002, TC-003 | Pasa | Pasa (ambos) |
| CA-3 · Obligatorios y formato de correo, error por campo, sin envío | TC-004, TC-005, TC-013 | Pasa (TC-004, TC-005); TC-013 manual pendiente | Bug conocido (TC-004, TC-005); TC-013 pendiente |
| CA-4 · Registro válido y entrada con esas credenciales | TC-006 | Pasa | Bug conocido |
| CA-5 · Obligatorios vacíos y política de clave | TC-007, TC-008, TC-009, TC-011, TC-013 | Pasa (TC-007, TC-008, TC-009, TC-011); TC-013 pendiente | Pasa (TC-007); bug conocido (TC-008, TC-009); TC-011 no aplica; TC-013 pendiente |
| CA-6 · Cierre de sesión y pérdida de acceso a My account | TC-010, TC-012 | Pasa | Pasa (ambos) |

## Bugs abiertos

Todos en `bugs/`, ambiente `ui-bugs · https://with-bugs.practicesoftwaretesting.com`. Confirmados con mensaje de fallo, captura y red en la traza (según `03-ejecucion.md`).

| Bug | Título | Casos | Severidad | Archivo |
|---|---|---|---|---|
| BUG-001 | Tras iniciar sesión, el menú no muestra el nombre del cliente y My account dice "User Data not found" | TC-001, TC-006 | Alta | [BUG-001](../../bugs/BUG-001-menu-sin-nombre-y-my-account-sin-datos.md) |
| BUG-002 | El inicio de sesión con correo y clave vacíos envía la petición en vez de mostrar un error en cada campo | TC-004 | Media | [BUG-002](../../bugs/BUG-002-login-acepta-campos-vacios-sin-mensaje.md) |
| BUG-003 | El inicio de sesión no valida el formato del correo y envía la petición | TC-005 | Media | [BUG-003](../../bugs/BUG-003-login-acepta-correo-sin-formato-valido.md) |
| BUG-004 | El registro acepta claves sin mayúscula, minúscula, número ni símbolo: solo exige longitud | TC-008 | Alta | [BUG-004](../../bugs/BUG-004-registro-acepta-clave-sin-mayuscula-ni-otras-reglas.md) |
| BUG-005 | El registro rechaza una clave válida de 8 caracteres y exige 10 | TC-009 | Alta | [BUG-005](../../bugs/BUG-005-registro-rechaza-clave-valida-de-8-caracteres.md) |

Severidad: criterio del reporter a partir del impacto que describe cada caso. No viene de los archivos de entrada.

## Casos manuales pendientes de ejecutar

- **TC-013** · Claridad y ubicación de los mensajes de error en ambos formularios (CA-3, CA-5). Prioridad Baja. Sin ejecutar: sin dato de resultado. Insumos de `03-ejecucion.md`: en la app real, con 7 caracteres el formulario dice `Password must be minimal 6 characters long.` (la política pide 8); con una regla de composición incumplida dice `Password can not include invalid characters.`, que no indica qué regla falta.

## Observaciones (no son bugs abiertos)

Vienen de `03-ejecucion.md`. No tienen caso automatizado que las confirme y no se han convertido en archivo de bug:

- La API de `ui-bugs` acepta una clave sin símbolo (`POST /users/register` → 201) y pide 9 caracteres (`The password field must be at least 9 characters.`). TC-011 corre contra la API real, así que no lo cubre.
- La versión con bugs valida el correo del registro contra mayúsculas (`E-mail format is invalid.` con letras mayúsculas). Las pruebas usan correos en minúscula.
- La app real responde 422 con `{"password": [...]}` ante una clave inválida (pregunta abierta 10 del plan); con 7 caracteres dice `The password field must be at least 8 characters.`.
- `ui-bugs` usa rutas con almohadilla (`/#/auth/login`) y un formulario de registro con `address` y `postcode`. Según el informe del automator, es una versión anterior, no la app real con defectos sembrados.
- Inestabilidad: una corrida de `--repeat-each=3` que coincidió con la suite de REQ-002 dio 11 timeouts en `fill`/`focus`. Las dos corridas siguientes, sin cambios, dieron 36 de 36. Sin causa confirmada; el automator sugiere limitar los workers si las suites corren a la vez.
- Fuera de REQ-001: `npm run lint` falla por `src/data/compra.ts:45` y `npm run typecheck` por `tests/ui/catalogo.spec.ts` (REQ-002). Los archivos de REQ-001 pasan ambos.

## Trazabilidad de la matriz

`results/trazabilidad.json`: 6 criterios de REQ-001, todos con `cubierto: true`. No aparecen problemas (`"problemas": []`).
