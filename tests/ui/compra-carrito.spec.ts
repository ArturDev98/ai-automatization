import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../../src/fixtures';
import { CatalogPage } from '../../src/pages/CatalogPage';
import { ProductPage } from '../../src/pages/ProductPage';
import { CartPage } from '../../src/pages/CartPage';
import { PRODUCTO_A, aCentavos, leerOraculo, productosConExistencias } from '../../src/data/compra';
import { rutaDe, varianteDe } from '../../src/data/acceso';

interface Linea {
  nombre: string;
  cantidad: number;
}

const centavosDe = (locator: Locator) => async () => aCentavos(await locator.innerText());

/** Agrega cada línea desde su detalle y devuelve el precio leído en su tarjeta del catálogo, en centavos. */
async function armarCarrito(page: Page, lineas: Linea[]): Promise<Map<string, number>> {
  const catalogo = new CatalogPage(page);
  const producto = new ProductPage(page);
  const precios = new Map<string, number>();
  for (const { nombre, cantidad } of lineas) {
    await catalogo.abrir();
    precios.set(nombre, await catalogo.precioEnTarjeta(nombre));
    await catalogo.abrirProducto(nombre);
    await expect(producto.nombre).toHaveText(nombre);
    await producto.fijarCantidad(cantidad);
    await expect(producto.cantidad).toHaveValue(String(cantidad));
    await producto.agregarAlCarrito();
  }
  return precios;
}

async function comprobarTotales(carrito: CartPage, lineas: Linea[], precios: Map<string, number>): Promise<void> {
  let suma = 0;
  for (const { nombre, cantidad } of lineas) {
    const precio = precios.get(nombre) ?? NaN;
    await expect(carrito.cantidad(nombre)).toHaveValue(String(cantidad));
    await expect.poll(centavosDe(carrito.precioUnitario(nombre)), `precio unitario de ${nombre}`).toBe(precio);
    await expect.poll(centavosDe(carrito.totalDeLinea(nombre)), `total de línea de ${nombre} (${cantidad} u.)`)
      .toBe(precio * cantidad);
    suma += aCentavos(await carrito.totalDeLinea(nombre).innerText());
  }
  await expect.poll(centavosDe(carrito.totalGeneral), 'total general = suma de las líneas').toBe(suma);
}

