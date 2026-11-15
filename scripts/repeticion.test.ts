import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aplicarNotas, extraer, nombreModelo, revisarPrivacidad, type Registro, type Repeticion } from './repeticion';

const RAIZ = 'C:\\Users\\alguien\\repo';
const hora = (h: string) => `2026-01-01T${h}.000Z`;
const linea = (h: string, type: string, content: unknown, model?: string) => ({
  type,
  timestamp: hora(h),
  cwd: RAIZ,
  message: { ...(model ? { model } : {}), content },
});
const uso = (h: string, name: string, input: object, id = `u-${h}`, model = 'claude-opus-5-5') =>
  linea(h, 'assistant', [{ type: 'tool_use', id, name, input }], model);
const salida = (h: string, id: string, texto: string) => linea(h, 'user', [{ type: 'tool_result', tool_use_id: id, content: texto }]);
const dice = (h: string, texto: string) => linea(h, 'user', texto);
const regreso = (h: string, agente: string) =>
  dice(h, `Another Claude session sent a message:\n<agent-message from="${agente}">\n[Subagent hand-back] informe`);

// Corrida mínima: el extractor lee, vuelca una pantalla, escribe y regresa.
function registro(): Registro {
  return {
    principal: [
      uso('10:00:00', 'Skill', { skill: 'qa-flow', args: 'REQ-009' }),
      uso('10:00:10', 'Agent', { subagent_type: 'extractor', description: 'Extracción de REQ-009' }, 'tu-ext'),
      salida('10:00:11', 'tu-ext', 'Async agent launched successfully.\nagentId: aaa111 (internal ID)'),
      regreso('10:02:00', 'aaa111'),
    ],
    subagentes: [
      {
        meta: { agentType: 'extractor', toolUseId: 'tu-ext' },
        lineas: [
          dice('10:00:11', 'Etapa 1'),
          uso('10:00:20', 'Read', { file_path: `${RAIZ}\\requirements\\REQ-009.md` }, 'e1', 'claude-haiku-5-5'),
          uso('10:00:30', 'Bash', { command: 'npm run snapshot -- https://practicesoftwaretesting.com/contact x.json' }, 'e2', 'claude-haiku-5-5'),
          uso('10:01:00', 'Write', { file_path: `${RAIZ}\\artifacts\\REQ-009\\01-extraccion.json` }, 'e3', 'claude-haiku-5-5'),
          uso('10:01:59', 'SubagentHandback', {}, 'e4', 'claude-haiku-5-5'),
        ],
      },
    ],
  };
}

// Suma un automator que regresa a las 10:05 y deja al orquestador verificar.
function conAutomator(r: Registro, falla: boolean): Registro {
  r.principal.push(
    uso('10:03:00', 'Agent', { subagent_type: 'automator', description: 'Automatizar REQ-009' }, 'tu-aut'),
    salida('10:03:01', 'tu-aut', 'agentId: bbb222 (internal ID)'),
    regreso('10:05:00', 'bbb222'),
    uso('10:05:10', 'Bash', { command: 'npx playwright test -g "@REQ-009"' }, 'o1'),
    salida('10:05:40', 'o1', falla ? '  1 failed\n  2 passed (3s)' : '  3 passed (3s)'),
  );
  r.subagentes.push({
    meta: { agentType: 'automator', toolUseId: 'tu-aut' },
    lineas: [dice('10:03:01', 'Etapa 3'), uso('10:04:00', 'Edit', { file_path: `${RAIZ}\\tests\\ui\\x.spec.ts` }, 'a1')],
  });
  return r;
}

const tipos = (r: ReturnType<typeof extraer>, actor: string) => r.eventos.filter((e) => e.actor === actor).map((e) => e.tipo);

test('una corrida con extractor da inicio, acciones y fin con su modelo', () => {
  const r = extraer(registro(), 'REQ-009');
  assert.deepEqual(tipos(r, 'extractor'), ['inicio', 'lee', 'snapshot', 'escribe', 'fin']);
  assert.deepEqual(r.actores.find((a) => a.clave === 'extractor'), { clave: 'extractor', modelo: 'Claude Haiku 5.5' });
  assert.equal(r.eventos[0].t, 0);
  assert.equal(r.eventos.find((e) => e.tipo === 'snapshot')?.ruta, '/contact');
  assert.equal(r.fecha, '2026-01-01');
});

