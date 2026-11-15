import { test as base, type APIRequestContext, type APIResponse } from '@playwright/test';
import { apiUrlDe, crearContextoApi } from '../api/contexto';
import { crearCarrito, eliminarCarrito } from '../api/carritos';
import { registrarYEntrar } from '../api/usuarios';
import { nuevoCliente, type Cliente } from '../data/clientes';

export interface CarritosDeLaPrueba {
  /** Crea un carrito y lo apunta para borrarlo al terminar, pase o falle la prueba. */
  crear(): Promise<APIResponse>;
}

interface Fixtures {
  /** Contexto contra la API, independiente del baseURL del proyecto (sirve también en `ui`). */
  api: APIRequestContext;
  /** Cliente recién registrado en esta prueba; su clave nunca se escribe en reportes. */
  cliente: Cliente;
  /** Token de `POST /users/login` del `cliente`. */
  token: string;
  carritos: CarritosDeLaPrueba;
}

interface ClienteInterno {
  sesionCliente: { cliente: Cliente; token: string };
}

export const test = base.extend<Fixtures & ClienteInterno>({
  // eslint-disable-next-line no-empty-pattern
  api: async ({}, use, testInfo) => {
    const api = await crearContextoApi(apiUrlDe(testInfo.project.name));
    await use(api);
    await api.dispose();
  },

  sesionCliente: async ({ api }, use) => {
    const cliente = nuevoCliente();
    const token = await registrarYEntrar(api, cliente);
    await use({ cliente, token });
  },

  cliente: async ({ sesionCliente }, use) => {
    await use(sesionCliente.cliente);
  },

  token: async ({ sesionCliente }, use) => {
    await use(sesionCliente.token);
  },

  carritos: async ({ api }, use) => {
    const ids: string[] = [];
    await use({
      async crear() {
        const respuesta = await crearCarrito(api);
        const id = (await respuesta.json().catch(() => ({}))).id;
        if (typeof id === 'string') ids.push(id);
        return respuesta;
      },
    });
    // 404 es válido: la prueba pudo borrarlo ya.
    for (const id of ids) {
      const borrado = await eliminarCarrito(api, id);
      if (![204, 404].includes(borrado.status())) {
        throw new Error(`No se pudo eliminar el carrito ${id}: ${borrado.status()}`);
      }
    }
  },
});

export { expect } from '@playwright/test';
