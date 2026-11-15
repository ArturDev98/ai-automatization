# Plan de pruebas · REQ-002 · Catálogo, carrito y compra

> Generado por: planner (Claude Fable 5.2) · 2026-11-14 · Requisito: REQ-002

## Alcance

**Entra**

- Catálogo (`/`): búsqueda por texto (con y sin coincidencias), filtro por categoría y los cuatro órdenes pedidos (nombre A-Z y Z-A, precio ascendente y descendente).
- Detalle (`/product/{id}`): elegir cantidad, agregar al carrito, contador de unidades del ícono del carrito y producto sin existencias.
- Carrito y pago (`/checkout`): totales por línea y general, recálculo al cambiar cantidad, quitar producto y compra completa con sesión iniciada hasta el mensaje de pago exitoso y el número de factura.
- La misma suite, sin cambios, contra la versión con bugs sembrados: los asserts son de negocio (aritmética, orden, pertenencia al filtro), no de "se ve algo".

**Queda fuera**

- Filtros que el requisito no pide: marca, rango de precio, sostenibilidad, orden por CO₂, comparar y favoritos.
- Registro e inicio de sesión como funcionalidad (aquí solo son preparación de datos), claves incorrectas y bloqueo de cuenta.
- La cuenta de demostración `customer@practicesoftwaretesting.com`: no se usa en ningún caso (ver Datos de prueba).
- Validaciones de los formularios de dirección y pago, historial de facturas, idiomas, vistas móviles, rendimiento y accesibilidad.

## Riesgos

1. **Totales mal calculados en el carrito (CA-5, CA-6).** Es el riesgo de mayor impacto: el cliente paga otra cifra. TC-008, TC-009 y TC-010 recalculan en la prueba, en centavos, cada total de línea y el total general a partir del precio unitario y la cantidad mostrados, con dos productos de precios distintos y cantidades distintas para que un total "de una sola línea" o una suma sin multiplicar no pase por casualidad.
2. **Orden o filtro que no corresponde a lo elegido (CA-1, CA-2, CA-3).** Un orden por precio hecho como texto ("9.17" después de "14.15"), un orden aplicado solo a la página visible, una dirección invertida o un filtro que deja pasar productos ajenos. TC-001, TC-003, TC-004 y TC-005 comparan lo mostrado contra un oráculo calculado desde la API (conjunto exacto de nombres, extremo global del orden) y verifican el orden numérico entre páginas.
3. **Contador del carrito que cuenta líneas y no unidades (CA-4).** TC-006 usa cantidad 3 en un solo producto (líneas = 1, unidades = 3) y TC-007 dos productos con 2 y 1 unidades (líneas = 2, unidades = 3): en ambos el valor correcto difiere del conteo de líneas.
4. **Producto sin existencias que se puede comprar (CA-7).** TC-011 verifica el rótulo en tarjeta y detalle y, sobre todo, que tras intentar agregarlo el carrito sigue sin unidades; también que un producto con existencias no lleva el rótulo.
5. **Dependencia de datos y pantallas no observadas (CA-8 y entorno).** La cuenta compartida está bloqueada (HTTP 423) y `/checkout` no tiene selectores capturados. El plan registra un cliente propio por corrida con `POST /users/register`, no fija precios ni ids en el código y deja como preguntas abiertas los pasos de pago; el automator debe tomar snapshots de `/checkout` con carrito y con sesión antes de escribir TC-008 a TC-012.

## Casos de prueba

