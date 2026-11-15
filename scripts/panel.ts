import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { leerCasos, type Caso, type Estado, type Trazabilidad } from './trazabilidad';

type ClaveEtapa = 'extractor' | 'planner' | 'revision' | 'automator' | 'reporter';
type EstadoEtapa = 'hecho' | 'pendiente' | 'falla';

interface Etapa {
  clave: ClaveEtapa;
  estado: EstadoEtapa;
  firma: string;
  archivo: string | null;
  datos: [string, string][];
}

interface CasoPanel extends Caso {
  estados: Record<string, Estado>;
}

interface Linea {
  req: string;
  titulo: string;
  historia: string;
  etapas: Etapa[];
  criterios: { id: string; texto: string; casos: CasoPanel[] }[];
  casos: CasoPanel[];
}

interface Bug {
  id: string;
  titulo: string;
  archivo: string;
  campos: Record<string, string>;
}

const RAIZ = process.cwd();
const REPO = process.env.GITHUB_REPOSITORY ?? 'ArturDev98/ai-automatization';
const BLOB = `https://github.com/${REPO}/blob/main/`;
const ETAPAS: ClaveEtapa[] = ['extractor', 'planner', 'revision', 'automator', 'reporter'];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const leer = (ruta: string) => (existsSync(join(RAIZ, ruta)) ? readFileSync(join(RAIZ, ruta), 'utf8') : null);

// Cabecera de artefacto: "> Generado por: planner (Claude Fable 5.2) · 2026-11-14 · ..."
function firmaDe(md: string | null): string {
  const m = md?.match(/^>\s*(?:Generado por:\s*)?(.+?)\s*·\s*(\d{4}-\d{2}-\d{2})/m);
  return m ? `${m[1]}, ${m[2]}` : '';
}

function vinetas(md: string): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const m of md.matchAll(/^- \*\*(.+?):\*\*\s*(.+)$/gm)) campos[m[1].toLowerCase()] = m[2].trim();
  return campos;
}

