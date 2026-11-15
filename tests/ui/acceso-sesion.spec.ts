import { test, expect } from '../../src/fixtures';
import { registrarClientePropio } from '../../src/api/acceso';
import { perfilAcceso, varianteDe } from '../../src/data/acceso';
import { AccountPage } from '../../src/pages/AccountPage';
import { LoginPage } from '../../src/pages/LoginPage';
import { Menu } from '../../src/pages/Menu';

test.describe('Cierre de sesión', () => {
  test('TC-010 cierre de sesión y acceso directo a My account', {
    tag: ['@REQ-001', '@TC-010'],
  }, async ({ page, api }, testInfo) => {
    const v = varianteDe(testInfo.project.name);
    const cliente = perfilAcceso();
    await registrarClientePropio(api, cliente, v);
    const menu = new Menu(page);
    const cuenta = new AccountPage(page, v);
    await new LoginPage(page, v).entrar(cliente.email, cliente.password);
    // Precondición: sesión abierta. Que el menú muestre el nombre lo verifica TC-001.
    await expect(cuenta.titulo).toBeVisible();
    await expect(menu.menuCliente).toBeVisible();

    await menu.salir();

    await expect(menu.iniciarSesion).toHaveText('Sign in');
    await expect(menu.menuCliente).toBeHidden();
    await expect(page.getByText(cliente.first_name)).toHaveCount(0);

    await cuenta.abrir();

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(cuenta.titulo).toBeHidden();
    await expect(menu.iniciarSesion).toHaveText('Sign in');
  });

  test('TC-012 botón atrás del navegador después de cerrar sesión', {
    tag: ['@REQ-001', '@TC-012'],
  }, async ({ page, api }, testInfo) => {
    const v = varianteDe(testInfo.project.name);
    const cliente = perfilAcceso();
    await registrarClientePropio(api, cliente, v);
    const menu = new Menu(page);
    const cuenta = new AccountPage(page, v);
    await new LoginPage(page, v).entrar(cliente.email, cliente.password);
    await expect(cuenta.titulo).toBeVisible();

    await menu.salir();
    await expect(menu.iniciarSesion).toBeVisible();

    for (const [paso, accion] of [
      ['atrás', () => page.goBack()],
      ['recarga', () => page.reload()],
    ] as const) {
      await test.step(paso, async () => {
        await accion();
        await expect(menu.iniciarSesion, paso).toHaveText('Sign in');
        await expect(cuenta.titulo, paso).toBeHidden();
        await expect(page.getByText(cliente.first_name), paso).toHaveCount(0);
      });
    }
  });
});
