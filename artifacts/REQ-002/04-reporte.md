> Generado por: reporter (Claude Haiku 5.5) · 2026-11-14 · Requisito: REQ-002

# Reporte · REQ-002 · Catálogo, carrito y compra

## Resumen

- **Qué se probó:** 12 casos automatizados (14 pruebas por las filas de orden y de precio) de catálogo, detalle, carrito y compra, en `ui` y en `ui-bugs`; TC-013 es manual y no se ejecutó.
- **Resultado:** `ui` 14 de 14 pasan. `ui-bugs` 4 pasan y 10 fallan como se espera (marcadas `test.fail`), por 6 hallazgos abiertos (BUG-006 a BUG-011). Además, BUG-012 registra un filtro de precio que oculta productos en la tienda real, sin prueba que falle por él.
- **Bloqueos:** ninguno en `ui`. En `ui-bugs`, TC-009 y TC-010 no llegan a su paso principal porque fallan en la precondición de totales (BUG-009 y BUG-010).

## Cambio de plan (H-01)

- **Qué esperaba el plan:** TC-004 y TC-005 suponían que, al ordenar, el primer producto mostrado era el extremo de todo el catálogo (`GET /products` completo). Por ejemplo, Z-A o High-Low debían empezar por el nombre o precio más alto del catálogo.
- **Qué pasó:** la tienda carga con un filtro de precio de 1 a 100 que oculta 5 de los 50 productos (Workbench with Drawers, Wooden Workbench, Cordless Drill 20V y 18V, Random Orbit Sander). El primero mostrado no era el extremo del catálogo, aunque el orden de lo mostrado era correcto. En la primera ejecución, TC-004 (Z-A) y TC-005 (High-Low) fallaron por esa premisa.
- **Qué se decidió:** revisión humana del 2026-11-14 (`artifacts/REQ-002/02-revision.md`, Arturo Isaza): CA-3 pide que "el orden mostrado corresponda al elegido". TC-004 y TC-005 pasan a comparar páginas 1 y 2 con el oráculo de lo mostrado (rango leído de la página, sin alquileres). Esto aparece en `artifacts/REQ-002/02-plan.md`, sección "Cambios".
- **Qué bug salió:** el filtro oculto se reporta aparte como [BUG-012](../../bugs/BUG-012-filtro-de-precio-oculta-productos-por-defecto.md), severidad Baja, contra la tienda real (`ui`). Ninguna prueba lo afirma.

## Resultados por caso y proyecto

Fuentes: `results/results.json` (`ui`), `results/results-bugs.json` (`ui-bugs`) y la columna de estados de `results/trazabilidad.json`. Totales: `ui` 14 pruebas, 14 pasan; `ui-bugs` 14 pruebas, 4 pasan y 10 fallos esperados, 0 inesperados.

| Caso | Título | `ui` | `ui-bugs` | Bug abierto |
|---|---|---|---|---|
| TC-001 | Buscar un texto existente | Pasa | Pasa | — |
| TC-002 | Búsqueda sin coincidencias muestra el mensaje | Pasa | Falla esperada | [BUG-006](../../bugs/BUG-006-busqueda-sin-coincidencias-sin-mensaje.md) |
| TC-003 | Marcar una categoría | Pasa | Pasa | — |
| TC-004 | Ordenar por nombre A-Z y Z-A (2 pruebas) | Pasa (2 de 2) | Falla esperada (2 de 2) | [BUG-007](../../bugs/BUG-007-orden-del-catalogo-invertido.md) |
| TC-005 | Ordenar por precio Low-High y High-Low (2 pruebas) | Pasa (2 de 2) | Falla esperada (2 de 2) | [BUG-007](../../bugs/BUG-007-orden-del-catalogo-invertido.md) |
| TC-006 | Agregar con cantidad 3, contador en 3 | Pasa | Pasa | — |
| TC-007 | Contador suma unidades de dos productos | Pasa | Falla esperada | [BUG-008](../../bugs/BUG-008-incremento-de-cantidad-no-sube.md) |
| TC-008 | Total de línea y total general | Pasa | Falla esperada | [BUG-009](../../bugs/BUG-009-total-de-linea-en-cero-en-el-carrito.md) |
| TC-009 | Cambiar cantidad recalcula totales | Pasa | Falla esperada (bloqueada en la precondición) | [BUG-009](../../bugs/BUG-009-total-de-linea-en-cero-en-el-carrito.md) |
| TC-010 | Quitar un producto actualiza el total | Pasa | Falla esperada (bloqueada en la precondición) | [BUG-010](../../bugs/BUG-010-total-general-un-centavo-menos.md) |
| TC-011 | Producto sin existencias, Out of stock | Pasa | Pasa | — |
| TC-012 | Compra con sesión: pago exitoso y factura | Pasa | Falla esperada | [BUG-011](../../bugs/BUG-011-factura-no-aparece-tras-confirmar-el-pago.md) |
| TC-013 | Recorrido exploratorio de pago (manual) | No aplica | No aplica | — |

Los estados `bug-conocido` de la matriz son los fallos esperados de `ui-bugs`. Ninguna prueba de `ui` tiene `test.fail`.

## Cobertura por criterio

Fuente: `results/trazabilidad.json`, filas con `req` = REQ-002. El campo `problemas` de la matriz está vacío.

