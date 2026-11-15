# Plan de pruebas · REQ-001 · Acceso de clientes: inicio de sesión y registro

> Generado por: planner (Claude Fable 5.2) · 2026-11-14 · Requisito: REQ-001

## Alcance

**Entra**

- Inicio de sesión en `/auth/login`: camino feliz, credenciales incorrectas y validación de campos (CA-1, CA-2, CA-3).
- Registro en `/auth/register`: alta válida de punta a punta, obligatorios vacíos y política de clave (CA-4, CA-5).
- Cierre de sesión y pérdida de acceso a `/account` (CA-6).
- Un caso de contrato sobre `POST /users/register`, porque la política de clave no debe depender solo del formulario.

**Queda fuera**

- El bloqueo de la cuenta al tercer intento fallido: es una restricción del entorno, no un criterio, y probarlo destruye datos.
- La cuenta de demostración `customer@practicesoftwaretesting.com`. La extracción la lista como dato de prueba, pero el requisito vigente la descarta (compartida, bloqueada con HTTP 423). Ningún caso la usa.
- Recuperación de clave, edición de perfil, registro con correo ya existente, otros idiomas y la versión con bugs: el requisito no los pide.
- Validez de los campos de registro que el requisito no nombra (fecha de nacimiento, teléfono, dirección): solo se llenan con valores válidos para poder llegar al resultado.

## Riesgos

1. **Un cliente legítimo no puede entrar o entra otro que no debe.** Es el riesgo de mayor impacto: sin acceso no hay compra. Lo cubren TC-001 (entra con credenciales correctas), TC-002 y TC-003 (no entra con correo inexistente ni con clave incorrecta).
2. **La política de clave se aplica a medias.** Cinco reglas combinadas son fáciles de implementar mal en una sola. TC-008 incumple cada regla por separado, TC-009 prueba el límite de longitud (7 y 8) y TC-011 comprueba que la API también la exige, no solo el formulario.
3. **El registro termina "bien" pero la cuenta no sirve.** Un alta que no deja iniciar sesión es peor que un error visible. TC-006 no se queda en la redirección: entra con las credenciales recién creadas.
4. **La sesión sobrevive al cierre.** En un equipo compartido expone la cuenta del cliente. TC-010 verifica el menú y el acceso directo a `/account`; TC-012 verifica que el botón atrás no la devuelve.
5. **La suite se rompe por el entorno, no por la app.** La demo es compartida, se reinicia y bloquea cuentas. Cada caso registra su propio cliente con correo único, los negativos hacen un solo intento fallido y ningún caso depende de datos previos.

## Casos de prueba

| ID | Criterios | Título | Técnica | Prioridad | Tipo |
|---|---|---|---|---|---|
| TC-001 | CA-1 | Inicio de sesión con correo y clave correctos | partición de equivalencia | Alta | Automatizado |
| TC-002 | CA-2 | Inicio de sesión con un correo que no existe | partición de equivalencia | Alta | Automatizado |
| TC-003 | CA-2 | Inicio de sesión con clave incorrecta de un cliente registrado | partición de equivalencia | Alta | Automatizado |
| TC-004 | CA-3 | Inicio de sesión con correo y clave vacíos | tabla de decisión | Media | Automatizado |
| TC-005 | CA-3 | Inicio de sesión con correo de formato inválido | partición de equivalencia | Media | Automatizado |
| TC-006 | CA-4 | Registro válido e inicio de sesión con las credenciales creadas | transición de estados | Alta | Automatizado |
| TC-007 | CA-5 | Registro con los campos obligatorios vacíos | partición de equivalencia | Media | Automatizado |
| TC-008 | CA-5 | Registro con clave que incumple una regla de composición | tabla de decisión | Alta | Automatizado |
| TC-009 | CA-5 | Longitud de la clave en el registro: 7 y 8 caracteres | valores límite | Alta | Automatizado |
| TC-010 | CA-6 | Cierre de sesión y acceso directo a My account | transición de estados | Alta | Automatizado |
| TC-011 | CA-5 | La API de registro rechaza una clave fuera de política | contrato | Media | Automatizado |
| TC-012 | CA-6 | Botón atrás del navegador después de cerrar sesión | conjetura de errores | Media | Automatizado |
| TC-013 | CA-3, CA-5 | Claridad y ubicación de los mensajes de error en ambos formularios | exploratoria | Baja | Manual |

