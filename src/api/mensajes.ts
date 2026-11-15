import type { APIRequestContext, APIResponse } from '@playwright/test';

export function enviarMensaje(api: APIRequestContext, data: object): Promise<APIResponse> {
  return api.post('/messages', { data });
}
