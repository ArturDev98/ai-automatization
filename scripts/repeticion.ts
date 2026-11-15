import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type Actor ='orquestador' | 'persona' | 'extractor' | 'planner' | 'automator' | 'reporter';
export type Tipo =
  | 'inicio' | 'fin' | 'lee' | 'busca' | 'escribe' | 'edita' | 'snapshot' | 'api' | 'comando'
  | 'pruebas' | 'calidad' | 'trazabilidad' | 'puerta' | 'pausa' | 'decision' | 'pide' | 'devuelve'
  | 'detiene' | 'ci' | 'commit';

export const CONTROL: Tipo[] = ['puerta', 'pausa', 'decision', 'pide', 'devuelve', 'detiene'];

export interface Evento {
  t: number;
  actor: Actor;
  tipo: Tipo;
  ruta?: string;
  pasan?: number;
  fallan?: number;
  inestables?: number;
  cubiertos?: string;
  a?: Actor;
  resultado?: 'pasa' | 'no-pasa';
  nota?: { es: string; en: string };
}

export interface Repeticion {
  req: string;
  fecha: string;
  inicio: string;
  fin: string;
  actores: { clave: Actor; modelo: string | null }[];
  eventos: Evento[];
}

export interface Registro {
  principal: object[];
  subagentes: { meta: { agentType: string; toolUseId: string }; lineas: object[] }[];
}

interface Bloque { type: string; id?: string; name?: string; input?: Record<string, unknown>; tool_use_id?: string; content?: unknown; text?: string }
interface Linea { type?: string; timestamp?: string; cwd?: string; message?: { model?: string; content?: string | Bloque[] } }
// Evento con su hora absoluta, antes de pasarla a segundos desde el inicio.
type Crudo = Omit<Evento, 't'> & { ms: number };