| ID | Criterios | Título | Técnica | Prioridad | Tipo |
|---|---|---|---|---|---|
| TC-001 | CA-1 | Buscar un texto existente muestra solo productos cuyo nombre lo contiene | partición de equivalencia | Alta | Automatizado |
| TC-002 | CA-1 | Buscar un texto sin coincidencias muestra el mensaje y ningún producto | partición de equivalencia | Media | Automatizado |
| TC-003 | CA-2 | Marcar una categoría muestra exactamente los productos de esa categoría | partición de equivalencia | Alta | Automatizado |
| TC-004 | CA-3 | Ordenar por nombre A-Z y Z-A deja los nombres en el orden elegido | tabla de decisión | Media | Automatizado |
| TC-005 | CA-3 | Ordenar por precio ascendente y descendente deja los precios en orden numérico | tabla de decisión | Alta | Automatizado |
| TC-006 | CA-4 | Agregar un producto con cantidad 3 deja el contador del carrito en 3 | valores límite | Alta | Automatizado |
| TC-007 | CA-4 | El contador del carrito suma unidades de dos productos distintos y no líneas | conjetura de errores | Alta | Automatizado |
| TC-008 | CA-5 | Total de línea igual a precio por cantidad y total general igual a la suma | tabla de decisión | Alta | Automatizado |
| TC-009 | CA-5 | Cambiar una cantidad en el carrito recalcula la línea y el total general | transición de estados | Alta | Automatizado |
| TC-010 | CA-6 | Quitar un producto lo elimina de la lista y actualiza el total | transición de estados | Alta | Automatizado |
| TC-011 | CA-7 | Producto sin existencias se muestra como Out of stock y no entra al carrito | conjetura de errores | Alta | Automatizado |
| TC-012 | CA-8 | Cliente con sesión completa la compra y ve pago exitoso y número de factura | transición de estados | Alta | Automatizado |
| TC-013 | CA-8 | Recorrido exploratorio del pago con los demás métodos y revisión de la confirmación | exploratoria | Media | Manual |

## Detalle de casos

Convenciones comunes a todos los casos:

- Cada prueba arranca con un contexto de navegador nuevo (carrito vacío, sin sesión), salvo TC-012 que inicia sesión.
- **Oráculo de catálogo**: lista completa de productos obtenida recorriendo `GET /products?page={n}` hasta `last_page` en la API del mismo entorno que se prueba (`id`, `name`, `price`, `in_stock`, `category`). Los productos se eligen del oráculo por nombre o por condición, nunca por id ni precio fijos.
- Los importes se comparan en centavos enteros (texto `$14.15` → 1415) para no arrastrar errores de coma flotante.
- "Nombres mostrados" es el texto de `product-name` de cada tarjeta; "precios mostrados" el de `product-price`.

### TC-001 · Buscar un texto existente muestra solo productos cuyo nombre lo contiene

- **Precondiciones**: catálogo en `/` sin filtros. Oráculo de catálogo cargado.
- **Datos**: texto `Pliers`, escrito con la misma capitalización que los nombres para no depender de si la búsqueda distingue mayúsculas.
- **Pasos**:
  1. Escribir `Pliers` en `search-query` y pulsar `search-submit`.
  2. Leer los nombres mostrados; si hay más de una página, recorrerlas con `pagination-next`.
- **Resultado esperado**:
  - Hay al menos un producto y todos los nombres mostrados contienen `Pliers`.
  - El conjunto de nombres mostrados es igual al conjunto de nombres del oráculo que contienen `Pliers` (ni sobran ni faltan). En la página 1 del catálogo ya hay al menos cuatro: Combination Pliers, Pliers, Long Nose Pliers y Slip Joint Pliers.
  - No aparece ningún producto de control cuyo nombre no contiene el texto (por ejemplo `Bolt Cutters`).

### TC-002 · Buscar un texto sin coincidencias muestra el mensaje y ningún producto

- **Precondiciones**: catálogo en `/` sin filtros.
- **Datos**: texto `zzqx-sin-coincidencias`; el oráculo confirma que ningún nombre lo contiene.
- **Pasos**:
  1. Escribir el texto en `search-query` y pulsar `search-submit`.
- **Resultado esperado**:
  - No queda ninguna tarjeta de producto (cero elementos `product-name` en el listado).
  - Se ve un mensaje que indica que no hay productos. El requisito no fija el texto ni el selector (pregunta abierta 3).

### TC-003 · Marcar una categoría muestra exactamente los productos de esa categoría

- **Precondiciones**: catálogo en `/` sin filtros. Oráculo de catálogo y `GET /categories/tree` cargados.
- **Datos**: subcategoría `Pliers`, localizada por nombre en el árbol; su checkbox es `category-<id>`. Según la extracción tiene 5 productos, pero el número se toma del oráculo.
- **Pasos**:
  1. Marcar el checkbox de la categoría Pliers.
  2. Leer los nombres mostrados (todas las páginas si hay más de una).