Cobertura por criterio: CA-1 (TC-001) · CA-2 (TC-002, TC-003) · CA-3 (TC-004, TC-005, TC-013) · CA-4 (TC-006) · CA-5 (TC-007, TC-008, TC-009, TC-011, TC-013) · CA-6 (TC-010, TC-012).

## Detalle de casos

Convenciones comunes:

- "Cliente propio" es un cliente que el caso registra con `POST /users/register` antes de empezar, con correo único. No se comparte entre casos.
- Los selectores citados salen de la extracción. Los que no están en ella (mensajes de error, menú con sesión, opción de cerrar sesión, contenido de `/account`) **no están verificados**: el automator los captura con `npm run snapshot` o en la primera corrida, y no los inventa.
- La app se prueba en inglés, su idioma por defecto.

### TC-001 · Inicio de sesión con correo y clave correctos

- **Precondiciones:** cliente propio registrado por API. Navegador sin sesión.
- **Pasos:**
  1. Abrir `/auth/login`.
  2. Escribir el correo del cliente en `email` y su clave en `password`.
  3. Pulsar `login-submit`.
- **Datos:** correo y clave del cliente propio; nombre y apellido con los que se registró.
- **Resultado esperado:** la URL pasa a `/account`, la página se identifica como "My account" y el menú superior muestra el nombre del cliente. El enlace `nav-sign-in` deja de verse.

### TC-002 · Inicio de sesión con un correo que no existe

- **Precondiciones:** navegador sin sesión. No necesita cliente.
- **Pasos:**
  1. Abrir `/auth/login`.
  2. Escribir un correo único que nunca se registró y una clave que cumple la política.
  3. Pulsar `login-submit` una sola vez.
- **Datos:** correo único generado en la corrida, sin registrar.
- **Resultado esperado:** se muestra el mensaje "Invalid email or password". La URL sigue en `/auth/login` y el menú sigue mostrando `nav-sign-in`.

### TC-003 · Inicio de sesión con clave incorrecta de un cliente registrado

- **Precondiciones:** cliente propio registrado por API y **exclusivo de este caso**, para que ningún otro intento fallido se sume al suyo.
- **Pasos:**
  1. Abrir `/auth/login`.
  2. Escribir el correo del cliente y una clave distinta de la suya, que cumple la política.
  3. Pulsar `login-submit` una sola vez. No se reintenta.
- **Datos:** correo del cliente propio; clave incorrecta bien formada (para aislar "clave incorrecta" de "clave inválida").
- **Resultado esperado:** se muestra "Invalid email or password", el mismo texto que en TC-002 (el mensaje no revela si el correo existe). La URL sigue en `/auth/login` y el menú sigue mostrando `nav-sign-in`.

### TC-004 · Inicio de sesión con correo y clave vacíos

- **Precondiciones:** navegador sin sesión. Se observan las peticiones de red a la API.
- **Pasos y datos:** tres combinaciones, cada una partiendo de `/auth/login` recién cargado y terminando en `login-submit`.
  1. Correo vacío y clave vacía.
  2. Correo vacío y clave con valor.
  3. Correo con valor (formato válido, sin registrar) y clave vacía.
- **Resultado esperado:**
  - Combinación 1: un mensaje de error en el campo correo y otro en el campo clave, cada uno junto a su campo.
  - Combinación 2: mensaje solo en el correo. Combinación 3: mensaje solo en la clave.
  - En las tres: no sale ninguna petición de inicio de sesión hacia la API, la URL sigue en `/auth/login` y no aparece "Invalid email or password".
  - El texto exacto de los mensajes no está en el requisito (ver preguntas abiertas): se verifica que existen, son visibles y pertenecen a su campo.

### TC-005 · Inicio de sesión con correo de formato inválido

