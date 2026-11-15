import { test as base, expect } from '../../src/fixtures';
import { login } from '../../src/api/usuarios';
import { nuevoCliente } from '../../src/data/clientes';
import { cuerpoDeRegistro, varianteDe } from '../../src/data/acceso';
import { METODO_DE_PAGO, leerOraculo, productosConExistencias } from '../../src/data/compra';
import { LoginPage } from '../../src/pages/LoginPage';
import { CatalogPage } from '../../src/pages/CatalogPage';
import { ProductPage } from '../../src/pages/ProductPage';
import { CartPage } from '../../src/pages/CartPage';
import { CheckoutPage } from '../../src/pages/CheckoutPage';

// Mismo cliente del fixture `cliente`, pero registrado con el contrato de la API de cada versión.
const test = base.extend({
  sesionCliente: async ({ api }, use, testInfo) => {
    const cliente = nuevoCliente('req002');
    const alta = await api.post('/users/register', { data: cuerpoDeRegistro(cliente, varianteDe(testInfo.project.name)) });
    if (alta.status() !== 201) throw new Error(`Registro de ${cliente.email}: ${alta.status()} ${await alta.text()}`);
    const sesion = await login(api, cliente.email, cliente.password);
    const token = (await sesion.json().catch(() => ({}))).access_token;
    if (typeof token !== 'string') throw new Error(`Login de ${cliente.email}: ${sesion.status()}`);
    await use({ cliente, token });
  },
});

test.describe('Compra con sesión iniciada', () => {
  test('TC-012 cliente con sesión completa la compra y ve pago exitoso y número de factura', {
    tag: ['@REQ-002', '@TC-012'],
  }, async ({ page, api, cliente }, testInfo) => {
    test.fail(testInfo.project.name === 'ui-bugs', 'H-07: se esperaba el número de factura tras Confirm; POST /invoices responde 500 y no aparece');
    const [a] = productosConExistencias(await leerOraculo(api));
    const catalogo = new CatalogPage(page);

    await catalogo.abrir();
    await page.getByTestId('nav-sign-in').click();
    await new LoginPage(page).intentar(cliente.email, cliente.password);
    await expect(page).toHaveURL(/account/);

    await catalogo.abrir();
    await catalogo.abrirProducto(a.nombre);
    const producto = new ProductPage(page);
    await expect(producto.nombre).toHaveText(a.nombre);
    await producto.agregarAlCarrito();

    const carrito = new CartPage(page);
    await carrito.abrir();
    await expect(carrito.lineas).toHaveCount(1);
    await expect(carrito.cantidad(a.nombre)).toHaveValue('1');
    await carrito.avanzar.click();

    const checkout = new CheckoutPage(page);
    await expect(checkout.saludoConSesion).toBeVisible();
    await expect(checkout.correoDeLogin).toBeHidden();
    await checkout.avanzarSesion.click();

    await checkout.confirmarDireccion();
    await checkout.elegirPago(METODO_DE_PAGO);
    await checkout.finalizar.click();
    await expect(checkout.pagoExitoso).toBeVisible();
    await checkout.finalizar.click();
    await expect(checkout.confirmacion).toHaveText(/invoice number is\s+[A-Z0-9][A-Z0-9-]*/i);
    await expect(checkout.correoDeLogin).toBeHidden();
  });
});