- **Resultado esperado**:
  - El conjunto de nombres mostrados es igual al conjunto de productos del oráculo con `category.name = Pliers`.
  - No aparece ningún producto de otra categoría (control: ningún nombre del oráculo con categoría `Hammer`, como `Claw Hammer` o `Thor Hammer`, que sin filtro comparten la página 1).
  - La cantidad mostrada es menor que el total del catálogo (el filtro sí se aplicó).

### TC-004 · Ordenar por nombre A-Z y Z-A deja los nombres en el orden elegido

- **Precondiciones**: catálogo en `/` sin filtros. Oráculo de catálogo cargado.
- **Datos**: opciones `Name (A - Z)` y `Name (Z - A)` del select `sort`. Una prueba parametrizada con las dos filas.
- **Pasos** (por cada opción):
  1. Elegir la opción en `sort` y esperar a que el listado cambie.
  2. Leer los nombres mostrados de la página 1 y, tras `pagination-next`, los de la página 2.
- **Resultado esperado**:
  - A-Z: los nombres de la página 1 están en orden alfabético no decreciente (comparación sin distinguir mayúsculas); el primero es el menor nombre de todo el oráculo; el primero de la página 2 no es menor que el último de la página 1.
  - Z-A: lo mismo en sentido inverso; el primero es el mayor nombre de todo el oráculo.
  - El primer nombre de A-Z y el de Z-A son distintos (delata un orden que ignora la dirección).

### TC-005 · Ordenar por precio ascendente y descendente deja los precios en orden numérico

- **Precondiciones**: catálogo en `/` sin filtros. Oráculo de catálogo cargado.
- **Datos**: opciones `Price (Low - High)` y `Price (High - Low)`. Una prueba parametrizada con las dos filas. El catálogo tiene precios de una y dos cifras enteras (9.17, 14.15, 48.41), así que un orden por texto queda delatado.
- **Pasos** (por cada opción):
  1. Elegir la opción en `sort` y esperar a que el listado cambie.
  2. Leer los precios mostrados de la página 1 y, tras `pagination-next`, los de la página 2.
- **Resultado esperado**:
  - Low - High: los precios de la página 1, convertidos a número, son no decrecientes; el primero es igual al precio mínimo del oráculo; el primero de la página 2 es mayor o igual que el último de la página 1.
  - High - Low: no crecientes; el primero es igual al precio máximo del oráculo; el primero de la página 2 es menor o igual que el último de la página 1.
  - El primer precio de Low - High es menor que el primero de High - Low.

### TC-006 · Agregar un producto con cantidad 3 deja el contador del carrito en 3

- **Precondiciones**: carrito vacío. Producto A = `Combination Pliers` (con existencias según el oráculo), abierto desde su tarjeta del catálogo.
- **Datos**: cantidad 3.
- **Pasos**:
  1. En el detalle, poner 3 en `quantity` y comprobar que el campo muestra 3.
  2. Pulsar `add-to-cart`.
  3. Leer el contador del ícono del carrito en el encabezado.
  4. Abrir el carrito.
- **Resultado esperado**:
  - El contador del ícono muestra `3` (no `1`, que sería el número de líneas).
  - El carrito tiene una sola línea, la de Combination Pliers, con cantidad 3.

### TC-007 · El contador del carrito suma unidades de dos productos distintos y no líneas

- **Precondiciones**: carrito vacío. Producto A = `Combination Pliers`, producto B = `Bolt Cutters` (ambos con existencias según el oráculo).
- **Datos**: A con cantidad 2 usando `increase-quantity`; B con la cantidad inicial del campo.
- **Pasos**:
  1. En el detalle de A, leer el valor inicial de `quantity`, pulsar `increase-quantity` una vez y comprobar que el campo subió en 1 (queda en 2).
  2. Pulsar `add-to-cart` y comprobar que el contador muestra 2.
  3. Ir al detalle de B y pulsar `add-to-cart` sin tocar la cantidad (1).
  4. Leer el contador del ícono.
- **Resultado esperado**:
  - Tras el paso 2 el contador muestra `2`; tras el paso 4 muestra `3` (2 + 1), no `2` (líneas) ni `1` (última cantidad).
  - El contador mantiene el `3` al volver al catálogo.

