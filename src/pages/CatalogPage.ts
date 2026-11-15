import type { Locator, Page } from '@playwright/test';
import { aCentavos, type RangoDePrecio } from '../data/compra';

export class CatalogPage {
  readonly textoDeBusqueda: Locator;
  readonly buscarBoton: Locator;
  readonly nombres: Locator;
  readonly precios: Locator;
  readonly sinResultados: Locator;
  readonly orden: Locator;
  readonly paginaSiguiente: Locator;

  constructor(readonly page: Page) {
    this.textoDeBusqueda = page.getByTestId('search-query');
    this.buscarBoton = page.getByTestId('search-submit');
    this.nombres = page.getByTestId('product-name');
    this.precios = page.getByTestId('product-price');
    this.sinResultados = page.getByTestId('no-results');
    this.orden = page.getByTestId('sort');
    this.paginaSiguiente = page.getByTestId('pagination-next');
  }

  async abrir(): Promise<void> {
    await this.page.goto('/');
    await this.nombres.first().waitFor();
  }

  async buscar(texto: string): Promise<void> {
    await this.textoDeBusqueda.fill(texto);
    await this.buscarBoton.click();
  }

  async ordenarPor(etiqueta: string): Promise<void> {
    await this.orden.selectOption({ label: etiqueta });
  }

  /** Checkbox del filtro; su `data-test` lleva el id de `/categories/tree`. */
  categoria(id: string): Locator {
    return this.page.getByTestId(`category-${id}`);
  }

  botonDePagina(numero: number): Locator {
    return this.page.getByRole('button', { name: `Page-${numero}`, exact: true });
  }

  tarjeta(nombre: string): Locator {
    return this.page.getByRole('link').filter({ has: this.page.getByRole('heading', { name: nombre, exact: true }) });
  }

  /** Si la tarjeta no está en la página visible, la busca por nombre. */
  async mostrarTarjeta(nombre: string): Promise<Locator> {
    const tarjeta = this.tarjeta(nombre);
    if (!(await tarjeta.isVisible())) {
      await this.buscar(nombre);
      await tarjeta.waitFor();
    }
    return tarjeta;
  }

  async abrirProducto(nombre: string): Promise<void> {
    await (await this.mostrarTarjeta(nombre)).click();
  }

  async precioEnTarjeta(nombre: string): Promise<number> {
    const tarjeta = await this.mostrarTarjeta(nombre);
    return aCentavos(await tarjeta.getByTestId('product-price').innerText());
  }

  /** Los dos tiradores del filtro "Price Range"; su nombre accesible viene de `aria-label`. */
  get rangoMinimo(): Locator {
    return this.page.getByRole('slider', { name: 'ngx-slider', exact: true });
  }

  get rangoMaximo(): Locator {
    return this.page.getByRole('slider', { name: 'ngx-slider-max', exact: true });
  }

  /** Rango de precio aplicado, en centavos; `null` si la página no tiene ese control. */
  async leerRangoDePrecio(): Promise<RangoDePrecio | null> {
    if ((await this.rangoMinimo.count()) === 0 || (await this.rangoMaximo.count()) === 0) return null;
    const valor = async (tirador: Locator) => aCentavos((await tirador.getAttribute('aria-valuenow')) ?? '');
    return { minimo: await valor(this.rangoMinimo), maximo: await valor(this.rangoMaximo) };
  }

  async leerNombres(): Promise<string[]> {
    return (await this.nombres.allInnerTexts()).map((n) => n.trim());
  }

  async leerPrecios(): Promise<number[]> {
    return (await this.precios.allInnerTexts()).map(aCentavos);
  }
}
