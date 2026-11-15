import { test, expect } from '../../src/fixtures';
import { login as loginApi } from '../../src/api/usuarios';
import { clavesDeLimite, clavesFueraDePolitica, perfilAcceso, varianteDe } from '../../src/data/acceso';
import { LoginPage } from '../../src/pages/LoginPage';
import { Menu } from '../../src/pages/Menu';
import { RegisterPage, type CampoOmitible } from '../../src/pages/RegisterPage';

test.describe('Registro', () => {
  test('TC-006 registro válido e inicio de sesión con las credenciales creadas', {
    tag: ['@REQ-001', '@TC-006'],
  }, async ({ page }, testInfo) => {
    test.fail(testInfo.project.name === 'ui-bugs', 'esperado: el menú muestra el nombre registrado; obtenido: "User Data not found"');
    const v = varianteDe(testInfo.project.name);
    const cliente = perfilAcceso();
    const registro = new RegisterPage(page, v);
    const login = new LoginPage(page, v);

    await registro.registrar(cliente);

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(registro.erroresDeCampo).toHaveCount(0);

    await login.intentar(cliente.email, cliente.password);

    await expect(page).toHaveURL(/\/account$/);
    await expect(new Menu(page).menuCliente).toContainText(cliente.first_name);
  });

  test('TC-007 registro con los campos obligatorios vacíos', {
    tag: ['@REQ-001', '@TC-007'],
  }, async ({ page }, testInfo) => {
    const v = varianteDe(testInfo.project.name);
    const registro = new RegisterPage(page, v);
    const pasos: { paso: string; sin: CampoOmitible[] | 'todo'; errorCorreo: boolean; errorClave: boolean }[] = [
      { paso: 'formulario vacío', sin: 'todo', errorCorreo: true, errorClave: true },
      { paso: 'sin correo', sin: ['email'], errorCorreo: true, errorClave: false },
      { paso: 'sin clave', sin: ['password'], errorCorreo: false, errorClave: true },
    ];

    for (const p of pasos) {
      await test.step(p.paso, async () => {
        await registro.abrir();
        if (p.sin !== 'todo') await registro.llenar(perfilAcceso(), p.sin);
        await registro.enviar.click();

        if (p.errorCorreo) await expect(registro.errorCorreo, p.paso).toBeVisible();
        else await expect(registro.errorCorreo, p.paso).toBeHidden();
        if (p.errorClave) await expect(registro.errorClave, p.paso).toBeVisible();
        else await expect(registro.errorClave, p.paso).toBeHidden();
        await expect(page, p.paso).toHaveURL(/\/auth\/register$/);
        expect(registro.envios, p.paso).toEqual([]);
      });
    }
  });

  test('TC-008 registro con clave que incumple una regla de composición', {
    tag: ['@REQ-001', '@TC-008'],
  }, async ({ page, api }, testInfo) => {
    test.fail(testInfo.project.name === 'ui-bugs', 'esperado: rechaza la clave fuera de política; obtenido: alta 201 y redirige a /auth/login');
    const v = varianteDe(testInfo.project.name);
    const registro = new RegisterPage(page, v);

    for (const [regla, clave] of Object.entries(clavesFueraDePolitica())) {
      await test.step(regla, async () => {
        const cliente = { ...perfilAcceso(), password: clave };
        await registro.registrar(cliente);

        await expect(registro.errorClave, regla).toBeVisible();
        await expect(page, regla).toHaveURL(/\/auth\/register$/);

        // Un solo intento por correo: nunca se acerca al bloqueo.
        const sesion = await loginApi(api, cliente.email, clave);
        expect(sesion.status(), regla).not.toBe(200);
        expect(await sesion.json(), regla).not.toHaveProperty('access_token');
      });
    }
  });

  test('TC-009 longitud de la clave en el registro: 7 y 8 caracteres', {
    tag: ['@REQ-001', '@TC-009'],
  }, async ({ page }, testInfo) => {
    test.fail(testInfo.project.name === 'ui-bugs', 'esperado: acepta una clave válida de 8; obtenido: "Password must be minimal 10 characters long."');
    const v = varianteDe(testInfo.project.name);
    const registro = new RegisterPage(page, v);
    const { siete, ocho } = clavesDeLimite();

    await test.step('7 caracteres', async () => {
      await registro.registrar({ ...perfilAcceso(), password: siete });
      await expect(registro.errorClave).toBeVisible();
      await expect(page).toHaveURL(/\/auth\/register$/);
    });

    await test.step('8 caracteres', async () => {
      await registro.registrar({ ...perfilAcceso(), password: ocho });
      await expect(page).toHaveURL(/\/auth\/login$/);
    });
  });
});
