// Rehace site/og.png desde site/og.html a 2x (2400×1254), la imagen que LinkedIn muestra del panel.
// Al cambiarla, sube el ?v= de og:image en site/panel.html: LinkedIn la guarda en caché por URL.
import { chromium } from '@playwright/test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SITE = join(__dirname, '..', 'site');

async function main() {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1200, height: 627 }, deviceScaleFactor: 2 });
  await pagina.goto(pathToFileURL(join(SITE, 'og.html')).href, { waitUntil: 'networkidle' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.locator('.og').screenshot({ path: join(SITE, 'og.png') });
  await navegador.close();
  console.log('site/og.png listo');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
