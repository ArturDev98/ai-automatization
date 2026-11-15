import type { Locator, Page } from '@playwright/test';
import type { Cliente } from '../data/clientes';
import { NUMERO_DE_CASA, abrirLimpio, type Variante } from '../data/acceso';

export type CampoOmitible = 'email' | 'password';

export class RegisterPage {
  readonly correo: Locator;
  readonly clave: Locator;
  readonly enviar: Locator;
  readonly errorCorreo: Locator;
  readonly errorClave: Locator;
  /** Cualquier mensaje de error de campo del formulario. */
  readonly erroresDeCampo: Locator;
  /** Peticiones `POST /users/register` vistas desde que se creó el objeto. */
  readonly envios: string[] = [];

  constructor(readonly page: Page, readonly variante: Variante = 'actual') {
    this.correo = page.getByTestId('email');
    this.clave = page.getByTestId('password');
    this.enviar = page.getByTestId('register-submit');
    this.errorCorreo = page.getByTestId('email-error');
    this.errorClave = page.getByTestId('password-error');
    this.erroresDeCampo = page.locator('[data-test$="-error"]');
    page.on('request', (peticion) => {
      if (peticion.method() === 'POST' && peticion.url().includes('/users/register')) this.envios.push(peticion.url());
    });
  }

  async abrir(): Promise<void> {
    await abrirLimpio(this.page, this.variante, '/auth/register');
  }

  /** Llena todos los campos marcados con `*`, salvo los indicados en `sin`. */
  async llenar(cliente: Cliente, sin: CampoOmitible[] = []): Promise<void> {
    const t = (id: string) => this.page.getByTestId(id);
    const { address } = cliente;
    await t('first-name').fill(cliente.first_name);
    await t('last-name').fill(cliente.last_name);
    await t('dob').fill(cliente.dob);
    await this.elegirPais(address.country);
    if (this.variante === 'bugs') {
      await t('address').fill(address.street);
      await t('postcode').fill(address.postal_code);
    } else {
      // Código postal y número primero: el autocompletado de dirección podría pisar calle y ciudad.
      await t('postal_code').fill(address.postal_code);
      await t('house_number').fill(NUMERO_DE_CASA);
      await t('street').fill(address.street);
    }
    await t('city').fill(address.city);
    await t('state').fill(address.state);
    await t('phone').fill(cliente.phone);
    if (!sin.includes('email')) await this.correo.fill(cliente.email);
    if (!sin.includes('password')) await this.clave.fill(cliente.password);
  }

  // Por teclado: en la variante de bugs el control solo toma eventos de confianza y `selectOption` no lo actualiza.
  private async elegirPais(codigo: string): Promise<void> {
    const pais = this.page.getByTestId('country');
    const etiqueta = (await pais.locator(`option[value="${codigo}"]`).textContent())?.trim() ?? codigo;
    await pais.focus();
    await this.page.keyboard.type(etiqueta);
  }

  async registrar(cliente: Cliente, sin: CampoOmitible[] = []): Promise<void> {
    await this.abrir();
    await this.llenar(cliente, sin);
    await this.enviar.click();
  }
}
