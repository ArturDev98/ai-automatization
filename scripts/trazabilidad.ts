import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type Tipo = 'automatizado' | 'manual';
export type Estado = 'pasa' | 'falla' | 'bug-conocido' | 'inestable' | 'omitido';

export interface Criterio {
  id: string;
  texto: string;
}

export interface Caso {
  id: string;
  criterios: string[];
  titulo: string;
  tecnica: string;
  prioridad: string;
  tipo: Tipo;
}

export interface Ejecucion {
  req: string;
  tc: string;
  titulo: string;
  proyecto: string;
  estado: Estado;
  archivo: string;
}

export interface CasoEnMatriz extends Caso {
  estados: Record<string, Estado>;
}

export interface FilaMatriz {
  req: string;
  criterio: Criterio;
  casos: CasoEnMatriz[];
  cubierto: boolean;
}

export interface Trazabilidad {
  generado: string;
  filas: FilaMatriz[];
  problemas: string[];
}

// Columnas del plan: | ID | Criterios | Título | Técnica | Prioridad | Tipo |
export function leerCasos(planMd: string): Caso[] {
  const casos: Caso[] = [];
  for (const linea of planMd.split(/\r?\n/)) {
    const celdas = linea.split('|').map((c) => c.trim());
    if (!/^TC-\d+$/.test(celdas[1] ?? '')) continue;
    const [, id, criterios, titulo, tecnica, prioridad, tipo] = celdas;
    casos.push({
      id,
      criterios: criterios.split(',').map((c) => c.trim()).filter(Boolean),
      titulo,
      tecnica,
      prioridad,
      tipo: /manual/i.test(tipo ?? '') ? 'manual' : 'automatizado',
    });
  }
  return casos;
}

interface PwTest {
  projectName: string;
  expectedStatus: string;
  status: string;
}
interface PwSpec {
  title: string;
  tags?: string[];
  file: string;
  tests: PwTest[];
}
interface PwSuite {
  specs?: PwSpec[];
  suites?: PwSuite[];
}

function estadoDe(t: PwTest): Estado {
  if (t.status === 'skipped') return 'omitido';
  if (t.status === 'flaky') return 'inestable';
  if (t.status === 'unexpected') return 'falla';
  // "expected" con expectedStatus failed es un test.fail: un bug ya reportado.
  return t.expectedStatus === 'failed' ? 'bug-conocido' : 'pasa';
}

export function leerEjecuciones(reporte: { suites?: PwSuite[] }): Ejecucion[] {
  const salida: Ejecucion[] = [];
  const recorrer = (suite: PwSuite) => {
    for (const spec of suite.specs ?? []) {
      const marcas = [...(spec.tags ?? []), ...(spec.title.match(/@[\w-]+/g) ?? [])].map((t) => t.replace(/^@/, ''));
      const req = marcas.find((m) => /^REQ-\d+$/.test(m));
      const tc = marcas.find((m) => /^TC-\d+$/.test(m));
      if (!req || !tc) continue;
      for (const t of spec.tests) {
        salida.push({ req, tc, titulo: spec.title, proyecto: t.projectName, estado: estadoDe(t), archivo: spec.file });
      }
    }
    (suite.suites ?? []).forEach(recorrer);
  };
  (reporte.suites ?? []).forEach(recorrer);
  return salida;
}

const GRAVEDAD: Estado[] = ['falla', 'inestable', 'bug-conocido', 'pasa', 'omitido'];

