# Plan de pruebas · REQ-003 · API de productos, sesión y carrito

> Generado por: planner (Claude Fable 5.2) · 2026-11-14 · Requisito: REQ-003

## Alcance

**Entra**

- `GET /products`: paginación, metadatos y unicidad entre páginas (CA-1).
- `GET /products/{id}`: detalle y 404 (CA-2).
- Búsqueda por texto, filtro por categoría y orden por precio o nombre (CA-3).
- Contrato del producto en detalle y en listado (CA-4).
- Sesión: registro del cliente de la corrida, `POST /users/login` y `GET /users/me` (CA-5).
- Ciclo de vida del carrito: crear, añadir, consultar, cambiar cantidad, eliminar (CA-6).
- Respuestas a datos inválidos en carrito y login: 4xx con cuerpo explicativo, nunca 5xx (CA-7).

**Queda fuera**

- La UI de Toolshop y la versión con bugs sembrados (este requisito es solo de API, proyecto `api`).
- La cuenta de demostración `customer@practicesoftwaretesting.com`: está bloqueada (423) y el requisito
  la descarta como dependencia. Ningún caso la usa, ni para login válido ni para login inválido.
- El bloqueo de cuenta tras tres intentos fallidos: no es criterio de este requisito y probarlo
  destruye datos.
- Validación del propio `POST /users/register` (campos, duplicados, reglas de clave): aquí es solo
  una precondición de CA-5, no un criterio.
- Checkout, pagos, facturas, favoritos, marcas y administración.
- Rendimiento, carga y seguridad más allá del 401 de `GET /users/me`.

## Riesgos

1. **Dependencia de una cuenta compartida (alto).** La extracción no pudo verificar el login válido
   porque la cuenta de demostración responde 423. Mitigación: TC-009 registra un cliente propio con
   correo único en cada corrida y hace login con él; ningún caso toca la cuenta compartida.
2. **Datos de catálogo que cambian (alto).** Es una demo pública de terceros: ids de producto y de
   categoría, totales (50) y número de páginas (6) pueden cambiar. Mitigación: ningún caso fija esos
   valores; los ids se leen en tiempo de ejecución (`GET /products`, `GET /categories/tree`) y los
   totales se comparan entre sí, no contra una constante.
3. **Paginación incoherente o con duplicados (alto).** Un integrador que recorra el catálogo perdería
   o repetiría productos. Mitigación: TC-001 recorre todas las páginas y cruza metadatos con el
   contenido real; TC-002 cubre el borde superior.
4. **Contrato inestable entre endpoints (alto).** El producto dentro del carrito ya viene sin
   `category` ni `brand`; si el listado o el detalle perdieran un campo, los canales integrados se
   rompen. Mitigación: TC-003 valida el contrato en el detalle y TC-008 en todos los productos del listado.
5. **Errores de cliente que salen como 5xx o sin explicación (medio).** Hay tres formas de cuerpo de
   error y el login valida distinto al resto. Mitigación: TC-013 y TC-014 recorren los datos inválidos
   observados más los límites de cantidad y exigen 4xx con texto no vacío; la forma exacta queda como
   pregunta abierta.
6. **Carritos huérfanos en un servicio compartido (medio).** Mitigación: cada caso de carrito crea el
   suyo y lo elimina en la limpieza aunque falle a mitad (ver Datos de prueba).

## Casos de prueba

