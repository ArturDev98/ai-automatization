import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Se prueba el archivo generado tal cual se publica; antes hay que correr `npm run panel`.
const PANEL = pathToFileURL(resolve('site/dist/index.html')).href;

test.describe('Panel generado', () => {
  // El panel arranca en el idioma del navegador; las pruebas parten del español.
  test.use({ locale: 'es-CO' });

  test('carga sin errores de consola con la política de contenido activa', async ({ page }) => {
    const errores: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errores.push(m.text());
    });
    page.on('pageerror', (e) => errores.push(e.message));

    await page.goto(PANEL);

    await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('requisito');
    // El letrero solo existe si el script corrió: es la señal de que la CSP no lo bloqueó.
    await expect(page.locator('#parada .letrero')).toBeVisible();
    expect(errores).toEqual([]);
  });

  test('elegir una estación muestra su parada', async ({ page }) => {
    await page.goto(PANEL);

    await page.locator('.mapa-svg.h .est[data-linea="1"][data-etapa="1"]').click();

    await expect(page.locator('#parada .letrero code')).toHaveText('REQ-002');
    await expect(page.locator('#parada .letrero strong')).toHaveText('Planner');
    await expect(page.locator('#parada a')).toHaveAttribute('href', /artifacts\/REQ-002\/02-plan\.md$/);
  });

  test('el selector cambia los textos a inglés y lo recuerda', async ({ page }) => {
    await page.goto(PANEL);

    await page.locator('#idioma').click();

    await expect(page.getByRole('heading', { level: 1 })).toContainText('requirement');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('requirement');
  });

  test('el contenido de abajo aparece al hacer scroll', async ({ page }) => {
    await page.goto(PANEL);
    const ocultos = page.locator('.revelar:not(.visto)');
    expect(await ocultos.count()).toBeGreaterThan(0);

    await page.evaluate(async () => {
      for (let y = 0; y <= document.body.scrollHeight; y += 300) {
        window.scrollTo(0, y);
        await new Promise((listo) => requestAnimationFrame(() => requestAnimationFrame(listo)));
      }
    });

    await expect(ocultos).toHaveCount(0);
  });

  test('el riel lateral marca la sección en la que estás', async ({ page }) => {
    await page.goto(PANEL);
    const actual = page.locator('.riel a[aria-current]');
    await expect(actual).toHaveText('Inicio');

    await page.locator('#servicio').scrollIntoViewIfNeeded();
    await page.locator('.riel a[href="#incidencias"]').click();
    await expect(actual).toHaveText('Incidencias');
    await expect(actual).toHaveCount(1);
  });

  test('el botón del final vuelve al inicio', async ({ page }) => {
    await page.goto(PANEL);
    const arriba = page.locator('.boton.arriba');
    await arriba.scrollIntoViewIfNeeded();

    await arriba.click();

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(80);
    await expect(page.locator('.riel a[aria-current]')).toHaveText('Inicio');
  });

  test.describe('con movimiento reducido', () => {
    test.use({ reducedMotion: 'reduce' });

    test('no se oculta nada', async ({ page }) => {
      await page.goto(PANEL);
      await expect(page.locator('#parada .letrero')).toBeVisible();
      await expect(page.locator('.revelar')).toHaveCount(0);
    });
  });

  test.describe('sin JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('la página se lee en español', async ({ page }) => {
      await page.goto(PANEL);
      await expect(page.getByRole('heading', { level: 1 })).toContainText('requisito');
      await expect(page.getByRole('heading', { name: 'Qué pasa en cada estación' })).toBeVisible();
      await expect(page.locator('.linea').first()).toBeVisible();
    });
  });
});
