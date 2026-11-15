import type { Locator, Page } from '@playwright/test';

/** Barra superior de Toolshop: enlace de acceso y menú del cliente con sesión. */
export class Menu {
  readonly iniciarSesion: Locator;
  /** Botón del menú del cliente; su texto es el nombre completo. */
  readonly menuCliente: Locator;
  readonly miCuenta: Locator;
  readonly cerrarSesion: Locator;

  constructor(readonly page: Page) {
    this.iniciarSesion = page.getByTestId('nav-sign-in');
    // La versión con bugs lo llama `nav-user-menu`.
    this.menuCliente = page.getByTestId('nav-menu').or(page.getByTestId('nav-user-menu'));
    this.miCuenta = page.getByTestId('nav-my-account');
    this.cerrarSesion = page.getByTestId('nav-sign-out');
  }

  async abrirInicioDeSesion(): Promise<void> {
    await this.iniciarSesion.click();
  }

  async salir(): Promise<void> {
    await this.menuCliente.click();
    await this.cerrarSesion.click();
  }
}