| ID | Criterios | Título | Técnica | Prioridad | Tipo |
|---|---|---|---|---|---|
| TC-001 | CA-1 | Paginación completa con metadatos coherentes y sin productos repetidos | contrato | Alta | Automatizado |
| TC-002 | CA-1 | Última página y página fuera de rango mantienen metadatos coherentes | valores límite | Media | Automatizado |
| TC-003 | CA-2, CA-4 | Detalle de un producto existente devuelve el producto pedido con su contrato | contrato | Alta | Automatizado |
| TC-004 | CA-2 | Detalle de un id inexistente responde 404 | partición de equivalencia | Alta | Automatizado |
| TC-005 | CA-3 | Búsqueda por texto devuelve solo productos que contienen el término | partición de equivalencia | Alta | Automatizado |
| TC-006 | CA-3 | Filtro por categoría devuelve solo productos de esa categoría | partición de equivalencia | Alta | Automatizado |
| TC-007 | CA-3 | Orden por precio y por nombre, ascendente y descendente | tabla de decisión | Media | Automatizado |
| TC-008 | CA-4 | Contrato del producto estable en todo el listado | contrato | Alta | Automatizado |
| TC-009 | CA-5 | Login con cliente recién registrado entrega token y da acceso a /users/me | transición de estados | Alta | Automatizado |
| TC-010 | CA-5 | Login con correo inexistente responde 401 sin token | partición de equivalencia | Alta | Automatizado |
| TC-011 | CA-5 | /users/me sin token o con token inválido responde 401 | conjetura de errores | Alta | Automatizado |
| TC-012 | CA-6 | Ciclo de vida del carrito: crear, añadir, consultar, cambiar cantidad y eliminar | transición de estados | Alta | Automatizado |
| TC-013 | CA-7 | Datos inválidos en el carrito responden 4xx con explicación y nunca 5xx | valores límite | Alta | Automatizado |
| TC-014 | CA-7 | Login con cuerpo incompleto responde 4xx con explicación y nunca 5xx | conjetura de errores | Media | Automatizado |

No hay casos manuales: el requisito es una API sin juicio visual ni de usabilidad, y el único flujo
que destruiría datos compartidos (bloquear una cuenta) queda fuera de alcance en lugar de probarse a mano.

## Detalle de casos

Base de todas las peticiones: `https://api.practicesoftwaretesting.com`. Tags por prueba:
`@REQ-003` y el `@TC-0NN` correspondiente.

### TC-001 · Paginación completa con metadatos coherentes y sin productos repetidos

- **Precondiciones:** ninguna.
- **Pasos:**
  1. `GET /products?page=1`. Guardar `total`, `per_page` y `last_page`.
  2. `GET /products?page=N` para cada N de 2 a `last_page`.
- **Datos:** ninguno fijo; `total`, `per_page` y `last_page` se leen de la página 1.
- **Resultado esperado:**
  - Todas las respuestas son 200.
  - En cada página, `current_page` es igual a la N pedida, y `total`, `per_page` y `last_page` son
    iguales a los de la página 1.
  - `last_page` es igual a `ceil(total / per_page)`.
  - Cada página trae como máximo `per_page` productos y las páginas anteriores a la última traen
    exactamente `per_page`.
  - La suma de productos de todas las páginas es igual a `total`.
  - El conjunto de `id` de todas las páginas no tiene repetidos (ids únicos = `total`).

### TC-002 · Última página y página fuera de rango mantienen metadatos coherentes

- **Precondiciones:** ninguna.
- **Pasos:**
  1. `GET /products?page=1`. Guardar `total`, `per_page` y `last_page`.
  2. `GET /products?page={last_page}`.
  3. `GET /products?page={last_page + 1}`.
- **Datos:** `last_page` y `last_page + 1`, calculados en ejecución.
- **Resultado esperado:**
  - Paso 2: 200, `current_page` = `last_page`, y `data` trae `total - per_page * (last_page - 1)`
    productos (entre 1 y `per_page`).
  - Paso 3 (suposición, ver pregunta abierta 4): 200, `data` vacío, y `total` y `last_page` iguales a
    los de la página 1. En ningún caso un 5xx.

### TC-003 · Detalle de un producto existente devuelve el producto pedido con su contrato

- **Precondiciones:** ninguna.
- **Pasos:**
  1. `GET /products?page=1` y tomar el primer producto (`id`, `name`, `price`).
  2. `GET /products/{id}` con ese id.
- **Datos:** id leído en el paso 1 (en la extracción: `01M7EBGKH5Y5Z6THZ35N71B8MQ`, Combination Pliers).
- **Resultado esperado:**
  - 200.
  - `id` del detalle igual al pedido; `name` y `price` iguales a los del listado.
  - Contrato de CA-4: `id`, `name` y `description` son string; `price` es número; `in_stock` es
    booleano; `category` y `brand` son objetos no nulos. Los siete campos están presentes.

