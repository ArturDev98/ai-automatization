import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aMarkdown, construir, leerCasos, leerEjecuciones } from './trazabilidad';

const PLAN = `
| ID | Criterios | Título | Técnica | Prioridad | Tipo |
|---|---|---|---|---|---|
| TC-001 | CA-1 | Login válido | Partición de equivalencia | Alta | Automatizado |
| TC-002 | CA-1, CA-2 | Clave incorrecta | Tabla de decisión | Alta | Automatizado |
| TC-003 | CA-3 | Revisión visual del formulario | Exploratoria | Baja | Manual |
`;

const spec = (title: string, tags: string[], status: string, expectedStatus = 'passed') => ({
  title,
  tags,
  file: 'ui/login.spec.ts',
  tests: [{ projectName: 'ui', status, expectedStatus }],
});

test('leerCasos toma solo las filas TC y separa criterios', () => {
  const casos = leerCasos(PLAN);
  assert.equal(casos.length, 3);
  assert.deepEqual(casos[1].criterios, ['CA-1', 'CA-2']);
  assert.equal(casos[2].tipo, 'manual');
  assert.equal(casos[0].tipo, 'automatizado');
});

test('leerEjecuciones acepta tags con o sin arroba y en el título', () => {
  const ejecuciones = leerEjecuciones({
    suites: [
      {
        specs: [spec('a', ['REQ-001', 'TC-001'], 'expected')],
        suites: [{ specs: [spec('@REQ-001 @TC-002 b', [], 'unexpected'), spec('sin marcas', [], 'expected')] }],
      },
    ],
  });
  assert.deepEqual(
    ejecuciones.map((e) => [e.tc, e.estado]),
    [
      ['TC-001', 'pasa'],
      ['TC-002', 'falla'],
    ],
  );
});

test('un test.fail que falla como se espera cuenta como bug conocido', () => {
  const [e] = leerEjecuciones({ suites: [{ specs: [spec('x', ['@REQ-001', '@TC-001'], 'expected', 'failed')] }] });
  assert.equal(e.estado, 'bug-conocido');
});

test('construir cruza plan y ejecuciones sin problemas cuando todo cuadra', () => {
  const criterios = ['CA-1', 'CA-2', 'CA-3'].map((id) => ({ id, texto: id }));
  const ejecuciones = leerEjecuciones({
    suites: [{ specs: [spec('a', ['REQ-001', 'TC-001'], 'expected'), spec('b', ['REQ-001', 'TC-002'], 'expected')] }],
  });
  const t = construir([{ req: 'REQ-001', criterios, casos: leerCasos(PLAN) }], ejecuciones);
  assert.deepEqual(t.problemas, []);
  assert.ok(t.filas.every((f) => f.cubierto));
  assert.match(aMarkdown(t), /TC-003 ✋/);
});

test('construir denuncia criterios sin caso, casos sin prueba y pruebas fuera del plan', () => {
  const criterios = ['CA-1', 'CA-2', 'CA-3', 'CA-4'].map((id) => ({ id, texto: id }));
  const ejecuciones = leerEjecuciones({
    suites: [{ specs: [spec('a', ['REQ-001', 'TC-001'], 'expected'), spec('z', ['REQ-001', 'TC-099'], 'expected')] }],
  });
  const t = construir([{ req: 'REQ-001', criterios, casos: leerCasos(PLAN) }], ejecuciones);
  assert.equal(t.problemas.length, 3);
  assert.ok(t.problemas.some((p) => p.includes('CA-4')));
  assert.ok(t.problemas.some((p) => p.includes('TC-002')));
  assert.ok(t.problemas.some((p) => p.includes('TC-099')));
});

test('un caso con varias pruebas se queda con su peor resultado', () => {
  const criterios = ['CA-1', 'CA-2', 'CA-3'].map((id) => ({ id, texto: id }));
  const ejecuciones = leerEjecuciones({
    suites: [
      {
        specs: [
          spec('a1', ['REQ-001', 'TC-001'], 'expected', 'failed'),
          spec('a2', ['REQ-001', 'TC-001'], 'expected'),
          spec('b', ['REQ-001', 'TC-002'], 'expected'),
        ],
      },
    ],
  });
  const t = construir([{ req: 'REQ-001', criterios, casos: leerCasos(PLAN) }], ejecuciones);
  assert.equal(t.filas[0].casos[0].estados.ui, 'bug-conocido');
});
