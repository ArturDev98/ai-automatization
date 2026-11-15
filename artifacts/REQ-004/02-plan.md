# Plan de pruebas · REQ-004 · Formulario de contacto

> Generado por: planner (Claude Fable 5.2) · 2026-11-15 · Requisito: REQ-004
>
> Cambio · 2026-11-15 · Se agrega TC-014 por el hallazgo H-1 de `03-ejecucion.md`, pedido en la revisión humana (`02-revision.md`, historial 2). TC-001 a TC-013 no cambian.

## Alcance

**Entra**

- Envío del formulario de `/contact` por un visitante sin sesión: camino feliz, envío vacío, obligatorios por separado y formato de correo (CA-1, CA-2, CA-3).
- Largo mínimo del mensaje, con análisis de valores límite sobre el umbral observado (CA-4).
- Adjunto: una partición aceptada y dos rechazadas, extensión y contenido (CA-5).
- Envío con sesión iniciada, con un cliente que la propia prueba registra por API (CA-6).
- Un caso de contrato sobre `POST /messages`, para saber si las reglas de CA-3 y CA-4 viven solo en el formulario.
- Envío de un visitante antes de que la pantalla termine de comprobar la sesión, que es cuando hoy se aplican los obligatorios de nombre, apellido y correo (CA-2, hallazgo H-1).

**Queda fuera**

- Las cuentas de demostración: el requisito las descarta. Ningún caso las usa, tampoco para leer los mensajes enviados (`GET /messages` exige sesión y no hay cuenta propia con ese permiso).
- Qué pasa con el mensaje después de enviarlo (bandeja del administrador, respuesta, estados): el requisito no lo pide.
- Tamaño máximo del adjunto, tipos aceptados más allá de lo que la app anuncia, y largo máximo del mensaje: el requisito no los define.
- Otros idiomas. La app se prueba en inglés.
- Los textos sembrados de la versión con bugs que no tocan ningún criterio ("Massage", "Contakt"): se anotan como hallazgos en TC-013, no tienen caso propio.

**Entornos**

- La misma suite corre contra tres destinos: contenedores de CI (imágenes oficiales 2.5, UI en `localhost:4200`, API en `localhost:8091`), la demo pública y la versión con bugs. Las direcciones llegan por `UI_URL`, `API_URL`, `UI_BUGS_URL` y `API_BUGS_URL`; ningún caso fija un host.
- La versión con bugs usa rutas con `#/` (`#/contact`, `#/auth/login`). Los casos navegan por el mecanismo de rutas que ya tiene el repo, no con rutas escritas a mano.
- Todo lo observado en la extracción se vio en la demo pública y en la versión con bugs. **Nada se observó en las imágenes 2.5**: lo que este plan llama "observado" hay que confirmarlo también ahí.

## Riesgos

1. **El formulario dice que envió y no envió, o envía datos que debió rechazar.** Es el daño directo al visitante: cree que la tienda recibió su duda. TC-001 comprueba la confirmación y que salió la petición; TC-002, TC-003, TC-004, TC-005, TC-007 y TC-008 comprueban, además del error, que **no** salió ninguna petición de envío. Esos casos prueban la pantalla ya estable; TC-014 cubre la ventana anterior, en la que la ejecución confirmó que el mensaje se guarda sin nombre o sin correo (H-1).
2. **El límite del mensaje está corrido en uno.** Los errores de límite son los más comunes en validaciones de largo. TC-005 prueba 49 y 50 con cadenas que solo difieren en un carácter; TC-012 comprueba si la API aplica el mismo límite.
3. **Con sesión, el mensaje sale sin identificar al cliente.** La extracción deduce del código que en la versión con bugs el nombre viaja en blanco, y que en la demo el correo no viaja. La tienda no sabría a quién responder. TC-009 cubre lo que el requisito pide (no reescribir); TC-010 mira el cuerpo de la petición. Ambos descansan en hipótesis sin observar, marcadas como tales.
4. **La regla del adjunto no está en el requisito y la app la aplica de forma distinta en cada versión.** Sin oráculo claro, un assert fijo puede dar falsos fallos o falsos verdes. TC-006 a TC-008 separan las particiones con un dato que cambia una sola propiedad, y el oráculo usado queda como pregunta abierta para la revisión humana.
5. **Asserts fijados sobre textos que nadie vio en pantalla.** Los textos de error y de confirmación salen del archivo de idioma y del bundle, no del DOM. Cada caso indica qué debe confirmar el automator en la app antes de fijar el assert, y qué se verifica si el texto no coincide.

