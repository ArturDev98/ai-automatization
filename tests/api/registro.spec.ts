import { test, expect } from '../../src/fixtures';
import { registrar } from '../../src/api/usuarios';
import { clavesDeLimite, clavesFueraDePolitica, perfilAcceso } from '../../src/data/acceso';

test.describe('API de registro', () => {
  test('TC-011 la API de registro rechaza una clave fuera de política', {
    tag: ['@REQ-001', '@TC-011'],
  }, async ({ api }) => {
    const rechazos = [
      ['7 caracteres', clavesDeLimite().siete],
      ['sin símbolo', clavesFueraDePolitica()['sin símbolo']],
    ] as const;

    for (const [paso, clave] of rechazos) {
      const respuesta = await registrar(api, { ...perfilAcceso(), password: clave });
      expect(respuesta.ok(), `${paso}: ${respuesta.status()}`).toBe(false);
      const cuerpo = await respuesta.json();
      expect(cuerpo, paso).not.toHaveProperty('id');
      expect(cuerpo.password?.length ?? 0, `${paso}: la causa debe ser la clave`).toBeGreaterThan(0);
    }

    const control = await registrar(api, perfilAcceso());
    expect(control.status(), 'control con clave válida').toBe(201);
  });
});
