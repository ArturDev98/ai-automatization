import type { APIRequestContext } from '@playwright/test';
import { test, expect } from '../../src/fixtures';
import { CatalogPage } from '../../src/pages/CatalogPage';
import {
  CATEGORIA,
  CATEGORIA_DE_CONTROL,
  CONTROL_DE_BUSQUEDA,
  ORDENES_POR_NOMBRE,
  ORDENES_POR_PRECIO,
  TEXTO_CON_COINCIDENCIAS,
  TEXTO_SIN_COINCIDENCIAS,
  compararNombres,
  idDeCategoria,
  leerOraculo,
  oraculoDeLoMostrado,
  ordenadosSegun,
  type OrdenPorNombre,
  type ProductoDelOraculo,
} from '../../src/data/compra';

const ESPERA = { timeout: 10_000 };

const contiene = (nombre: string, texto: string) => nombre.toLowerCase().includes(texto.toLowerCase());

/** Lee la página visible y las siguientes por sus botones numerados, si las hay. */
async function nombresDeTodasLasPaginas(catalogo: CatalogPage): Promise<string[]> {
  const nombres = await catalogo.leerNombres();
  for (let n = 2; (await catalogo.botonDePagina(n).count()) > 0; n++) {
    const primeroAnterior = (await catalogo.leerNombres())[0];
    await catalogo.botonDePagina(n).click();
    await expect(catalogo.nombres.first()).not.toHaveText(primeroAnterior);
    nombres.push(...(await catalogo.leerNombres()));
  }
  return nombres;
}

interface Criterio<T> {
  leer: (catalogo: CatalogPage) => Promise<T[]>;
  delOraculo: (producto: ProductoDelOraculo) => T;
  comparar: (a: T, b: T) => number;
  /** Precios: el primero de un sentido debe quedar del lado correcto del otro, no solo ser distinto. */
  cruceEstricto: boolean;
}

const POR_NOMBRE: Criterio<string> = {
  leer: (c) => c.leerNombres(),
  delOraculo: (p) => p.nombre,
  comparar: compararNombres,
  cruceEstricto: false,
};
const POR_PRECIO: Criterio<number> = {
  leer: (c) => c.leerPrecios(),
  delOraculo: (p) => p.centavos,
  comparar: (a, b) => a - b,
  cruceEstricto: true,
};

async function comprobarOrden<T>(catalogo: CatalogPage, fila: OrdenPorNombre, criterio: Criterio<T>, api: APIRequestContext) {
  const inverso = (fila.sentido * -1) as 1 | -1;
  const oraculo = await leerOraculo(api);
  await catalogo.abrir();
  const rango = await catalogo.leerRangoDePrecio();
  const esperado = ordenadosSegun(oraculoDeLoMostrado(oraculo, rango).map(criterio.delOraculo), criterio.comparar, fila.sentido);
  await catalogo.ordenarPor(fila.etiqueta);

  let pagina1: T[] = [];
  await expect(async () => {
    pagina1 = await criterio.leer(catalogo);
    expect(pagina1.length).toBeGreaterThan(1);
    expect(pagina1, `página 1 con "${fila.etiqueta}"`).toEqual(ordenadosSegun(pagina1, criterio.comparar, fila.sentido));
  }).toPass(ESPERA);

  await catalogo.paginaSiguiente.click();
  let pagina2: T[] = [];
  await expect(async () => {
    pagina2 = await criterio.leer(catalogo);
    expect(pagina2, 'la página 2 se cargó').not.toEqual(pagina1);
    expect(pagina2, `página 2 con "${fila.etiqueta}"`).toEqual(ordenadosSegun(pagina2, criterio.comparar, fila.sentido));
    const frontera = criterio.comparar(pagina1[pagina1.length - 1], pagina2[0]) * fila.sentido;
    expect(frontera, `último de la página 1 (${pagina1.at(-1)}) frente al primero de la 2 (${pagina2[0]})`).toBeLessThanOrEqual(0);
  }).toPass(ESPERA);

  const mostrados = [...pagina1, ...pagina2];
  const rotulo = rango ? `${rango.minimo}-${rango.maximo} centavos` : 'sin control de rango';
  expect(mostrados, `páginas 1 y 2 con "${fila.etiqueta}" frente al oráculo de lo mostrado (${rotulo})`).toEqual(
    esperado.slice(0, mostrados.length),
  );

  await catalogo.ordenarPor(fila.opuesta);
  let primeroOpuesto = pagina1[0];
  await expect(async () => {
    const opuesta = await criterio.leer(catalogo);
    expect(opuesta.length).toBeGreaterThan(1);
    expect(opuesta, `página 1 con "${fila.opuesta}"`).toEqual(ordenadosSegun(opuesta, criterio.comparar, inverso));
    primeroOpuesto = opuesta[0];
  }).toPass(ESPERA);
  expect<unknown>(primeroOpuesto, `primero con "${fila.opuesta}" frente a "${fila.etiqueta}"`).not.toEqual(pagina1[0]);
  if (criterio.cruceEstricto) {
    expect(criterio.comparar(pagina1[0], primeroOpuesto) * fila.sentido).toBeLessThan(0);
  }
}

