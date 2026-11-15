import { CONTROL, type Actor, type Evento, type Repeticion } from './repeticion';

export interface EventoPanel extends Evento {
  v: number;
}

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Los huecos largos (esperas, CI) pesan como mucho `tope` segundos para que no se coman el minuto.
export function comprimir(eventos: Evento[], tope = 180): EventoPanel[] {
  let acumulado = 0;
  const pasos = eventos.map((e, i) => (acumulado += i ? Math.min(Math.max(e.t - eventos[i - 1].t, 0), tope) : 0));
  const total = acumulado || 1;
  return eventos.map((e, i) => ({ ...e, v: Math.round((pasos[i] / total) * 10000) / 10000 }));
}

const AGENTES: Actor[] = ['extractor', 'planner', 'automator', 'reporter'];
export const claveActor = (a: Actor) => (AGENTES.includes(a) ? `e.${a}` : `a.${a}`);
const LECTURAS = ['lee', 'busca'];
const COMANDOS = ['snapshot', 'api', 'comando', 'pruebas', 'calidad', 'trazabilidad'];
const ARCHIVOS = ['escribe', 'edita'];

const ICONO: Partial<Record<string, string>> = {
  'puerta-pasa': 'ok',
  'puerta-no-pasa': 'falla',
  pausa: 'manual',
  decision: 'manual',
  pide: 'pide',
  devuelve: 'volver',
  detiene: 'alto',
};

function controlHtml(e: Evento, i: number, inicio: number): string {
  const iso = new Date(inicio + e.t * 1000).toISOString();
  const icono = ICONO[e.tipo === 'puerta' ? `puerta-${e.resultado}` : e.tipo] ?? 'ok';
  const texto = e.nota
    ? `<span class="ctl-t" data-nota="${i}">${esc(e.nota.es)}</span>`
    : `<span class="ctl-t"><span data-i18n="a.${e.tipo}"></span>${e.a ? ` <span data-i18n="${claveActor(e.a)}"></span>` : ''}</span>`;
  return `<li class="ctl ${e.tipo}${e.resultado ? ' ' + e.resultado : ''}"><time datetime="${iso}">${iso.slice(11, 16)}</time><svg aria-hidden="true"><use href="#i-${icono}"/></svg><span class="ctl-cuerpo"><b data-i18n="${claveActor(e.actor)}"></b>${texto}</span></li>`;
}

function resumenHtml(r: Repeticion, inicio: number): string {
  const hhmm = (t: number) => new Date(inicio + t * 1000).toISOString().slice(11, 16);
  const filas = r.actores
    .filter((a) => a.clave !== 'persona')
    .map((a) => {
      const suyos = r.eventos.filter((e) => e.actor === a.clave);
      if (!suyos.length) return '';
      const cuenta = (tipos: string[]) => suyos.filter((e) => tipos.includes(e.tipo)).length;
      return `<tr><th scope="row" data-i18n="${claveActor(a.clave)}"></th><td>${esc(a.modelo ?? '')}</td><td><time>${hhmm(suyos[0].t)}</time>–<time>${hhmm(suyos.at(-1)!.t)}</time></td><td>${cuenta(LECTURAS)}</td><td>${cuenta(COMANDOS)}</td><td>${cuenta(ARCHIVOS)}</td></tr>`;
    })
    .join('');
  return `<div class="tabla-scroll"><table class="accion-resumen"><thead><tr><th scope="col" data-i18n="a.quien"></th><th scope="col" data-i18n="a.modelo"></th><th scope="col" data-i18n="a.tramo"></th><th scope="col" data-i18n="a.lecturas"></th><th scope="col" data-i18n="a.comandos"></th><th scope="col" data-i18n="a.archivos"></th></tr></thead><tbody>${filas}</tbody></table></div>`;
}

// Las cinco estaciones del mapa, en una sola línea; el tren lo mueve el script.
function viaHtml(): string {
  const x = [70, 285, 500, 715, 930];
  const claves = ['extractor', 'planner', 'revision', 'automator', 'reporter'];
  const estaciones = x
    .map((cx, i) => `<g class="a-est" data-etapa="${i}"><circle class="aro" cx="${cx}" cy="44" r="${i === 2 ? 11 : 15}"/><text class="rotulo" x="${cx}" y="100" text-anchor="middle" data-i18n="e.${claves[i]}"></text></g>`)
    .join('');
  return `<svg class="accion-via" viewBox="0 0 1000 116" aria-hidden="true"><path class="via l4" d="M70,44 H930"/>${estaciones}<g class="tren"><rect x="-26" y="30" width="52" height="28" rx="14"/><circle cx="-10" cy="44" r="4"/><circle cx="10" cy="44" r="4"/></g></svg>`;
}

export function repeticionHtml(r: Repeticion | null): string {
  if (!r) return '';
  const inicio = Date.parse(r.inicio);
  const minutos = Math.round((Date.parse(r.fin) - inicio) / 60_000);
  const control = r.eventos.map((e, i) => (CONTROL.includes(e.tipo) ? controlHtml(e, i, inicio) : '')).join('');
  const marcas = comprimir(r.eventos)
    .filter((e) => CONTROL.includes(e.tipo))
    .map((e) => `<i class="${e.tipo}${e.resultado ? ' ' + e.resultado : ''}" style="left:${(e.v * 100).toFixed(2)}%"></i>`)
    .join('');
  return `<section id="accion" aria-labelledby="t-accion">
    <h2 id="t-accion" data-i18n="t.accion"></h2>
    <p class="bajada" data-i18n="t.accionBajada"></p>
    <p class="accion-ficha"><code>${esc(r.req)}</code> <time datetime="${esc(r.inicio)}">${esc(r.fecha)}</time> <b>${minutos} min</b> <span data-i18n="a.escala"></span></p>
    <div class="accion" hidden>
      <div class="accion-cabeza">
        <p class="accion-reloj"><time></time><span>UTC</span></p>
        <div class="accion-ctrl">
          <button type="button" class="ctrl" id="accion-play" aria-pressed="false"><svg aria-hidden="true"><use href="#i-play"/></svg><span class="solo-lector" data-i18n="a.play"></span></button>
          <button type="button" class="ctrl" id="accion-reinicio"><svg aria-hidden="true"><use href="#i-reinicio"/></svg><span class="solo-lector" data-i18n="a.reinicio"></span></button>
        </div>
      </div>
      ${viaHtml()}
      <div class="accion-barra-caja">
        <input type="range" id="accion-barra" min="0" max="1000" step="1" value="0">
        <span class="accion-marcas" aria-hidden="true">${marcas}</span>
      </div>
      <div class="accion-letrero" aria-live="polite"></div>
      <div class="accion-tablero">
        <div class="letrero l4 accion-quien"><strong></strong><span></span></div>
        <div class="parada-info"><dl class="accion-cifras"></dl></div>
        <ol class="accion-bitacora"></ol>
      </div>
    </div>
    <div class="accion-estatico">
      <h3 data-i18n="a.momentos"></h3>
      <ol class="accion-control">${control}</ol>
      <h3 data-i18n="a.resumen"></h3>
      ${resumenHtml(r, inicio)}
    </div>
    <p class="nota"><span data-i18n="a.fuente"></span> <a href="{{REPO}}/blob/main/site/repeticiones/${esc(r.req)}.json" rel="noopener" data-i18n="a.json"></a></p>
  </section>`;
}
