import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cuadros } from './gif';

test('cuadros avanza de 0 a 1 y se queda quieto en cada parada', () => {
  const c = cuadros([0.5, 0.5], 2, 2, 3);
  assert.deepEqual(c, [0, 0.25, 0.5, 0.5, 0.5, 0.5, 0.75, 1]);
});
