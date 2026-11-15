> Generado por: automator (Claude Opus 5.5) · 2026-11-14 · Requisito: REQ-002

# Ejecución · REQ-002 · Catálogo, carrito y compra

## Archivos creados o cambiados

Todos son nuevos; no se tocó nada de `src/fixtures/`, `src/api/`, `src/data/clientes.ts`, `src/data/productos.ts`, la configuración ni archivos de otros requisitos.

| Archivo | Contenido |
|---|---|
| `src/data/compra.ts` | Datos del plan (productos A/B, textos de búsqueda, categorías, filas de orden, método de pago), `aCentavos`, `compararNombres`, `ordenadosSegun`, oráculo `leerOraculo` / `idDeCategoria` / `productosConExistencias`. |
| `src/pages/CatalogPage.ts` | Búsqueda, orden, filtro por categoría, paginación, tarjetas por rol y precio de tarjeta en centavos. |
| `src/pages/ProductPage.ts` | Detalle: cantidad, `increase-quantity`, `add-to-cart`, `out-of-stock` y aviso emergente. |
| `src/pages/CartPage.ts` | Paso 1 de `/checkout`: líneas, cantidad, precio unitario, total de línea, quitar, total general, contador del encabezado. |
| `src/pages/CheckoutPage.ts` | Pasos 2 a 4: sesión reconocida, dirección, método de pago, mensaje de pago exitoso y confirmación con factura. |
| `tests/ui/catalogo.spec.ts` | TC-001 a TC-005. |
| `tests/ui/compra-carrito.spec.ts` | TC-006 a TC-011. |
| `tests/ui/compra-pago.spec.ts` | TC-012. |

Se reutilizan: fixtures `api` y `cliente` (`src/fixtures`), `leerTodas` y `buscarCategoria` (`src/api/productos.ts`), `login` (`src/api/usuarios.ts`), `nuevoCliente` (`src/data/clientes.ts`), y del automator de REQ-001: `LoginPage` (`src/pages/LoginPage.ts`) y `cuerpoDeRegistro`, `varianteDe`, `rutaDe` (`src/data/acceso.ts`).

## Casos, pruebas y resultados

Verificación: `--project=ui --repeat-each=3` dio 42 de 42 con el resultado esperado (0 inesperados, 0 inestables); `--project=ui-bugs` dio 14 de 14 con el resultado esperado; `npm run -s lint` y `npm run -s typecheck` quedaron limpios.

| Caso | Prueba | `ui` | `ui-bugs` |
|---|---|---|---|
| TC-001 | `catalogo.spec.ts` › TC-001 buscar un texto existente… | Pasa | Pasa |
| TC-002 | `catalogo.spec.ts` › TC-002 buscar un texto sin coincidencias… | Pasa | Falla esperada (H-02) |
| TC-003 | `catalogo.spec.ts` › TC-003 marcar una categoría… | Pasa | Pasa |
| TC-004 | `catalogo.spec.ts` › TC-004 ordenar por Name (A - Z)… | Pasa | Falla esperada (H-03) |
| TC-004 | `catalogo.spec.ts` › TC-004 ordenar por Name (Z - A)… | Falla esperada (H-01) | Falla esperada (H-03) |
| TC-005 | `catalogo.spec.ts` › TC-005 ordenar por Price (Low - High)… | Pasa | Falla esperada (H-03) |
| TC-005 | `catalogo.spec.ts` › TC-005 ordenar por Price (High - Low)… | Falla esperada (H-01) | Falla esperada (H-03) |
| TC-006 | `compra-carrito.spec.ts` › TC-006 agregar un producto con cantidad 3… | Pasa | Pasa |
| TC-007 | `compra-carrito.spec.ts` › TC-007 el contador suma unidades… | Pasa | Falla esperada (H-04) |
| TC-008 | `compra-carrito.spec.ts` › TC-008 total de línea… | Pasa | Falla esperada (H-05) |
| TC-009 | `compra-carrito.spec.ts` › TC-009 cambiar una cantidad… | Pasa | Falla esperada (H-05, bloquea) |
| TC-010 | `compra-carrito.spec.ts` › TC-010 quitar un producto… | Pasa | Falla esperada (H-06, bloquea) |
| TC-011 | `compra-carrito.spec.ts` › TC-011 producto sin existencias… | Pasa | Pasa |
| TC-012 | `compra-pago.spec.ts` › TC-012 cliente con sesión completa la compra… | Pasa | Falla esperada (H-07) |
| TC-013 | — (manual) | No aplica | No aplica |

## Hallazgos

Las marcas son `test.fail(...)` dentro de la prueba. H-02 a H-07 son condicionales a `ui-bugs`, así que en `ui` la prueba sigue siendo estricta. Cada uno se confirmó con la captura y, cuando hizo falta, con la traza (red). Las capturas vienen de la corrida sin marcas (`--trace=on`), guardada fuera de `test-results/` (ver Decisiones técnicas, punto 9).