## Casos de prueba

| ID | Criterios | Título | Técnica | Prioridad | Tipo |
|---|---|---|---|---|---|
| TC-001 | CA-1 | Un visitante envía el formulario completo y ve la confirmación | partición de equivalencia | Alta | Automatizado |
| TC-002 | CA-2 | Envío del formulario vacío | partición de equivalencia | Alta | Automatizado |
| TC-003 | CA-2 | Falta un solo campo obligatorio y los demás son válidos | tabla de decisión | Media | Automatizado |
| TC-004 | CA-3 | Correo con formato inválido | partición de equivalencia | Alta | Automatizado |
| TC-005 | CA-4 | Largo del mensaje: 49 y 50 caracteres | valores límite | Alta | Automatizado |
| TC-006 | CA-5 | Envío con un adjunto aceptado | partición de equivalencia | Media | Automatizado |
| TC-007 | CA-5 | Adjunto con extensión no aceptada | partición de equivalencia | Alta | Automatizado |
| TC-008 | CA-5 | Adjunto de extensión aceptada que no está vacío | partición de equivalencia | Media | Automatizado |
| TC-009 | CA-6 | Un cliente con sesión envía sin escribir nombre ni correo | transición de estados | Alta | Automatizado |
| TC-010 | CA-6 | El mensaje enviado con sesión identifica al cliente | conjetura de errores | Media | Automatizado |
| TC-011 | CA-2, CA-3, CA-4 | Corregir los errores y enviar | transición de estados | Media | Automatizado |
| TC-012 | CA-3, CA-4 | La API de mensajes rechaza lo que el formulario rechaza | contrato | Media | Automatizado |
| TC-013 | CA-1, CA-2, CA-5 | Claridad de los mensajes, de la ayuda del adjunto y de la lista de asuntos | exploratoria | Baja | Manual |
| TC-014 | CA-2 | Envío sin nombre, apellido ni correo antes de que la pantalla compruebe la sesión | conjetura de errores | Alta | Automatizado |

Cobertura por criterio: CA-1 (TC-001, TC-013) · CA-2 (TC-002, TC-003, TC-011, TC-013, TC-014) · CA-3 (TC-004, TC-011, TC-012) · CA-4 (TC-005, TC-011, TC-012) · CA-5 (TC-006, TC-007, TC-008, TC-013) · CA-6 (TC-009, TC-010).

## Detalle de casos

Convenciones comunes:

- **"No se envía nada"** se verifica en la red: durante el caso no sale ningún `POST` a la ruta `/messages` de la API del entorno. Es una hipótesis de la extracción que ese sea el endpoint (sale del bundle, nunca se llamó): el automator lo confirma en la primera corrida de TC-001. La versión con bugs usa otro host de API; el filtro se hace por ruta y método, no por host.
- **"Confirmar antes de fijar"** marca un dato que la extracción dedujo del archivo de idioma o del bundle y no vio en pantalla. El automator lo comprueba en la app (con `npm run snapshot` o en la primera corrida) en la demo y en las imágenes 2.5. Si no coincide, no adapta el assert en silencio: lo anota y lo deja a la revisión humana.
- **Textos de error:** se exige siempre que el error exista, sea visible y pertenezca a su campo. El texto literal se compara solo donde el criterio pide un contenido concreto (CA-4, "cuál es el mínimo"; CA-5, "por qué").
- **Selectores:** los de los campos salen de la extracción. Los de los errores (ids `first-name-error` y similares, vistos solo en el bundle), el de la confirmación (un `role=alert` sin `data-test`) y los del menú con sesión **no están verificados** y no se inventan.
- El mensaje valida al salir del campo y los errores se muestran tras pulsar `contact-submit` (hipótesis del bundle). Todos los negativos terminan pulsando `contact-submit`.
- **Versión con bugs:** los casos no cambian. Donde la extracción espera que un caso falle ahí, se indica con "En la versión con bugs"; es un fallo esperado que se trata según la convención del repo, sin debilitar el assert.

