import { chromium } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { comprimir } from './panel-repeticion';
import { leerRepeticion } from './panel';

const SALIDA = 'docs/repeticion.gif';
const FPS = 12;
const RECORRIDO = 10; // segundos de avance sin contar las paradas
const PARADA = 12; // cuadros quietos en cada momento con nota
const ANCHO = 900;
const MAXIMO = 2 * 1024 * 1024;

function ffmpeg(args: string[]) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`ffmpeg terminó con código ${r.status}`);
}

// Cada cuadro es una posición de la barra; en los momentos con nota se repite para que se lea.
export function cuadros(v: number[], fps = FPS, recorrido = RECORRIDO, parada = PARADA): number[] {
  const total = fps * recorrido;
  const paradas = [...new Set(v)].sort((a, b) => a - b);
  const salida: number[] = [];
  for (let i = 0; i <= total; i++) {
    const actual = i / total;
    const previo = (i - 1) / total;
    for (const p of paradas) if (p > previo && p <= actual) for (let k = 0; k < parada; k++) salida.push(p);
    salida.push(actual);
  }
  return salida;
}

async function main() {
  if (spawnSync('ffmpeg', ['-version']).status !== 0) {
    console.error('Falta ffmpeg en el PATH (en Windows: winget install Gyan.FFmpeg)');
    process.exit(1);
  }
  const panel = resolve('site/dist/index.html');
  const rep = leerRepeticion();
  if (!existsSync(panel) || !rep) {
    console.error('Antes hacen falta la repetición y el panel: npm run panel');
    process.exit(1);
  }
  const conNota = comprimir(rep.eventos).filter((e) => e.nota).map((e) => e.v);
  const posiciones = cuadros(conNota);

  const dir = mkdtempSync(join(tmpdir(), 'repeticion-'));
  const navegador = await chromium.launch();
  try {
    const pagina = await navegador.newPage({ viewport: { width: 1200, height: 1000 }, locale: 'es-CO', colorScheme: 'light' });
    await pagina.goto(pathToFileURL(panel).href);
    await pagina.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
    const escena = pagina.locator('#accion .accion');
    await escena.scrollIntoViewIfNeeded();
    await pagina.evaluate(() => document.querySelectorAll('.revelar').forEach((e) => e.classList.add('visto')));
    // ffmpeg necesita cuadros del mismo tamaño: el recorte es fijo, con margen por si el texto se parte.
    const caja = (await escena.boundingBox())!;
    const clip = { x: Math.floor(caja.x) - 2, y: Math.floor(caja.y) - 2, width: Math.ceil(caja.width) + 4, height: Math.ceil(caja.height) + 40 };
    for (const [i, v] of posiciones.entries()) {
      // Se mueve la barra sin darle el foco, para que el anillo no salga en el GIF.
      await pagina.evaluate((valor) => {
        const barra = document.querySelector<HTMLInputElement>('#accion-barra')!;
        barra.value = String(valor);
        barra.dispatchEvent(new Event('input'));
      }, Math.round(v * 1000));
      await pagina.screenshot({ path: join(dir, `f${String(i).padStart(4, '0')}.png`), clip });
    }
  } finally {
    await navegador.close();
  }

  const entrada = ['-framerate', String(FPS), '-i', join(dir, 'f%04d.png')];
  const escala = `fps=${FPS},scale=${ANCHO}:-1:flags=lanczos`;
  ffmpeg([...entrada, '-vf', `${escala},palettegen=stats_mode=diff`, join(dir, 'paleta.png')]);
  ffmpeg([...entrada, '-i', join(dir, 'paleta.png'), '-lavfi', `${escala}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`, SALIDA]);
  rmSync(dir, { recursive: true, force: true });

  const peso = statSync(SALIDA).size;
  const segundos = (posiciones.length / FPS).toFixed(1);
  console.log(`GIF: ${SALIDA} (${(peso / 1024 / 1024).toFixed(2)} MB, ${segundos} s, ${posiciones.length} cuadros)`);
  if (peso >= MAXIMO) {
    console.error('El GIF pesa 2 MB o más: baja ANCHO, FPS o PARADA');
    process.exit(1);
  }
}

if (require.main === module) void main();
