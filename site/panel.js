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
  let pintarAccion = () => {};

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
    pintarAccion();
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

  // En acción: la corrida real comprimida a 60 s; se detiene 2,5 s en cada momento de control.
  const rep = datos.repeticion;
  const seccion = document.getElementById('accion');
  if (rep && seccion) {
    const ev = rep.eventos;
    const cero = Date.parse(rep.inicio);
    const CONTROL = ['puerta', 'pausa', 'decision', 'pide', 'devuelve', 'detiene'];
    const AGENTES = ['extractor', 'planner', 'automator', 'reporter'];
    const ESTACION = { extractor: 0, planner: 1, persona: 2, automator: 3, reporter: 4 };
    const X = [70, 285, 500, 715, 930];
    const ICONO = { pausa: 'manual', decision: 'manual', pide: 'pide', devuelve: 'volver', detiene: 'alto' };
    const DURACION = 60000;
    const PARADA = 2500;
    const clave = (a) => (AGENTES.includes(a) ? 'e.' : 'a.') + a;
    const hora = (e) => new Date(cero + e.t * 1000).toISOString().slice(11, 16);
    const $ = (s) => seccion.querySelector(s);
    const escena = $('.accion');
    const barra = $('#accion-barra');
    const play = $('#accion-play');
    let v = 0;
    let corriendo = false;
    let quietoHasta = 0;
    let previo = null;
    let arrancada = false;

    const verbo = (e) => {
      let s = t('a.' + e.tipo);
      if (e.a) s += ' ' + t(clave(e.a));
      if (e.tipo === 'puerta') s += ' ' + t(e.resultado === 'pasa' ? 'a.pasa' : 'a.noPasa');
      if (e.tipo === 'pruebas') s += `: ${e.pasan} ${t('a.pasan')}, ${e.fallan} ${t('a.fallan')}`;
      if (e.cubiertos) s += `: ${e.cubiertos}`;
      return s;
    };

    const irA = (nuevo) => {
      v = Math.min(Math.max(nuevo, 0), 1);
      let k = 0;
      while (k + 1 < ev.length && ev[k + 1].v <= v) k++;
      const hechos = ev.slice(0, k + 1);
      const e = ev[k];
      const enEstacion = [...hechos].reverse().find((x) => x.actor in ESTACION);
      const estacion = enEstacion ? ESTACION[enEstacion.actor] : 0;
      $('.tren').style.transform = `translateX(${X[estacion]}px)`;
      seccion.querySelectorAll('.a-est').forEach((g, i) => {
        const agente = Object.keys(ESTACION).find((a) => ESTACION[a] === i);
        g.classList.toggle('aqui', i === estacion);
        g.classList.toggle('hecha', hechos.some((x) => (x.tipo === 'fin' && x.actor === agente) || (agente === 'persona' && x.tipo === 'decision')));
      });

      $('.accion-reloj time').textContent = hora(e);
      $('.accion-quien strong').textContent = t(clave(e.actor));
      $('.accion-quien span').textContent = (rep.actores.find((a) => a.clave === e.actor) || {}).modelo || '';
      const suyos = hechos.filter((x) => x.actor === e.actor);
      const cuenta = (tipos) => suyos.filter((x) => tipos.includes(x.tipo)).length;
      const pruebas = [...hechos].reverse().find((x) => x.tipo === 'pruebas');
      const cifras = [
        ['lecturas', cuenta(['lee', 'busca'])],
        ['comandos', cuenta(['snapshot', 'api', 'comando', 'pruebas', 'calidad', 'trazabilidad'])],
        ['archivos', cuenta(['escribe', 'edita'])],
      ];
      $('.accion-cifras').innerHTML =
        cifras.map(([k2, n]) => `<div><dt>${esc(t('a.' + k2))}</dt><dd data-cifra="${k2}">${n}</dd></div>`).join('') +
        `<div><dt>${esc(t('a.pruebasUltimas'))}</dt><dd class="texto">${pruebas ? `${pruebas.pasan} ${esc(t('a.pasan'))}, ${pruebas.fallan} ${esc(t('a.fallan'))}` : '–'}</dd></div>`;
      $('.accion-bitacora').innerHTML = hechos
        .slice(-6)
        .reverse()
        .map((x) => `<li><time>${hora(x)}</time><span><b>${esc(t(clave(x.actor)))}</b> ${esc(verbo(x))}${x.ruta ? ` <code>${esc(x.ruta)}</code>` : ''}</span></li>`)
        .join('');

      // El letrero muestra la última revisión; atenuada cuando ya quedó atrás.
      const c = [...hechos].reverse().find((x) => CONTROL.includes(x.tipo));
      const letrero = $('.accion-letrero');
      const id = c ? `${ev.indexOf(c)}${idioma}${v - c.v < 0.04 ? '' : 'p'}` : idioma;
      if (letrero.dataset.id !== id) {
        letrero.dataset.id = id;
        if (!c) {
          letrero.innerHTML = `<p class="aviso-ctl pasado"><svg aria-hidden="true"><use href="#i-pendiente"/></svg><span>${esc(t('a.sinControl'))}</span></p>`;
        } else {
          let texto = c.nota ? c.nota[idioma] : verbo(c);
          if (c.tipo === 'pausa') {
            const d = ev.find((x) => x.tipo === 'decision' && x.t >= c.t);
            if (d) texto += `. ${t('a.esperando')}: ${Math.round((d.t - c.t) / 60)} min`;
          }
          const icono = c.tipo === 'puerta' ? (c.resultado === 'pasa' ? 'ok' : 'falla') : ICONO[c.tipo];
          const pasado = id.endsWith('p') ? ' pasado' : '';
          letrero.innerHTML = `<p class="aviso-ctl ${c.tipo} ${c.resultado || ''}${pasado}"><svg aria-hidden="true"><use href="#i-${icono}"/></svg><span><time>${hora(c)}</time> <b>${esc(t(clave(c.actor)))}</b> ${esc(texto)}</span></p>`;
        }
      }

      barra.value = String(Math.round(v * 1000));
      barra.setAttribute('aria-valuetext', `${hora(e)} UTC`);
    };

    const marcarPlay = () => {
      play.setAttribute('aria-pressed', String(corriendo));
      play.querySelector('use').setAttribute('href', corriendo ? '#i-pausa' : '#i-play');
    };

    const cuadro = (ahora) => {
      if (!corriendo) return;
      const dt = previo === null ? 0 : Math.min(ahora - previo, 100);
      previo = ahora;
      if (ahora >= quietoHasta) {
        let nuevo = v + dt / DURACION;
        const parada = ev.find((x) => CONTROL.includes(x.tipo) && x.v > v && x.v <= nuevo);
        if (parada) {
          nuevo = parada.v;
          quietoHasta = ahora + PARADA;
        }
        irA(nuevo);
        if (v >= 1) {
          corriendo = false;
          marcarPlay();
          return;
        }
      }
      requestAnimationFrame(cuadro);
    };

    const arrancar = () => {
      if (v >= 1) irA(0);
      corriendo = true;
      arrancada = true;
      previo = null;
      quietoHasta = 0;
      marcarPlay();
      requestAnimationFrame(cuadro);
    };
    const parar = () => {
      corriendo = false;
      marcarPlay();
    };

    pintarAccion = () => {
      seccion.querySelectorAll('[data-nota]').forEach((el) => {
        el.textContent = ev[+el.dataset.nota].nota[idioma];
      });
      barra.setAttribute('aria-label', t('a.barra'));
      if (!escena.hidden) irA(v);
    };

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      seccion.classList.add('quieta');
    } else {
      escena.hidden = false;
      $('.accion-estatico').open = false;
      play.addEventListener('click', () => (corriendo ? parar() : arrancar()));
      $('#accion-reinicio').addEventListener('click', () => {
        quietoHasta = 0;
        irA(0);
      });
      barra.addEventListener('input', () => {
        arrancada = true;
        parar();
        irA(+barra.value / 1000);
      });
      if ('IntersectionObserver' in window) {
        const vigia = new IntersectionObserver((entradas) => {
          if (entradas.some((x) => x.isIntersecting) && !arrancada) {
            vigia.disconnect();
            arrancar();
          }
        }, { threshold: 0.35 });
        vigia.observe(escena);
      }
    }
  }

  // Parada inicial: la última estación recorrida del primer requisito.
  const primeras = datos.lineas[0] ? datos.lineas[0].etapas : [];
  let ultima = 0;
  primeras.forEach((et, k) => { if (et.estado !== 'pendiente') ultima = k; });
  aplicarIdioma();
  if (datos.lineas.length) elegir(0, ultima);
})();
