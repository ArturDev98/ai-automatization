import type { Locator, Page } from '@playwright/test';

export class ProductPage {
  readonly nombre: Locator;
  readonly cantidad: Locator;
  readonly aumentarCantidad: Locator;
  readonly agregar: Locator;
  readonly sinExistencias: Locator;
  /** Aviso emergente tras agregar; la versión con bugs muestra uno de error aunque sí agrega. */
  readonly aviso: Locator;

  constructor(readonly page: Page) {
    this.nombre = page.getByTestId('product-name');
    this.cantidad = page.getByTestId('quantity');
    this.aumentarCantidad = page.getByTestId('increase-quantity');
    this.agregar = page.getByTestId('add-to-cart');
    this.sinExistencias = page.getByTestId('out-of-stock');
    this.aviso = page.getByRole('alert').first();
  }

  async fijarCantidad(cantidad: number): Promise<void> {
    await this.cantidad.fill(String(cantidad));
  }

  /** Espera el aviso para no salir de la página antes de que el carrito registre el producto. */
  async agregarAlCarrito(): Promise<void> {
    await this.agregar.click();
    await this.aviso.waitFor();
  }
}