### TC-004 · Detalle de un id inexistente responde 404

- **Precondiciones:** ninguna.
- **Pasos:** `GET /products/01M7EBGKZZZZZZZZZZZZZZZZZZ`.
- **Datos:** id ficticio con forma de ULID que no existe.
- **Resultado esperado:** 404. El cuerpo es JSON con un `message` de texto no vacío (observado:
  `Requested item not found`); el assert del texto exacto no es obligatorio, el código sí.

### TC-005 · Búsqueda por texto devuelve solo productos que contienen el término

- **Precondiciones:** ninguna.
- **Pasos:**
  1. `GET /products/search?q=hammer`; si `last_page` > 1, recorrer todas las páginas.
  2. `GET /products/search?q=zzzznoexiste`.
- **Datos:** término con resultados `hammer`; término sin resultados `zzzznoexiste`.
- **Resultado esperado:**
  - Paso 1: 200, `total` mayor que 0 e igual al número de productos devueltos; cada producto contiene
    `hammer` en `name` o en `description`, sin distinguir mayúsculas (suposición, ver pregunta abierta 3).
  - Paso 2: 200, `data` vacío y `total` 0.

### TC-006 · Filtro por categoría devuelve solo productos de esa categoría

- **Precondiciones:** ninguna.
- **Pasos:**
  1. `GET /categories/tree` y localizar por nombre las categorías `Hammer` y `Pliers`; guardar sus ids.
  2. `GET /products?by_category={id de Hammer}`, todas sus páginas.
  3. `GET /products?by_category={id de Pliers}`, todas sus páginas.
- **Datos:** dos categorías hoja distintas (dos particiones válidas), ids leídos en el paso 1.
- **Resultado esperado:**
  - Pasos 2 y 3: 200, `total` mayor que 0 e igual al número de productos devueltos.
  - Todos los productos del paso 2 tienen `category.id` igual al id de Hammer; todos los del paso 3,
    igual al id de Pliers.
  - Ningún `id` de producto aparece en los dos resultados.

### TC-007 · Orden por precio y por nombre, ascendente y descendente

- **Precondiciones:** ninguna.
- **Pasos:** para cada combinación, `GET /products?sort={campo},{dirección}` recorriendo todas las
  páginas y concatenando los productos en el orden recibido.
- **Datos (tabla de decisión, 4 combinaciones):** `price,asc` · `price,desc` · `name,asc` · `name,desc`.
- **Resultado esperado:**
  - Todas las respuestas son 200 y el total de productos concatenados es igual a `total`.
  - `price,asc`: cada precio es mayor o igual que el anterior. `price,desc`: menor o igual.
  - `name,asc`: cada nombre es mayor o igual que el anterior, comparando sin distinguir mayúsculas.
    `name,desc`: menor o igual.
  - El orden se mantiene al cruzar de una página a la siguiente (por eso se concatena antes de comparar).
  - Los empates (mismo precio) no cuentan como fallo.

### TC-008 · Contrato del producto estable en todo el listado

- **Precondiciones:** ninguna.
- **Pasos:** `GET /products?page=N` para N de 1 a `last_page`; validar cada producto de `data`.
- **Datos:** todos los productos del catálogo (50 en la extracción).
- **Resultado esperado:** en cada uno de los productos: `id` string no vacío, `name` string no vacío,
  `description` string, `price` número mayor que 0, `in_stock` booleano, `category` objeto no nulo con
  `id` y `name`, `brand` objeto no nulo con `id` y `name`. Si falla, el mensaje indica el `id` del
  producto y el campo. Los campos adicionales (`is_rental`, `co2_rating`, etc.) no hacen fallar el caso.

### TC-009 · Login con cliente recién registrado entrega token y da acceso a /users/me

- **Precondiciones:** ninguna cuenta previa; el caso crea la suya.
- **Pasos:**
  1. `POST /users/register` con un cliente de correo único (ver Datos de prueba).
  2. `POST /users/login` con ese correo y esa clave.
  3. `GET /users/me` con `Authorization: Bearer {token}`.
