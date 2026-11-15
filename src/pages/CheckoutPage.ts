import type { Locator, Page } from '@playwright/test';
import { DATOS_DE_PAGO, NUMERO_DE_CASA } from '../data/compra';

/** Pasos 2 a 4 de `/checkout`: sesión, dirección y pago. */
export class CheckoutPage {
  readonly saludoConSesion: Locator;
  readonly correoDeLogin: Locator;
  readonly avanzarSesion: Locator;
  readonly numeroDeCasa: Locator;
  readonly avanzarDireccion: Locator;
  readonly metodoDePago: Locator;
  readonly finalizar: Locator;
  readonly pagoExitoso: Locator;
  readonly confirmacion: Locator;

  constructor(readonly page: Page) {
    this.saludoConSesion = page.getByText(/you are already logged in/i);
    this.correoDeLogin = page.getByTestId('email');
    this.avanzarSesion = page.getByTestId('proceed-2');
    this.numeroDeCasa = page.getByTestId('house_number');
    this.avanzarDireccion = page.getByTestId('proceed-3');
    this.metodoDePago = page.getByTestId('payment-method');
    this.finalizar = page.getByTestId('finish');
    // Por texto: la versión con bugs no pone data-test al mensaje.
    this.pagoExitoso = page.getByText('Payment was successful').first();
    this.confirmacion = page.getByText(/your invoice number is/i);
  }

  /** Solo completa el número de casa si la pantalla lo pide y vino vacío. */
  async confirmarDireccion(): Promise<void> {
    await this.avanzarDireccion.waitFor();
    if ((await this.numeroDeCasa.isVisible()) && !(await this.numeroDeCasa.inputValue())) {
      await this.numeroDeCasa.fill(NUMERO_DE_CASA);
    }
    await this.avanzarDireccion.click();
  }

  /** Elige el método y llena solo los campos de pago que la pantalla muestre. */
  async elegirPago(metodo: string): Promise<void> {
    await this.metodoDePago.selectOption({ label: metodo });
    await this.finalizar.waitFor();
    for (const [campo, valor] of Object.entries(DATOS_DE_PAGO)) {
      const entrada = this.page.getByTestId(campo);
      if (await entrada.isVisible()) await entrada.fill(valor);
    }
  }
}
