import type { Locator, Page } from '@playwright/test';
import { abrirLimpio, type Variante } from '../data/acceso';

export class AccountPage {
  /** Encabezado "My account"; solo existe con sesión. */
  readonly titulo: Locator;

  constructor(readonly page: Page, readonly variante: Variante = 'actual') {
    this.titulo = page.getByTestId('page-title').filter({ hasText: 'My account' });
  }

  async abrir(): Promise<void> {
    await abrirLimpio(this.page, this.variante, '/account');
  }
}