### TC-001 · Un visitante envía el formulario completo y ve la confirmación

- **Precondiciones:** navegador sin sesión. Se observan las peticiones a la API.
- **Pasos:**
  1. Abrir la pantalla de contacto.
  2. Llenar `first-name`, `last-name` y `email`; elegir un asunto en `subject`; escribir el mensaje en `message`. No adjuntar nada.
  3. Pulsar `contact-submit`.
- **Datos:** nombre y apellido ficticios, correo único de `example.com`, asunto `Customer service`, mensaje ficticio claramente por encima del mínimo (unos 80 caracteres).
- **Resultado esperado:** se muestra una confirmación y los campos del formulario y `contact-submit` dejan de verse. Sale un `POST` de envío y responde con éxito.
- **Confirmar antes de fijar:** el texto de la confirmación ("Thanks for your message! We will contact you shortly.") y su contenedor; la ruta y el cuerpo del `POST`.

### TC-002 · Envío del formulario vacío

- **Precondiciones:** navegador sin sesión. Se observan las peticiones a la API.
- **Pasos:**
  1. Abrir la pantalla de contacto.
  2. Pulsar `contact-submit` sin tocar ningún campo.
- **Datos:** ninguno.
- **Resultado esperado:** nombre, apellido, correo, asunto y mensaje muestran cada uno su error de campo obligatorio, junto a su campo. No sale ningún `POST` de envío, el formulario sigue visible y no aparece la confirmación. El adjunto no muestra error (no es obligatorio).
- **Confirmar antes de fijar:** que los cinco campos son los obligatorios (el requisito no los enumera; ver pregunta 1) y los textos ("First name is required", etc.), que no se comparan literalmente.

### TC-003 · Falta un solo campo obligatorio y los demás son válidos

- **Precondiciones:** navegador sin sesión. Se observan las peticiones a la API.
- **Pasos y datos:** cinco filas. En cada una, abrir la pantalla recién cargada, llenar todo con los datos válidos de TC-001 menos un campo y pulsar `contact-submit`.
  1. Sin nombre.
  2. Sin apellido.
  3. Sin correo.
  4. Sin asunto (se deja la opción "Select a subject *").
  5. Sin mensaje.
- **Resultado esperado:** en cada fila, el campo que falta muestra su error y los otros cuatro no muestran ninguno. No sale ningún `POST` de envío y no aparece la confirmación.
- **Por qué existe:** TC-002 no distingue un formulario que valida cada campo de uno que solo comprueba "está todo vacío". Esta tabla aísla cada obligatorio.

### TC-004 · Correo con formato inválido

- **Precondiciones:** navegador sin sesión. Se observan las peticiones a la API.
- **Pasos:** para cada dato, abrir la pantalla, llenar el resto con los datos válidos de TC-001, escribir el correo inválido y pulsar `contact-submit`.
- **Datos:** una clase inválida por dato: sin arroba (`no-es-correo`), sin dominio (`cliente@`), sin parte local (`@example.com`).
- **Resultado esperado:** el campo correo muestra un error, los demás campos no. No sale ningún `POST` de envío y no aparece la confirmación.
- **Confirmar antes de fijar:** el texto "Email format is invalid". Solo `no-es-correo` se observó como inválido; las otras dos clases no se probaron en la extracción.
- **En la versión con bugs:** se espera que falle. La extracción observó que `no-es-correo` queda como válido para el visitante.

### TC-005 · Largo del mensaje: 49 y 50 caracteres

- **Precondiciones:** navegador sin sesión. Se observan las peticiones a la API.
- **Pasos:**
  1. Abrir la pantalla, llenar el resto con datos válidos, escribir un mensaje de 49 caracteres y pulsar `contact-submit`.
  2. En una pantalla recién cargada, repetir con un mensaje de 50 caracteres.
- **Datos:** el mensaje de 50 es el de 49 más un carácter, sin espacios al principio ni al final, para que la única diferencia sea el largo. Texto ficticio con letras, no un solo carácter repetido.
- **Resultado esperado:**
  - Paso 1: el campo mensaje muestra un error que nombra el mínimo (contiene "50"). No sale ningún `POST` de envío y no aparece la confirmación.
  - Paso 2: el mensaje se acepta: aparece la confirmación y el formulario deja de verse.