### H-01 · `ui` · TC-004 (Z - A) y TC-005 (High - Low): el primero no es el extremo del catálogo completo

- **Esperado (plan)**: con `Name (Z - A)` el primer nombre es el mayor de todo el oráculo (`GET /products`, todas las páginas); con `Price (High - Low)` el primer precio es el máximo del oráculo.
- **Obtenido**: `primero con "Name (Z - A)" frente al extremo de todo el catálogo — Expected: "Workbench with Drawers", Received: "Wood Saw"`. `primero con "Price (High - Low)" frente al extremo de todo el catálogo — Expected: 17820, Received: 8955`.
- **Causa observada**: el catálogo trae por defecto el filtro "Price Range" en 1–100 (los dos sliders `ngx-slider` en 1 y 100) y pide `/products` con `between=price,1,100` e `is_rental=false`. Muestra 45 de los 50 productos y oculta los 5 de más de $100 (Workbench with Drawers, Wooden Workbench, Cordless Drill 20V y 18V, Random Orbit Sander). El resto del orden sí es correcto en las dos filas: páginas 1 y 2 ordenadas, frontera entre páginas y cruce con el sentido opuesto.
- **Para decidir**: puede ser un defecto (el cliente que ordena de mayor a menor no ve los productos más caros) o una premisa del plan que no contempló ese filtro por defecto (pregunta abierta 5). No cambié el oráculo del plan. La marca depende de los datos: si la demo deja de tener productos de más de $100, la prueba pasará y la marca dará "unexpected pass".
- **Evidencia**: `results/req002-evidencia-ui/catalogo-Catálogo-búsqueda-640fe-ja-los-nombres-en-ese-orden-ui/trace.zip` (Z - A) y `results/req002-evidencia-ui/catalogo-Catálogo-búsqueda-58249-s-precios-en-orden-numérico-ui/trace.zip` (High - Low), con su `error-context.md`.

### H-02 · `ui-bugs` · TC-002: una búsqueda sin coincidencias no muestra ningún mensaje

- **Esperado**: cero tarjetas y un mensaje visible de que no hay productos (en `ui`: `no-results`, "There are no products found.").
- **Obtenido**: `expect(locator).toBeVisible() failed — Locator: getByTestId('no-results') — Expected: visible — element(s) not found`. Las tarjetas sí quedan en cero. La captura muestra solo "Searched for: …" y "0 products found for '…'", sin el mensaje de "no hay productos" en el área de resultados (el contenedor `search_completed` queda vacío).
- **Evidencia**: `results/req002-evidencia-bugs/catalogo-Catálogo-búsqueda-65ffa-l-mensaje-y-ningún-producto-ui-bugs/test-failed-1.png`.

### H-03 · `ui-bugs` · TC-004 y TC-005 (las 4 filas): cada opción de orden aplica el sentido contrario

- **Esperado**: la opción elegida deja la página 1 en ese orden.
- **Obtenido**: `página 1 con "Name (A - Z)" — expect(received).toEqual(expected)`, porque la lista llega en orden Z-A (Wood Saw, Thor Hammer, Slip Joint Pliers…). Lo mismo ocurre en las otras tres filas: "Name (Z - A)" llega A-Z y "Price (Low - High)" llega de mayor a menor (12523, 11924, 10079…); "Price (High - Low)" llega de menor a mayor (492, 917, 1114…). En el select de esa versión cada etiqueta tiene el valor del sentido opuesto (`Name (A - Z)` = `name,desc`, `Price (High - Low)` = `price,asc`…).
- **Evidencia**: `results/req002-evidencia-bugs/catalogo-Catálogo-búsqueda-c2344-ja-los-nombres-en-ese-orden-ui-bugs/test-failed-1.png` (A-Z, se ve "Name (A - Z)" elegido y Wood Saw primero), `…-640fe-ja-los-nombres-en-ese-orden-ui-bugs/` (Z-A), `…-5858d-s-precios-en-orden-numérico-ui-bugs/` (Low-High), `…-58249-s-precios-en-orden-numérico-ui-bugs/` (High-Low), todas bajo `results/req002-evidencia-bugs/`.
- **Nota**: en esa versión el catálogo tampoco muestra `pagination-next` (la API tiene 26 productos en 3 páginas y la UI muestra 9). Las pruebas no llegan a ese paso porque H-03 las detiene antes; no lo reporto como hallazgo aparte (ver Observaciones).

### H-04 · `ui-bugs` · TC-007: `increase-quantity` no sube la cantidad

