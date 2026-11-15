import { request, type APIRequestContext } from '@playwright/test';

export const API_URL = process.env.API_URL ?? 'https://api.practicesoftwaretesting.com';
export const API_BUGS_URL = process.env.API_BUGS_URL ?? 'https://api-with-bugs.practicesoftwaretesting.com';

// La versión con bugs tiene su propia API y su propia base de datos de clientes.
export function apiUrlDe(proyecto: string): string {
  return proyecto === 'ui-bugs' ? API_BUGS_URL : API_URL;
}

// Sin Accept JSON, Laravel responde los errores de validación con un 302 a la portada.
export const CABECERAS_API = { Accept: 'application/json' };

export function crearContextoApi(baseURL = API_URL): Promise<APIRequestContext> {
  return request.newContext({ baseURL, extraHTTPHeaders: CABECERAS_API });
}