test.describe('Carrito: cantidades, contador y totales', () => {
  test('TC-006 agregar un producto con cantidad 3 deja el contador del carrito en 3', {
    tag: ['@REQ-002', '@TC-006'],
  }, async ({ page, api }) => {
    const [a] = productosConExistencias(await leerOraculo(api));
    await armarCarrito(page, [{ nombre: a.nombre, cantidad: 3 }]);

    const carrito = new CartPage(page);
    await expect(carrito.contador).toHaveText('3');
    await carrito.abrir();
    await expect(carrito.lineas).toHaveCount(1);
    await expect(carrito.linea(a.nombre)).toBeVisible();
    await expect(carrito.cantidad(a.nombre)).toHaveValue('3');
  });

  test('TC-007 el contador del carrito suma unidades de dos productos distintos y no líneas', {
    tag: ['@REQ-002', '@TC-007'],
  }, async ({ page, api }, testInfo) => {
    test.fail(testInfo.project.name === 'ui-bugs', 'H-04: se esperaba que increase-quantity subiera la cantidad a 2; sigue en 1');
    const [a, b] = productosConExistencias(await leerOraculo(api));
    const catalogo = new CatalogPage(page);
    const producto = new ProductPage(page);
    const carrito = new CartPage(page);

    await catalogo.abrir();
    await catalogo.abrirProducto(a.nombre);
    await expect(producto.nombre).toHaveText(a.nombre);
    const inicial = Number(await producto.cantidad.inputValue());
    await producto.aumentarCantidad.click();
    await expect(producto.cantidad).toHaveValue(String(inicial + 1));
    await expect(producto.cantidad).toHaveValue('2');
    await producto.agregarAlCarrito();
    await expect(carrito.contador).toHaveText('2');

    await catalogo.abrir();
    await catalogo.abrirProducto(b.nombre);
    await expect(producto.nombre).toHaveText(b.nombre);
    await producto.agregarAlCarrito();
    await expect(carrito.contador).toHaveText('3');

    await catalogo.abrir();
    await expect(carrito.contador).toHaveText('3');
  });

  test('TC-008 total de línea igual a precio por cantidad y total general igual a la suma', {
    tag: ['@REQ-002', '@TC-008'],
  }, async ({ page, api }, testInfo) => {
    test.fail(testInfo.project.name === 'ui-bugs', 'H-05: se esperaba total de línea = precio x cantidad; muestra $00.00');
    const [a, b] = productosConExistencias(await leerOraculo(api));
    const lineas = [{ nombre: a.nombre, cantidad: 2 }, { nombre: b.nombre, cantidad: 3 }];
    const precios = await armarCarrito(page, lineas);

    const carrito = new CartPage(page);
    await carrito.abrir();
    await expect(carrito.lineas).toHaveCount(2);
    await comprobarTotales(carrito, lineas, precios);
  });

  test('TC-009 cambiar una cantidad en el carrito recalcula la línea y el total general', {
    tag: ['@REQ-002', '@TC-009'],
  }, async ({ page, api }, testInfo) => {
    // H-05 detiene la prueba en los totales iniciales, antes de cambiar la cantidad.
    test.fail(testInfo.project.name === 'ui-bugs', 'H-05: se esperaba total de línea = precio x cantidad; muestra $00.00');
    const [a, b] = productosConExistencias(await leerOraculo(api));
    const precios = await armarCarrito(page, [{ nombre: a.nombre, cantidad: 2 }, { nombre: b.nombre, cantidad: 1 }]);

    const carrito = new CartPage(page);
    await carrito.abrir();
    await expect(carrito.lineas).toHaveCount(2);
    await comprobarTotales(carrito, [{ nombre: a.nombre, cantidad: 2 }, { nombre: b.nombre, cantidad: 1 }], precios);

    for (const nueva of [5, 1]) {
      await carrito.cambiarCantidad(a.nombre, nueva);
      await comprobarTotales(carrito, [{ nombre: a.nombre, cantidad: nueva }, { nombre: b.nombre, cantidad: 1 }], precios);
      const esperado = (precios.get(a.nombre) ?? NaN) * nueva + (precios.get(b.nombre) ?? NaN);
      await expect.poll(centavosDe(carrito.totalGeneral), `total general con ${nueva} u. de ${a.nombre}`).toBe(esperado);
    }
  });

  test('TC-010 quitar un producto lo elimina de la lista y actualiza el total', {
    tag: ['@REQ-002', '@TC-010'],
  }, async ({ page, api }, testInfo) => {
    // H-06 detiene la prueba en el total inicial, antes de quitar la línea.
    test.fail(testInfo.project.name === 'ui-bugs', 'H-06: se esperaba total general = precio A x 2 + precio B; muestra un centavo menos');
    const [a, b] = productosConExistencias(await leerOraculo(api));
    const precios = await armarCarrito(page, [{ nombre: a.nombre, cantidad: 2 }, { nombre: b.nombre, cantidad: 1 }]);
    const precioA = precios.get(a.nombre) ?? NaN;
    const precioB = precios.get(b.nombre) ?? NaN;

    const carrito = new CartPage(page);
    await carrito.abrir();
    await expect(carrito.lineas).toHaveCount(2);
    await expect.poll(centavosDe(carrito.totalGeneral), 'total inicial').toBe(precioA * 2 + precioB);

    await carrito.quitar(a.nombre).click();
    await expect(carrito.linea(a.nombre)).toHaveCount(0);
    await expect(carrito.lineas).toHaveCount(1);
    await expect(carrito.cantidad(b.nombre)).toHaveValue('1');
    await expect.poll(centavosDe(carrito.totalGeneral), 'total tras quitar').toBe(precioB);
  });

  test('TC-011 producto sin existencias se muestra como Out of stock y no entra al carrito', {
    tag: ['@REQ-002', '@TC-011'],
  }, async ({ page, api }, testInfo) => {
    const oraculo = await leerOraculo(api);
    const sinStock = oraculo.find((p) => !p.conExistencias);
    test.skip(!sinStock, 'El catálogo del entorno no tiene ningún producto sin existencias');
    if (!sinStock) return;
    const control = oraculo.find((p) => p.nombre === PRODUCTO_A && p.conExistencias) ?? oraculo.find((p) => p.conExistencias);
    if (!control) throw new Error('Oráculo: no hay producto con existencias para el control');

    const catalogo = new CatalogPage(page);
    await catalogo.abrir();
    const tarjetaSinStock = await catalogo.mostrarTarjeta(sinStock.nombre);
    await expect(tarjetaSinStock.getByTestId('out-of-stock')).toHaveText(/out of stock/i);
    await catalogo.abrir();
    const tarjetaControl = await catalogo.mostrarTarjeta(control.nombre);
    await expect(tarjetaControl.getByTestId('product-price')).toBeVisible();
    await expect(tarjetaControl.getByTestId('out-of-stock')).toHaveCount(0);

    await catalogo.abrir();
    await catalogo.abrirProducto(sinStock.nombre);
    const producto = new ProductPage(page);
    await expect(producto.nombre).toHaveText(sinStock.nombre);
    await expect(producto.sinExistencias).toHaveText(/out of stock/i);
    // El requisito no fija el mecanismo: vale botón deshabilitado o clic sin efecto.
    const deshabilitado = await producto.agregar.isDisabled();
    testInfo.annotations.push({ type: 'mecanismo', description: deshabilitado ? 'botón deshabilitado' : 'clic permitido' });
    if (!deshabilitado) {
      await producto.agregar.click();
      await page.waitForLoadState('networkidle');
    }

    const carrito = new CartPage(page);
    await expect(carrito.contador.filter({ hasNotText: /^\s*0\s*$/ })).toHaveCount(0);
    await carrito.abrirPorRuta(rutaDe(varianteDe(testInfo.project.name), '/checkout'));
    await expect(carrito.linea(sinStock.nombre)).toHaveCount(0);
  });
});