- **Esperado**: tras un clic, la cantidad pasa del valor inicial (1) a 2.
- **Obtenido**: `expect(locator).toHaveValue(expected) failed — Locator: getByTestId('quantity') — Expected: "2" — Received: "1"`. La exploración previa dio lo mismo: después del clic el campo sigue en 1 y el contador queda en 1.
- **Evidencia**: `results/req002-evidencia-bugs/compra-carrito-Carrito-can-5bc35-uctos-distintos-y-no-líneas-ui-bugs/test-failed-1.png`.

### H-05 · `ui-bugs` · TC-008 y TC-009: el total de cada línea es $00.00

- **Esperado**: total de línea = precio unitario × cantidad.
- **Obtenido**: `total de línea de Combination Pliers (2 u.) — expect(received).toBe(expected) — Expected: 2830 — Received: 0`. La captura muestra $00.00 en el total de las dos líneas. El precio unitario ($14.15 y $48.41) y el total general ($173.53) sí son correctos.
- **TC-009**: falla en la misma verificación de los totales iniciales, que el plan pone como precondición. El recálculo al cambiar la cantidad no llega a probarse en esa versión.
- **Evidencia**: `results/req002-evidencia-bugs/compra-carrito-Carrito-can-a027a-tal-general-igual-a-la-suma-ui-bugs/test-failed-1.png` (TC-008) y `results/req002-evidencia-bugs/compra-carrito-Carrito-can-93af9-la-línea-y-el-total-general-ui-bugs/test-failed-1.png` (TC-009).

### H-06 · `ui-bugs` · TC-010: el total general sale un centavo menos

- **Esperado**: con A × 2 y B × 1, total general = precio A × 2 + precio B (28.30 + 48.41 = 76.71).
- **Obtenido**: `total inicial — expect(received).toBe(expected) — Expected: 7671 — Received: 7670`; la captura muestra $76.70. Con A × 2 y B × 3 (TC-008) el total sí da exacto ($173.53), así que el error depende de los importes.
- **Bloqueo**: es la precondición del caso, así que el paso de quitar no se llega a probar en esa versión (ver Observaciones).
- **Evidencia**: `results/req002-evidencia-bugs/compra-carrito-Carrito-can-e8e4e--lista-y-actualiza-el-total-ui-bugs/test-failed-1.png`.

### H-07 · `ui-bugs` · TC-012: tras confirmar el pago no hay número de factura

- **Esperado**: tras "Confirm", el mensaje de pago exitoso y un número de factura no vacío.
- **Obtenido**: el mensaje "Payment was successful" sí aparece. Después del segundo clic en `finish` (Confirm), el número de factura no sale: `expect(locator).toHaveText(expected) failed — Locator: getByText(/your invoice number is/i) — element(s) not found`. En la traza, `POST https://api-with-bugs.practicesoftwaretesting.com/invoices` responde **500** (antes, `POST /payment/check` respondió 200). En el select de pago de esa versión aparece además una opción "Errror 304 - Missing Payment Gateway" y ese texto se ve en la pantalla de pago.
- **Evidencia**: `results/req002-evidencia-bugs/compra-pago-Compra-con-ses-f3ed5-exitoso-y-número-de-factura-ui-bugs/test-failed-1.png` y `trace.zip` en la misma carpeta (pestaña Network).

## Observaciones (no las afirma ninguna prueba; para que el reporter decida)

Las vi explorando la versión con bugs. Quedan fuera de los asserts porque un defecto anterior detiene la prueba o porque el plan no las cubre:

- **Quitar una línea**: en la versión con bugs, el clic en el botón de quitar de la línea A (36×38 px, visible) deja las dos líneas en la lista. TC-010 no llega a ese paso por H-06.
- **Paginación**: en la versión con bugs el catálogo no tiene `pagination-next` ni botones de página (API: 26 productos, `last_page` 3; UI: 9).
- **Dirección**: en el paso de dirección de la versión con bugs, el código postal aparece con el texto "missing value" aunque el cliente se registró con 110111; la app deja avanzar.
- **Aviso al agregar**: en la versión con bugs, al agregar al carrito sale "Oeps, something went wrong." aunque el producto sí se agrega y el contador sube.
- **Menú y sesión**: en la versión con bugs, `nav-home` lleva a `#/contact` y, con sesión iniciada, el menú del usuario dice "User Data not found". Está fuera del alcance de REQ-002.
- **Mensaje de éxito**: en la versión con bugs, el mensaje "Payment was successful" no tiene `data-test` (en `ui` es `payment-success-message`).

## Casos no automatizados y pruebas saltadas

- **TC-013** (exploratorio de los demás métodos de pago): es manual según el plan. No se automatizó.
- **Saltos**: ninguno en las corridas. TC-011 lleva `test.skip` condicional, como pide el plan, solo si el oráculo no tiene ningún producto sin existencias, con el motivo "El catálogo del entorno no tiene ningún producto sin existencias". Hoy hay uno en los dos entornos (Long Nose Pliers).

