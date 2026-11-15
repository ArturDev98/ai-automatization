import { test, expect } from '../../src/fixtures';
import {
  anadirAlCarrito,
  cambiarCantidad,
  consultarCarrito,
  eliminarCarrito,
  type Carrito,
} from '../../src/api/carritos';
import { primerProducto } from '../../src/api/productos';
import { ID_PRODUCTO_INEXISTENTE } from '../../src/data/productos';

test.describe('API de carrito', () => {
  test('TC-012 ciclo de vida del carrito: crear, añadir, consultar, cambiar cantidad y eliminar', {
    tag: ['@REQ-003', '@TC-012'],
  }, async ({ api, carritos }) => {
    const { id: productId } = await primerProducto(api);

    const creado = await carritos.crear();
    expect(creado.status()).toBe(201);
    const { id } = await creado.json();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);

    const vacio = await consultarCarrito(api, id);
    expect(vacio.status()).toBe(200);
    const cuerpoVacio = (await vacio.json()) as Carrito;
    expect(cuerpoVacio.id).toBe(id);
    expect(cuerpoVacio.cart_items).toEqual([]);

    expect((await anadirAlCarrito(api, id, { product_id: productId, quantity: 1 })).status()).toBe(200);
    const conUno = await consultarCarrito(api, id);
    expect(conUno.status()).toBe(200);
    const itemsUno = ((await conUno.json()) as Carrito).cart_items;
    expect(itemsUno).toHaveLength(1);
    expect(itemsUno[0]).toMatchObject({ product_id: productId, quantity: 1 });

    expect((await cambiarCantidad(api, id, { product_id: productId, quantity: 3 })).status()).toBe(200);
    const conTres = await consultarCarrito(api, id);
    expect(conTres.status()).toBe(200);
    const itemsTres = ((await conTres.json()) as Carrito).cart_items;
    expect(itemsTres).toHaveLength(1);
    expect(itemsTres[0]).toMatchObject({ product_id: productId, quantity: 3 });

    expect((await eliminarCarrito(api, id)).status()).toBe(204);
    expect((await consultarCarrito(api, id)).status()).toBe(404);
  });

  test('TC-013 datos inválidos en el carrito responden 4xx con explicación y nunca 5xx', {
    tag: ['@REQ-003', '@TC-013'],
  }, async ({ api, carritos }) => {
    const { id: productId } = await primerProducto(api);
    const creado = await carritos.crear();
    expect(creado.status()).toBe(201);
    const { id } = await creado.json();

    const filas = [
      { paso: 'POST {}', enviar: () => anadirAlCarrito(api, id, {}), campos: ['product_id', 'quantity'] },
      { paso: 'POST quantity 0', enviar: () => anadirAlCarrito(api, id, { product_id: productId, quantity: 0 }), campos: ['quantity'] },
      { paso: 'POST quantity -1', enviar: () => anadirAlCarrito(api, id, { product_id: productId, quantity: -1 }), campos: ['quantity'] },
      { paso: 'POST quantity "abc"', enviar: () => anadirAlCarrito(api, id, { product_id: productId, quantity: 'abc' }), campos: ['quantity'] },
      {
        paso: 'POST producto inexistente',
        enviar: () => anadirAlCarrito(api, id, { product_id: ID_PRODUCTO_INEXISTENTE, quantity: 1 }),
        campos: ['product_id'],
      },
      { paso: 'PUT {}', enviar: () => cambiarCantidad(api, id, {}), campos: ['product_id', 'quantity'] },
    ];
    for (const { paso, enviar, campos } of filas) {
      const respuesta = await enviar();
      expect(respuesta.status(), paso).toBeGreaterThanOrEqual(400);
      expect(respuesta.status(), paso).toBeLessThan(500);
      const cuerpo = await respuesta.json();
      expect(typeof cuerpo.message, paso).toBe('string');
      expect(cuerpo.message.length, paso).toBeGreaterThan(0);
      for (const campo of campos) expect(cuerpo.errors, `${paso}: errors.${campo}`).toHaveProperty(campo);
    }

    const final = await consultarCarrito(api, id);
    expect(final.status()).toBe(200);
    expect(((await final.json()) as Carrito).cart_items).toEqual([]);
  });
});
