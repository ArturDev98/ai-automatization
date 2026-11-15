# REQ-002 · Catálogo, carrito y compra

**Como** cliente de la tienda
**quiero** encontrar un producto, llevarlo al carrito y pagarlo
**para** completar una compra sin ayuda.

## Pantallas

- Catálogo: `/`
- Detalle de producto: `/product/{id}`
- Carrito y pago (pasos carrito, sesión, dirección, pago): `/checkout`

## Criterios de aceptación

- **CA-1** Al buscar un texto, el catálogo muestra solo productos cuyo nombre lo contiene. Si no
  hay coincidencias, muestra un mensaje que lo dice.
- **CA-2** Al marcar una categoría, el catálogo muestra solo productos de esa categoría.
- **CA-3** El catálogo se puede ordenar por nombre (A-Z, Z-A) y por precio (menor a mayor, mayor
  a menor), y el orden mostrado corresponde al elegido.
- **CA-4** Desde el detalle se puede elegir una cantidad y agregar el producto al carrito. El
  ícono del carrito muestra el total de unidades.
- **CA-5** En el carrito, el total de cada línea es precio por cantidad y el total general es la
  suma de las líneas. Al cambiar una cantidad, ambos se recalculan.
- **CA-6** Al quitar un producto del carrito, desaparece de la lista y el total se actualiza.
- **CA-7** Un producto sin existencias se muestra como "Out of stock" y no se puede agregar al carrito.
- **CA-8** Un cliente con sesión iniciada puede terminar la compra: confirma su dirección, elige
  un método de pago, y al confirmar ve el mensaje de pago exitoso y un número de factura.

## Datos y restricciones

- Cuenta de demostración: `customer@practicesoftwaretesting.com` / `welcome01`.
- Los precios y productos son los de la demo; las pruebas leen el precio que muestra la página o
  la API en lugar de fijarlo en el código.
- La misma suite debe poder correr contra la versión con bugs sembrados
  (`https://with-bugs.practicesoftwaretesting.com`) sin cambios.
