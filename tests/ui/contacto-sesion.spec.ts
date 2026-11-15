import type { APIRequestContext, Page } from '@playwright/test';
import { test, expect } from '../../src/fixtures';
import { registrarClientePropio } from '../../src/api/acceso';
import { varianteDe, type Variante } from '../../src/data/acceso';
import type { Cliente } from '../../src/data/clientes';
import { ASUNTO_CON_SESION, CONFIRMACION, clienteDeContacto, formularioValido } from '../../src/data/contacto';
import { AccountPage } from '../../src/pages/AccountPage';
import { ContactPage } from '../../src/pages/ContactPage';
import { LoginPage } from '../../src/pages/LoginPage';

/** Precondición: cliente propio con sesión iniciada por la UI y la pantalla de contacto ya con su perfil. */
async function contactoConSesion(page: Page, api: APIRequestContext, v: Variante): Promise<{ cliente: Cliente; contacto: ContactPage }> {
  const cliente = clienteDeContacto();
  await registrarClientePropio(api, cliente, v);
  await new LoginPage(page, v).entrar(cliente.email, cliente.password);
  await expect(new AccountPage(page, v).titulo).toBeVisible();
  const contacto = new ContactPage(page, v);
  await contacto.abrir();
  await expect(contacto.saludo(`${cliente.first_name} ${cliente.last_name}`)).toBeVisible();
  return { cliente, contacto };
}

test.describe('Formulario de contacto con sesión', () => {
  test('TC-009 un cliente con sesión envía sin escribir nombre ni correo', {
    tag: ['@REQ-004', '@TC-009'],
  }, async ({ page, api }, testInfo) => {
    const { contacto } = await contactoConSesion(page, api, varianteDe(testInfo.project.name));
    await expect(contacto.nombre).toBeHidden();
    await expect(contacto.apellido).toBeHidden();
    await expect(contacto.correo).toBeHidden();

    await contacto.elegirAsunto(ASUNTO_CON_SESION);
    await contacto.mensaje.fill(formularioValido().mensaje);
    await contacto.enviar.click();

    await expect(contacto.confirmacion).toHaveText(CONFIRMACION);
    for (const campo of ['first-name', 'last-name', 'email'] as const) {
      await expect(contacto.error(campo), `sin error en ${campo}`).toBeHidden();
    }
    for (const campo of [contacto.asunto, contacto.mensaje, contacto.enviar]) {
      await expect(campo).toBeHidden();
    }
  });

  test('TC-010 el mensaje enviado con sesión identifica al cliente', {
    tag: ['@REQ-004', '@TC-010'],
  }, async ({ page, api }, testInfo) => {
    test.fail(testInfo.project.name === 'ui-bugs', 'esperado: el POST /messages lleva el nombre del cliente; obtenido: name " " (en blanco)');
    const { cliente, contacto } = await contactoConSesion(page, api, varianteDe(testInfo.project.name));
    await contacto.elegirAsunto(ASUNTO_CON_SESION);
    await contacto.mensaje.fill(formularioValido().mensaje);

    const respuesta = contacto.respuestaDeEnvio();
    await contacto.enviar.click();

    const envio = await respuesta;
    expect(envio.ok(), `POST /messages respondió ${envio.status()}`).toBe(true);
    const nombre = String(envio.request().postDataJSON()?.name ?? '');
    expect(nombre).toContain(cliente.first_name);
    expect(nombre).toContain(cliente.last_name);
  });
});