test('una copia de la llamada sin hora o con el mismo id no se cuenta dos veces', () => {
  const r = registro();
  const lineas = r.subagentes[0].lineas as { timestamp?: string; type?: string }[];
  lineas.push({ ...lineas[1], type: 'api-request-blob', timestamp: undefined }, { ...lineas[2] });
  assert.equal(extraer(r, 'REQ-009').eventos.filter((e) => e.tipo === 'lee' || e.tipo === 'snapshot').length, 2);
});

test('pruebas suma las cifras de Playwright', () => {
  const r = extraer(conAutomator(registro(), true), 'REQ-009');
  const p = r.eventos.find((e) => e.tipo === 'pruebas');
  assert.equal(p?.actor, 'orquestador');
  assert.equal(p?.pasan, 2);
  assert.equal(p?.fallan, 1);
});

test('una ruta fuera del repo no sale y una del repo queda relativa', () => {
  const r = registro();
  r.subagentes[0].lineas.push(
    uso('10:01:10', 'Read', { file_path: 'C:\\Users\\alguien\\AppData\\Local\\Temp\\x.txt' }, 'e5', 'claude-haiku-5-5'),
    uso('10:01:20', 'Read', { file_path: '/c/Users/alguien/repo/src/pages/A.ts' }, 'e6', 'claude-haiku-5-5'),
  );
  const lee = extraer(r, 'REQ-009').eventos.filter((e) => e.tipo === 'lee');
  assert.deepEqual(lee.map((e) => e.ruta), ['requirements/REQ-009.md', undefined, 'src/pages/A.ts']);
  assert.equal(extraer(r, 'REQ-009').eventos.find((e) => e.tipo === 'escribe')?.ruta, 'artifacts/REQ-009/01-extraccion.json');
});

test('una ruta que sale del repo con .. no sale', () => {
  const r = registro();
  r.subagentes[0].lineas.push(
    uso('10:01:10', 'Read', { file_path: `${RAIZ}\\..\\..\\alguien\\.ssh\\id_rsa` }, 'e5', 'claude-haiku-5-5'),
    uso('10:01:20', 'Grep', { pattern: 'x', path: `${RAIZ}/../otro` }, 'e6', 'claude-haiku-5-5'),
  );
  const ev = extraer(r, 'REQ-009').eventos.filter((e) => e.t >= 59);
  assert.deepEqual(ev.filter((e) => e.tipo === 'lee' || e.tipo === 'busca').map((e) => e.ruta), [undefined, undefined]);
});

test('sin cwd en la sesión no sale ninguna ruta', () => {
  const r = registro();
  for (const l of r.principal as { cwd?: string }[]) delete l.cwd;
  assert.ok(extraer(r, 'REQ-009').eventos.every((e) => !e.ruta || e.ruta.startsWith('/')));
  assert.equal(extraer(r, 'REQ-009').eventos.find((e) => e.tipo === 'lee')?.ruta, undefined);
});

test('la ruta de una llamada a la API solo sale si es una URL limpia', () => {
  const r = registro();
  r.subagentes[0].lineas.push(
    uso('10:01:10', 'Bash', { command: 'curl https://api.practicesoftwaretesting.com/users/login>$HOME/tok.json' }, 'e5', 'claude-haiku-5-5'),
    uso('10:01:20', 'Bash', { command: 'curl "https://api.practicesoftwaretesting.com/products?page=2"' }, 'e6', 'claude-haiku-5-5'),
    uso('10:01:30', 'Bash', { command: 'curl https://api.practicesoftwaretesting.com/$c' }, 'e7', 'claude-haiku-5-5'),
  );
  const api = extraer(r, 'REQ-009').eventos.filter((e) => e.tipo === 'api');
  assert.deepEqual(api.map((e) => e.ruta), [undefined, '/products', undefined]);
});

test('un regreso marcado como meta sigue contando como fin', () => {
  const r = registro();
  (r.principal[3] as { isMeta?: boolean }).isMeta = true;
  assert.deepEqual(tipos(extraer(r, 'REQ-009'), 'extractor').at(-1), 'fin');
});

test('una línea meta o de comando local no es un mensaje de la persona', () => {
  const r = conAutomator(registro(), true);
  r.principal.push(
    { ...dice('10:05:45', 'cualquier cosa'), isMeta: true },
    dice('10:05:50', '<bash-input>ls</bash-input>'),
    uso('10:06:00', 'SendMessage', { to: 'bbb222' }, 'o2'),
  );
  const res = extraer(r, 'REQ-009');
  assert.deepEqual(tipos(res, 'persona'), []);
  assert.equal(res.eventos.filter((e) => e.tipo === 'puerta').at(-1)?.resultado, 'no-pasa');
});