- **Precondiciones:** navegador sin sesión. Se observan las peticiones de red a la API.
- **Pasos:** para cada dato, abrir `/auth/login`, escribir el correo inválido y una clave bien formada, y pulsar `login-submit`.
- **Datos:** una clase inválida por dato: sin arroba (`cliente.example.com`), sin dominio (`cliente@`), sin parte local (`@example.com`).
- **Resultado esperado:** el campo correo muestra su mensaje de error, el campo clave no muestra ninguno, no sale ninguna petición de inicio de sesión y la URL sigue en `/auth/login`. El caso falla si aparece "Invalid email or password", porque significaría que el formulario sí se envió.

### TC-006 · Registro válido e inicio de sesión con las credenciales creadas

- **Precondiciones:** navegador sin sesión. Correo único sin registrar.
- **Pasos:**
  1. Abrir `/auth/register`.
  2. Llenar todos los campos marcados con `*`: `first-name`, `last-name`, `dob`, `country`, `postal_code`, `house_number`, `street`, `city`, `state`, `phone`, `email` y `password`.
  3. Pulsar `register-submit`.
  4. En la pantalla de inicio de sesión, escribir el correo y la clave recién creados y pulsar `login-submit`.
- **Datos:** perfil válido completo (ver Datos de prueba), correo único y clave que cumple la política.
- **Resultado esperado:** tras el paso 3 la URL es `/auth/login`, sin mensajes de error. Tras el paso 4 la URL es `/account` y el menú superior muestra el nombre usado en el registro.

### TC-007 · Registro con los campos obligatorios vacíos

- **Precondiciones:** navegador sin sesión. Se observan las peticiones de red a la API.
- **Pasos y datos:**
  1. Abrir `/auth/register` y pulsar `register-submit` sin llenar nada.
  2. Recargar, llenar todo el perfil válido menos `email` y pulsar `register-submit`.
  3. Recargar, llenar todo el perfil válido menos `password` y pulsar `register-submit`.
- **Resultado esperado:** en los tres pasos el registro no se acepta: la URL sigue en `/auth/register` y no sale ninguna petición de registro hacia la API. En el paso 1 hay error en correo y en clave; en el 2, en el correo; en el 3, en la clave. En el paso 2, además, el correo que no se llegó a enviar no existe como cuenta (no hace falta comprobarlo con un inicio de sesión).
- **Nota:** los demás campos con `*` se observan en el paso 1, pero solo se exige el error de correo y clave, que son los que el requisito nombra (ver preguntas abiertas).

### TC-008 · Registro con clave que incumple una regla de composición

- **Precondiciones:** navegador sin sesión. Un correo único por cada fila de datos.
- **Pasos:** para cada clave, abrir `/auth/register`, llenar el perfil válido con un correo único y esa clave, y pulsar `register-submit`.
- **Datos:** cada clave tiene 8 caracteres o más e incumple **una sola** regla, para que el rechazo se atribuya a ella.
  - Sin mayúscula.
  - Sin minúscula.
  - Sin número.
  - Sin símbolo.
- **Resultado esperado:** en las cuatro filas el registro no se acepta: la URL sigue en `/auth/register`, el campo clave muestra un error y no hay redirección a `/auth/login`. Como comprobación final, una petición de inicio de sesión por API con ese correo y esa clave no devuelve sesión (un solo intento por correo).

### TC-009 · Longitud de la clave en el registro: 7 y 8 caracteres

- **Precondiciones:** navegador sin sesión. Dos correos únicos.
- **Pasos:**
  1. Registrar por la UI con una clave de 7 caracteres que tiene mayúscula, minúscula, número y símbolo.
  2. Registrar por la UI, con otro correo, con una clave de 8 caracteres de la misma composición.
- **Datos:** la clave de 8 es la de 7 más un carácter, para que la única diferencia sea la longitud.
- **Resultado esperado:** paso 1, el registro no se acepta: la URL sigue en `/auth/register` y el campo clave muestra un error. Paso 2, el registro se acepta y lleva a `/auth/login`.

### TC-010 · Cierre de sesión y acceso directo a My account

- **Precondiciones:** cliente propio registrado por API y con sesión iniciada por la UI (se ve su nombre en el menú).
- **Pasos:**
  1. Abrir el menú del cliente y elegir la opción de cerrar sesión.
  2. Comprobar el menú superior.
  3. Navegar directamente a `/account`.