- **Datos:** correo único por corrida y clave generada; nunca la cuenta de demostración.
- **Resultado esperado:**
  - Paso 1: 201.
  - Paso 2: 200 y el cuerpo trae un token de texto no vacío (campo esperado `access_token`, ver
    pregunta abierta 2).
  - Paso 3: 200 y el `email` devuelto es el del cliente registrado en el paso 1.

### TC-010 · Login con correo inexistente responde 401 sin token

- **Precondiciones:** ninguna.
- **Pasos:** `POST /users/login` con un correo que no existe y una clave cualquiera. Una sola petición.
- **Datos:** correo inexistente único por corrida (por ejemplo `nadie-qa-flow-{sufijo}@example.com`),
  clave `x-inexistente-1`. No se usa ninguna cuenta real: se bloquean al tercer intento fallido.
- **Resultado esperado:** 401; el cuerpo no trae token y trae un texto de error no vacío (observado:
  `{"error": "Unauthorized"}`).

### TC-011 · /users/me sin token o con token inválido responde 401

- **Precondiciones:** ninguna.
- **Pasos:**
  1. `GET /users/me` sin cabecera `Authorization`.
  2. `GET /users/me` con `Authorization: Bearer token-invalido-qa`.
- **Datos:** token falso `token-invalido-qa`.
- **Resultado esperado:** 401 en los dos pasos, y el cuerpo no contiene datos de usuario (sin `email`
  ni `id`). El paso 1 es lo que exige CA-5 literalmente; el paso 2 comprueba que el servicio exige
  *ese* token y no cualquier cabecera.

### TC-012 · Ciclo de vida del carrito: crear, añadir, consultar, cambiar cantidad y eliminar

- **Precondiciones:** un `product_id` válido leído de `GET /products?page=1`. Sin `Authorization`
  (suposición, ver pregunta abierta 7).
- **Pasos y resultado esperado por estado:**
  1. `POST /carts` → 201 y el cuerpo trae un `id` de texto no vacío. Estado: carrito creado.
  2. `GET /carts/{id}` → 200, `id` igual al creado y `cart_items` vacío. Estado: vacío.
  3. `POST /carts/{id}` con `{"product_id": "<id>", "quantity": 1}` → 200.
  4. `GET /carts/{id}` → 200, `cart_items` tiene exactamente 1 elemento, con `product_id` igual al
     enviado y `quantity` 1. Estado: con un producto.
  5. `PUT /carts/{id}/product/quantity` con `{"product_id": "<id>", "quantity": 3}` → 200.
  6. `GET /carts/{id}` → 200, `cart_items` sigue con 1 elemento (no se duplica) y `quantity` 3.
     Estado: cantidad cambiada.
  7. `DELETE /carts/{id}` → 204.
  8. `GET /carts/{id}` → 404. Estado: eliminado.
- **Datos:** un producto real del catálogo; cantidades 1 y 3.
- **Nota:** las respuestas de los pasos 3 y 5 no devuelven el carrito, así que el estado se comprueba
  siempre con el `GET` siguiente. Si el caso falla antes del paso 7, la limpieza elimina el carrito.

### TC-013 · Datos inválidos en el carrito responden 4xx con explicación y nunca 5xx

- **Precondiciones:** un carrito propio recién creado (`POST /carts`) y un `product_id` válido.
- **Pasos:** enviar cada fila contra el mismo carrito.
  1. `POST /carts/{id}` con `{}`.
  2. `POST /carts/{id}` con `product_id` válido y `quantity` 0 (límite inferior inválido; el mínimo
     válido, 1, lo cubre TC-012).
  3. `POST /carts/{id}` con `product_id` válido y `quantity` -1.
  4. `POST /carts/{id}` con `product_id` válido y `quantity` `"abc"`.
  5. `POST /carts/{id}` con `product_id` `01M7EBGKZZZZZZZZZZZZZZZZZZ` y `quantity` 1.
  6. `PUT /carts/{id}/product/quantity` con `{}`.
  7. `GET /carts/{id}`.
