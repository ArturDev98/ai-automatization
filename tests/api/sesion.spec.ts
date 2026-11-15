import { test, expect } from '../../src/fixtures';
import { textoDeError } from '../../src/api/errores';
import { login, perfil, registrar } from '../../src/api/usuarios';
import { correoInexistente, nuevoCliente } from '../../src/data/clientes';
import { TOKEN_INVALIDO } from '../../src/data/productos';

test.describe('API de sesión', () => {
  test('TC-009 login con cliente recién registrado entrega token y da acceso a /users/me', {
    tag: ['@REQ-003', '@TC-009'],
  }, async ({ api }) => {
    const cliente = nuevoCliente('qa-req003');

    const alta = await registrar(api, cliente);
    expect(alta.status()).toBe(201);

    const sesion = await login(api, cliente.email, cliente.password);
    expect(sesion.status()).toBe(200);
    const { access_token } = await sesion.json();
    expect(typeof access_token).toBe('string');
    expect(access_token.length).toBeGreaterThan(0);

    const yo = await perfil(api, access_token);
    expect(yo.status()).toBe(200);
    expect((await yo.json()).email).toBe(cliente.email);
  });

  test('TC-010 login con correo inexistente responde 401 sin token', {
    tag: ['@REQ-003', '@TC-010'],
  }, async ({ api }) => {
    const respuesta = await login(api, correoInexistente(), 'x-inexistente-1');
    expect(respuesta.status()).toBe(401);
    const cuerpo = await respuesta.json();
    expect(cuerpo).not.toHaveProperty('access_token');
    expect(textoDeError(cuerpo)?.length ?? 0).toBeGreaterThan(0);
  });

  test('TC-011 /users/me sin token o con token inválido responde 401', {
    tag: ['@REQ-003', '@TC-011'],
  }, async ({ api }) => {
    for (const [paso, token] of [['sin token', undefined], ['token inválido', TOKEN_INVALIDO]] as const) {
      const respuesta = await perfil(api, token);
      expect(respuesta.status(), paso).toBe(401);
      const cuerpo = await respuesta.json();
      expect(cuerpo, paso).not.toHaveProperty('email');
      expect(cuerpo, paso).not.toHaveProperty('id');
    }
  });

  test('TC-014 login con cuerpo incompleto responde 4xx con explicación y nunca 5xx', {
    tag: ['@REQ-003', '@TC-014'],
  }, async ({ api }) => {
    const cuerpos = [{}, { email: correoInexistente() }];
    for (const data of cuerpos) {
      const respuesta = await api.post('/users/login', { data });
      const paso = JSON.stringify(data);
      expect(respuesta.status(), paso).toBeGreaterThanOrEqual(400);
      expect(respuesta.status(), paso).toBeLessThan(500);
      const cuerpo = await respuesta.json();
      expect(cuerpo, paso).not.toHaveProperty('access_token');
      expect(textoDeError(cuerpo)?.length ?? 0, paso).toBeGreaterThan(0);
    }
  });
});
