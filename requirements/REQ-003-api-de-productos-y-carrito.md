# REQ-003 · API de productos, sesión y carrito

**Como** equipo que integra la tienda con otros canales
**quiero** que la API de productos, sesión y carrito responda de forma predecible
**para** construir sobre ella sin sorpresas.

## Servicio

- Base: `https://api.practicesoftwaretesting.com`
- Documentación: `https://api.practicesoftwaretesting.com/api/documentation`

## Criterios de aceptación

- **CA-1** `GET /products` devuelve los productos paginados, con metadatos coherentes entre sí
  (página actual, tamaño de página, total y última página) y sin repetir productos entre páginas.
- **CA-2** `GET /products/{id}` devuelve el detalle del producto pedido, y responde 404 cuando el
  id no existe.
- **CA-3** El listado admite búsqueda por texto, filtro por categoría y orden por precio o nombre,
  y todos los productos devueltos cumplen el criterio pedido.
- **CA-4** El contrato de un producto es estable: `id`, `name`, `description`, `price`, `in_stock`,
  `category` y `brand` vienen siempre y con el tipo esperado.
- **CA-5** `POST /users/login` entrega un token con credenciales válidas y responde 401 con
  credenciales inválidas. `GET /users/me` exige ese token: sin él responde 401.
- **CA-6** El carrito se puede crear, recibir un producto, consultarse, cambiar la cantidad y
  eliminarse, y cada paso deja el carrito en el estado esperado.
- **CA-7** Una petición con datos inválidos responde con un error de cliente (4xx) y un cuerpo que
  explica el problema; nunca con un 5xx.

## Datos y restricciones

- Cliente de prueba: cada corrida registra su propio cliente con `POST /users/register` de la API (correo único) y entra con él. La cuenta de demostración `customer@practicesoftwaretesting.com` es compartida, otras personas la bloquean (HTTP 423) y no es una dependencia válida para la suite.
- El caso de credenciales inválidas usa un correo que no existe (una cuenta se bloquea tras tres
  intentos fallidos).
- Cada prueba crea su propio carrito y lo elimina al terminar.