export function leerLineas(traza: Trazabilidad | null, bugs: Bug[]): Linea[] {
  const dirReq = join(RAIZ, 'requirements');
  return readdirSync(dirReq)
    .filter((f) => /^REQ-\d+.*\.md$/.test(f))
    .sort()
    .map((archivoReq) => {
      const req = archivoReq.match(/^REQ-\d+/)![0];
      const reqMd = readFileSync(join(dirReq, archivoReq), 'utf8');
      const titulo = (reqMd.match(/^#\s*REQ-\d+\s*·\s*(.+)$/m)?.[1] ?? req).trim();
      const historia = [...reqMd.matchAll(/^\*\*(Como|quiero|para)\*\*\s*(.+)$/gm)].map((m) => `${m[1]} ${m[2]}`).join(' ');
      const dir = `artifacts/${req}`;

      const extJson = leer(`${dir}/01-extraccion.json`);
      const ext = extJson ? JSON.parse(extJson) : null;
      const planMd = leer(`${dir}/02-plan.md`);
      const revMd = leer(`${dir}/02-revision.md`);
      const ejeMd = leer(`${dir}/03-ejecucion.md`);
      const repMd = leer(`${dir}/04-reporte.md`);

      const filas = traza?.filas.filter((f) => f.req === req) ?? [];
      const estadosDe = (id: string) => filas.flatMap((f) => f.casos).find((c) => c.id === id)?.estados ?? {};
      const casos: CasoPanel[] = (planMd ? leerCasos(planMd) : []).map((c) => ({ ...c, estados: estadosDe(c.id) }));
      const criterios = ((ext?.criterios ?? []) as { id: string; texto: string }[])
        .filter((cr) => /^CA-\d+$/.test(cr.id))
        .map((cr) => ({
        ...cr,
        casos: casos.filter((c) => c.criterios.includes(cr.id)),
      }));

      // Solo cuentan ui y api: en ui-bugs los fallos son los bugs sembrados que se buscan.
      const propios = casos.flatMap((c) => Object.entries(c.estados).filter(([p]) => p !== 'ui-bugs').map(([, e]) => e));
      const cuenta = (e: Estado) => propios.filter((x) => x === e).length;
      const auto = casos.filter((c) => c.tipo === 'automatizado').length;
      const rev = revMd ? vinetas(revMd) : {};

      const etapas: Etapa[] = [
        {
          clave: 'extractor',
          estado: ext ? 'hecho' : 'pendiente',
          firma: ext ? `${ext.generadoPor}, ${ext.fecha}` : '',
          archivo: ext ? `${dir}/01-extraccion.json` : null,
          datos: ext
            ? [
                ['d.criterios', String(ext.criterios.length)],
                ['d.pantallas', String(ext.pantallas?.length ?? 0)],
                ['d.endpoints', String(ext.endpoints?.length ?? 0)],
                ['d.ambiguedades', String(ext.ambiguedades?.length ?? 0)],
              ]
            : [],
        },
        {
          clave: 'planner',
          estado: planMd ? 'hecho' : 'pendiente',
          firma: firmaDe(planMd),
          archivo: planMd ? `${dir}/02-plan.md` : null,
          datos: planMd
            ? [
                ['d.casos', String(casos.length)],
                ['d.automatizados', String(auto)],
                ['d.manuales', String(casos.length - auto)],
                ['d.prioridadAlta', String(casos.filter((c) => /alta/i.test(c.prioridad)).length)],
              ]
            : [],
        },
        {
          clave: 'revision',
          estado: revMd ? 'hecho' : 'pendiente',
          firma: revMd ? firmaDe(revMd).replace(/^Revisión humana, /, '') : '',
          archivo: revMd ? `${dir}/02-revision.md` : null,
          datos: revMd
            ? [
                ['d.reviso', rev['revisó'] ?? ''],
                ['d.decision', rev['decisión'] ?? ''],
                ['d.cambios', rev['cambios pedidos'] ?? ''],
              ]
            : [],
        },
        {
          clave: 'automator',
          estado: !ejeMd ? 'pendiente' : cuenta('falla') > 0 ? 'falla' : 'hecho',
          firma: firmaDe(ejeMd),
          archivo: ejeMd ? `${dir}/03-ejecucion.md` : null,
          datos: ejeMd
            ? [
                ['d.pruebas', String(propios.length)],
                ['d.pasan', String(cuenta('pasa'))],
                ['d.fallan', String(cuenta('falla'))],
                ['d.bugConocido', String(cuenta('bug-conocido'))],
              ]
            : [],
        },
        {
          clave: 'reporter',
          estado: repMd ? 'hecho' : 'pendiente',
          firma: firmaDe(repMd),
          archivo: repMd ? `${dir}/04-reporte.md` : null,
          datos: repMd
            ? [
                ['d.bugs', String(bugs.filter((b) => b.campos['requisito'] === req).length)],
                ['d.manualesPendientes', String(casos.length - auto)],
              ]
            : [],
        },
      ];
      return { req, titulo, historia, etapas, criterios, casos };
    });
}

export function leerBugs(): Bug[] {
  const dir = join(RAIZ, 'bugs');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /^BUG-\d+.*\.md$/.test(f))
    .sort()
    .map((f) => {
      const md = readFileSync(join(dir, f), 'utf8');
      const cab = md.match(/^#\s*(BUG-\d+)\s*·\s*(.+)$/m);
      return { id: cab?.[1] ?? f.slice(0, 7), titulo: cab?.[2].trim() ?? f, archivo: `bugs/${f}`, campos: vinetas(md) };
    });
}

// Geometría del mapa: las líneas se juntan en la cápsula de transbordo (revisión humana).
const MAX_LINEAS = 5;

function mapa(todas: Linea[], vertical: boolean): string {
  const lineas = todas.slice(0, MAX_LINEAS);
  const n = lineas.length;
  const largo = vertical ? [150, 270, 420, 560, 660] : [250, 440, 640, 850, 1050];
  const ancho = lineas.map((_, i) => (vertical ? 50 + 60 * i : 110 + 80 * i));
  const centro = (ancho[0] + ancho[n - 1]) / 2;
  const junto = lineas.map((_, i) => centro + (i - (n - 1) / 2) * 30);
  const piezas: string[] = [];

  lineas.forEach((l, i) => {
    const a = ancho[i];
    const j = junto[i];
    // El quiebre avanza lo mismo que se desvía, para que quede a 45 grados.
    const d = Math.abs(a - j);
    const camino = vertical
      ? `M${a},84 V${370 - d} L${j},370 V470 L${a},${470 + d} V690`
      : `M128,${a} H${590 - d} L590,${j} H690 L${690 + d},${a} H1150`;
    piezas.push(`<path class="via l${i + 1}" pathLength="1" d="${camino}"/>`);
    piezas.push(
      vertical
        ? `<rect class="tope l${i + 1}" x="${a - 12}" y="686" width="24" height="8" rx="2"/>`
        : `<rect class="tope l${i + 1}" x="1146" y="${a - 12}" width="8" height="24" rx="2"/>`,
    );
    const num = l.req.replace('REQ-', '');
    piezas.push(
      vertical
        ? `<rect class="placa l${i + 1}" x="${a - 24}" y="44" width="48" height="28" rx="6"/><text class="placa-t" x="${a}" y="63" text-anchor="middle">${num}</text>`
        : `<rect class="placa l${i + 1}" x="8" y="${a - 16}" width="112" height="32" rx="6"/><text class="placa-t" x="64" y="${a + 6}" text-anchor="middle">${l.req}</text>`,
    );
  });

  const tramo = (n - 1) * 30 + 36;
  piezas.push(
    vertical
      ? `<rect class="transbordo" x="${junto[0] - 18}" y="402" width="${tramo}" height="36" rx="18"/>`
      : `<rect class="transbordo" x="622" y="${junto[0] - 18}" width="36" height="${tramo}" rx="18"/>`,
  );

  const rotuloX = ancho[n - 1] + 35;
  ETAPAS.forEach((clave, e) => {
    const p = largo[e];
    piezas.push(
      vertical
        ? `<text class="rotulo" x="${rotuloX}" y="${p - 2}" data-i18n="e.${clave}"></text><text class="rotulo-2" x="${rotuloX}" y="${p + 17}" data-i18n="m.${clave}"></text>`
        : `<text class="rotulo" x="${p}" y="38" text-anchor="middle" data-i18n="e.${clave}"></text><text class="rotulo-2" x="${p}" y="58" text-anchor="middle" data-i18n="m.${clave}"></text>`,
    );
    lineas.forEach((l, i) => {
      const lado = clave === 'revision' ? junto[i] : ancho[i];
      const [x, y] = vertical ? [lado, p] : [p, lado];
      const etapa = l.etapas[e];
      const r = clave === 'revision' ? 9 : 13;
      const k = r / 13;
      const marca =
        etapa.estado === 'hecho'
          ? `<path class="marca" d="M${x - 6 * k},${y + 0.5 * k} l${4 * k},${4 * k} l${7 * k},-${8 * k}"/>`
          : etapa.estado === 'falla'
            ? `<path class="marca" d="M${x - 5 * k},${y - 5 * k} l${10 * k},${10 * k} M${x + 5 * k},${y - 5 * k} l-${10 * k},${10 * k}"/>`
            : '';
      piezas.push(
        `<g class="est ${etapa.estado} l${i + 1}" role="button" tabindex="0" data-linea="${i}" data-etapa="${e}" aria-label="${l.req}">` +
          `<circle class="halo" cx="${x}" cy="${y}" r="${r + 8}"/><circle class="aro" cx="${x}" cy="${y}" r="${r}"/>${marca}` +
          `<circle class="toque" cx="${x}" cy="${y}" r="${clave === 'revision' ? 15 : 24}"/></g>`,
      );
    });
  });

  const caja = vertical ? `0 0 ${rotuloX + 155} 720` : `0 0 1200 ${ancho[n - 1] + 60}`;
  return `<svg class="mapa-svg ${vertical ? 'v' : 'h'}" viewBox="${caja}" role="group" aria-labelledby="mapa-titulo">${piezas.join('')}</svg>`;
}

const ICONO: Record<string, string> = { pasa: 'ok', falla: 'falla', 'bug-conocido': 'bug', inestable: 'inestable', omitido: 'omitido' };

function casoHtml(c: CasoPanel): string {
  const estados =
    c.tipo === 'manual'
      ? `<span class="est-chip manual"><svg aria-hidden="true"><use href="#i-manual"/></svg><span data-i18n="s.manual"></span></span>`
      : Object.entries(c.estados)
          .map(([p, e]) => `<span class="est-chip ${ICONO[e]}"><svg aria-hidden="true"><use href="#i-${ICONO[e]}"/></svg><span data-i18n="s.${e}"></span> <i>${esc(p)}</i></span>`)
          .join('') || `<span class="est-chip pendiente"><svg aria-hidden="true"><use href="#i-pendiente"/></svg><span data-i18n="s.pendiente"></span></span>`;
  return `<li><code>${c.id}</code><span class="caso-t">${esc(c.titulo)}<small>${esc(c.tecnica)} / ${esc(c.prioridad)}</small></span><span class="caso-e">${estados}</span></li>`;
}

function lineaHtml(l: Linea, i: number): string {
  const auto = l.casos.filter((c) => c.tipo === 'automatizado').length;
  const criterios = l.criterios
    .map((cr) => `<div class="criterio"><p><b>${esc(cr.id)}</b> ${esc(cr.texto)}</p><ul class="casos">${cr.casos.map(casoHtml).join('')}</ul></div>`)
    .join('');
  return `<article class="linea l${(i % MAX_LINEAS) + 1}" id="${l.req}">
  <header><span class="placa-h">${l.req}</span><h3>${esc(l.titulo)}</h3></header>
  <p class="historia">${esc(l.historia)}</p>
  <details${i === 0 ? ' open' : ''}><summary><span data-i18n="l.ver"></span> <span class="cuenta">${l.criterios.length} <span data-i18n="l.criterios"></span>, ${l.casos.length} <span data-i18n="l.casos"></span>, ${auto} <span data-i18n="l.auto"></span></span></summary>${criterios || `<p class="vacio" data-i18n="l.sinPlan"></p>`}</details>
</article>`;
}

function resumenCorrida(traza: Trazabilidad | null): string {
  if (!traza) return `<p class="vacio" data-i18n="c.sinCorrida"></p>`;
  const porProyecto: Record<string, Record<string, number>> = {};
  const vistos = new Set<string>();
  for (const f of traza.filas) {
    for (const c of f.casos) {
      if (vistos.has(`${f.req}/${c.id}`)) continue;
      vistos.add(`${f.req}/${c.id}`);
      for (const [p, e] of Object.entries(c.estados)) {
        porProyecto[p] ??= {};
        porProyecto[p][e] = (porProyecto[p][e] ?? 0) + 1;
      }
    }
  }
  const proyectos = Object.keys(porProyecto).sort();
  if (!proyectos.length) return `<p class="vacio" data-i18n="c.sinCorrida"></p>`;
  const celda = (p: string, e: string) => `<td>${porProyecto[p][e] ?? 0}</td>`;
  const filas = proyectos
    .map((p) => `<tr><th scope="row"><code>${esc(p)}</code><small data-i18n="p.${esc(p)}"></small></th>${celda(p, 'pasa')}${celda(p, 'bug-conocido')}${celda(p, 'falla')}${celda(p, 'inestable')}</tr>`)
    .join('');
  return `<div class="tabla-scroll"><table class="corrida"><thead><tr><th scope="col" data-i18n="c.proyecto"></th><th scope="col" data-i18n="s.pasa"></th><th scope="col" data-i18n="s.bug-conocido"></th><th scope="col" data-i18n="s.falla"></th><th scope="col" data-i18n="s.inestable"></th></tr></thead><tbody>${filas}</tbody></table></div>
  <p class="nota"><span data-i18n="c.generado"></span> <time datetime="${esc(traza.generado)}">${esc(traza.generado.slice(0, 16).replace('T', ' '))} UTC</time>.</p>`;
}

function bugsHtml(bugs: Bug[]): string {
  if (!bugs.length) return `<p class="vacio" data-i18n="b.vacio"></p>`;
  return `<ul class="avisos">${bugs
    .map(
      (b) => `<li><a href="${esc(BLOB + encodeURI(b.archivo))}"><code>${esc(b.id)}</code><span class="aviso-t">${esc(b.titulo)}</span>
      <span class="aviso-m">${esc(b.campos['requisito'] ?? '')} / ${esc(b.campos['casos'] ?? '')} / <span data-i18n="b.severidad"></span> ${esc(b.campos['severidad'] ?? '')}</span></a></li>`,
    )
    .join('')}</ul>`;
}

function main() {
  const trazaJson = leer('results/trazabilidad.json');
  const traza: Trazabilidad | null = trazaJson ? JSON.parse(trazaJson) : null;
  const bugs = leerBugs();
  const lineas = leerLineas(traza, bugs);
  const salida = join(RAIZ, 'site', 'dist');
  mkdirSync(salida, { recursive: true });

  // Los reportes de Playwright no se publican: sus trazas guardan claves de clientes de prueba.
  const enlaces = `<a class="boton sec" href="https://github.com/${REPO}/actions/workflows/qa.yml" rel="noopener" data-i18n="c.corridas"></a>`;

  const datos = {
    blob: BLOB,
    lineas: lineas.slice(0, MAX_LINEAS).map((l) => ({ req: l.req, titulo: l.titulo, etapas: l.etapas })),
  };

  const html = readFileSync(join(RAIZ, 'site', 'panel.html'), 'utf8')
    .replace('/*CSS*/', () => readFileSync(join(RAIZ, 'site', 'panel.css'), 'utf8'))
    .replace('/*JS*/', () => readFileSync(join(RAIZ, 'site', 'panel.js'), 'utf8'))
    .replace('<!--MAPA-->', () => mapa(lineas, false) + mapa(lineas, true))
    .replace('<!--LINEAS-->', () => lineas.map(lineaHtml).join('\n'))
    .replace('<!--BUGS-->', () => bugsHtml(bugs))
    .replace('<!--CORRIDA-->', () => resumenCorrida(traza))
    .replace('<!--REPORTES-->', () => enlaces)
    .replaceAll('{{REPO}}', `https://github.com/${REPO}`)
    .replace('"__DATOS__"', () => JSON.stringify(datos).replace(/</g, '\\u003c'));

  // CSP con el hash de cada script en línea: nada más puede ejecutarse en la página.
  const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
  const csp = [
    "default-src 'none'",
    `script-src ${hashes.join(' ')}`,
    "style-src 'unsafe-inline' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    "img-src 'self' data:",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
  writeFileSync(join(salida, 'index.html'), html.replace('<!--CSP-->', `<meta http-equiv="Content-Security-Policy" content="${csp}">`));
  console.log(`Panel generado: site/dist/index.html (${lineas.length} líneas, ${bugs.length} bugs)`);
}

if (require.main === module) main();
