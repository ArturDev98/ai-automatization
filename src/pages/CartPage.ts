import type { Locator, Page } from '@playwright/test';

function textoExacto(texto: string): RegExp {
  return new RegExp(`^\\s*${texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
}

/** Paso 1 de `/checkout` y contador del encabezado. */
export class CartPage {
  readonly enlace: Locator;
  readonly contador: Locator;
  readonly lineas: Locator;
  readonly totalGeneral: Locator;
  readonly avanzar: Locator;

  constructor(readonly page: Page) {
    this.enlace = page.getByTestId('nav-cart');
    this.contador = page.getByTestId('cart-quantity');
    this.lineas = page.getByRole('row').filter({ has: page.getByTestId('product-title') });
    this.totalGeneral = page.getByTestId('cart-total');
    this.avanzar = page.getByTestId('proceed-1');
  }

  async abrir(): Promise<void> {
    await this.enlace.click();
  }

  /** Con el carrito vacío no hay ícono: se entra por la ruta (con `#/` en la versión con bugs). */
  async abrirPorRuta(ruta: string): Promise<void> {
    await this.page.goto(ruta);
  }

  linea(nombre: string): Locator {
    return this.lineas.filter({ has: this.page.getByTestId('product-title').filter({ hasText: textoExacto(nombre) }) });
  }

  cantidad(nombre: string): Locator {
    return this.linea(nombre).getByTestId('product-quantity');
  }

  precioUnitario(nombre: string): Locator {
    return this.linea(nombre).getByTestId('product-price');
  }

  totalDeLinea(nombre: string): Locator {
    return this.linea(nombre).getByTestId('line-price');
  }

  // El botón de quitar no tiene data-test ni nombre accesible: es el enlace de la última celda.
  quitar(nombre: string): Locator {
    return this.linea(nombre).getByRole('cell').last().locator('a');
  }

  /** Tab confirma el campo: la app recalcula el total al perder el foco. */
  async cambiarCantidad(nombre: string, cantidad: number): Promise<void> {
    const campo = this.cantidad(nombre);
    await campo.fill(String(cantidad));
    await campo.press('Tab');
  }
}