- **Confirmar antes de fijar:** el umbral. El requisito no dice el número; 50 es lo observado (49 inválido, 50 válido, sin enviar) en la demo y en la versión con bugs, no en las imágenes 2.5. También el texto "Message must be minimal 50 characters".
- **Nota:** el valor 0 lo cubren TC-002 y TC-003; un valor holgado por encima del límite, TC-001. No se repiten aquí.

### TC-006 · Envío con un adjunto aceptado

- **Precondiciones:** navegador sin sesión. Se observan las peticiones a la API.
- **Pasos:**
  1. Abrir la pantalla y llenar todo con los datos válidos de TC-001.
  2. Cargar el archivo en `attachment`.
  3. Pulsar `contact-submit`.
- **Datos:** un `.txt` de 0 bytes, creado en memoria por la prueba.
- **Resultado esperado:** el adjunto no muestra error, aparece la confirmación y el formulario deja de verse.
- **Confirmar antes de fijar:** que el `.txt` vacío es la partición aceptada (observado como válido sin enviar; ver pregunta 4) y si el adjunto viaja en una segunda petición (`POST /messages/{id}/attach-file`, hipótesis del bundle). Si esa segunda petición existe, se exige que responda con éxito; si no, no se inventa.

### TC-007 · Adjunto con extensión no aceptada

- **Precondiciones:** navegador sin sesión. Se observan las peticiones a la API.
- **Pasos:**
  1. Abrir la pantalla y llenar todo con los datos válidos de TC-001.
  2. Cargar el archivo en `attachment` (el campo declara `accept=".txt"`, que solo filtra el diálogo: la prueba carga el archivo directamente).
  3. Pulsar `contact-submit`.
- **Datos:** un `.pdf` de 0 bytes. Vacío a propósito: según la extracción, un `.pdf` con contenido recibiría el mensaje de tamaño y no el de extensión, y el caso dejaría de aislar la extensión.
- **Resultado esperado:** el formulario muestra junto al adjunto un error que explica el motivo (la extensión). No sale ningún `POST` de envío y no aparece la confirmación.
- **Confirmar antes de fijar:** el texto "File should have a txt extension." (no observado; sale del archivo de idioma). Si el texto real es otro pero explica la extensión, se fija el real y se anota.
- **En la versión con bugs:** se espera que falle (la extracción observó que el `.pdf` vacío se acepta). Si eso es un bug o una regla distinta de esa versión, lo decide la revisión humana (ver pregunta 5).

### TC-008 · Adjunto de extensión aceptada que no está vacío

- **Precondiciones:** navegador sin sesión. Se observan las peticiones a la API.
- **Pasos:** los de TC-007, con otro archivo.
- **Datos:** un `.txt` con una línea de texto ficticio (unos pocos bytes). Misma extensión que TC-006; solo cambia el contenido.
- **Resultado esperado:** el formulario muestra junto al adjunto un error que explica el motivo (el archivo debe estar vacío). No sale ningún `POST` de envío y no aparece la confirmación.
- **Confirmar antes de fijar:** el texto "File should be empty." (no observado). El oráculo de este caso no es el requisito sino la regla que la propia app anuncia ("files must be 0kb"); ver pregunta 4. Si la revisión humana decide que un `.txt` con contenido debe aceptarse, este caso se invierte y la regla actual pasa a ser un bug.
- **En la versión con bugs:** se espera que falle (el `.txt` con contenido se acepta ahí).

### TC-009 · Un cliente con sesión envía sin escribir nombre ni correo

- **Precondiciones:** cliente propio registrado con `POST /users/register` y con sesión iniciada por la pantalla de acceso (`email`, `password`, `login-submit`). Se observan las peticiones a la API.
- **Pasos:**
  1. Con la sesión iniciada, abrir la pantalla de contacto.
  2. Sin escribir nombre, apellido ni correo, elegir un asunto y escribir un mensaje válido.
  3. Pulsar `contact-submit`.