test('la puerta que pasa por un pedido lo dice, y descartar el pedido la deja en no pasa', () => {
  const r = conAutomator(registro(), true);
  r.principal.push(dice('10:05:50', 'voy por un café'), uso('10:06:00', 'SendMessage', { to: 'bbb222' }, 'o2'));
  const res = extraer(r, 'REQ-009');
  const puerta = res.eventos.filter((e) => e.tipo === 'puerta').at(-1)!;
  const pide = res.eventos.find((e) => e.tipo === 'pide')!;
  assert.equal(puerta.resultado, 'pasa');
  assert.equal(puerta.porPide, pide.t);
  const limpio = aplicarNotas(res, [{ hora: '10:05:50', tipo: 'pide', descartar: true }]);
  assert.equal(limpio.eventos.some((e) => e.tipo === 'pide'), false);
  assert.equal(limpio.eventos.filter((e) => e.tipo === 'puerta').at(-1)?.resultado, 'no-pasa');
});

test('un pide sin nota hace fallar las notas', () => {
  const r = conAutomator(registro(), false);
  r.principal.push(dice('10:05:50', 'agrega un caso'), uso('10:06:00', 'SendMessage', { to: 'bbb222' }, 'o2'));
  assert.throws(() => aplicarNotas(extraer(r, 'REQ-009'), []), /pide/);
});

test('la puerta no pasa si el orquestador devuelve el trabajo al mismo agente', () => {
  const r = conAutomator(registro(), true);
  r.principal.push(uso('10:06:00', 'SendMessage', { to: 'bbb222', summary: 'corrige' }, 'o2'));
  const ev = extraer(r, 'REQ-009').eventos;
  const puertas = ev.filter((e) => e.tipo === 'puerta');
  assert.deepEqual(puertas.map((e) => e.resultado), ['pasa', 'no-pasa']);
  assert.equal(puertas[1].t, ev.find((e) => e.tipo === 'pruebas')?.t);
  assert.equal(ev.find((e) => e.tipo === 'devuelve')?.a, 'automator');
});

test('un pedido de la persona antes de devolver es pide, y la puerta pasa', () => {
  const r = conAutomator(registro(), false);
  r.principal.push(dice('10:05:50', 'agrega un caso'), uso('10:06:00', 'SendMessage', { to: 'bbb222' }, 'o2'));
  const res = extraer(r, 'REQ-009');
  assert.deepEqual(tipos(res, 'persona'), ['pide']);
  assert.equal(res.eventos.filter((e) => e.tipo === 'puerta').at(-1)?.resultado, 'pasa');
});

test('un mensaje de la persona sin devolución después no genera pide', () => {
  const r = registro();
  r.principal.splice(3, 0, dice('10:01:00', '¿esperamos?'));
  assert.deepEqual(tipos(extraer(r, 'REQ-009'), 'persona'), []);
});

test('la pausa de aprobación y su respuesta son de la persona', () => {
  const r = registro();
  r.principal.push(uso('10:02:10', 'AskUserQuestion', { questions: [] }, 'q1'), salida('10:03:00', 'q1', 'respondido'));
  assert.deepEqual(tipos(extraer(r, 'REQ-009'), 'persona'), ['pausa', 'decision']);
});

test('a la misma hora, la puerta va antes de la acción que la sigue', () => {
  const r = registro();
  r.principal.push(uso('10:02:10', 'AskUserQuestion', { questions: [] }, 'q1'), salida('10:03:00', 'q1', 'respondido'));
  const tipos10 = extraer(r, 'REQ-009').eventos.filter((e) => e.tipo === 'puerta' || e.tipo === 'pausa').map((e) => e.tipo);
  assert.deepEqual(tipos10, ['puerta', 'pausa']);
});