### TC-008 · Total de línea igual a precio por cantidad y total general igual a la suma

- **Precondiciones**: carrito vacío. Productos A = `Combination Pliers` y B = `Bolt Cutters`, cuyos precios se leen de la tarjeta del catálogo (`product-price`) antes de agregarlos.
- **Datos**: A con cantidad 2, B con cantidad 3. Con los precios de la extracción serían 2 × 14.15 = 28.30, 3 × 48.41 = 145.23 y total 173.53; la prueba calcula con lo leído, no con estas cifras.
- **Pasos**:
  1. Agregar A con cantidad 2 y B con cantidad 3 desde sus detalles.
  2. Abrir el carrito (`/checkout`, paso carrito).
  3. Leer por línea nombre, cantidad, precio unitario y total de línea; leer el total general.
- **Resultado esperado**:
  - Hay exactamente dos líneas, A con cantidad 2 y B con cantidad 3.
  - El precio unitario de cada línea es igual al precio leído en el catálogo para ese producto.
  - Total de línea A = precio A × 2 y total de línea B = precio B × 3, con dos decimales.
  - Total general = total de línea A + total de línea B, exacto al centavo.

### TC-009 · Cambiar una cantidad en el carrito recalcula la línea y el total general

- **Precondiciones**: carrito con A = `Combination Pliers` cantidad 2 y B = `Bolt Cutters` cantidad 1, y totales iniciales ya verificados como en TC-008.
- **Datos**: nueva cantidad de A: 5; después, 1.
- **Pasos**:
  1. En el carrito, cambiar la cantidad de A de 2 a 5 y confirmar el campo.
  2. Leer total de línea A, total de línea B y total general.
  3. Cambiar la cantidad de A de 5 a 1 y volver a leer.
- **Resultado esperado**:
  - Tras el paso 1: total de línea A = precio A × 5; total de línea B sin cambios (precio B × 1); total general = precio A × 5 + precio B.
  - Tras el paso 3: total de línea A = precio A; total general = precio A + precio B.
  - Ningún total conserva el valor anterior al cambio (el recálculo ocurre sin recargar la página).

### TC-010 · Quitar un producto lo elimina de la lista y actualiza el total

- **Precondiciones**: carrito con A = `Combination Pliers` cantidad 2 y B = `Bolt Cutters` cantidad 1; total general inicial = precio A × 2 + precio B.
- **Datos**: se quita A.
- **Pasos**:
  1. En el carrito, pulsar el control de quitar de la línea A.
  2. Leer las líneas y el total general.
- **Resultado esperado**:
  - La línea de A ya no está en la lista; queda exactamente una línea, la de B, con cantidad 1.
  - Total general = precio B × 1 (el total inicial menos precio A × 2).

### TC-011 · Producto sin existencias se muestra como Out of stock y no entra al carrito

- **Precondiciones**: carrito vacío. Producto S = el producto del oráculo con `in_stock = false` (hoy `Long Nose Pliers`, único de 50). Producto de control C = `Combination Pliers` (`in_stock = true`).
- **Datos**: ninguno más.
- **Pasos**:
  1. En el catálogo, localizar la tarjeta de S y la de C.
  2. Abrir el detalle de S.
  3. Intentar agregarlo: si `add-to-cart` está deshabilitado se comprueba ese estado; si se deja pulsar, se pulsa.
  4. Leer el contador del carrito y abrir el carrito.
- **Resultado esperado**:
  - La tarjeta de S muestra `Out of stock` (`out-of-stock`); la tarjeta de C no lo muestra.
  - El detalle de S muestra `Out of stock`.
  - Tras el intento, el carrito no tiene ninguna línea de S y el contador no registra unidades. El requisito dice "no se puede agregar" sin fijar el mecanismo, así que cualquiera de los dos (botón deshabilitado o clic sin efecto) cumple, siempre que el carrito siga vacío (pregunta abierta 6).

### TC-012 · Cliente con sesión completa la compra y ve pago exitoso y número de factura

