import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Cliente } from '../data/clientes';

export function registrar(api: APIRequestContext, cliente: Cliente): Promise<APIResponse> {
  return api.post('/users/register', { data: cliente });
}

export function login(api: APIRequestContext, email: string, password: string): Promise<APIResponse> {
  return api.post('/users/login', { data: { email, password } });
}

export function perfil(api: APIRequestContext, token?: string): Promise<APIResponse> {
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  return api.get('/users/me', { headers });
}

// Para precondiciones: falla con el cuerpo de la respuesta si algo no sale como se espera.
export async function registrarYEntrar(api: APIRequestContext, cliente: Cliente): Promise<string> {
  const alta = await registrar(api, cliente);
  if (alta.status() !== 201) {
    throw new Error(`Registro de ${cliente.email}: ${alta.status()} ${await alta.text()}`);
  }
  const sesion = await login(api, cliente.email, cliente.password);
  const cuerpo = await sesion.json().catch(() => ({}));
  if (sesion.status() !== 200 || typeof cuerpo.access_token !== 'string') {
    throw new Error(`Login de ${cliente.email}: ${sesion.status()} ${JSON.stringify(cuerpo)}`);
  }
  return cuerpo.access_token;
}
