import { test, expect } from '../../src/fixtures';
import { registrarClientePropio } from '../../src/api/acceso';
import { perfilAcceso, varianteDe } from '../../src/data/acceso';
import { claveSegura, correoInexistente } from '../../src/data/clientes';
import { AccountPage } from '../../src/pages/AccountPage';
import { LoginPage } from '../../src/pages/LoginPage';
import { Menu } from '../../src/pages/Menu';

const CREDENCIALES_INVALIDAS = 'Invalid email or password';

test.describe('Inicio de sesión', () => {
  test('TC-001 inicio de sesión con correo y clave correctos', {
    tag: ['@REQ-001', '@TC-001'],
  }, async ({ page, api }, testInfo) => {
    test.fail(testInfo.project.name === 'ui-bugs', 'esperado: el menú muestra el nombre del cliente; obtenido: "User Data not found"');
    const v = varianteDe(testInfo.project.name);
    const cliente = perfilAcceso();
    await registrarClientePropio(api, cliente, v);
    const login = new LoginPage(page, v);
    const menu = new Menu(page);

    await login.entrar(cliente.email, cliente.password);

    await expect(page).toHaveURL(/\/account$/);
    await expect(new AccountPage(page, v).titulo).toBeVisible();
    await expect(menu.menuCliente).toContainText(cliente.first_name);
    await expect(menu.iniciarSesion).toBeHidden();
  });

  test('TC-002 inicio de sesión con un correo que no existe', {
    tag: ['@REQ-001', '@TC-002'],
  }, async ({ page }, testInfo) => {
    const v = varianteDe(testInfo.project.name);
    const login = new LoginPage(page, v);

    await login.entrar(correoInexistente(), claveSegura());

    await expect(login.errorCredenciales).toHaveText(CREDENCIALES_INVALIDAS);
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(new Menu(page).iniciarSesion).toBeVisible();
  });

  test('TC-003 inicio de sesión con clave incorrecta de un cliente registrado', {
    tag: ['@REQ-001', '@TC-003'],
  }, async ({ page, api }, testInfo) => {
    const v = varianteDe(testInfo.project.name);
    // Cliente exclusivo y un solo intento fallido: la cuenta se bloquea al tercero.
    const cliente = perfilAcceso();
    await registrarClientePropio(api, cliente, v);
    const login = new LoginPage(page, v);

    await login.entrar(cliente.email, claveSegura());

    await expect(login.errorCredenciales).toHaveText(CREDENCIALES_INVALIDAS);
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(new Menu(page).iniciarSesion).toBeVisible();
    expect(login.envios).toHaveLength(1);
  });

  test('TC-004 inicio de sesión con correo y clave vacíos', {
    tag: ['@REQ-001', '@TC-004'],
  }, async ({ page }, testInfo) => {
    test.fail(testInfo.project.name === 'ui-bugs', 'esperado: error por campo y sin envío; obtenido: envía POST /users/login y muestra "Invalid email or password"');
    const v = varianteDe(testInfo.project.name);
    const login = new LoginPage(page, v);
    const combinaciones = [
      { paso: 'ambos vacíos', email: '', password: '', errorCorreo: true, errorClave: true },
      { paso: 'correo vacío', email: '', password: claveSegura(), errorCorreo: true, errorClave: false },
      { paso: 'clave vacía', email: correoInexistente(), password: '', errorCorreo: false, errorClave: true },
    ];

    for (const c of combinaciones) {
      await test.step(c.paso, async () => {
        await login.abrir();
        await login.intentar(c.email, c.password);

        if (c.errorCorreo) await expect(login.errorCorreo, c.paso).toBeVisible();
        else await expect(login.errorCorreo, c.paso).toBeHidden();
        if (c.errorClave) await expect(login.errorClave, c.paso).toBeVisible();
        else await expect(login.errorClave, c.paso).toBeHidden();
        await expect(login.errorCredenciales, c.paso).toBeHidden();
        await expect(page, c.paso).toHaveURL(/\/auth\/login$/);
        expect(login.envios, c.paso).toEqual([]);
      });
    }
  });

  test('TC-005 inicio de sesión con correo de formato inválido', {
    tag: ['@REQ-001', '@TC-005'],
  }, async ({ page }, testInfo) => {
    test.fail(testInfo.project.name === 'ui-bugs', 'esperado: error de formato en el correo y sin envío; obtenido: envía POST /users/login y responde 401');
    const v = varianteDe(testInfo.project.name);
    const login = new LoginPage(page, v);

    for (const correo of ['cliente.example.com', 'cliente@', '@example.com']) {
      await test.step(correo, async () => {
        await login.abrir();
        await login.intentar(correo, claveSegura());

        await expect(login.errorCorreo, correo).toBeVisible();
        await expect(login.errorClave, correo).toBeHidden();
        await expect(login.errorCredenciales, correo).toBeHidden();
        await expect(page, correo).toHaveURL(/\/auth\/login$/);
        expect(login.envios, correo).toEqual([]);
      });
    }
  });
});