export function construir(
  planes: { req: string; criterios: Criterio[]; casos: Caso[] }[],
  ejecuciones: Ejecucion[],
): Trazabilidad {
  const filas: FilaMatriz[] = [];
  const problemas: string[] = [];
  for (const { req, criterios, casos } of planes) {
    const conEstado: CasoEnMatriz[] = casos.map((caso) => {
      const estados: Record<string, Estado> = {};
      for (const e of ejecuciones) {
        if (e.req !== req || e.tc !== caso.id) continue;
        // Un caso con varias pruebas vale lo que su peor resultado.
        const previo = estados[e.proyecto];
        if (!previo || GRAVEDAD.indexOf(e.estado) < GRAVEDAD.indexOf(previo)) estados[e.proyecto] = e.estado;
      }
      if (caso.tipo === 'automatizado' && Object.keys(estados).length === 0) {
        problemas.push(`${req} ${caso.id}: planeado como automatizado pero no tiene prueba ejecutada`);
      }
      return { ...caso, estados };
    });
    for (const criterio of criterios) {
      const suyos = conEstado.filter((c) => c.criterios.includes(criterio.id));
      if (suyos.length === 0) problemas.push(`${req} ${criterio.id}: criterio sin ningún caso de prueba`);
      filas.push({ req, criterio, casos: suyos, cubierto: suyos.length > 0 });
    }
    const conocidos = new Set(criterios.map((c) => c.id));
    for (const caso of casos) {
      for (const c of caso.criterios) {
        if (!conocidos.has(c)) problemas.push(`${req} ${caso.id}: apunta a ${c}, que no existe en la extracción`);
      }
    }
    for (const e of ejecuciones) {
      if (e.req === req && !casos.some((c) => c.id === e.tc)) {
        problemas.push(`${req} ${e.tc}: hay una prueba (${e.archivo}) que no está en el plan`);
      }
    }
  }
  return { generado: new Date().toISOString(), filas, problemas: [...new Set(problemas)] };
}

const ICONO: Record<Estado, string> = {
  pasa: '✅',
  falla: '❌',
  'bug-conocido': '🐞',
  inestable: '⚠️',
  omitido: '⏭️',
};

export function aMarkdown(t: Trazabilidad): string {
  const lineas = [
    '# Matriz de trazabilidad',
    '',
    '_Generada por `npm run trazabilidad` a partir del plan y de los resultados de Playwright. No se edita a mano._',
    '',
    '✅ pasa · 🐞 falla por un bug ya reportado · ❌ falla · ⚠️ inestable · ✋ manual',
    '',
    '| Requisito | Criterio | Casos |',
    '|---|---|---|',
  ];
  for (const f of t.filas) {
    const casos = f.casos
      .map((c) => {
        if (c.tipo === 'manual') return `${c.id} ✋`;
        const marcas = Object.entries(c.estados).map(([p, e]) => `${ICONO[e]} ${p}`).join(' ');
        return `${c.id} ${marcas || '❔'}`;
      })
      .join('<br>');
    lineas.push(`| ${f.req} | **${f.criterio.id}** ${f.criterio.texto} | ${casos || '**sin cobertura**'} |`);
  }
  if (t.problemas.length) lineas.push('', '## Problemas', '', ...t.problemas.map((p) => `- ${p}`));
  return lineas.join('\n') + '\n';
}

function main() {
  const raiz = process.cwd();
  const dirArtefactos = join(raiz, 'artifacts');
  const planes = readdirSync(dirArtefactos)
    .filter((d) => /^REQ-\d+$/.test(d) && existsSync(join(dirArtefactos, d, '02-plan.md')))
    .sort()
    .map((req) => ({
      req,
      criterios: JSON.parse(readFileSync(join(dirArtefactos, req, '01-extraccion.json'), 'utf8')).criterios as Criterio[],
      casos: leerCasos(readFileSync(join(dirArtefactos, req, '02-plan.md'), 'utf8')),
    }));

  const dirResultados = join(raiz, 'results');
  const reportes = existsSync(dirResultados) ? readdirSync(dirResultados).filter((f) => /^results.*\.json$/.test(f)) : [];
  const ejecuciones = reportes.flatMap((f) => leerEjecuciones(JSON.parse(readFileSync(join(dirResultados, f), 'utf8'))));

  const t = construir(planes, ejecuciones);
  mkdirSync(dirResultados, { recursive: true });
  writeFileSync(join(dirResultados, 'trazabilidad.json'), JSON.stringify(t, null, 2));
  writeFileSync(join(raiz, 'docs', 'trazabilidad.md'), aMarkdown(t));

  const cubiertos = t.filas.filter((f) => f.cubierto).length;
  console.log(`Criterios cubiertos: ${cubiertos}/${t.filas.length} · Ejecuciones leídas: ${ejecuciones.length}`);
  if (t.problemas.length) {
    console.error(t.problemas.map((p) => `  - ${p}`).join('\n'));
    process.exit(1);
  }
}

if (require.main === module) main();