test('un subagente detenido cierra con detiene y sin fin', () => {
  const r = registro();
  r.principal.push(
    uso('10:03:00', 'Agent', { subagent_type: 'reporter', description: 'Reporte de REQ-009' }, 'tu-rep'),
    salida('10:03:01', 'tu-rep', 'agentId: ccc333 (internal ID)'),
    dice('10:03:30', 'cambia el plan'),
    uso('10:03:40', 'TaskStop', { task_id: 'ccc333' }, 'o3'),
  );
  r.subagentes.push({
    meta: { agentType: 'reporter', toolUseId: 'tu-rep' },
    lineas: [dice('10:03:01', 'Etapa 4'), uso('10:03:20', 'Glob', { pattern: '*.md' }, 'r1', 'claude-haiku-5-5')],
  });
  const res = extraer(r, 'REQ-009');
  assert.deepEqual(tipos(res, 'reporter'), ['inicio', 'busca']);
  assert.equal(res.eventos.find((e) => e.tipo === 'detiene')?.a, 'reporter');
});

test('gh run antes del primer commit no cuenta como ci', () => {
  const r = conAutomator(registro(), false);
  r.principal.splice(3, 0, uso('10:01:30', 'Bash', { command: 'gh run list -L 1' }, 'g0'));
  r.principal.push(
    uso('10:06:00', 'Bash', { command: 'git add -A && git commit -m x' }, 'g1'),
    uso('10:06:30', 'Bash', { command: 'gh run watch 1' }, 'g2'),
    uso('10:07:00', 'SendMessage', { to: 'bbb222' }, 'g3'),
    regreso('10:08:00', 'bbb222'),
    uso('10:08:30', 'Bash', { command: 'git commit -m y' }, 'g4'),
  );
  const ev = extraer(r, 'REQ-009').eventos;
  assert.deepEqual(ev.filter((e) => e.tipo === 'ci').map((e) => e.t), [ev.find((e) => e.tipo === 'commit')!.t + 30]);
  assert.equal(ev.at(-1)?.tipo, 'commit');
});

const conDevolucion = (): Repeticion => ({
  req: 'REQ-009',
  fecha: '2026-01-01',
  inicio: '2026-01-01T15:59:00.000Z',
  fin: '2026-01-01T16:00:00.000Z',
  actores: [],
  eventos: [{ t: 49, actor: 'orquestador', tipo: 'devuelve', a: 'automator' }],
});

test('una nota se pega al evento de su tipo a 60 s o menos', () => {
  const r = aplicarNotas(conDevolucion(), [{ hora: '15:59:30', tipo: 'devuelve', es: 'vuelve', en: 'back' }]);
  assert.deepEqual(r.eventos[0].nota, { es: 'vuelve', en: 'back' });
});

test('una nota sin evento cerca o de otro tipo hace fallar', () => {
  assert.throws(() => aplicarNotas(conDevolucion(), [{ hora: '10:00:00', tipo: 'devuelve', es: 'x', en: 'x' }]), /10:00:00/);
  assert.throws(() => aplicarNotas(conDevolucion(), [{ hora: '15:59:49', tipo: 'pide', es: 'x', en: 'x' }]), /15:59:49/);
});

for (const malo of ['C:\\Users\\alguien', 'C:/Users/alguien', '/c/Users/alguien', 'AppData', 'a@b.co', 'toolu_01abc', 'agent-a2021cb566021842d', 'a2021cb566021842d'])
  test(`revisarPrivacidad rechaza ${malo}`, () => assert.throws(() => revisarPrivacidad(JSON.stringify({ x: malo }))));

for (const clave of ['sk-ant-api03-abcdefghij', 'ghp_abcdefghijklmnop', 'Bearer abc.def', 'eyJhbGciOiJIUzI1NiJ9.eyJ', 'password=hunter2', 'token: abc'])
  test(`revisarPrivacidad rechaza una clave como ${clave.slice(0, 8)}`, () => assert.throws(() => revisarPrivacidad(JSON.stringify({ x: clave }), 'nadie')));

test('revisarPrivacidad rechaza el usuario del equipo, pero no una palabra que lo contiene', () => {
  assert.throws(() => revisarPrivacidad(JSON.stringify({ ruta: '../../alguien/.ssh' }), 'alguien'), /usuario/);
  revisarPrivacidad(JSON.stringify({ x: 'Alguienes' }), 'alguien');
});

test('revisarPrivacidad deja pasar rutas del repo, modelos y fechas', () => {
  revisarPrivacidad(JSON.stringify({ ruta: 'artifacts/REQ-004/02-plan.md', modelo: 'Claude Opus 5.5', inicio: '2026-11-15T15:16:13.636Z' }), 'nadie');
});

test('nombreModelo', () => {
  assert.equal(nombreModelo('claude-fable-5-2'), 'Claude Fable 5.2');
  assert.equal(nombreModelo('claude-haiku-5-5'), 'Claude Haiku 5.5');
});
