(() => {
  const T = JSON.parse(document.getElementById('textos').textContent);

  const datos = JSON.parse(document.getElementById('datos').textContent);
  const raiz = document.documentElement;
  const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* almacenamiento bloqueado */ } };
  const leer = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };

  let idioma = leer('idioma') || ((navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en');
  const t = (k) => T[idioma][k] ?? k;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  let elegida = null;

  function pintarParada() {
    const caja = document.getElementById('parada');
    if (!elegida) return;
    const [i, e] = elegida;
    const linea = datos.lineas[i];
    const etapa = linea.etapas[e];
    const hechos = etapa.datos
      .map(([k, v]) => `<div><dt>${esc(t(k))}</dt><dd${/^\d+$/.test(v) ? '' : ' class="texto"'}>${esc(v)}</dd></div>`)
      .join('');
    caja.innerHTML = `<div class="parada-cuerpo">
      <div class="letrero l${i + 1}"><code>${esc(linea.req)}</code><strong>${esc(t('e.' + etapa.clave))}</strong><span>${esc(t('o.' + etapa.estado))}</span></div>
      <div class="parada-info">
        ${hechos ? `<dl>${hechos}</dl>` : ''}
        ${etapa.firma ? `<p class="firma">${esc(etapa.firma)}</p>` : ''}
        ${etapa.archivo ? `<a href="${esc(datos.blob + etapa.archivo)}" rel="noopener">${esc(t('o.abrir'))}</a>` : `<p class="firma">${esc(t('o.sinArtefacto'))}</p>`}
      </div></div>`;
  }

  function aplicarIdioma() {
    raiz.lang = idioma;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('.est').forEach((g) => {
      const l = datos.lineas[+g.dataset.linea];
      const et = l.etapas[+g.dataset.etapa];
      g.setAttribute('aria-label', `${l.req}, ${t('e.' + et.clave)}: ${t('o.' + et.estado)}`);
    });
    const b = document.getElementById('idioma');
    b.textContent = idioma === 'es' ? 'EN' : 'ES';
    b.setAttribute('aria-label', idioma === 'es' ? 'Switch to English' : 'Cambiar a español');
    document.getElementById('riel').setAttribute('aria-label', t('n.riel'));
    document.title = idioma === 'es' ? 'Arturo Isaza · Flujo de QA con agentes' : 'Arturo Isaza · QA workflow with agents';
    pintarParada();
    pintarGuia();
  }

  // Guía móvil: las secciones son las paradas del riel, en el mismo orden.
  const secciones = Array.from(document.querySelectorAll('.riel a')).map((a) => a.getAttribute('href').slice(1));
  const guia = document.getElementById('guia');
  const guiaSig = document.getElementById('guia-sig');
  const guiaArriba = document.getElementById('guia-arriba');
  document.getElementById('guia-paradas').innerHTML = secciones.map(() => '<i></i>').join('');
  let actual = secciones[0];

  function pintarGuia() {
    const i = Math.max(0, secciones.indexOf(actual));
    const siguiente = secciones[i + 1];
    const alFinal = innerHeight + scrollY >= document.documentElement.scrollHeight - 40;
    guiaSig.classList.toggle('fuera', !siguiente || alFinal);
    if (siguiente) {
      guiaSig.href = '#' + siguiente;
      document.getElementById('guia-nombre').textContent = t('n.' + siguiente);
    }
    document.querySelectorAll('#guia-paradas i').forEach((p, k) => p.classList.toggle('paso', k <= i));
    guiaArriba.classList.toggle('fuera', scrollY < innerHeight * 0.6);
  }

  function elegir(i, e) {
    elegida = [i, e];
    document.querySelectorAll('.est').forEach((g) => {
      g.setAttribute('aria-pressed', String(+g.dataset.linea === i && +g.dataset.etapa === e));
    });
    pintarParada();
  }

  document.querySelectorAll('.est').forEach((g) => {
    const ir = () => elegir(+g.dataset.linea, +g.dataset.etapa);
    g.addEventListener('click', ir);
    g.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ir(); }
    });
  });

  document.getElementById('idioma').addEventListener('click', () => {
    idioma = idioma === 'es' ? 'en' : 'es';
    guardar('idioma', idioma);
    aplicarIdioma();
  });

  const botonTema = document.getElementById('tema');
  const oscuro = () => (raiz.dataset.theme ? raiz.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  const pintarTema = () => botonTema.querySelector('use').setAttribute('href', oscuro() ? '#i-sol' : '#i-luna');
  botonTema.addEventListener('click', () => {
    raiz.dataset.theme = oscuro() ? 'light' : 'dark';
    guardar('tema', raiz.dataset.theme);
    pintarTema();
  });
  pintarTema();

  // Sección actual: la que cruza una franja a un tercio de la pantalla.
  const enlaces = Array.from(document.querySelectorAll('.riel a, .barra nav a'));
  const marcar = (id) => {
    enlaces.forEach((a) => {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    actual = id;
    pintarGuia();
  };
  let pendiente = false;
  addEventListener('scroll', () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; pintarGuia(); });
  }, { passive: true });
  guia.hidden = false;
  if ('IntersectionObserver' in window) {
    const espia = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) marcar(e.target.id);
        });
      },
      { rootMargin: '-35% 0px -60% 0px' },
    );
    document.querySelectorAll('main > section[id]').forEach((s) => espia.observe(s));
  }

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const vigia = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('visto');
          vigia.unobserve(e.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    document.querySelectorAll('main > section:not(.portada):not(.mapa) > *, .pie > *').forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add('revelar');
      vigia.observe(el);
    });
  }

  // Parada inicial: la última estación recorrida del primer requisito.
  const primeras = datos.lineas[0] ? datos.lineas[0].etapas : [];
  let ultima = 0;
  primeras.forEach((et, k) => { if (et.estado !== 'pendiente') ultima = k; });
  aplicarIdioma();
  if (datos.lineas.length) elegir(0, ultima);
})();