- **Datos:** cliente propio; asunto `Payments`; mensaje ficticio por encima del mínimo.
- **Resultado esperado:** el formulario no pide nombre ni correo (no hay error de obligatorio en esos datos), aparece la confirmación y el formulario deja de verse.
- **Confirmar antes de fijar:** todo el comportamiento con sesión es hipótesis del bundle, nunca observado. En concreto: que `first-name`, `last-name` y `email` se ocultan (y no que aparecen rellenos), y el saludo "Hello {name}, please fill out this form to submit your message.". El criterio se cumple con cualquiera de las dos formas, ocultos o rellenos con los datos del cliente; el automator fija la que vea y la anota. El saludo se comprueba solo si existe; no es parte del criterio.
- **Nota:** el paso 1 debe esperar a que la pantalla refleje la sesión antes de escribir, con un assert web-first sobre el estado observado, no con una espera fija.

### TC-010 · El mensaje enviado con sesión identifica al cliente

- **Precondiciones:** las de TC-009, con otro cliente propio. Se captura el cuerpo del `POST` de envío.
- **Pasos:** los de TC-009.
- **Datos:** cliente propio con nombre y apellido reconocibles.
- **Resultado esperado:** el cuerpo del `POST` de envío lleva el nombre del cliente (contiene su nombre de pila y su apellido, no una cadena vacía ni solo espacios).
- **Confirmar antes de fijar:** este resultado es una lectura de CA-6, no una frase suya: si el cliente no escribe su nombre, se entiende que el mensaje igual lo lleva (ver pregunta 6). El campo `name` y su formato salen del bundle. Sobre el **correo** no se fija ningún assert: la extracción deduce que con sesión no viaja y no se sabe si la API asocia el mensaje a la cuenta; se anota lo observado y queda para la revisión humana.
- **En la versión con bugs:** hipótesis de la extracción, sin observar: el nombre viajaría en blanco y el caso fallaría. Hay que confirmarlo corriendo el caso, no darlo por hecho.

### TC-011 · Corregir los errores y enviar

- **Precondiciones:** navegador sin sesión. Se observan las peticiones a la API.
- **Pasos:**
  1. Abrir la pantalla, llenar nombre y apellido, escribir el correo `no-es-correo`, no elegir asunto, escribir un mensaje de 49 caracteres y pulsar `contact-submit`.
  2. Sin recargar, corregir el correo, elegir un asunto y completar el mensaje hasta 50 caracteres.
  3. Pulsar `contact-submit`.
- **Datos:** los de TC-004 y TC-005; correo corregido único de `example.com`.
- **Resultado esperado:** tras el paso 1 hay error en correo, asunto y mensaje, y no sale ningún `POST`. Tras el paso 3 no queda ningún error, sale un solo `POST` de envío, aparece la confirmación y el formulario deja de verse.
- **Por qué existe:** los demás negativos parten de una pantalla limpia. Este comprueba que un formulario que ya mostró errores se recupera y no envía dos veces.
- **En la versión con bugs:** el paso 1 no mostraría el error de correo (misma causa que TC-004).

### TC-012 · La API de mensajes rechaza lo que el formulario rechaza

- **Precondiciones:** ninguna. Proyecto `api`, sin navegador y sin sesión.
- **Pasos:**
  1. Como control, enviar `POST /messages` con nombre, asunto, correo válido y un mensaje de 50 caracteres.
  2. Enviar el mismo cuerpo con un mensaje de 49 caracteres.
  3. Enviar el cuerpo del paso 1 con el correo `no-es-correo`.
- **Datos:** un solo cuerpo base; cada llamada cambia un único campo.
- **Resultado esperado:** la llamada 1 responde con éxito. Las llamadas 2 y 3 no responden con éxito (no 2xx) y señalan el campo causante.
- **Confirmar antes de fijar:** todo el contrato es hipótesis: la ruta, que admite envíos sin sesión, los nombres de campo (`name`, `subject`, `message`, `email`) y el campo extra `status` de la versión con bugs. Si el control (llamada 1) no responde con éxito, el caso se detiene como problema de contrato, no como fallo de CA-3 o CA-4.
- **Límite del caso:** el requisito habla del formulario, no de la API. Si la API acepta las llamadas 2 o 3, no se fija el caso como fallo sin más: es un hallazgo para la revisión humana (ver pregunta 8).

### TC-013 · Claridad de los mensajes, de la ayuda del adjunto y de la lista de asuntos