const AGENTES: Actor[] = ['extractor', 'planner', 'automator', 'reporter'];
const HOST = /https?:\/\/(?:[\w-]+\.)*practicesoftwaretesting\.com(\/[^\s"'|;&)?#]*)?/;
// Mensajes del sistema que llegan como texto del usuario y no los escribió la persona.
const NO_PERSONA = /^\s*(Base directory|<task-notification|Another Claude session|<system-reminder|<local-command|<command-|\[Request interrupted)/;

export function nombreModelo(id: string): string {
  const m = id.match(/^claude-([a-z]+)-(\d+)-(\d+)/);
  return m ? `Claude ${m[1][0].toUpperCase()}${m[1].slice(1)} ${m[2]}.${m[3]}` : id;
}

const ms = (l: Linea) => Date.parse(l.timestamp ?? '');
const bloques = (l: Linea): Bloque[] => (Array.isArray(l.message?.content) ? l.message!.content : []);
const textoDe = (l: Linea): string | null => {
  const c = l.message?.content;
  if (l.type !== 'user') return null;
  if (typeof c === 'string') return c;
  const t = (c ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '');
  return t.length && !(c ?? []).some((b) => b.type === 'tool_result') ? t.join('\n') : null;
};
const contenido = (c: unknown): string =>
  typeof c === 'string' ? c : Array.isArray(c) ? c.map((b) => (typeof b === 'object' && b && 'text' in b ? String(b.text) : '')).join('\n') : '';

function normal(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\/([a-z])\//i, '$1:/').toLowerCase();
}

function relativa(ruta: unknown, raiz: string): string | undefined {
  if (typeof ruta !== 'string' || !ruta) return undefined;
  const base = normal(raiz).replace(/\/$/, '') + '/';
  const n = normal(ruta);
  if (!n.startsWith(base)) return undefined;
  return ruta.replace(/\\/g, '/').slice(ruta.replace(/\\/g, '/').length - (n.length - base.length));
}

function cifras(salida: string) {
  const suma = (k: string) => [...salida.matchAll(new RegExp(`(\\d+) ${k}\\b`, 'g'))].reduce((s, m) => s + Number(m[1]), 0);
  return { pasan: suma('passed'), fallan: suma('failed'), inestables: suma('flaky') };
}

// Un comando puede correr pruebas, trazabilidad y lint a la vez: sale un evento por cada uno.
function deComando(cmd: string, salida: string): Omit<Crudo, 'ms' | 'actor'>[] {
  const ev: Omit<Crudo, 'ms' | 'actor'>[] = [];
  if (/playwright test|npm (?:run )?(?:-s )?test(?::(?:ui|api|bugs|panel))?(?![\w:])/.test(cmd)) ev.push({ tipo: 'pruebas', ...cifras(salida) });
  if (/trazabilidad/.test(cmd)) {
    const c = salida.match(/Criterios cubiertos: (\d+\/\d+)/);
    ev.push({ tipo: 'trazabilidad', ...(c ? { cubiertos: c[1] } : {}) });
  }
  if (/eslint|npm run (-s )?lint|\btsc\b|typecheck/.test(cmd)) ev.push({ tipo: 'calidad' });
  if (ev.length) return ev;
  const url = cmd.match(HOST);
  if (/snapshot/.test(cmd)) return [{ tipo: 'snapshot', ...(url ? { ruta: url[1] ?? '/' } : {}) }];
  if (/\bcurl\b/.test(cmd) && url) return [{ tipo: 'api', ruta: url[1] ?? '/' }];
  return [{ tipo: 'comando' }];
}

const RUTA_DE: Record<string, Tipo> = { Read: 'lee', Glob: 'busca', Grep: 'busca', Write: 'escribe', Edit: 'edita' };

export function extraer(reg: Registro, req: string): Repeticion {
  const principal = reg.principal as Linea[];
  const iSkill = principal.findIndex((l) => bloques(l).some((b) => b.type === 'tool_use' && b.name === 'Skill' && b.input?.skill === 'qa-flow' && b.input?.args === req));
  if (iSkill < 0) throw new Error(`No hay una llamada a qa-flow con ${req} en la sesión`);
  const raiz = principal[iSkill].cwd ?? '';
  const desde = ms(principal[iSkill]);
  const usadas = new Set<string>();
  const lineas = principal.slice(iSkill).filter((l) => {
    if (Number.isNaN(ms(l))) return false;
    const ids = bloques(l).filter((b) => b.type === 'tool_use').map((b) => b.id ?? '');
    if (ids.length && ids.every((id) => usadas.has(id))) return false;
    ids.forEach((id) => usadas.add(id));
    return true;
  });

  const resultados = new Map<string, { texto: string; ms: number }>();
  for (const l of lineas) for (const b of bloques(l)) if (b.type === 'tool_result' && b.tool_use_id) resultados.set(b.tool_use_id, { texto: contenido(b.content), ms: ms(l) });

  // Agentes de la corrida: llamada Agent con el requisito en la descripción, unida a su registro.
  const actorDeId = new Map<string, Actor>();
  const crudos: Crudo[] = [];
  const modelos = new Map<Actor, string>();
  for (const l of lineas)
    for (const b of bloques(l)) {
      if (b.type !== 'tool_use' || b.name !== 'Agent' || !String(b.input?.description ?? '').includes(req)) continue;
      const sub = reg.subagentes.find((s) => s.meta.toolUseId === b.id);
      const actor = sub?.meta.agentType as Actor;
      if (!sub || !AGENTES.includes(actor)) continue;
      const id = resultados.get(b.id!)?.texto.match(/agentId: (\w+)/)?.[1];
      if (id) actorDeId.set(id, actor);
      agregarSubagente(sub.lineas as Linea[], actor, raiz, crudos, modelos);
    }

  // Orquestador y persona, sobre la sesión principal.
  const personas: number[] = [];
  const fines: { ms: number; actor: Actor }[] = [];
  const dirigidas: { ms: number; tipo: 'Agent' | 'SendMessage' | 'TaskStop' | 'AskUserQuestion'; a?: Actor }[] = [];
  const anclas: number[] = [];
  let primerCommit = Infinity;
  for (const l of lineas) {
    const t = ms(l);
    const txt = textoDe(l);
    if (txt !== null) {
      const de = txt.match(/<agent-message from="(\w+)">[\s\S]*\[Subagent hand-back\]/)?.[1];
      if (de && actorDeId.has(de)) {
        fines.push({ ms: t, actor: actorDeId.get(de)! });
        crudos.push({ ms: t, actor: actorDeId.get(de)!, tipo: 'fin' });
      } else if (!NO_PERSONA.test(txt)) personas.push(t);
      continue;
    }
    for (const b of bloques(l)) {
      if (b.type !== 'tool_use') continue;
      const inp = b.input ?? {};
      if (l.message?.model && !modelos.has('orquestador')) modelos.set('orquestador', l.message.model);
      if (b.name === 'Bash' || b.name === 'PowerShell') {
        const cmd = String(inp.command ?? '');
        if (/git commit/.test(cmd)) {
          primerCommit = Math.min(primerCommit, t);
          crudos.push({ ms: t, actor: 'orquestador', tipo: 'commit' });
        } else if (/\bgh run\b/.test(cmd)) {
          if (t > primerCommit) crudos.push({ ms: t, actor: 'orquestador', tipo: 'ci' });
        } else {
          const ev = deComando(cmd, resultados.get(b.id!)?.texto ?? '').filter((e) => ['pruebas', 'trazabilidad', 'calidad'].includes(e.tipo));
          ev.forEach((e) => crudos.push({ ms: t, actor: 'orquestador', ...e }));
          if (ev.length) anclas.push(t);
        }
      } else if (b.name === 'Write' || b.name === 'Edit') {
        const ruta = relativa(inp.file_path, raiz);
        if (ruta && (ruta.startsWith(`artifacts/${req}/`) || ruta.startsWith('tests/'))) crudos.push({ ms: t, actor: 'orquestador', tipo: RUTA_DE[b.name], ruta });
      } else if (b.name === 'AskUserQuestion') {
        crudos.push({ ms: t, actor: 'persona', tipo: 'pausa' });
        const r = resultados.get(b.id!);
        if (r) crudos.push({ ms: r.ms, actor: 'persona', tipo: 'decision' });
        dirigidas.push({ ms: t, tipo: 'AskUserQuestion' });
        anclas.push(t);
      } else if (b.name === 'SendMessage' || b.name === 'TaskStop') {
        const a = actorDeId.get(String(b.name === 'SendMessage' ? inp.to : inp.task_id));
        if (!a) continue;
        crudos.push({ ms: t, actor: 'orquestador', tipo: b.name === 'SendMessage' ? 'devuelve' : 'detiene', a });
        dirigidas.push({ ms: t, tipo: b.name, a });
        anclas.push(t);
      } else if (b.name === 'Agent' && String(inp.description ?? '').includes(req)) {
        dirigidas.push({ ms: t, tipo: 'Agent' });
        anclas.push(t);
      }
    }
  }

  // Puerta tras cada regreso: pasa salvo que se le devuelva el trabajo sin que la persona pidiera nada.
  for (const f of fines) {
    const ancla = anclas.filter((t) => t > f.ms).sort((a, b) => a - b)[0];
    if (ancla === undefined) continue;
    const sig = dirigidas.filter((d) => d.ms > f.ms).sort((a, b) => a.ms - b.ms)[0];
    const pidio = sig ? personas.some((p) => p > f.ms && p < sig.ms) : false;
    const noPasa = !!sig && sig.tipo === 'SendMessage' && sig.a === f.actor && !pidio;
    crudos.push({ ms: ancla, actor: 'orquestador', tipo: 'puerta', resultado: noPasa ? 'no-pasa' : 'pasa' });
  }

  // Pedido de la persona: su último mensaje antes de una devolución, sin un regreso en medio.
  for (const d of crudos.filter((c) => c.tipo === 'devuelve' || c.tipo === 'detiene')) {
    const p = personas.filter((x) => x < d.ms).at(-1);
    if (p === undefined || fines.some((f) => f.ms > p && f.ms < d.ms)) continue;
    if (crudos.some((c) => c.tipo === 'pide' && c.ms === p)) continue;
    crudos.push({ ms: p, actor: 'persona', tipo: 'pide' });
  }

  // Fin de la ventana: primer commit tras el último regreso o, si no hay, el último evento.
  const ultimo = Math.max(...fines.map((f) => f.ms), desde);
  const commit = crudos.filter((c) => c.tipo === 'commit' && c.ms > ultimo).map((c) => c.ms).sort((a, b) => a - b)[0];
  const hasta = commit ?? Math.max(...crudos.map((c) => c.ms), ultimo);

  const orden = crudos
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.ms >= desde && c.ms <= hasta)
    .sort((x, y) => x.c.ms - y.c.ms || x.i - y.i)
    .map(({ c }) => c);
  const cero = orden[0]?.ms ?? desde;
  const eventos: Evento[] = orden.map(({ ms: m, ...resto }) => ({ t: Math.round((m - cero) / 100) / 10, ...resto }));

  const vistos = [...new Set(orden.map((c) => c.actor))];
  const actores = (['orquestador', ...AGENTES, 'persona'] as Actor[])
    .filter((a) => a === 'orquestador' || vistos.includes(a))
    .map((clave) => ({ clave, modelo: modelos.has(clave) ? nombreModelo(modelos.get(clave)!) : null }));

  const inicio = new Date(cero).toISOString();
  return { req, fecha: inicio.slice(0, 10), inicio, fin: new Date(hasta).toISOString(), actores, eventos };
}

export interface Nota { hora: string; tipo: Tipo; es: string; en: string }

export function aplicarNotas(r: Repeticion, notas: Nota[]): Repeticion {
  const cero = Date.parse(r.inicio);
  const eventos = r.eventos.map((e) => ({ ...e }));
  for (const n of notas) {
    const objetivo = Date.parse(`${r.fecha}T${n.hora}.000Z`);
    const cerca = eventos
      .filter((e) => e.tipo === n.tipo && Math.abs(cero + e.t * 1000 - objetivo) <= 60_000)
      .sort((a, b) => Math.abs(cero + a.t * 1000 - objetivo) - Math.abs(cero + b.t * 1000 - objetivo))[0];
    if (!cerca) throw new Error(`La nota de las ${n.hora} (${n.tipo}) no cae sobre ningún evento`);
    cerca.nota = { es: n.es, en: n.en };
  }
  return { ...r, eventos };
}

// Red de seguridad sobre la lista blanca: si algo de esto aparece, no se escribe nada.
const PRIVADO: [string, RegExp][] = [
  ['ruta de Windows', /[A-Za-z]:(\\\\|\/)/],
  ['ruta de Git Bash', /\/[a-z]\/Users\//i],
  ['AppData', /AppData/i],
  ['correo', /[\w.+-]+@[\w-]+\.[a-z]{2,}/i],
  ['id de herramienta', /toolu_/],
  ['id de agente', /\ba[0-9a-f]{16}\b/],
];

export function revisarPrivacidad(json: string): void {
  for (const [nombre, patron] of PRIVADO) {
    const m = json.match(patron);
    if (m) throw new Error(`La repetición contiene un dato privado (${nombre}): ${m[0]}`);
  }
}

const leerJsonl = (ruta: string): object[] =>
  readFileSync(ruta, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .flatMap((l) => {
      try {
        return [JSON.parse(l)];
      } catch {
        return [];
      }
    });

export function leerRegistro(sesionJsonl: string): Registro {
  const dir = join(sesionJsonl.replace(/\.jsonl$/, ''), 'subagents');
  const subagentes = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.meta.json'))
        .map((f) => ({
          meta: JSON.parse(readFileSync(join(dir, f), 'utf8')),
          lineas: existsSync(join(dir, f.replace('.meta.json', '.jsonl'))) ? leerJsonl(join(dir, f.replace('.meta.json', '.jsonl'))) : [],
        }))
    : [];
  return { principal: leerJsonl(sesionJsonl), subagentes };
}

function main() {
  const [sesion, req] = process.argv.slice(2);
  if (!sesion || !/^REQ-\d+$/.test(req ?? '')) {
    console.error('Uso: npm run repeticion -- <sesion.jsonl> REQ-00X');
    process.exit(1);
  }
  const base = join(process.cwd(), 'site', 'repeticiones');
  const archivoNotas = join(base, `${req}.notas.json`);
  let r = extraer(leerRegistro(sesion), req);
  if (existsSync(archivoNotas)) r = aplicarNotas(r, JSON.parse(readFileSync(archivoNotas, 'utf8')));
  const json = JSON.stringify(r, null, 2) + '\n';
  try {
    revisarPrivacidad(json);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
  mkdirSync(base, { recursive: true });
  writeFileSync(join(base, `${req}.json`), json);
  const min = Math.round((Date.parse(r.fin) - Date.parse(r.inicio)) / 60_000);
  console.log(`Repetición: site/repeticiones/${req}.json (${r.eventos.length} eventos, ${min} min)`);
}

if (require.main === module) main();

function agregarSubagente(lineas: Linea[], actor: Actor, raiz: string, crudos: Crudo[], modelos: Map<Actor, string>) {
  const resultados = new Map<string, string>();
  for (const l of lineas) for (const b of bloques(l)) if (b.type === 'tool_result' && b.tool_use_id) resultados.set(b.tool_use_id, contenido(b.content));
  const primera = lineas.find((l) => l.timestamp);
  if (primera) crudos.push({ ms: ms(primera), actor, tipo: 'inicio' });
  // El registro guarda copias sin hora de cada llamada (api-request-blob): cuentan una vez.
  const vistas = new Set<string>();
  for (const l of lineas) {
    if (Number.isNaN(ms(l))) continue;
    if (l.message?.model && !modelos.has(actor)) modelos.set(actor, l.message.model);
    for (const b of bloques(l)) {
      if (b.type !== 'tool_use' || !b.name || vistas.has(b.id ?? '')) continue;
      vistas.add(b.id ?? '');
      const t = ms(l);
      const inp = b.input ?? {};
      if (RUTA_DE[b.name]) {
        const ruta = relativa(inp.file_path ?? inp.path, raiz);
        crudos.push({ ms: t, actor, tipo: RUTA_DE[b.name], ...(ruta ? { ruta } : {}) });
      } else if (b.name === 'Bash' || b.name === 'PowerShell') {
        deComando(String(inp.command ?? ''), resultados.get(b.id!) ?? '').forEach((e) => crudos.push({ ms: t, actor, ...e }));
      }
    }
  }
}
