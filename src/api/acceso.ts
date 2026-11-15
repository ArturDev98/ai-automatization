import type { APIRequestContext } from '@playwright/test';
import type { Cliente } from '../data/clientes';
import { cuerpoDeRegistro, type Variante } from '../data/acceso';
import { registrarYEntrar } from './usuarios';

/** Precondición "cliente propio": lo registra por API y comprueba que puede entrar. */
export async function registrarClientePropio(api: APIRequestContext, cliente: Cliente, variante: Variante): Promise<void> {
  if (variante === 'actual') {
    await registrarYEntrar(api, cliente);
    return;
  }
  const alta = await api.post('/users/register', { data: cuerpoDeRegistro(cliente, variante) });
  if (alta.status() !== 201) {
    throw new Error(`Entorno: registro de ${cliente.email}: ${alta.status()} ${await alta.text()}`);
  }
  const sesion = await api.post('/users/login', { data: { email: cliente.email, password: cliente.password } });
  if (sesion.status() !== 200) {
    throw new Error(`Entorno: login de ${cliente.email}: ${sesion.status()} ${await sesion.text()}`);
  }
}