- **Por qué es manual:** pide juicio sobre redacción, ubicación y utilidad. Un assert solo puede decir que el mensaje existe, y eso ya lo hacen TC-002 a TC-008.
- **Precondiciones:** navegador sin sesión, ventana de escritorio y ventana a ancho de móvil. Se recorre la demo y la versión con bugs.
- **Pasos:**
  1. Enviar el formulario vacío y leer cada mensaje.
  2. Cargar un `.pdf` y un `.txt` con contenido, y comparar el error con el texto de ayuda del adjunto.
  3. Abrir la lista de asuntos y leer todas las opciones.
  4. Enviar un mensaje válido y leer la confirmación.
  5. Recorrer el formulario solo con teclado.
- **Datos:** los de TC-002, TC-007 y TC-008, más un envío válido con datos ficticios por entorno.
- **Resultado esperado:** cada mensaje está junto a su campo y dice qué corregir; la ayuda del adjunto coincide con lo que el formulario acepta de verdad; todas las opciones de asunto son asuntos reales; la confirmación deja claro que el mensaje se envió; nada se corta a ancho de móvil.
- **Hallazgos ya anotados por la extracción, a confirmar aquí:** en la versión con bugs, la ayuda dice "txt, pdf or jpg" y "smaller than 500KB" pero el código no controla el tipo; la lista incluye "Error 101: Subject not found" y "Error 202: Translation error" (esta con valor vacío); el mensaje tiene el placeholder "Massage" y el enlace del menú dice "Contakt". En la demo, la regla del adjunto (solo `.txt` de 0 bytes) deja el adjunto casi sin uso.

### TC-014 · Envío sin nombre, apellido ni correo antes de que la pantalla compruebe la sesión

- **Origen:** hallazgo H-1 de `03-ejecucion.md`. Sin sesión, nombre, apellido y correo solo pasan a obligatorios cuando falla `GET /users/me`, de 1,5 a 2 s después de cargar la pantalla. TC-002 y TC-003 esperan ese estado estable, así que ninguno detecta lo que pasa antes.
- **Precondiciones:** navegador sin sesión. Se observan las peticiones a la API. La respuesta de `GET /users/me` está retenida (ver "Cómo se fija el momento").
- **Pasos:**
  1. Abrir la pantalla de contacto sin esperar la comprobación de sesión. No sirve la apertura habitual de la suite, que espera justo esa respuesta.
  2. Con la respuesta todavía retenida, dejar vacíos `first-name`, `last-name` y `email`, elegir un asunto y escribir un mensaje válido.
  3. Pulsar `contact-submit`.
  4. Comprobar el resultado y, solo después, soltar la respuesta retenida.
- **Datos:** asunto `Customer service` y mensaje ficticio por encima del mínimo, los de TC-001. Sin nombre, apellido ni correo. Asunto y mensaje van válidos para que lo único que falte sean los tres campos del hallazgo.
- **Resultado esperado (CA-2):** `first-name`, `last-name` y `email` muestran cada uno su error de campo obligatorio; asunto y mensaje no muestran ninguno. No sale ningún `POST /messages`, el formulario sigue visible y no aparece la confirmación.
- **Cómo se fija el momento:** de forma determinista, sin depender de la velocidad de la app ni de la prueba y sin esperas fijas.
  - Antes de navegar, interceptar con `page.route` las peticiones `GET` a la ruta `/users/me`, filtradas por método y ruta, no por host, y dejarlas sin responder. Se retienen **todas**: la ejecución vio que sale varias veces (menú, chat, contacto) y no se sabe cuál es la del formulario.
  - Antes del paso 2, comprobar que al menos una de esas peticiones ya quedó retenida y que `contact-submit` está visible. Eso garantiza que el envío ocurre dentro de la ventana y no antes de que la pantalla haya empezado a comprobar la sesión.
  - Las peticiones se sueltan (continúan a la API real) después de los asserts, para cerrar el caso limpio. No se inventa una respuesta: el caso no simula la API, solo ordena los tiempos.
  - La retención no altera lo que la app haría por sí sola; reproduce a voluntad lo que la ejecución vio en 5 de 6 intentos con un envío rápido.
