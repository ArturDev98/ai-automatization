import type { Locator, Page } from '@playwright/test';
import { abrirLimpio, type Variante } from '../data/acceso';

export class LoginPage {
  readonly correo: Locator;
  readonly clave: Locator;
  readonly enviar: Locator;
  readonly errorCorreo: Locator;
  readonly errorClave: Locator;
  /** Mensaje general de credenciales rechazadas por la API. */
  readonly errorCredenciales: Locator;
  /** Peticiones `POST /users/login` vistas desde que se creó el objeto. */
  readonly envios: string[] = [];

  constructor(readonly page: Page, readonly variante: Variante = 'actual') {
    this.correo = page.getByTestId('email');
    this.clave = page.getByTestId('password');
    this.enviar = page.getByTestId('login-submit');
    this.errorCorreo = page.getByTestId('email-error');
    this.errorClave = page.getByTestId('password-error');
    this.errorCredenciales = page.getByTestId('login-error');
    page.on('request', (peticion) => {
      if (peticion.method() === 'POST' && peticion.url().includes('/users/login')) this.envios.push(peticion.url());
    });
  }

  async abrir(): Promise<void> {
    await abrirLimpio(this.page, this.variante, '/auth/login');
  }

  async intentar(email: string, password: string): Promise<void> {
    if (email) await this.correo.fill(email);
    if (password) await this.clave.fill(password);
    await this.enviar.click();
  }

  async entrar(email: string, password: string): Promise<void> {
    await this.abrir();
    await this.intentar(email, password);
  }
}