- **Datos:** los de cada fila; el id de producto inexistente es el mismo de TC-004.
- **Resultado esperado:**
  - Pasos 1 a 6: el estado está entre 400 y 499 (observado: 422 en las filas 1, 2, 4, 5 y 6; la fila
    3 no se observó en la extracción) y nunca es 5xx.
  - Pasos 1 a 6: el cuerpo es JSON con un `message` de texto no vacío, y `errors` nombra el campo
    culpable: `product_id` y `quantity` en las filas 1 y 6, `quantity` en las filas 2, 3 y 4,
    `product_id` en la fila 5.
  - Paso 7: 200 y `cart_items` vacío; ninguna petición inválida modificó el carrito.
- **Limpieza:** `DELETE /carts/{id}`.

### TC-014 · Login con cuerpo incompleto responde 4xx con explicación y nunca 5xx

- **Precondiciones:** ninguna.
- **Pasos:**
  1. `POST /users/login` con `{}`.
  2. `POST /users/login` con solo `email` (correo inexistente, sin `password`).
- **Datos:** el correo inexistente de TC-010. Ninguna cuenta real, para no sumar intentos fallidos.
- **Resultado esperado:** en los dos pasos el estado está entre 400 y 499 (observado: 401), nunca
  5xx; el cuerpo es JSON con un texto de error no vacío (observado: `{"error": "Invalid login request"}`)
  y no trae token. No se exige 422 ni que el cuerpo nombre el campo que falta (ver pregunta abierta 5).

## Datos de prueba

- **Cliente de la corrida (TC-009).** Se crea con `POST /users/register` al empezar el caso (o en un
  fixture de alcance worker si más adelante lo necesita otro caso). Correo único:
  `qa-req003-{timestamp}-{aleatorio}@example.com`. Clave generada en ejecución, que no se escribe en
  el repositorio ni en los reportes. El resto de campos obligatorios del registro salen de la
  documentación del servicio (ver pregunta abierta 1). Limpieza: no hay; un cliente no puede borrar
  su propia cuenta con lo que se conoce del servicio, así que la cuenta queda en la demo (ver pregunta
  abierta 8). Esa cuenta no se reutiliza entre corridas.
- **Cuenta de demostración.** No se usa en ningún caso.
- **Correo inexistente (TC-010, TC-014).** `nadie-qa-flow-{sufijo}@example.com`, dominio reservado
  que no puede corresponder a una cuenta real. No requiere creación ni limpieza.
- **Token inválido (TC-011).** Literal `token-invalido-qa`.
- **Producto válido (TC-003, TC-012, TC-013).** Primer producto de `GET /products?page=1`, leído en
  cada corrida. Referencia de la extracción: `01M7EBGKH5Y5Z6THZ35N71B8MQ` (Combination Pliers, 14.15).
  No se fija en el código porque la demo puede regenerar sus ids.
- **Id de producto inexistente (TC-004, TC-013).** `01M7EBGKZZZZZZZZZZZZZZZZZZ`. Dato estático en `src/data`.
- **Categorías (TC-006).** `Hammer` y `Pliers`, localizadas por nombre en `GET /categories/tree`.
  Referencia de la extracción: `01M7EBGKG2F6EYM9B8KQE8ZW3J` y `01M7EBGKG2F6EYM9B8KQE8ZW3P`.
- **Términos de búsqueda (TC-005).** `hammer` (con resultados) y `zzzznoexiste` (sin resultados).
- **Totales del catálogo (TC-001, TC-002, TC-007, TC-008).** Se leen de la página 1; no se fija 50,
  9 ni 6.
- **Carritos (TC-012, TC-013).** Cada caso crea el suyo con `POST /carts` y lo elimina con
  `DELETE /carts/{id}`. La eliminación va en la limpieza del fixture para que corra aunque el caso
  falle; en TC-012 la limpieza tolera el 404 porque el propio caso ya lo borró. Ningún carrito se
  comparte entre casos.
- **Solo lectura.** TC-001 a TC-008, TC-010, TC-011 y TC-014 no crean ni modifican datos.

## Preguntas abiertas