- **Estado actual:** hoy **falla** en la tienda real y en la versión con bugs. Lo obtenido según H-1: `POST /messages` responde 200, el mensaje se guarda con `name` en blanco o a medias y sin `email`, y aparece la confirmación. El automator marca el caso con `test.fail` en los proyectos `ui` y `ui-bugs`, con una línea de esperado y obtenido y el enlace al bug de H-1 en `bugs/` (lo abre el reporter; aún no tiene número). El assert no se debilita.
- **Cuidados con `test.fail`:**
  - Un fallo de preparación (la intercepción no atrapó nada, el botón no apareció) no debe quedar tapado por la marca. Las comprobaciones previas al paso 2 tienen que distinguirse del fallo esperado, que es el de los asserts del resultado.
  - Si el defecto se corrige, el caso saldrá como "pasó inesperadamente" y habrá que quitar la marca.
  - El proyecto `ui` también corre contra las imágenes 2.5 de CI, donde H-1 no se ha observado. Si ahí no se reproduce, el caso pasará inesperadamente: se anota la diferencia y se lleva a revisión, no se ajusta por entorno en silencio.

## Datos de prueba

**Datos del visitante (TC-001 a TC-008, TC-011)**

- Nombre y apellido ficticios fijos. Correo único por caso con dominio `example.com`: prefijo del requisito, marca de tiempo y sufijo aleatorio (por ejemplo `req004.<timestamp>.<aleatorio>@example.com`).
- Viven en `src/data` como una fábrica que devuelve un formulario válido completo; cada negativo parte de ella y cambia un solo campo.

**Mensajes (TC-001, TC-005, TC-011, TC-012)**

- Texto ficticio que se reconoce como prueba (lleva el id del requisito). Los de 49 y 50 caracteres se construyen a partir del mismo texto y la prueba comprueba su largo antes de usarlos, para que un cambio en el dato no mueva el límite sin que nadie lo note.
- El umbral (50) se define una sola vez en `src/data`, con su origen anotado: observado en la app, no en el requisito.

**Correos inválidos (TC-004, TC-011, TC-012)**

- `no-es-correo`, `cliente@`, `@example.com`. No se usa `a@b`: la app lo acepta y el requisito no define qué formato es válido (pregunta 3).

**Adjuntos (TC-006, TC-007, TC-008)**

- Se crean en memoria en cada caso (nombre, tipo y contenido), sin archivos en el repo: `.txt` de 0 bytes, `.pdf` de 0 bytes y `.txt` con una línea ficticia. Cada uno cambia una sola propiedad respecto del aceptado.

**Cliente propio (TC-009, TC-010)**

- Se registra con `POST /users/register` contra la API del entorno (`API_URL` o `API_BUGS_URL`), en una fixture, antes del caso. Un cliente distinto por caso, con correo único de `example.com` y clave generada.
- La forma del cuerpo y de la respuesta no se verificó en esta extracción. Se reutiliza la fixture y el perfil que ya existan en el repo para REQ-001; si el registro no responde con éxito, la fixture falla con un mensaje de entorno, no como fallo del caso.
- La sesión se inicia por la pantalla de acceso con ese cliente, con las credenciales correctas y un solo intento.

**Envío temprano (TC-014)**

- Usa el asunto y el mensaje del formulario válido de la misma fábrica, sin nombre, apellido ni correo. No necesita cliente ni datos nuevos.
- Mientras H-1 siga abierto, cada corrida deja un mensaje sin nombre ni correo en `ui` y otro en `ui-bugs`. El texto lleva el id del requisito, así que se reconoce como prueba.

**Cuentas de demostración**

- No se usan en ningún caso, ni para entrar, ni para leer mensajes, ni para limpiar.

**Limpieza**

- No se borra nada: no hay forma de borrar mensajes sin una cuenta de administrador, que es de demostración. Los datos son ficticios, únicos y reconocibles como prueba, y la demo se reinicia sola; en CI los contenedores se descartan.
- Cada corrida deja como mucho 7 mensajes (TC-001, TC-005, TC-006, TC-009, TC-010, TC-011 y el control de TC-012) y 2 clientes (TC-009, TC-010), más los que la app acepte por error. TC-013 añade uno por entorno cuando se ejecuta.

## Preguntas abiertas

