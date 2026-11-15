import { test, expect } from '../../src/fixtures';
import { buscarCategoria, leerPagina, leerTodas, type Categoria, type Producto } from '../../src/api/productos';
import {
  BUSQUEDA_CON_RESULTADOS,
  BUSQUEDA_SIN_RESULTADOS,
  CATEGORIAS_FILTRO,
  ID_PRODUCTO_INEXISTENTE,
} from '../../src/data/productos';

function validarContrato(p: Producto): void {
  const donde = `producto ${p.id}`;
  expect(typeof p.id === 'string' && p.id.length > 0, `${donde}: id`).toBe(true);
  expect(typeof p.name === 'string' && p.name.length > 0, `${donde}: name`).toBe(true);
  expect(typeof p.description, `${donde}: description`).toBe('string');
  expect(typeof p.price === 'number' && p.price > 0, `${donde}: price`).toBe(true);
  expect(typeof p.in_stock, `${donde}: in_stock`).toBe('boolean');
  for (const campo of ['category', 'brand'] as const) {
    const valor = p[campo];
    expect(typeof valor === 'object' && valor !== null, `${donde}: ${campo} objeto no nulo`).toBe(true);
    expect(typeof valor?.id, `${donde}: ${campo}.id`).toBe('string');
    expect(typeof valor?.name, `${donde}: ${campo}.name`).toBe('string');
  }
}