## Decisiones técnicas

1. **Oráculo**: `leerOraculo` recorre `GET /products` hasta `last_page` en la API del proyecto (fixture `api`). La API de la versión con bugs no trae `in_stock`, sino `stock` (número), así que "con existencias" se toma de `in_stock` si existe y, si no, de `stock > 0`. Los productos se eligen por nombre, sin ids ni precios fijos. Los importes se comparan en centavos enteros (`aCentavos` para la página, `Math.round(price * 100)` para la API).
2. **Registro del cliente en `ui-bugs` (TC-012)**: el fixture compartido `cliente` registra con dirección anidada, y la API de la versión con bugs la rechaza (`422 {"address":["The address field must be a string."],…}`). En `compra-pago.spec.ts` se sobrescribe el fixture interno `sesionCliente` con `test.extend`: genera el cliente con `nuevoCliente` y lo registra con `cuerpoDeRegistro(cliente, varianteDe(proyecto))`. En `ui` el cuerpo es el mismo que el del fixture original. No se editó `src/fixtures/`. Si conviene, el fixture común podría adoptar esa variante.
3. **Dependencia del otro automator**: uso `LoginPage.intentar`, `cuerpoDeRegistro`, `varianteDe` y `rutaDe`, que vienen de archivos de REQ-001 aún sin commit. Si cambian de nombre, `typecheck` lo detecta.
4. **Sincronización sin esperas fijas**: los cambios de lista (búsqueda, filtro, orden, paginación) se esperan con `expect(async () => …).toPass({ timeout: 10_000 })` sobre el mismo assert de negocio (la lista ordenada, todos de la categoría, todos contienen el texto). Los importes del carrito se esperan con `expect.poll` en centavos. Antes de salir del detalle, `ProductPage.agregarAlCarrito` espera el aviso emergente (`role=alert`). Así no se navega antes de que el carrito registre el producto. La versión con bugs no llama a `/carts`, así que no se puede esperar una respuesta de red.
5. **TC-004/TC-005**: las verificaciones van en este orden: página 1 ordenada, página 2 ordenada y frontera entre páginas, cruce con la opción opuesta y, al final, el extremo del oráculo. Así H-01 no oculta el resto del orden, que queda verificado. El orden por nombre compara en minúsculas por código de carácter (espacio y guion antes que letras), coherente con lo que devuelve la base. Para nombres, el cruce exige primeros distintos, como dice el plan. Para precios exige que el primero de Low-High sea menor que el de High-Low.
6. **Selectores sin `data-test`**: las tarjetas se ubican por rol (`link` que contiene el `heading` del nombre). Las páginas, por `button` con nombre `Page-N`. El mensaje de pago exitoso y la confirmación con factura, por texto, porque la versión con bugs no tiene `data-test` en el mensaje y la confirmación no tiene ninguno. El botón de quitar no tiene `data-test` ni nombre accesible; se toma como `getByRole('cell').last().locator('a')` dentro de la fila. Es un selector por etiqueta, no por clase ni XPath.
7. **Número de factura "no vacío"**: se exige `invoice number is` seguido de un token alfanumérico (`/invoice number is\s+[A-Z0-9][A-Z0-9-]*/i`) para que un punto suelto no cuente como factura.
8. **Pasos de checkout**: el método de pago es "Cash on Delivery", que en `ui` no pide datos. En la versión con bugs la pantalla pide titular y número de cuenta con cualquier método; `elegirPago` llena solo los campos visibles. En `ui`, el paso de dirección exige `house_number`, que el registro no trae; `confirmarDireccion` lo llena solo si viene vacío. "No se vuelve a pedir sesión" se verifica con el saludo "you are already logged in" y con el campo de correo oculto en el paso 2 y en la confirmación.
9. **Carpetas de salida**: el otro automator corre en paralelo y Playwright limpia `test-results/` al empezar cada corrida, así que mis corridas usaron `--output=results/req002-*`, que está en `.gitignore` y no se limpia. Por la misma razón, `results/results.json` y `results/results-bugs.json` pueden haber quedado escritos por la corrida del otro automator. Antes de `npm run trazabilidad` conviene volver a correr la suite completa.
10. **TC-011**: el requisito no fija el mecanismo. La prueba anota en `testInfo.annotations` si el botón estaba deshabilitado (en los dos entornos lo está) o si se permitió el clic. Solo en este último caso espera `networkidle` antes de revisar el carrito. El contador se verifica como "ningún `cart-quantity` con valor distinto de 0".
11. **Datos que deja cada corrida**: TC-012 registra un cliente `req002-…@example.com` por prueba en el entorno correspondiente y, en `ui`, genera una factura real para ese cliente. No usa la cuenta de demostración ni cuentas compartidas.