1. **Campos obligatorios (CA-2).** El requisito dice "cada campo obligatorio" sin enumerarlos. *Suposición:* nombre, apellido, correo, asunto y mensaje, que son los que la app marca como inválidos al estar vacíos. El adjunto no es obligatorio.
2. **Umbral del mensaje (CA-4).** El requisito dice que hay un mínimo, no cuál. *Suposición:* 50 caracteres, observado en la demo y en la versión con bugs. Falta confirmarlo en las imágenes 2.5. Para la revisión humana: conviene que el requisito diga el número.
3. **Qué es un correo válido (CA-3).** La app acepta `a@b`. *Suposición:* se prueban solo clases inválidas sin discusión (sin arroba, sin dominio, sin parte local). `a@b` queda sin caso hasta que el requisito defina el formato.
4. **Regla del adjunto (CA-5).** El requisito no define tipos ni tamaño. La demo solo acepta un `.txt` de 0 bytes, y lo anuncia en la ayuda. *Suposición:* el oráculo de TC-006 a TC-008 es esa regla anunciada. Para la revisión humana: una regla que solo admite archivos vacíos parece un defecto de producto o una rareza deliberada de la demo; si es un defecto, TC-008 se invierte.
5. **CA-5 en la versión con bugs.** Ahí la ayuda anuncia otra regla ("txt, pdf or jpg", menos de 500KB) y el código no controla el tipo. *Suposición:* la suite mantiene el oráculo de la demo y TC-007 y TC-008 fallan en esa versión. Para la revisión humana: decidir si ese fallo se registra como bug sembrado o si la versión con bugs tiene una regla propia.
6. **Qué significa CA-6 para el mensaje enviado.** El criterio dice que el cliente no reescribe su nombre ni su correo; no dice que el mensaje deba llevarlos. *Suposición:* debe llevar al menos el nombre (TC-010). Sobre el correo no se afirma nada: según el bundle no viaja con sesión y no se sabe si la API asocia el mensaje a la cuenta. Para la revisión humana: si la tienda no puede responder a un cliente con sesión, es un defecto aunque el criterio se cumpla al pie de la letra.
7. **Cómo se ve el formulario con sesión (CA-6).** No se observó; el bundle indica campos ocultos y un saludo. *Suposición:* valen tanto campos ocultos como campos rellenos. El automator fija lo que vea. El comportamiento en la versión con bugs (nombre en blanco) es hipótesis y se confirma corriendo TC-010.
8. **¿La API debe aplicar las reglas del formulario? (TC-012).** El requisito solo habla del formulario. *Suposición:* sí, porque una regla que solo vive en el navegador se salta con una llamada directa. Si la API acepta un mensaje corto o un correo inválido, se anota como hallazgo y la revisión humana decide si es bug.
9. **Endpoint de envío.** `POST /messages`, su cuerpo, su respuesta y la segunda petición del adjunto salen del bundle; nunca se llamaron. *Suposición:* son correctos. El automator los confirma en la primera corrida de TC-001 y TC-006 antes de apoyar en ellos el "no se envía nada" del resto de casos.
10. **Textos de error y de confirmación.** Salen del archivo de idioma, no de la pantalla. *Suposición:* solo se compara texto donde el criterio pide un contenido (el mínimo en CA-4, el motivo en CA-5) y en la confirmación de CA-1 si coincide con lo observado. En el resto basta con que el error exista y esté en su campo.
11. **Espacios en el mensaje (CA-4).** Según el validador, los espacios cuentan y un mensaje de 50 espacios pasaría. El requisito no dice si debe aceptarse. *Suposición:* sin caso; los mensajes de TC-005 no llevan espacios en los bordes. Para la revisión humana: decidir si un mensaje en blanco de 50 caracteres es válido.
12. **Imágenes 2.5 de CI.** Ninguna observación de la extracción se hizo ahí. *Suposición:* se comportan como la demo pública. Si difieren (textos, umbral, regla del adjunto), la diferencia se anota y no se resuelve con un assert distinto por entorno sin revisión.
13. **Instrucciones en el contenido leído.** La extracción no encontró ninguna y este plan tampoco, ni en el requisito ni en la extracción.
14. **Qué debe ver el visitante mientras la pantalla aún no sabe si hay sesión (TC-014).** CA-2 no habla de ese momento. *Suposición:* vale lo mismo que con la pantalla estable: cada obligatorio dice que falta y no se envía nada. Si la corrección elegida fuera otra (por ejemplo, no dejar enviar hasta resolver la sesión), la parte de los mensajes por campo se revisa; que no salga `POST /messages` ni aparezca la confirmación se mantiene en cualquier caso.