- **Precondiciones**: cliente propio de la corrida, registrado con `POST /users/register` (correo único, dirección completa) y con sesión iniciada en la UI por `nav-sign-in`. Carrito vacío.
- **Datos**: producto A = `Combination Pliers`, cantidad 1. Método de pago: el que pida menos datos adicionales entre los que ofrezca la pantalla (pregunta abierta 8).
- **Pasos**:
  1. Con la sesión iniciada, agregar A al carrito y abrir `/checkout`.
  2. Paso carrito: comprobar la línea de A y avanzar.
  3. Paso sesión: comprobar que reconoce al cliente con sesión y avanzar.
  4. Paso dirección: confirmar la dirección del cliente (completar solo los campos que la pantalla exija) y avanzar.
  5. Paso pago: elegir el método de pago, completar sus datos y confirmar.
- **Resultado esperado**:
  - Se muestra el mensaje de pago exitoso.
  - Se muestra un número de factura no vacío.
  - En ningún paso se pide volver a iniciar sesión ni se usa la cuenta de demostración.

### TC-013 · Recorrido exploratorio del pago con los demás métodos y revisión de la confirmación

- **Por qué es manual**: los pasos de dirección y pago no están capturados (sin selectores ni lista de métodos), el requisito no dice qué datos pide cada método, y juzgar si el mensaje de éxito y la factura se entienden es criterio visual. Automatizar todas las combinaciones hoy sería inventar el resultado esperado.
- **Precondiciones**: un cliente registrado a mano o por API solo para la sesión exploratoria (no la cuenta de demostración). Sesión de 30 minutos en el entorno normal y 30 en el de bugs sembrados.
- **Datos**: carrito con dos productos y cantidades distintas.
- **Pasos**:
  1. Completar una compra con cada método de pago distinto al usado en TC-012.
  2. En cada una, anotar qué campos pide el método y qué muestra la confirmación.
  3. Repetir un recorrido en la versión con bugs y comparar.
- **Resultado esperado**:
  - Con cada método, tras confirmar se ve el mensaje de pago exitoso y un número de factura.
  - Cualquier diferencia entre entornos, o un método que no llegue a la confirmación, se registra como hallazgo en `bugs/` y como candidato a caso automatizado.

## Datos de prueba

- **Cliente de la corrida** (TC-012; TC-013 usa uno aparte): se crea una vez por corrida con `POST /users/register` contra la API del entorno bajo prueba. Correo único, por ejemplo `qa.req002.<marca de tiempo>.<aleatorio>@example.com`; clave generada que cumpla la política de la API; dirección completa para que el paso de dirección tenga qué confirmar. No hay limpieza posible desde un cliente: las cuentas quedan en la demo, que se restablece sola; por eso el correo nunca se repite.
- **Cuenta de demostración** `customer@practicesoftwaretesting.com`: no se usa. La extracción la lista como dato de prueba, pero el requisito actualizado la descarta (compartida, bloqueada con HTTP 423); manda el requisito.
- **Oráculo de catálogo** (TC-001 a TC-005, TC-011): `GET /products?page={n}` de la página 1 a `last_page` y `GET /categories/tree`, solo lectura, una vez por corrida. No se fija el total (50) ni el tamaño de página (9) en el código.
- **Productos con existencias** (TC-006 a TC-010, TC-012): `Combination Pliers` y `Bolt Cutters`, localizados por nombre y validados con `in_stock = true` en el oráculo; si alguno falta o no tiene existencias, se toman los dos primeros con existencias y precios distintos. Sus precios se leen de la página en cada prueba.
- **Producto sin existencias** (TC-011): el que el oráculo marque `in_stock = false`. Si no hay ninguno, la prueba se salta con motivo explícito en lugar de fallar por datos.
- **Categoría** (TC-003): `Pliers`, buscada por nombre en el árbol; alternativa `Hammer`.
- **Textos de búsqueda** (TC-001, TC-002): `Pliers` y `zzqx-sin-coincidencias`.
- **Carrito**: cada prueba lo arma desde cero en un contexto de navegador nuevo, así que no hay limpieza ni dependencia entre casos. TC-012 genera una factura real en la demo para el cliente de la corrida; no afecta a datos compartidos.
- **Restricciones respetadas**: no se prueban claves incorrectas ni se modifica el perfil de ninguna cuenta compartida; ningún precio ni id queda fijo en el código.

