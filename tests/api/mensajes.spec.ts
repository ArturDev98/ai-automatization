import type { APIRequestContext } from '@playwright/test';
import { test, expect } from '../../src/fixtures';
import { enviarMensaje } from '../../src/api/mensajes';
import { CORREOS_INVALIDOS, cuerpoDeMensaje, mensajesDeLimite } from '../../src/data/contacto';

// Un control que no responde 2xx es un problema de contrato, no de CA-3 ni CA-4.
async function controlAceptado(api: APIRequestContext): Promise<void> {
  const control = await enviarMensaje(api, cuerpoDeMensaje());
  expect(control.ok(), `contrato: el control con 50 caracteres respondió ${control.status()} ${await control.text()}`).toBe(true);
}

test.describe('API de mensajes', () => {
  test('TC-012 la API de mensajes rechaza un correo con formato inválido', {
    tag: ['@REQ-004', '@TC-012'],
  }, async ({ api }) => {
    await controlAceptado(api);

    const respuesta = await enviarMensaje(api, cuerpoDeMensaje({ email: CORREOS_INVALIDOS[0] }));

    expect(respuesta.ok(), `correo inválido: ${respuesta.status()}`).toBe(false);
    const cuerpo = await respuesta.json();
    expect(cuerpo).not.toHaveProperty('id');
    expect(cuerpo.email, 'la causa debe ser el correo').toEqual(expect.arrayContaining([expect.any(String)]));
  });

  test('TC-012 la API de mensajes rechaza un mensaje más corto que el mínimo', {
    tag: ['@REQ-004', '@TC-012'],
  }, async ({ api }, testInfo) => {
    test.fail(testInfo.project.name === 'api', 'esperado: 4xx con error en message para 49 caracteres; obtenido: 200 y el mensaje se guarda');
    await controlAceptado(api);

    const respuesta = await enviarMensaje(api, cuerpoDeMensaje({ message: mensajesDeLimite().corto }));

    expect(respuesta.ok(), `mensaje de 49 caracteres: ${respuesta.status()}`).toBe(false);
    const cuerpo = await respuesta.json();
    expect(cuerpo).not.toHaveProperty('id');
    expect(cuerpo.message, 'la causa debe ser el mensaje').toEqual(expect.arrayContaining([expect.any(String)]));
  });
});