test.describe('API de productos', () => {
  test('TC-001 paginación completa con metadatos coherentes y sin productos repetidos', {
    tag: ['@REQ-003', '@TC-001'],
  }, async ({ api }) => {
    const paginas = await leerTodas(api, '/products');
    const { total, per_page, last_page } = paginas[0].pagina;

    expect(last_page).toBe(Math.ceil(total / per_page));
    const ids: string[] = [];
    paginas.forEach(({ status, pagina }, i) => {
      const n = i + 1;
      expect(status, `página ${n}`).toBe(200);
      expect(pagina.current_page, `current_page de la página ${n}`).toBe(n);
      expect({ total: pagina.total, per_page: pagina.per_page, last_page: pagina.last_page }).toEqual({
        total,
        per_page,
        last_page,
      });
      expect(pagina.data.length, `productos de la página ${n}`).toBeLessThanOrEqual(per_page);
      if (n < last_page) expect(pagina.data.length, `productos de la página ${n}`).toBe(per_page);
      ids.push(...pagina.data.map((p) => p.id));
    });
    expect(ids).toHaveLength(total);
    expect(new Set(ids).size).toBe(total);
  });

  test('TC-002 última página y página fuera de rango mantienen metadatos coherentes', {
    tag: ['@REQ-003', '@TC-002'],
  }, async ({ api }) => {
    const primera = await leerPagina(api, '/products', { page: 1 });
    expect(primera.status).toBe(200);
    const { total, per_page, last_page } = primera.pagina;

    const ultima = await leerPagina(api, '/products', { page: last_page });
    expect(ultima.status).toBe(200);
    expect(ultima.pagina.current_page).toBe(last_page);
    const esperados = total - per_page * (last_page - 1);
    expect(esperados).toBeGreaterThanOrEqual(1);
    expect(esperados).toBeLessThanOrEqual(per_page);
    expect(ultima.pagina.data).toHaveLength(esperados);

    const fuera = await leerPagina(api, '/products', { page: last_page + 1 });
    expect(fuera.status).toBe(200);
    expect(fuera.pagina.data).toEqual([]);
    expect(fuera.pagina.total).toBe(total);
    expect(fuera.pagina.last_page).toBe(last_page);
  });

  test('TC-003 detalle de un producto existente devuelve el producto pedido con su contrato', {
    tag: ['@REQ-003', '@TC-003'],
  }, async ({ api }) => {
    const { pagina } = await leerPagina(api, '/products', { page: 1 });
    const delListado = pagina.data[0];

    const respuesta = await api.get(`/products/${delListado.id}`);
    expect(respuesta.status()).toBe(200);
    const detalle = (await respuesta.json()) as Producto;
    expect(detalle.id).toBe(delListado.id);
    expect(detalle.name).toBe(delListado.name);
    expect(detalle.price).toBe(delListado.price);
    for (const campo of ['id', 'name', 'description', 'price', 'in_stock', 'category', 'brand']) {
      expect(detalle, `campo ${campo}`).toHaveProperty(campo);
    }
    expect(typeof detalle.id).toBe('string');
    expect(typeof detalle.name).toBe('string');
    expect(typeof detalle.description).toBe('string');
    expect(typeof detalle.price).toBe('number');
    expect(typeof detalle.in_stock).toBe('boolean');
    expect(typeof detalle.category === 'object' && detalle.category !== null, 'category').toBe(true);
    expect(typeof detalle.brand === 'object' && detalle.brand !== null, 'brand').toBe(true);
  });

  test('TC-004 detalle de un id inexistente responde 404', { tag: ['@REQ-003', '@TC-004'] }, async ({ api }) => {
    const respuesta = await api.get(`/products/${ID_PRODUCTO_INEXISTENTE}`);
    expect(respuesta.status()).toBe(404);
    const cuerpo = await respuesta.json();
    expect(typeof cuerpo.message).toBe('string');
    expect(cuerpo.message.length).toBeGreaterThan(0);
  });

  test('TC-005 búsqueda por texto devuelve solo productos que contienen el término', {
    tag: ['@REQ-003', '@TC-005'],
  }, async ({ api }) => {
    const paginas = await leerTodas(api, '/products/search', { q: BUSQUEDA_CON_RESULTADOS });
    paginas.forEach(({ status }) => expect(status).toBe(200));
    const total = paginas[0].pagina.total;
    const productos = paginas.flatMap(({ pagina }) => pagina.data);
    expect(total).toBeGreaterThan(0);
    expect(productos).toHaveLength(total);
    for (const p of productos) {
      const texto = `${p.name} ${p.description}`.toLowerCase();
      expect(texto, `producto ${p.id} (${p.name})`).toContain(BUSQUEDA_CON_RESULTADOS.toLowerCase());
    }

    const vacia = await leerPagina(api, '/products/search', { q: BUSQUEDA_SIN_RESULTADOS });
    expect(vacia.status).toBe(200);
    expect(vacia.pagina.data).toEqual([]);
    expect(vacia.pagina.total).toBe(0);
  });

  test('TC-006 filtro por categoría devuelve solo productos de esa categoría', {
    tag: ['@REQ-003', '@TC-006'],
  }, async ({ api }) => {
    const arbol = await api.get('/categories/tree');
    expect(arbol.status()).toBe(200);
    const categorias = (await arbol.json()) as Categoria[];

    const idsPorCategoria: string[][] = [];
    for (const nombre of CATEGORIAS_FILTRO) {
      const categoria = buscarCategoria(categorias, nombre);
      expect(categoria, `categoría ${nombre} en /categories/tree`).toBeDefined();
      const paginas = await leerTodas(api, '/products', { by_category: categoria!.id });
      paginas.forEach(({ status }) => expect(status).toBe(200));
      const productos = paginas.flatMap(({ pagina }) => pagina.data);
      expect(paginas[0].pagina.total).toBeGreaterThan(0);
      expect(productos).toHaveLength(paginas[0].pagina.total);
      for (const p of productos) {
        expect(p.category?.id, `producto ${p.id} en ${nombre}`).toBe(categoria!.id);
      }
      idsPorCategoria.push(productos.map((p) => p.id));
    }
    const [a, b] = idsPorCategoria;
    expect(a.filter((id) => b.includes(id))).toEqual([]);
  });

  const ordenes = [
    { sort: 'price,asc', valor: (p: Producto) => p.price, asc: true },
    { sort: 'price,desc', valor: (p: Producto) => p.price, asc: false },
    { sort: 'name,asc', valor: (p: Producto) => p.name.toLowerCase(), asc: true },
    { sort: 'name,desc', valor: (p: Producto) => p.name.toLowerCase(), asc: false },
  ];
  for (const { sort, valor, asc } of ordenes) {
    test(`TC-007 orden ${sort} se mantiene en todas las páginas`, {
      tag: ['@REQ-003', '@TC-007'],
    }, async ({ api }) => {
      const paginas = await leerTodas(api, '/products', { sort });
      paginas.forEach(({ status }) => expect(status).toBe(200));
      const productos = paginas.flatMap(({ pagina }) => pagina.data);
      expect(productos).toHaveLength(paginas[0].pagina.total);
      for (let i = 1; i < productos.length; i++) {
        const [antes, ahora] = [valor(productos[i - 1]), valor(productos[i])];
        const mensaje = `posición ${i}: ${productos[i - 1].name} (${antes}) → ${productos[i].name} (${ahora})`;
        expect(asc ? ahora >= antes : ahora <= antes, mensaje).toBe(true);
      }
    });
  }

  test('TC-008 contrato del producto estable en todo el listado', {
    tag: ['@REQ-003', '@TC-008'],
  }, async ({ api }) => {
    const paginas = await leerTodas(api, '/products');
    paginas.forEach(({ status }) => expect(status).toBe(200));
    const productos = paginas.flatMap(({ pagina }) => pagina.data);
    expect(productos).toHaveLength(paginas[0].pagina.total);
    productos.forEach(validarContrato);
  });
});