- **Datos:** cliente propio.
- **Resultado esperado:** tras el paso 1 el menú muestra `nav-sign-in` con el texto "Sign in" y el nombre del cliente ya no aparece. Tras el paso 3 no se muestra el contenido de "My account" y el menú sigue en "Sign in". Se supone que la app lleva a `/auth/login` (ver preguntas abiertas).

### TC-011 · La API de registro rechaza una clave fuera de política

- **Precondiciones:** ninguna. Proyecto `api`, sin navegador.
- **Pasos:**
  1. Enviar `POST /users/register` con un perfil válido, correo único y una clave de 7 caracteres bien compuesta.
  2. Enviar `POST /users/register` con otro correo único y una clave de 8 caracteres o más, sin símbolo.
  3. Como control, enviar `POST /users/register` con otro correo único y una clave válida.
- **Datos:** el mismo cuerpo en las tres llamadas; solo cambian el correo y la clave.
- **Resultado esperado:** las llamadas 1 y 2 no crean el cliente: la respuesta no es de éxito (no 2xx) y señala la clave como causa. La llamada 3 responde con éxito, lo que prueba que el rechazo se debe a la clave y no al resto del cuerpo. El código exacto de rechazo no está en el requisito (ver preguntas abiertas).

### TC-012 · Botón atrás del navegador después de cerrar sesión

- **Precondiciones:** cliente propio con sesión iniciada y situado en `/account`.
- **Pasos:**
  1. Cerrar sesión desde el menú.
  2. Pulsar atrás en el navegador.
  3. Recargar la página.
- **Datos:** cliente propio.
- **Resultado esperado:** ni tras el paso 2 ni tras el 3 se muestra el contenido de "My account", y el menú sigue mostrando "Sign in" sin el nombre del cliente.

### TC-013 · Claridad y ubicación de los mensajes de error en ambos formularios

- **Por qué es manual:** pide juicio sobre redacción, ubicación y legibilidad. Un assert solo puede decir que el mensaje existe, y eso ya lo hacen TC-004, TC-005, TC-007 y TC-008.
- **Precondiciones:** navegador sin sesión, ventana de escritorio y ventana a ancho de móvil.
- **Pasos:**
  1. En `/auth/login`, provocar los errores de campo vacío y de formato de correo.
  2. En `/auth/register`, enviar vacío y luego con una clave fuera de política.
  3. Corregir cada campo y observar si su mensaje desaparece.
  4. Recorrer ambos formularios solo con teclado.
- **Datos:** los de TC-004, TC-005, TC-007 y TC-008. No se registra ningún cliente.
- **Resultado esperado:** cada mensaje está junto a su campo y dice qué corregir; el de la clave del registro deja saber qué regla falta; ningún mensaje tapa otro campo ni se corta a ancho de móvil; el error desaparece al corregir el dato. Lo que no se cumpla se anota como observación, no como fallo del criterio, salvo que el mensaje no exista o esté en el campo equivocado.

## Datos de prueba

**Cliente propio (TC-001, TC-003, TC-010, TC-012)**

- Se crea con `POST /users/register` contra `https://api.practicesoftwaretesting.com`, en una fixture, antes del caso. Un cliente distinto por caso.
- Correo único por caso: prefijo del requisito, marca de tiempo y sufijo aleatorio (por ejemplo `req001.<timestamp>.<aleatorio>@example.com`), para que no choque entre workers ni entre corridas.
- Clave generada que cumple la política (8 o más, mayúscula, minúscula, número y símbolo) con una parte aleatoria; no usar claves conocidas como `welcome01` o `Password1!`.
- La fixture comprueba que el registro respondió con éxito y, si no, falla con un mensaje claro de entorno, para no confundirlo con un fallo del caso.

**Perfil válido (TC-006 a TC-009 y TC-011)**

- Nombre y apellido fijos y reconocibles (sirven para el assert del menú), fecha de nacimiento adulta en formato `YYYY-MM-DD`, un país de la lista, código postal, número, calle, ciudad, estado y teléfono solo con dígitos.
- Vive en `src/data` como una fábrica que recibe el correo y la clave. La UI y la API usan el mismo perfil.

