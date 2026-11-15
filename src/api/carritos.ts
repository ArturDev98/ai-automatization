import type { APIRequestContext, APIResponse } from '@playwright/test';

export interface ItemCarrito {
  id: string;
  quantity: number;
  cart_id: string;
  product_id: string;
}

export interface Carrito {
  id: string;
  cart_items: ItemCarrito[];
}

export function crearCarrito(api: APIRequestContext): Promise<APIResponse> {
  return api.post('/carts');
}

export function consultarCarrito(api: APIRequestContext, id: string): Promise<APIResponse> {
  return api.get(`/carts/${id}`);
}

export function anadirAlCarrito(api: APIRequestContext, id: string, data: unknown): Promise<APIResponse> {
  return api.post(`/carts/${id}`, { data });
}

export function cambiarCantidad(api: APIRequestContext, id: string, data: unknown): Promise<APIResponse> {
  return api.put(`/carts/${id}/product/quantity`, { data });
}

export function eliminarCarrito(api: APIRequestContext, id: string): Promise<APIResponse> {
  return api.delete(`/carts/${id}`);
}
