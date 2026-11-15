import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { comprimir } from '../../scripts/panel-repeticion';
import { CONTROL, type Repeticion } from '../../scripts/repeticion';

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

  test('el favicon se publica junto a la página y carga', async ({ page }) => {
    await page.goto(PANEL);
    const href = await page.locator('link[rel="icon"]').getAttribute('href');
    const ancho = await page.evaluate(async (ruta) => {
      const img = new Image();
      img.src = ruta;
      await img.decode();
      return img.naturalWidth;
    }, href!);
    expect(ancho).toBeGreaterThan(0);
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
        // Instantáneo: con el scroll suave de la página, cada paso cortaría la animación del anterior.
        window.scrollTo({ top: y, behavior: 'instant' });
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

  test.describe('en el celular', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('la guía dice qué sección sigue y lleva a ella', async ({ page }) => {
      await page.goto(PANEL);
      const sigue = page.locator('#guia-sig');
      await expect(page.locator('.riel')).toBeHidden();
      await expect(sigue).toBeVisible();
      await expect(sigue).toContainText('Mapa');

      await sigue.click();

      await expect(sigue).toContainText('En acción');
      await expect(page.locator('#guia-paradas i.paso')).toHaveCount(2);
    });

    test('el botón flotante aparece al bajar y vuelve al inicio', async ({ page }) => {
      await page.goto(PANEL);
      const arriba = page.locator('#guia-arriba');
      await expect(arriba).toBeHidden();

      await page.locator('#incidencias').scrollIntoViewIfNeeded();
      await expect(arriba).toBeVisible();
      await arriba.click();

      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(80);
      await expect(arriba).toBeHidden();
    });

    test('al final de la página ya no anuncia otra sección', async ({ page }) => {
      await page.goto(PANEL);
      await page.locator('.pie').scrollIntoViewIfNeeded();
      await expect(page.locator('#guia-sig')).toBeHidden();
      await expect(page.locator('#guia-arriba')).toBeVisible();
    });
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

    test('la repetición se ve como lista estática', async ({ page }) => {
      await page.goto(PANEL);
      await expect(page.locator('#accion .accion-control li').first()).toBeVisible();
      await expect(page.locator('#accion .accion')).toBeHidden();
    });
  });

  test.describe('En acción', () => {
    const rep = JSON.parse(readFileSync(resolve('site/repeticiones/REQ-004.json'), 'utf8')) as Repeticion;
    const eventos = comprimir(rep.eventos);
    const textos = JSON.parse(readFileSync(resolve('site/textos.json'), 'utf8')) as Record<string, Record<string, string>>;
    const hhmm = (t: number) => new Date(Date.parse(rep.inicio) + t * 1000).toISOString().slice(11, 16);
    const barra = (page: Page) => page.locator('#accion-barra');

    test('lista los mismos momentos de control que el JSON', async ({ page }) => {
      await page.goto(PANEL);
      await expect(page.locator('#accion ol.accion-control li')).toHaveCount(rep.eventos.filter((e) => CONTROL.includes(e.tipo)).length);
    });

    test('la barra al final muestra la hora del último evento y deja la reproducción en pausa', async ({ page }) => {
      await page.goto(PANEL);
      await barra(page).fill('1000');
      await expect(page.locator('.accion-reloj time')).toHaveText(hhmm(rep.eventos.at(-1)!.t));
      await expect(page.locator('#accion-play')).toHaveAttribute('aria-pressed', 'false');
    });

    test('volver atrás con la barra no acumula contadores', async ({ page }) => {
      await page.goto(PANEL);
      await barra(page).fill('1000');
      await barra(page).fill('0');
      await expect(page.locator('[data-cifra="lecturas"]')).toHaveText('0');
      await expect(page.locator('.accion-bitacora li')).toHaveCount(1);
      await expect(page.locator('.accion-quien strong')).toHaveText('Extractor');
    });

    test('el botón de reproducir funciona con teclado', async ({ page }) => {
      await page.goto(PANEL);
      await barra(page).fill('0');
      const play = page.locator('#accion-play');
      await expect(play).toHaveAttribute('aria-pressed', 'false');
      await play.focus();
      await page.keyboard.press('Enter');
      await expect(play).toHaveAttribute('aria-pressed', 'true');
    });

    test('cambiar de idioma a mitad de la repetición repinta sin reiniciar', async ({ page }) => {
      await page.goto(PANEL);
      await barra(page).fill('500');
      const reloj = await page.locator('.accion-reloj time').textContent();
      const ultimo = eventos.filter((e) => e.v <= 0.5).at(-1)!;

      await page.locator('#idioma').click();

      await expect(page.locator('.accion-reloj time')).toHaveText(reloj!);
      await expect(page.locator('.accion-bitacora li').first()).toContainText(textos.en[`a.${ultimo.tipo}`]);
      await expect(barra(page)).toHaveValue('500');
    });

    test.describe('con movimiento reducido', () => {
      test.use({ reducedMotion: 'reduce' });

      test('se ve la versión estática y no hay controles', async ({ page }) => {
        await page.goto(PANEL);
        await expect(page.locator('#accion')).toHaveClass(/quieta/);
        await expect(page.locator('#accion .accion-control li').first()).toBeVisible();
        await expect(page.locator('#accion-play')).toBeHidden();
      });
    });

    test.describe('a 360 px', () => {
      test.use({ viewport: { width: 360, height: 800 } });

      test('no hay desplazamiento horizontal', async ({ page }) => {
        await page.goto(PANEL);
        await page.locator('#accion').scrollIntoViewIfNeeded();
        await expect(page.locator('#accion .accion')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      });
    });
  });
});