| Criterio | Resumen | Casos | Cubierto | `ui` | `ui-bugs` |
|---|---|---|---|---|---|
| CA-1 | Búsqueda por texto y mensaje sin coincidencias | TC-001, TC-002 | Sí | Pasa, Pasa | Pasa, bug-conocido |
| CA-2 | Filtro por categoría | TC-003 | Sí | Pasa | Pasa |
| CA-3 | Orden por nombre y precio | TC-004, TC-005 | Sí | Pasa, Pasa | bug-conocido, bug-conocido |
| CA-4 | Cantidad y contador de unidades | TC-006, TC-007 | Sí | Pasa, Pasa | Pasa, bug-conocido |
| CA-5 | Totales de línea y general, recálculo | TC-008, TC-009 | Sí | Pasa, Pasa | bug-conocido, bug-conocido |
| CA-6 | Quitar producto | TC-010 | Sí | Pasa | bug-conocido |
| CA-7 | Producto sin existencias | TC-011 | Sí | Pasa | Pasa |
| CA-8 | Compra con sesión, pago exitoso y factura | TC-012 (automatizado), TC-013 (manual) | Sí | Pasa (TC-012) | bug-conocido (TC-012) |

## Bugs abiertos

Todos son de la versión con bugs (`ui-bugs`) salvo BUG-012. Ambiente y severidad de cada uno están en su archivo.

| Bug | Título | Casos | Severidad | Ambiente |
|---|---|---|---|---|
| [BUG-006](../../bugs/BUG-006-busqueda-sin-coincidencias-sin-mensaje.md) | Búsqueda sin coincidencias sin mensaje (H-02) | TC-002 | Media | ui-bugs |
| [BUG-007](../../bugs/BUG-007-orden-del-catalogo-invertido.md) | Cada opción de orden aplica el sentido contrario (H-03) | TC-004, TC-005 | Alta | ui-bugs |
| [BUG-008](../../bugs/BUG-008-incremento-de-cantidad-no-sube.md) | `increase-quantity` no sube la cantidad (H-04) | TC-007 | Media | ui-bugs |
| [BUG-009](../../bugs/BUG-009-total-de-linea-en-cero-en-el-carrito.md) | Total de cada línea en $00.00 (H-05) | TC-008, TC-009 | Alta | ui-bugs |
| [BUG-010](../../bugs/BUG-010-total-general-un-centavo-menos.md) | Total general un centavo menos (H-06) | TC-010 | Alta | ui-bugs |
| [BUG-011](../../bugs/BUG-011-factura-no-aparece-tras-confirmar-el-pago.md) | Sin número de factura tras confirmar (API de facturas 500) (H-07) | TC-012 | Alta | ui-bugs |
| [BUG-012](../../bugs/BUG-012-filtro-de-precio-oculta-productos-por-defecto.md) | Filtro de precio 1–100 oculta productos sin avisar (H-01) | TC-004, TC-005 (origen) | Baja | ui |

Notas:

- BUG-007 agrupa las cuatro filas de orden porque tienen una sola causa.
- BUG-009 agrupa TC-008 y TC-009 porque fallan en la misma verificación.
- BUG-012 no hace fallar ninguna prueba; es una observación reportada.

## Casos manuales pendientes

- **TC-013** (recorrido exploratorio del pago con los demás métodos y revisión de la confirmación): pendiente. Lo define el plan como manual, 30 minutos en `ui` y 30 en `ui-bugs`. No se ejecutó.

## Observaciones sin caso

Son observaciones del automator (`artifacts/REQ-002/03-ejecucion.md`, sección "Observaciones") que ninguna prueba afirma. No abren bug.

- **Quitar una línea no la quita (`ui-bugs`):** el clic en el botón de quitar de la línea A (36×38 px, visible) deja las dos líneas. TC-010 no llega a ese paso porque BUG-010 la detiene antes.
- **Sin paginación (`ui-bugs`):** no hay `pagination-next` ni botones de página. La API tiene 26 productos en 3 páginas y la UI muestra 9. TC-004 y TC-005 no llegan a la página 2 porque BUG-007 las detiene antes.
- **"missing value" en el código postal (`ui-bugs`, paso de dirección):** el código postal aparece con ese texto aunque el cliente se registró con 110111, y la app deja avanzar.
- **Aviso al agregar (`ui-bugs`):** aparece "Oeps, something went wrong." al agregar al carrito, aunque el producto se agrega y el contador sube.
- **Tope del rango de precio no enviado (`ui-bugs`):** el control marca 1–100, pero la petición es `between=price,1` y el catálogo muestra productos de más de $100 (Random Orbit Sander $100.79, Cordless Drill 20V $125.23). TC-004 y TC-005 no llegan a compararlo con el oráculo porque BUG-007 las detiene antes.

Fuera de la lista del encargo, en el mismo bloque del automator:

- **Menú y sesión (`ui-bugs`):** con sesión iniciada, el menú dice "User Data not found", que es el mismo defecto de BUG-001 (REQ-001). `nav-home` lleva a `#/contact`; esto no tiene bug abierto.
- **Mensaje de éxito sin `data-test` (`ui-bugs`):** "Payment was successful" no tiene `data-test` (en `ui` es `payment-success-message`). Es un dato de selector, no un defecto funcional.

## Datos sin confirmar

- El precio $89.55 (primer producto con Price (High - Low) bajo el filtro) y la figura de $178.20 de "Workbench with Drawers" citadas en BUG-012 no aparecen en los archivos del repositorio. La captura `bugs/evidencia/REQ-002-H01.png` muestra el rango 1–100 aplicado, pero no los precios. El precio máximo de $178.2 sí consta en la extracción de REQ-003; el nombre del producto no consta en ningún archivo.
- La matriz `results/trazabilidad.json` tiene fecha de generación `2026-11-15T03:33:11Z`, posterior a la fecha de este reporte (2026-11-14). No se revisó la causa.
