import { randomInt } from 'node:crypto';
import type { Page } from '@playwright/test';
import { claveSegura, nuevoCliente, type Cliente } from './clientes';

/** `bugs` es una generación anterior de Toolshop: rutas con `#/`, dirección plana y otros campos. */
export type Variante = 'actual' | 'bugs';

export function varianteDe(proyecto: string): Variante {
  return proyecto === 'ui-bugs' ? 'bugs' : 'actual';
}

export function rutaDe(variante: Variante, ruta: string): string {
  return variante === 'bugs' ? `/#${ruta}` : ruta;
}

/** Abre una pantalla con estado limpio; con rutas `#/`, ir a la misma URL no recarga y conserva el formulario. */
export async function abrirLimpio(page: Page, variante: Variante, ruta: string): Promise<void> {
  if (variante === 'bugs') await page.goto('about:blank');
  await page.goto(rutaDe(variante, ruta));
}

// El formulario actual lo pide y la API lo acepta aunque `Cliente` no lo lleve.
export const NUMERO_DE_CASA = '42';

/** Perfil válido de REQ-001: nombre reconocible para el assert del menú; sirve a la UI y a la API. */
export function perfilAcceso(): Cliente {
  return { ...nuevoCliente('req001'), first_name: 'Valeria', last_name: 'Acceso' };
}

/** Cuerpo de `POST /users/register` según la variante; la de bugs no acepta dirección anidada. */
export function cuerpoDeRegistro(cliente: Cliente, variante: Variante): object {
  if (variante === 'actual') return cliente;
  const { address, ...resto } = cliente;
  return { ...resto, address: address.street, city: address.city, state: address.state, country: address.country, postcode: address.postal_code };
}

function letras(n: number): string {
  return Array.from({ length: n }, () => String.fromCharCode(97 + randomInt(26))).join('');
}

/** Cada clave incumple una sola regla de la política y conserva 8 caracteres o más. */
export function clavesFueraDePolitica(): Record<string, string> {
  const base = claveSegura();
  return {
    'sin mayúscula': base.toLowerCase(),
    'sin minúscula': base.toUpperCase(),
    'sin número': base.replace(/\d/g, 'k'),
    'sin símbolo': base.replace(/[^A-Za-z0-9]/g, 'x'),
  };
}

/** Claves de 7 y 8 caracteres con mayúscula, minúscula, número y símbolo; la de 8 es la de 7 más una letra. */
export function clavesDeLimite(): { siete: string; ocho: string } {
  const siete = `Qf!9${letras(3)}`;
  return { siete, ocho: `${siete}${letras(1)}` };
}