## Preguntas abiertas

1. **Cliente de prueba: la extracción y el requisito difieren.** La extracción indica entrar con la cuenta de demostración; el requisito actualizado exige registrar un cliente por corrida. Suposición: manda el requisito; ningún caso usa la cuenta de demostración.
2. **Contrato de `POST /users/register`.** El endpoint no está en la extracción (campos obligatorios, política de clave, código de respuesta). Suposición: el automator lo toma de la documentación de la API antes de escribir el fixture; el plan solo exige correo único y dirección completa.
3. **Texto y selector del mensaje "sin coincidencias" (CA-1).** No capturado. Suposición: TC-002 exige cero tarjetas y un mensaje visible en el área de resultados; el texto exacto se fija tras un snapshot de una búsqueda vacía, no se inventa.
4. **Mayúsculas y campo de búsqueda (CA-1).** No se sabe si distingue mayúsculas. Suposición: TC-001 busca con la capitalización de los nombres y compara "contiene" sin distinguir mayúsculas; el caso con otra capitalización no se prueba hasta que el requisito lo defina.
5. **Categoría padre y alcance del filtro y del orden (CA-2, CA-3).** No se aclara si `Hand Tools` incluye sus subcategorías ni si filtro y orden aplican a todo el catálogo. Suposición: TC-003 usa solo una subcategoría hoja; TC-003 a TC-005 asumen que filtro y orden aplican al catálogo completo (por eso comparan con el oráculo global y entre páginas). Si la app ordena solo la página visible, se reporta como hallazgo para decidir.
6. **Opciones reales del select de orden y regla de comparación de nombres.** Las opciones se leyeron del texto del contenedor. Suposición: existen las cuatro etiquetas citadas y se eligen por etiqueta; los nombres se comparan sin distinguir mayúsculas. `CO₂ Rating` queda fuera.
7. **Mecanismo de "no se puede agregar" (CA-7).** El snapshot muestra `add-to-cart` visible en el producto sin existencias y no captura `disabled`. Suposición: se acepta botón deshabilitado o clic sin efecto; lo que se exige es que el carrito quede sin ese producto.
8. **Ícono y contador del carrito (CA-4).** Sin `data-test` capturado, probablemente porque solo aparece con el carrito no vacío. Suposición: el automator lo localiza con un snapshot después de agregar un producto; con el carrito vacío no se afirma nada sobre el contador.
9. **Dónde se lee el precio unitario.** `unit-price` del detalle aparece con el texto literal `unit-price` en el snapshot. Suposición: el precio de referencia es `product-price` de la tarjeta del catálogo y se contrasta con el precio unitario de la línea del carrito.
10. **Pantallas de `/checkout` (CA-5, CA-6, CA-8).** No hay selectores del carrito con productos ni de los pasos de sesión, dirección y pago; tampoco se sabe cómo se confirma un cambio de cantidad, qué muestra el total al vaciar el carrito, qué métodos de pago hay ni qué formato tiene el número de factura. Suposición: se toman snapshots con carrito y con sesión antes de automatizar; TC-012 usa el método con menos datos y solo exige un número de factura no vacío; los demás métodos van a TC-013; el carrito vacío no se afirma.
11. **Total de la factura frente al total del carrito.** El requisito no dice que deban coincidir ni dónde se muestra. Suposición: no se afirma; se observa en TC-013.
12. **Límites de la cantidad (CA-4).** No se definen mínimo, máximo ni qué pasa con 0 o negativos. Suposición: solo se usan cantidades válidas (1, 2, 3, 5); los límites no se prueban hasta que el requisito los fije.
13. **Versión con bugs sembrados.** No hay snapshots de ese entorno ni se sabe si usa otra API, otros ids o si comparte usuarios. Suposición: mismos `data-test` y textos; oráculo y registro salen de la API configurada para el entorno bajo prueba; los productos se buscan por nombre. Los asserts principales son propiedades de lo que la página muestra (contiene, orden, aritmética), de modo que un oráculo defectuoso no los anula.
14. **Botón `filters` no visible en escritorio.** Sugiere un panel plegable en pantallas pequeñas. Suposición: la suite corre en tamaño de escritorio, con el panel de filtros visible.
