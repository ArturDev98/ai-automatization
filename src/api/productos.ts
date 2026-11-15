import type { APIRequestContext } from '@playwright/test';

export interface Categoria {
  id: string;
  name: string;
  slug?: string;
  parent_id?: string | null;
  sub_categories?: Categoria[];
}

export interface Producto {
  id: string;
  name: string;
  description: string;
  price: number;
  in_stock: boolean;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  [campo: string]: unknown;
}

export interface Pagina<T = Producto> {
  current_page: number;
  data: T[];
  from: number | null;
  to: number | null;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginaLeida {
  status: number;
  pagina: Pagina;
}

export async function leerPagina(
  api: APIRequestContext,
  ruta: string,
  params: Record<string, string | number> = {},
): Promise<PaginaLeida> {
  const respuesta = await api.get(ruta, { params });
  const pagina = respuesta.ok() ? ((await respuesta.json()) as Pagina) : ({} as Pagina);
  return { status: respuesta.status(), pagina };
}

// Recorre de la página 1 a last_page y devuelve cada página en orden.
export async function leerTodas(
  api: APIRequestContext,
  ruta: string,
  params: Record<string, string | number> = {},
): Promise<PaginaLeida[]> {
  const primera = await leerPagina(api, ruta, { ...params, page: 1 });
  const paginas = [primera];
  for (let n = 2; n <= (primera.pagina.last_page ?? 1); n++) {
    paginas.push(await leerPagina(api, ruta, { ...params, page: n }));
  }
  return paginas;
}

export async function primerProducto(api: APIRequestContext): Promise<Producto> {
  const { status, pagina } = await leerPagina(api, '/products', { page: 1 });
  if (status !== 200 || !pagina.data?.length) throw new Error(`GET /products?page=1: ${status}`);
  return pagina.data[0];
}

export function buscarCategoria(arbol: Categoria[], nombre: string): Categoria | undefined {
  for (const nodo of arbol) {
    if (nodo.name === nombre) return nodo;
    const hallada = buscarCategoria(nodo.sub_categories ?? [], nombre);
    if (hallada) return hallada;
  }
  return undefined;
}