function marcarHallazgosDeOrden(fila: OrdenPorNombre, proyecto: string): void {
  test.fail(proyecto === 'ui-bugs', `H-03: se esperaba "${fila.etiqueta}"; la versión con bugs ordena en el sentido contrario`);
}

test.describe('Catálogo: búsqueda, filtro y orden', () => {
  test('TC-001 buscar un texto existente muestra solo productos cuyo nombre lo contiene', {
    tag: ['@REQ-002', '@TC-001'],
  }, async ({ page, api }) => {
    const oraculo = await leerOraculo(api);
    const esperados = oraculo.filter((p) => contiene(p.nombre, TEXTO_CON_COINCIDENCIAS)).map((p) => p.nombre);
    expect(oraculo.some((p) => p.nombre === CONTROL_DE_BUSQUEDA), 'el producto de control existe').toBe(true);
    expect(contiene(CONTROL_DE_BUSQUEDA, TEXTO_CON_COINCIDENCIAS)).toBe(false);

    const catalogo = new CatalogPage(page);
    await catalogo.abrir();
    await catalogo.buscar(TEXTO_CON_COINCIDENCIAS);

    await expect(async () => {
      const visibles = await catalogo.leerNombres();
      expect(visibles.length).toBeGreaterThan(0);
      for (const nombre of visibles) {
        expect(nombre.toLowerCase(), 'nombre mostrado').toContain(TEXTO_CON_COINCIDENCIAS.toLowerCase());
      }
    }).toPass(ESPERA);
    const mostrados = await nombresDeTodasLasPaginas(catalogo);
    expect([...mostrados].sort(compararNombres)).toEqual([...esperados].sort(compararNombres));
    expect(mostrados).not.toContain(CONTROL_DE_BUSQUEDA);
  });

  test('TC-002 buscar un texto sin coincidencias muestra el mensaje y ningún producto', {
    tag: ['@REQ-002', '@TC-002'],
  }, async ({ page, api }, testInfo) => {
    test.fail(testInfo.project.name === 'ui-bugs', 'H-02: se esperaba un mensaje de "no hay productos"; no aparece ninguno');
    const oraculo = await leerOraculo(api);
    expect(oraculo.filter((p) => contiene(p.nombre, TEXTO_SIN_COINCIDENCIAS))).toEqual([]);

    const catalogo = new CatalogPage(page);
    await catalogo.abrir();
    await catalogo.buscar(TEXTO_SIN_COINCIDENCIAS);

    await expect(catalogo.nombres).toHaveCount(0);
    await expect(catalogo.sinResultados).toBeVisible();
    await expect(catalogo.sinResultados).toHaveText(/no products found/i);
  });

  test('TC-003 marcar una categoría muestra exactamente los productos de esa categoría', {
    tag: ['@REQ-002', '@TC-003'],
  }, async ({ page, api }) => {
    const oraculo = await leerOraculo(api);
    const id = await idDeCategoria(api, CATEGORIA);
    const esperados = oraculo.filter((p) => p.categoria === CATEGORIA).map((p) => p.nombre);
    const controles = oraculo.filter((p) => p.categoria === CATEGORIA_DE_CONTROL).map((p) => p.nombre);
    expect(esperados.length).toBeGreaterThan(0);
    expect(controles.length, `productos de control de ${CATEGORIA_DE_CONTROL}`).toBeGreaterThan(0);

    const catalogo = new CatalogPage(page);
    await catalogo.abrir();
    await catalogo.categoria(id).check();

    await expect(async () => {
      const visibles = await catalogo.leerNombres();
      expect(visibles.length).toBeGreaterThan(0);
      for (const nombre of visibles) expect(esperados, `"${nombre}" es de ${CATEGORIA}`).toContain(nombre);
    }).toPass(ESPERA);
    const mostrados = await nombresDeTodasLasPaginas(catalogo);
    expect([...mostrados].sort(compararNombres)).toEqual([...esperados].sort(compararNombres));
    for (const control of controles) expect(mostrados).not.toContain(control);
    expect(mostrados.length).toBeLessThan(oraculo.length);
  });

  for (const fila of ORDENES_POR_NOMBRE) {
    test(`TC-004 ordenar por ${fila.etiqueta} deja los nombres en ese orden`, {
      tag: ['@REQ-002', '@TC-004'],
    }, async ({ page, api }, testInfo) => {
      marcarHallazgosDeOrden(fila, testInfo.project.name);
      await comprobarOrden(new CatalogPage(page), fila, POR_NOMBRE, api);
    });
  }

  for (const fila of ORDENES_POR_PRECIO) {
    test(`TC-005 ordenar por ${fila.etiqueta} deja los precios en orden numérico`, {
      tag: ['@REQ-002', '@TC-005'],
    }, async ({ page, api }, testInfo) => {
      marcarHallazgosDeOrden(fila, testInfo.project.name);
      await comprobarOrden(new CatalogPage(page), fila, POR_PRECIO, api);
    });
  }
});