**Correos sin registrar (TC-002, TC-005, TC-007, TC-008, TC-009)**

- Mismo patrón de correo único. En TC-008 y TC-009, un correo distinto por cada clave probada.

**Claves fuera de política (TC-008, TC-009, TC-011)**

- Se derivan de una clave base válida quitándole una sola propiedad, de modo que cada dato incumple una regla y solo una. Se definen una vez en `src/data` y las comparten UI y API.

**Intentos fallidos**

- TC-002 usa un correo inexistente. TC-003 hace un único intento fallido sobre un cliente exclusivo. Las comprobaciones por API de TC-008 hacen un intento por correo. Ningún caso se acerca a los tres intentos.

**Limpieza**

- No se borra nada: los clientes creados son únicos, no interfieren entre sí y la demo se reinicia sola. Cada corrida deja 7 clientes nuevos (4 propios, 1 en TC-006, 1 en TC-009 y 1 en TC-011), más los que la app llegue a crear por error.
- Ningún caso toca la cuenta de demostración ni modifica el perfil de una cuenta compartida.

## Preguntas abiertas

1. **Cuenta de demostración.** La extracción la lista como dato de prueba; el requisito, actualizado después, la descarta. *Suposición:* manda el requisito; cada corrida registra su cliente por API.
2. **Cuerpo y respuesta de `POST /users/register`.** La extracción no trae endpoints. *Suposición:* el cuerpo lleva los mismos campos que el formulario y el éxito es una respuesta 2xx. El automator confirma nombres de campo y código en la primera llamada.
3. **Textos de los mensajes por campo (CA-3, CA-5).** El requisito no los define. *Suposición:* se verifica que el mensaje existe, es visible y pertenece a su campo, sin comparar el texto. Si el negocio fija los textos, se añaden a los asserts.
4. **"Ve su nombre en el menú" (CA-1).** No dice si es nombre, apellido o ambos. *Suposición:* el menú contiene al menos el nombre de pila con el que se registró.
5. **"Llega a My account" (CA-1).** El texto y los selectores de `/account` no se capturaron. *Suposición:* URL `/account` y un encabezado con el texto "My account".
6. **"Deja de estar disponible" (CA-6).** No dice qué ve el visitante. *Suposición:* no se muestra el contenido de la cuenta y la app lleva a `/auth/login`. Si la app muestra otra cosa sin exponer la cuenta, se ajusta el assert de la URL, no el de contenido.
7. **Campos obligatorios del registro (CA-4, CA-5).** El formulario marca con `*` diez campos que el requisito no nombra. *Suposición:* "datos válidos" es llenar todos los marcados; en los negativos solo se exige el error de correo y clave.
8. **Formato del correo en el registro.** La extracción asocia CA-3 al correo del registro, que es `type=text`, pero CA-3 habla del inicio de sesión y CA-5 no menciona el formato. *Suposición:* CA-3 se prueba en el inicio de sesión. El formato del correo en el registro queda sin caso hasta que el requisito lo pida.
9. **Cómo se valida el formato del correo (CA-3).** En el inicio de sesión el campo es `type=email`; puede validar el navegador, la app o ambos. *Suposición:* cualquiera vale mientras el campo muestre su error y no salga la petición. TC-005 no depende del mecanismo.
10. **Código de rechazo de la API ante una clave inválida (TC-011).** No está en el requisito. *Suposición:* basta con que no sea 2xx y no se cree el cliente; se anota el código observado.
11. **La política de clave no se anuncia en la pantalla de registro.** No se pudo contrastar con la app. *Suposición:* la política de CA-5 es la vigente. Si la app aplica reglas adicionales (por ejemplo, rechazar claves filtradas), la clave generada con parte aleatoria las esquiva.
12. **Bloqueo al tercer intento.** Es restricción y no criterio. *Suposición:* no se prueba. Si se quiere cubrir, necesita un criterio propio y un cliente desechable.
13. **Correo ya registrado.** El requisito no dice qué pasa al registrarse con un correo existente. *Suposición:* fuera de alcance; no se inventa un resultado esperado.
