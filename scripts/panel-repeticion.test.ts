import assert from 'node:assert/strict';
import { test } from 'node:test';
import { comprimir, duracionSegundos, repeticionHtml } from './panel-repeticion';
import type { Evento, Repeticion } from './repeticion';

const ev = (t: number, extra: Partial<Evento> = {}): Evento => ({ t, actor: 'automator', tipo: 'comando', ...extra });

const corrida = (): Repeticion => ({
  req: 'REQ-009',
  fecha: '2026-01-01',
  inicio: '2026-01-01T15:00:00.000Z',
  fin: '2026-01-01T15:20:00.000Z',
  actores: [
    { clave: 'orquestador', modelo: 'Claude Opus 5.5' },
    { clave: 'automator', modelo: 'Claude Opus 5.5' },
  ],
  eventos: [
    ev(0, { tipo: 'inicio' }),
    ev(30, { tipo: 'lee', ruta: 'src/a.ts' }),
    ev(90, { actor: 'orquestador', tipo: 'puerta', resultado: 'no-pasa', nota: { es: 'Fallan 4 <pruebas>', en: '4 fail' } }),
    ev(150, { actor: 'orquestador', tipo: 'devuelve', a: 'automator' }),
  ],
});

test('comprimir deja el primero en 0, el último en 1 y no retrocede', () => {
  const v = comprimir([ev(0), ev(5), ev(5), ev(40)]).map((e) => e.v);
  assert.equal(v[0], 0);
  assert.equal(v.at(-1), 1);
  assert.ok(v.every((x, i) => i === 0 || x >= v[i - 1]));
});

test('un hueco de 10 min pesa como uno de 180 s', () => {
  assert.deepEqual(comprimir([ev(0), ev(60), ev(660)]).map((e) => e.v), [0, 0.25, 1]);
});

test('comprimir con un solo evento lo deja en 0', () => {
  assert.deepEqual(comprimir([ev(12)]).map((e) => e.v), [0]);
});

test('repeticionHtml pone un li por momento de control con su hora y su nota escapada', () => {
  const html = repeticionHtml(corrida());
  const control = html.match(/<ol class="accion-control">([\s\S]*?)<\/ol>/)?.[1] ?? '';
  assert.equal(control.match(/<li/g)?.length, 2);
  assert.match(control, /<time datetime="2026-01-01T15:01:30.000Z">15:01<\/time>/);
  assert.match(control, /Fallan 4 &lt;pruebas&gt;/);
  assert.match(html, /<section id="accion"/);
});

test('Comandos cuenta una sola vez un comando que corre pruebas, trazabilidad y lint', () => {
  const r = corrida();
  r.eventos.push(ev(160, { actor: 'orquestador', tipo: 'pruebas' }), ev(160, { actor: 'orquestador', tipo: 'trazabilidad' }), ev(160, { actor: 'orquestador', tipo: 'calidad' }));
  const fila = repeticionHtml(r).match(/<tr><th scope="row" data-i18n="a\.orquestador"><\/th>(.*?)<\/tr>/)?.[1] ?? '';
  assert.deepEqual([...fila.matchAll(/<td>(\d+)<\/td>/g)].map((m) => m[1]), ['0', '1', '0']);
});

test('la puerta dice en texto si pasa o no, aunque tenga nota', () => {
  const control = repeticionHtml(corrida()).match(/<ol class="accion-control">([\s\S]*?)<\/ol>/)?.[1] ?? '';
  assert.match(control.match(/<li class="ctl puerta[\s\S]*?<\/li>/)?.[0] ?? '', /data-i18n="a\.noPasa"/);
});

test('duracionSegundos suma 2,5 s por cada parada distinta', () => {
  const e = comprimir([ev(0), ev(10, { tipo: 'puerta' }), ev(10, { tipo: 'devuelve' }), ev(40, { tipo: 'pide' })]);
  assert.equal(duracionSegundos(e), 65);
  assert.match(repeticionHtml(corrida()), /<b>65 s<\/b>/);
});

test('repeticionHtml devuelve vacío sin repetición', () => {
  assert.equal(repeticionHtml(null), '');
});
