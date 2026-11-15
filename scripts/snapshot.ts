import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export interface ElementoSnapshot {
  dataTest: string;
  tag: string;
  tipo: string | null;
  rol: string | null;
  texto: string;
  visible: boolean;
}

export interface Snapshot {
  url: string;
  titulo: string;
  encabezados: string[];
  elementos: ElementoSnapshot[];
}

export function limpiar(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim().slice(0, 80);
}

export async function tomarSnapshot(url: string): Promise<Snapshot> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    // Sin funciones con nombre aquí dentro: tsx les inyecta un helper que no existe en el navegador.
    const crudo = await page.evaluate(() => ({
      titulo: document.title,
      encabezados: Array.from(document.querySelectorAll('h1,h2,h3,h4')).map((h) => h.textContent ?? ''),
      elementos: Array.from(document.querySelectorAll<HTMLElement>('[data-test]')).map((el) => ({
        dataTest: el.getAttribute('data-test') ?? '',
        tag: el.tagName.toLowerCase(),
        tipo: el.getAttribute('type'),
        rol: el.getAttribute('role'),
        texto: el.getAttribute('aria-label') ?? el.getAttribute('placeholder') ?? el.textContent ?? '',
        visible: el.offsetParent !== null,
      })),
    }));
    return {
      url,
      titulo: crudo.titulo,
      encabezados: crudo.encabezados.map(limpiar),
      elementos: crudo.elementos.map((e) => ({ ...e, texto: limpiar(e.texto) })),
    };
  } finally {
    await browser.close();
  }
}

// Uso: tsx scripts/snapshot.ts <url> [archivo-salida.json]
async function main() {
  const [url, salida] = process.argv.slice(2);
  if (!url) {
    console.error('Uso: tsx scripts/snapshot.ts <url> [salida.json]');
    process.exit(1);
  }
  const json = JSON.stringify(await tomarSnapshot(url), null, 2);
  if (salida) {
    mkdirSync(dirname(salida), { recursive: true });
    writeFileSync(salida, json);
    console.log(`Snapshot guardado en ${salida}`);
  } else {
    console.log(json);
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
