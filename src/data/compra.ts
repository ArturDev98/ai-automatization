import type { APIRequestContext } from '@playwright/test';
import { buscarCategoria, leerTodas, type Categoria } from '../api/productos';

export const PRODUCTO_A = 'Combination Pliers';
export const PRODUCTO_B = 'Bolt Cutters';

export const TEXTO_CON_COINCIDENCIAS = 'Pliers';
export const TEXTO_SIN_COINCIDENCIAS = 'zzqx-sin-coincidencias';
export const CONTROL_DE_BUSQUEDA = 'Bolt Cutters';

export const CATEGORIA = 'Pliers';
export const CATEGORIA_DE_CONTROL = 'Hammer';

/** De los métodos de la pantalla, el que no pide datos propios en la versión actual. */
export const METODO_DE_PAGO = 'Cash on Delivery';
// La versión con bugs pide titular y número de cuenta con cualquier método.
export const DATOS_DE_PAGO: Record<string, string> = { 'account-name': 'Qa Flow', 'account-number': '1234567890' };
export const NUMERO_DE_CASA = '12';

export interface OrdenPorNombre {
  etiqueta: string;
  opuesta: string;
  sentido: 1 | -1;
}

export const ORDENES_POR_NOMBRE: OrdenPorNombre[] = [
  { etiqueta: 'Name (A - Z)', opuesta: 'Name (Z - A)', sentido: 1 },
  { etiqueta: 'Name (Z - A)', opuesta: 'Name (A - Z)', sentido: -1 },
];

export const ORDENES_POR_PRECIO: OrdenPorNombre[] = [
  { etiqueta: 'Price (Low - High)', opuesta: 'Price (High - Low)', sentido: 1 },
  { etiqueta: 'Price (High - Low)', opuesta: 'Price (Low - High)', sentido: -1 },
];

export interface ProductoDelOraculo {
  nombre: string;
  centavos: number;
  conExistencias: boolean;
  categoria: string | undefined;
  alquiler: boolean;
}

/** Extremos del filtro de precio en centavos, incluidos. */
export interface RangoDePrecio {
  minimo: number;
  maximo: number;
}

/** `$1,234.56` o `14.15` a centavos enteros; falla si el texto no es un importe. */
export function aCentavos(texto: string): number {
  const limpio = texto.replace(/[\s$,]/g, '');
  const partes = /^(\d+)(?:\.(\d{1,2}))?$/.exec(limpio);
  if (!partes) throw new Error(`"${texto}" no es un importe`);
  return Number(partes[1]) * 100 + Number((partes[2] ?? '').padEnd(2, '0'));
}

// Orden por código de carácter sin mayúsculas: espacio y guion van antes que las letras, como en la BD.
export function compararNombres(a: string, b: string): number {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x < y ? -1 : x > y ? 1 : 0;
}

export function ordenadosSegun<T>(lista: T[], comparar: (a: T, b: T) => number, sentido: 1 | -1): T[] {
  return [...lista].sort((a, b) => comparar(a, b) * sentido);
}

/** Catálogo completo de la API del entorno (`GET /products`, todas las páginas). */
export async function leerOraculo(api: APIRequestContext): Promise<ProductoDelOraculo[]> {
  const paginas = await leerTodas(api, '/products');
  paginas.forEach(({ status }, i) => {
    if (status !== 200) throw new Error(`Oráculo: GET /products?page=${i + 1} respondió ${status}`);
  });
  return paginas.flatMap(({ pagina }) =>
    pagina.data.map((p) => ({
      nombre: p.name,
      centavos: Math.round(p.price * 100),
      // La API de la versión con bugs no trae in_stock, sino la cantidad en stock.
      conExistencias: typeof p.in_stock === 'boolean' ? p.in_stock : Number(p.stock) > 0,
      categoria: p.category?.name,
      alquiler: p.is_rental === true,
    })),
  );
}

/** Lo que el catálogo presenta por defecto: sin alquileres y, si la página tiene rango, dentro de él. */
export function oraculoDeLoMostrado(oraculo: ProductoDelOraculo[], rango: RangoDePrecio | null): ProductoDelOraculo[] {
  return oraculo.filter(
    (p) => !p.alquiler && (!rango || (p.centavos >= rango.minimo && p.centavos <= rango.maximo)),
  );
}

export async function idDeCategoria(api: APIRequestContext, nombre: string): Promise<string> {
  const respuesta = await api.get('/categories/tree');
  if (respuesta.status() !== 200) throw new Error(`Oráculo: GET /categories/tree respondió ${respuesta.status()}`);
  const categoria = buscarCategoria((await respuesta.json()) as Categoria[], nombre);
  if (!categoria) throw new Error(`Oráculo: no existe la categoría ${nombre}`);
  return String(categoria.id);
}

/** A y B del plan si tienen existencias y precios distintos; si no, los dos primeros que cumplan. */
export function productosConExistencias(oraculo: ProductoDelOraculo[]): [ProductoDelOraculo, ProductoDelOraculo] {
  const [a, b] = [PRODUCTO_A, PRODUCTO_B].map((n) => oraculo.find((p) => p.nombre === n && p.conExistencias));
  if (a && b && a.centavos !== b.centavos) return [a, b];
  const disponibles = oraculo.filter((p) => p.conExistencias);
  const primero = disponibles[0];
  const segundo = disponibles.find((p) => p.centavos !== primero?.centavos);
  if (!primero || !segundo) throw new Error('Oráculo: no hay dos productos con existencias y precios distintos');
  return [primero, segundo];
}