1. **Cuerpo de `POST /users/register`.** El requisito fija el endpoint y el 201, pero no los campos,
   y la extracción no lo ejercitó (es anterior al cambio del requisito). Suposición: el automator toma
   los campos obligatorios y las reglas de clave de `https://api.practicesoftwaretesting.com/api/documentation`
   antes de escribir TC-009. Si el registro no responde 201 con datos válidos según esa documentación,
   TC-009 queda bloqueado y se reporta; no se recurre a la cuenta de demostración.
2. **Nombre del campo del token.** CA-5 dice "entrega un token" sin fijar el campo, y la extracción no
   llegó a ver una respuesta de login válida (423). Suposición: `access_token`, a confirmar con la
   documentación; el assert firme es que hay un token de texto no vacío que `GET /users/me` acepta.
3. **Criterio y endpoint de la búsqueda por texto.** `GET /products/search?q=hammer` devuelve 6
   productos y `GET /products?q=hammer` devuelve 7 (incluye Sledgehammer). Suposición: la búsqueda del
   requisito es `GET /products/search?q=` y "cumple el criterio" significa que el término aparece en
   `name` o `description` sin distinguir mayúsculas. TC-005 no prueba `GET /products?q=` ni exige que
   ambos coincidan.
4. **Página fuera de rango.** CA-1 no dice qué responder. Suposición: se acepta lo observado (200,
   `data` vacío, `total` y `last_page` sin cambios) porque es coherente con "metadatos coherentes
   entre sí". Si el dueño del requisito espera un 404, TC-002 cambia en el paso 3.
5. **Forma del cuerpo de error.** CA-7 pide "un cuerpo que explica el problema" sin fijar forma, y hay
   tres: `{"error"}` en login, `{"message"}` en 404 y `{"message", "errors"}` en validación de carrito.
   Además el login incompleto responde 401 y no 422, y no dice qué campo falta. Suposición: basta un
   4xx con un texto de error no vacío; en el carrito se exige además que `errors` nombre el campo
   porque el servicio ya lo hace. Si se quiere una forma única o 422 en el login, es un cambio de
   requisito y un posible bug.
6. **Cantidad negativa.** No se observó en la extracción. El requisito sí fija el resultado (4xx, nunca
   5xx), así que entra en TC-013; el código exacto y el mensaje no se fijan.
7. **Carrito sin sesión.** Los endpoints de carrito funcionan sin `Authorization` y el requisito no
   dice si el carrito debe ligarse a un usuario ni protegerse. Suposición: TC-012 y TC-013 van
   anónimos, que es lo verificado; no se prueba el carrito con sesión ni que se rechace sin ella.
8. **Limpieza de los clientes registrados.** El requisito no dice cómo se eliminan las cuentas que
   crea cada corrida. Suposición: se dejan, con correo único en dominio `example.com`, y no se
   reutilizan. Si la demo no se reinicia periódicamente, conviene confirmarlo con quien la mantiene.
9. **Respuestas de `POST /carts/{id}` y `PUT /carts/{id}/product/quantity`.** Devuelven
   `{"result": "item added or updated"}` y no el carrito. Suposición: es válido; "cada paso deja el
   carrito en el estado esperado" se comprueba con un `GET` posterior y no se hace assert del texto de `result`.
10. **Códigos de éxito del carrito.** El requisito no fija 201, 200 ni 204. Suposición: se usan los
    observados en la extracción (201 al crear, 200 al añadir, consultar y cambiar cantidad, 204 al
    eliminar, 404 al consultar después).
11. **Formato del parámetro de orden y de los ids.** El requisito no fija `sort=campo,dirección` ni el
    formato de los ids (ULID en minúscula en carritos, en mayúscula en productos). Suposición: se usa
    `sort=campo,dirección` tal como se observó y los ids se tratan como texto opaco, sin assert de formato.
12. **Comparación de nombres en el orden.** El requisito no dice si el orden por nombre distingue
    mayúsculas o acentos. Suposición: comparación sin distinguir mayúsculas; si aparece una diferencia
    solo por la intercalación de la base de datos, se revisa antes de reportar bug.
