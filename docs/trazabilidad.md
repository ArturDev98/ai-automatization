# Matriz de trazabilidad

_Generada por `npm run trazabilidad` a partir del plan y de los resultados de Playwright. No se edita a mano._

✅ pasa · 🐞 falla por un bug ya reportado · ❌ falla · ⚠️ inestable · ✋ manual

| Requisito | Criterio | Casos |
|---|---|---|
| REQ-001 | **CA-1** Un cliente registrado que escribe su correo y su clave correctos entra a la tienda, llega a "My account" y ve su nombre en el menú superior. | TC-001 🐞 ui-bugs ✅ ui |
| REQ-001 | **CA-2** Con un correo o una clave incorrectos el cliente no entra y ve el mensaje "Invalid email or password". | TC-002 ✅ ui-bugs ✅ ui<br>TC-003 ✅ ui-bugs ✅ ui |
| REQ-001 | **CA-3** El correo y la clave son obligatorios y el correo debe tener formato válido. Cada campo muestra su propio mensaje de error y no se envía el formulario. | TC-004 🐞 ui-bugs ✅ ui<br>TC-005 🐞 ui-bugs ✅ ui<br>TC-013 ✋ |
| REQ-001 | **CA-4** Un visitante que llena el registro con datos válidos queda registrado, es llevado al inicio de sesión y puede entrar con las credenciales que acaba de crear. | TC-006 🐞 ui-bugs ✅ ui |
| REQ-001 | **CA-5** El registro no acepta campos obligatorios vacíos ni una clave que incumpla la política: mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo. | TC-007 ✅ ui-bugs ✅ ui<br>TC-008 🐞 ui-bugs ✅ ui<br>TC-009 🐞 ui-bugs ✅ ui<br>TC-011 ✅ api<br>TC-013 ✋ |
| REQ-001 | **CA-6** Al cerrar sesión el cliente vuelve a ser visitante: el menú muestra "Sign in" y la página "My account" deja de estar disponible. | TC-010 ✅ ui-bugs ✅ ui<br>TC-012 ✅ ui-bugs ✅ ui |
| REQ-002 | **CA-1** Al buscar un texto, el catálogo muestra solo productos cuyo nombre lo contiene. Si no hay coincidencias, muestra un mensaje que lo dice. | TC-001 ✅ ui-bugs ✅ ui<br>TC-002 🐞 ui-bugs ✅ ui |
| REQ-002 | **CA-2** Al marcar una categoría, el catálogo muestra solo productos de esa categoría. | TC-003 ✅ ui-bugs ✅ ui |
| REQ-002 | **CA-3** El catálogo se puede ordenar por nombre (A-Z, Z-A) y por precio (menor a mayor, mayor a menor), y el orden mostrado corresponde al elegido. | TC-004 🐞 ui-bugs ✅ ui<br>TC-005 🐞 ui-bugs ✅ ui |
| REQ-002 | **CA-4** Desde el detalle se puede elegir una cantidad y agregar el producto al carrito. El ícono del carrito muestra el total de unidades. | TC-006 ✅ ui-bugs ✅ ui<br>TC-007 🐞 ui-bugs ✅ ui |
| REQ-002 | **CA-5** En el carrito, el total de cada línea es precio por cantidad y el total general es la suma de las líneas. Al cambiar una cantidad, ambos se recalculan. | TC-008 🐞 ui-bugs ✅ ui<br>TC-009 🐞 ui-bugs ✅ ui |
| REQ-002 | **CA-6** Al quitar un producto del carrito, desaparece de la lista y el total se actualiza. | TC-010 🐞 ui-bugs ✅ ui |
| REQ-002 | **CA-7** Un producto sin existencias se muestra como "Out of stock" y no se puede agregar al carrito. | TC-011 ✅ ui-bugs ✅ ui |
| REQ-002 | **CA-8** Un cliente con sesión iniciada puede terminar la compra: confirma su dirección, elige un método de pago, y al confirmar ve el mensaje de pago exitoso y un número de factura. | TC-012 🐞 ui-bugs ✅ ui<br>TC-013 ✋ |
| REQ-003 | **CA-1** GET /products devuelve los productos paginados, con metadatos coherentes entre sí (página actual, tamaño de página, total y última página) y sin repetir productos entre páginas. | TC-001 ✅ api<br>TC-002 ✅ api |
| REQ-003 | **CA-2** GET /products/{id} devuelve el detalle del producto pedido, y responde 404 cuando el id no existe. | TC-003 ✅ api<br>TC-004 ✅ api |
| REQ-003 | **CA-3** El listado admite búsqueda por texto, filtro por categoría y orden por precio o nombre, y todos los productos devueltos cumplen el criterio pedido. | TC-005 ✅ api<br>TC-006 ✅ api<br>TC-007 ✅ api |
| REQ-003 | **CA-4** El contrato de un producto es estable: id, name, description, price, in_stock, category y brand vienen siempre y con el tipo esperado. | TC-003 ✅ api<br>TC-008 ✅ api |
| REQ-003 | **CA-5** POST /users/login entrega un token con credenciales válidas y responde 401 con credenciales inválidas. GET /users/me exige ese token: sin él responde 401. | TC-009 ✅ api<br>TC-010 ✅ api<br>TC-011 ✅ api |
| REQ-003 | **CA-6** El carrito se puede crear, recibir un producto, consultarse, cambiar la cantidad y eliminarse, y cada paso deja el carrito en el estado esperado. | TC-012 ✅ api |
| REQ-003 | **CA-7** Una petición con datos inválidos responde con un error de cliente (4xx) y un cuerpo que explica el problema; nunca con un 5xx. | TC-013 ✅ api<br>TC-014 ✅ api |
