/* visorgis_sofia · lógica del visor (OpenLayers, build UMD global `ol`) */
(function () {
  'use strict';

  const C = window.VISOR_CONFIG;
  const $ = (s) => document.querySelector(s);
  const estado = { v: 0, idxMostrado: -1, reproduciendo: false, verHoy: false, anio: 0, tipo: '' };
  let capas = [];
  let map, view, capaFondo, capaCalles, grupoHistorico, capaPerimetros, narrador;

  /* ---------- Fuentes ---------- */
  function crearSource(c) {
    const f = c.fuente;
    const comunes = { attributions: c.atribucion, transition: 0 };
    if (f.type === 'wms') {
      return new ol.source.TileWMS(Object.assign({
        url: f.url,
        params: {
          LAYERS: f.layers, VERSION: f.version || '1.3.0', STYLES: '',
          FORMAT: f.format || 'image/png', TRANSPARENT: true,
        },
      }, comunes));
    }
    if (f.type === 'xyz') {
      return new ol.source.XYZ(Object.assign({ url: f.url, maxZoom: f.maxZoom || 20 }, comunes));
    }
    if (f.type === 'wmts-opts') {
      return new ol.source.WMTS(Object.assign({}, f.options, comunes));
    }
    throw new Error('Tipo de fuente no soportado: ' + f.type);
  }

  /* ---------- Perímetros, puertas e hitos (capa vectorial sobre todos los años) ---------- */
  // Cada elemento lleva `desde` (y opcionalmente `hasta`). Para el año que se está viendo:
  //   - el último perímetro vigente se dibuja en continuo (relleno solo en las recreaciones)
  //   - los perímetros anteriores, en discontinuo
  //   - las puertas de ese perímetro, con nombre; las de perímetros anteriores, solo el punto
  //   - los hitos ya construidos, con nombre
  const fuentesGeojson = {};
  function fuenteGeojson(url) {
    if (!fuentesGeojson[url]) {
      fuentesGeojson[url] = new ol.source.Vector({ url, format: new ol.format.GeoJSON() });
    }
    return fuentesGeojson[url];
  }
  const existe = (f, anio) => f.get('desde') <= anio && !(f.get('hasta') && anio >= f.get('hasta'));
  function perimetroVigente(src, anio) {
    let v = -Infinity;
    src.getFeatures().forEach((f) => {
      if (f.get('tipo') === 'recinto' && f.get('desde') <= anio && f.get('desde') > v) v = f.get('desde');
    });
    return v;
  }
  function estiloPerimetros(src) {
    const S = ol.style;
    const ZOOM_ETIQUETAS = 13.5; // a partir de aquí se rotulan puertas, hitos y recintos
    const fuente = (peso, px) => peso + ' ' + px + 'px "Segoe UI", system-ui, sans-serif';
    const halo = new S.Stroke({ color: '#1a1816', width: 3.5 });
    const trazo = new S.Stroke({ color: '#e0503f', width: 3.5 });
    const actualRelleno = new S.Style({ fill: new S.Fill({ color: 'rgba(214, 74, 58, 0.26)' }), stroke: trazo });
    const actualLinea = new S.Style({ stroke: trazo });
    const anterior = new S.Style({
      stroke: new S.Stroke({ color: 'rgba(245, 225, 190, 0.85)', width: 2, lineDash: [7, 6] }),
    });
    const rotulos = {};
    const rotuloRecinto = (nombre, limite) => {
      if (!rotulos[nombre]) {
        rotulos[nombre] = new S.Style({
          geometry: (f) => f.getGeometry().getInteriorPoint(),
          text: new S.Text({
            // texto enriquecido de OL: [texto, fuente, texto, fuente...]
            text: [nombre, fuente('italic 600', 15), '\n', '', 'Límite: ' + limite, fuente('400', 12)],
            fill: new S.Fill({ color: '#ffe3d6' }), textAlign: 'center',
            stroke: new S.Stroke({ color: '#1a1816', width: 4 }), overflow: true,
            declutterMode: 'obstacle', // se dibuja siempre y los demás rótulos lo esquivan
          }),
          zIndex: 5,
        });
      }
      return rotulos[nombre];
    };
    const cache = {};
    const punto = (nombre, clase, conTexto) => {
      const k = [nombre, clase, conTexto].join('|');
      if (!cache[k]) {
        const hito = clase === 'hito', propia = clase === 'propia';
        const yac = clase === 'yacimiento', barrio = clase === 'barrio';
        cache[k] = new S.Style({
          image: barrio
            ? new S.Circle({ radius: 5.5, fill: new S.Fill({ color: '#4fb3ba' }), stroke: new S.Stroke({ color: '#1a1816', width: 1.5 }) })
            : yac
            ? new S.Circle({ radius: 7, fill: new S.Fill({ color: '#b07a4f' }), stroke: new S.Stroke({ color: '#f3e3cf', width: 2 }) })
            : hito
            ? new S.RegularShape({ points: 4, radius: 7, angle: 0, fill: new S.Fill({ color: '#e0b04a' }),
                stroke: new S.Stroke({ color: '#1a1816', width: 1.5 }) })
            : new S.Circle({ radius: propia ? 5 : 4,
                fill: new S.Fill({ color: propia ? '#c23a30' : '#c9b79a' }),
                stroke: new S.Stroke({ color: '#1a1816', width: 1.5 }) }),
          text: conTexto ? new S.Text({
            text: nombre, offsetY: -15, font: fuente('600', hito ? 13.5 : 13),
            fill: new S.Fill({ color: hito ? '#fbe7b0' : barrio ? '#c9efe4' : '#fff7ea' }), stroke: halo,
          }) : undefined,
          zIndex: hito ? 11 : propia ? 10 : 8,
        });
      }
      return cache[k];
    };
    return (feat, res) => {
      const anio = estado.anio;
      if (!existe(feat, anio)) return null;
      const vigente = perimetroVigente(src, anio);
      const zoom = view ? view.getZoomForResolution(res) : 16;
      const conTexto = zoom >= ZOOM_ETIQUETAS;
      const tipo = feat.get('tipo');
      if (tipo === 'recinto') {
        if (feat.get('desde') !== vigente) return anterior;
        const base = estado.tipo === 'recreacion' ? actualRelleno : actualLinea;
        return conTexto ? [base, rotuloRecinto(feat.get('nombre'), feat.get('limite'))] : base;
      }
      if (tipo === 'hito') return punto(feat.get('nombre'), 'hito', conTexto);
      if (tipo === 'yacimiento') return punto(feat.get('nombre'), 'yacimiento', zoom >= 11.5);
      if (tipo === 'barrio') return punto(feat.get('nombre'), 'barrio', zoom >= 12);
      const propia = feat.get('desde') === vigente;
      // Las puertas que siguen en pie (Alcalá, Toledo) se rotulan siempre
      return punto(feat.get('nombre'), propia ? 'propia' : 'anterior', conTexto && (propia || !!feat.get('conservada')));
    };
  }



  /* ---------- Archivo de Esri World Imagery (Wayback) ---------- */
  // Los pasos con fuente { type: 'wayback', fecha: 'AAAA-MM' } se resuelven al arrancar con el
  // catálogo de versiones de Esri: se elige la versión publicada más cercana a esa fecha.
  // Si el catálogo no responde, esos pasos se quitan de la línea temporal.
  async function resolverWayback(lista) {
    const pendientes = lista.filter((c) => c.fuente.type === 'wayback');
    if (!pendientes.length) return lista;
    let versiones = [];
    try {
      const r = await fetch(C.waybackConfig, { cache: 'no-store' });
      const cfg = await r.json();
      versiones = Object.keys(cfg).map((k) => {
        const m = /(\d{4})-(\d{2})-(\d{2})/.exec(cfg[k].itemTitle || '');
        return m && { num: k, fecha: new Date(+m[1], +m[2] - 1, +m[3]), titulo: m[0],
          url: cfg[k].itemURL.replace('{level}', '{z}').replace('{row}', '{y}').replace('{col}', '{x}') };
      }).filter(Boolean);
    } catch (e) {
      console.info('Sin catálogo Wayback de Esri:', e.message);
      return lista.filter((c) => c.fuente.type !== 'wayback');
    }
    pendientes.forEach((c) => {
      const [a, m] = c.fuente.fecha.split('-').map(Number);
      const objetivo = new Date(a, (m || 7) - 1, 15);
      let mejor = null;
      versiones.forEach((v) => {
        if (!mejor || Math.abs(v.fecha - objetivo) < Math.abs(mejor.fecha - objetivo)) mejor = v;
      });
      if (mejor) {
        c.fuente = { type: 'xyz', url: mejor.url };
        c.atribucion = (c.atribucion || '') + ' · versión ' + mejor.titulo;
      }
    });
    console.info('Versiones Wayback resueltas:', pendientes.map((c) => c.id + '→' + c.atribucion).join(', '));
    return lista.filter((c) => c.fuente.type !== 'wayback');
  }


  /* ---------- Carga de teselas (indicador) ---------- */
  let pendientes = 0;
  function engancharCarga(source) {
    const ind = $('#cargando');
    const upd = () => ind.classList.toggle('visible', pendientes > 0);
    source.on('tileloadstart', () => { pendientes++; upd(); });
    const fin = () => { pendientes = Math.max(0, pendientes - 1); upd(); };
    source.on('tileloadend', fin);
    source.on('tileloaderror', fin);
  }

  const esMovil = () => window.matchMedia('(max-width: 760px), (max-height: 500px)').matches;

  /* ---------- Mapa ---------- */
  function crearMapa() {
    view = new ol.View({
      center: ol.proj.fromLonLat(C.centro), zoom: C.zoom,
      minZoom: C.minZoom, maxZoom: C.maxZoom,
    });

    capaFondo = new ol.layer.Tile({
      className: 'capa-fondo', zIndex: 0, preload: 1,
      source: new ol.source.XYZ({ url: C.fondo.url, attributions: C.fondo.atribucion }),
    });
    capaCalles = new ol.layer.Tile({
      className: 'capa-calles', zIndex: 50, visible: false, opacity: 0.85,
      source: new ol.source.XYZ({ url: C.calles.url, attributions: C.calles.atribucion }),
    });

    capas.forEach((c, k) => {
      if (c.fuente.type === 'vacia') {
        // Pasos de recreación: no tienen imagen propia, lo dibuja la capa de perímetros
        c.layer = new ol.layer.Tile({ source: new ol.source.XYZ({ tileUrlFunction: () => undefined }), visible: false, zIndex: 10 });
      } else {
        const src = crearSource(c);
        engancharCarga(src);
        c.layer = new ol.layer.Tile({ source: src, visible: false, zIndex: 10, preload: 0 });
      }
      c.layer.set('idx', k);
    });

    // Todas las capas de la línea temporal en un grupo: así se ocultan de golpe con "Ver hoy"
    grupoHistorico = new ol.layer.Group({ layers: capas.map((c) => c.layer), zIndex: 10 });

    const srcPerimetros = fuenteGeojson(C.perimetros);
    srcPerimetros.setAttributions('Límites, puertas, hitos y barrios: recreación aproximada propia');
    capaPerimetros = new ol.layer.Vector({
      source: srcPerimetros, style: estiloPerimetros(srcPerimetros), zIndex: 40, declutter: true,
    });

    map = new ol.Map({
      target: 'mapa',
      view,
      layers: [capaFondo, grupoHistorico, capaPerimetros, capaCalles],
    });
    map.addControl(new ol.control.ScaleLine({ units: 'metric' }));
    // Atribuciones plegables en pantallas pequeñas
    map.getControls().forEach((ctl) => {
      if (ctl instanceof ol.control.Attribution) {
        const ajustar = () => { const m = esMovil(); ctl.setCollapsible(m); ctl.setCollapsed(m); };
        ajustar();
        window.matchMedia('(max-width: 760px), (max-height: 500px)').addEventListener('change', ajustar);
      }
    });
    map.on('moveend', guardarHash);
  }

  /* ---------- Línea temporal ---------- */
  function construirTimeline() {
    const n = capas.length;
    const slider = $('#slider');
    slider.min = 0; slider.max = n - 1; slider.step = 0.01;
    const marcas = $('#marcas');
    marcas.innerHTML = '';
    document.documentElement.style.setProperty('--n-marcas', n);
    capas.forEach((c, k) => {
      const m = document.createElement('button');
      m.className = 'marca ' + c.tipo + (k % 2 ? ' abajo' : '');
      m.style.left = (n > 1 ? (k / (n - 1)) * 100 : 0) + '%';
      m.title = c.titulo;
      m.innerHTML = '<span class="punto"></span><span class="txt">' + c.etiqueta + '</span>';
      m.addEventListener('click', () => { parar(); animarA(k); });
      marcas.appendChild(m);
    });
  }

  function aplicar(v) {
    if (estado.verHoy) verHoy(false);
    const n = capas.length;
    v = Math.max(0, Math.min(n - 1, v));
    estado.v = v;
    const i = Math.floor(v);
    const f = +(v - i).toFixed(3);
    capas.forEach((c, k) => {
      const L = c.layer;
      if (k === i) { L.setVisible(true); L.setOpacity(1); L.setZIndex(10); }
      else if (k === i + 1 && f > 0) { L.setVisible(true); L.setOpacity(f); L.setZIndex(11); }
      else L.setVisible(false);
    });
    $('#slider').value = v;
    const idx = f >= 0.5 ? i + 1 : i;
    if (idx !== estado.idxMostrado) mostrarInfo(idx);
  }

  /* ---------- Comparar con hoy ---------- */
  // Oculta la capa histórica y muestra la ortofoto actual en color; otro clic (o H) la devuelve.
  function verHoy(activar) {
    if (activar === estado.verHoy) return;
    estado.verHoy = activar;
    grupoHistorico.setVisible(!activar);
    document.body.classList.toggle('ver-hoy', activar);
    const b = $('#hoy');
    if (activar) {
      b.textContent = 'Ver ' + capas[estado.idxMostrado].etiqueta;
      b.title = 'Volver a ' + capas[estado.idxMostrado].titulo + ' (H)';
      $('#anio').textContent = 'Hoy';
    } else {
      b.textContent = 'Ver hoy';
      b.title = 'Comparar con la ortofoto actual (H)';
      mostrarInfo(estado.idxMostrado);
    }
    b.classList.toggle('activo', activar);
  }

  function mostrarInfo(idx) {
    estado.idxMostrado = idx;
    const c = capas[idx];
    $('#anio').textContent = c.etiqueta;
    $('#titulo').textContent = c.titulo;
    if (narrador) narrador.preparar($('#narrar'), c.id);
    estado.anio = c.anio;
    estado.tipo = c.tipo;
    if (capaPerimetros) capaPerimetros.changed();
    $('#leyenda-rec').hidden = !$('#chk-perimetros').checked;
    $('#leyenda-yac').hidden = c.anio >= 180;
    // Cada cambio de paso encuadra el límite vigente de esa época
    if (map && !estado.respetarVista && estado.idxEncuadrado !== idx) encuadrarRecinto(c, false, true);
    estado.idxEncuadrado = idx;
    const d = $('#descripcion');
    d.innerHTML = '';
    [].concat(c.descripcion || []).forEach((txt) => {
      const p = document.createElement('p');
      if (/^En el mapa:/.test(txt)) {
        p.className = 'en-mapa';
        p.innerHTML = '<b>En el mapa:</b> ';
        p.appendChild(document.createTextNode(txt.replace(/^En el mapa:\s*/, '')));
      } else p.textContent = txt;
      d.appendChild(p);
    });
    d.scrollTop = 0;
    $('.panel-cuerpo').scrollTop = 0;
    centrarMarca(idx);
    $('#fuente').textContent = c.atribucion || '';
    const t = $('#tipo');
    t.textContent = { plano: 'Plano histórico', foto: 'Fotografía aérea',
      recreacion: 'Recreación aproximada' }[c.tipo] || '';
    t.className = 'tipo ' + c.tipo;
    document.querySelectorAll('.marca').forEach((m, k) => m.classList.toggle('activa', k === idx));
    guardarHash();
  }

  // En móvil la línea temporal se desplaza: mantener visible el año activo
  function centrarMarca(idx) {
    const pista = $('.pista-scroll');
    const m = document.querySelectorAll('.marca')[idx];
    if (!pista || !m || pista.scrollWidth <= pista.clientWidth) return;
    const x = m.offsetLeft - pista.clientWidth / 2;
    pista.scrollTo({ left: x, behavior: estado.reproduciendo ? 'smooth' : 'auto' });
  }

  /* ---------- Animación y reproducción ---------- */
  let rafAnim = null;
  function animarA(objetivo, ms = 450) {
    cancelAnimationFrame(rafAnim);
    const desde = estado.v, t0 = performance.now();
    const paso = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      aplicar(desde + (objetivo - desde) * e);
      if (p < 1) rafAnim = requestAnimationFrame(paso);
    };
    rafAnim = requestAnimationFrame(paso);
  }

  // Iconos SVG (los caracteres ⏮ ▶ ⏭ se pintan como emoji en iOS)
  const icono = (d) => '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="' + d + '"/></svg>';
  const ICONO_PLAY = icono('M7 4.5v15L19.5 12z');
  const ICONO_PAUSA = icono('M6.5 5h4v14h-4zM13.5 5h4v14h-4z');
  let rafPlay = null, ultimo = 0, espera = 0;
  function reproducir() {
    const n = capas.length;
    if (estado.v >= n - 1) aplicar(0);
    estado.reproduciendo = true;
    $('#play').innerHTML = ICONO_PAUSA;
    $('#play').title = 'Pausa (espacio)';
    espera = C.pausaSeg;
    ultimo = performance.now();
    const tick = (t) => {
      if (!estado.reproduciendo) return;
      const dt = (t - ultimo) / 1000; ultimo = t;
      if (espera > 0) espera -= dt;
      else {
        const sig = Math.floor(estado.v + 1e-6) + 1;
        let v = estado.v + dt / C.transicionSeg;
        if (v >= sig) { v = sig; espera = C.pausaSeg; }
        aplicar(v);
        if (v >= n - 1) { parar(); return; }
      }
      rafPlay = requestAnimationFrame(tick);
    };
    rafPlay = requestAnimationFrame(tick);
  }
  function parar() {
    estado.reproduciendo = false;
    cancelAnimationFrame(rafPlay);
    $('#play').innerHTML = ICONO_PLAY;
    $('#play').title = 'Reproducir (espacio)';
  }

  /* ---------- Estado en la URL ---------- */
  let hashTimer = null;
  function guardarHash() {
    clearTimeout(hashTimer);
    hashTimer = setTimeout(() => {
      if (!view || estado.idxMostrado < 0) return;
      const [lon, lat] = ol.proj.toLonLat(view.getCenter());
      const h = 'capa=' + capas[estado.idxMostrado].id + '&z=' + view.getZoom().toFixed(2) +
                '&c=' + lon.toFixed(5) + ',' + lat.toFixed(5);
      history.replaceState(null, '', '#' + h);
    }, 300);
  }
  function leerHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    const id = p.get('capa');
    const idx = id ? capas.findIndex((c) => c.id === id) : -1;
    if (p.get('c')) {
      const [lon, lat] = p.get('c').split(',').map(Number);
      if (isFinite(lon) && isFinite(lat)) view.setCenter(ol.proj.fromLonLat([lon, lat]));
    }
    if (p.get('z') && isFinite(+p.get('z'))) view.setZoom(+p.get('z'));
    return idx;
  }

  /* ---------- Controles ---------- */
  function enlazarControles() {
    const slider = $('#slider');
    slider.addEventListener('input', () => { parar(); cancelAnimationFrame(rafAnim); aplicar(+slider.value); });
    slider.addEventListener('change', () => animarA(Math.round(+slider.value), 250));
    $('#play').addEventListener('click', () => (estado.reproduciendo ? parar() : reproducir()));
    $('#prev').addEventListener('click', () => { parar(); animarA(Math.max(0, Math.round(estado.v) - 1)); });
    $('#next').addEventListener('click', () => { parar(); animarA(Math.min(capas.length - 1, Math.round(estado.v) + 1)); });

    // Transparencia de la capa histórica (se aplica al grupo, así se mantiene al cambiar de año)
    $('#opacidad').addEventListener('input', (e) => {
      const o = +e.target.value / 100;
      grupoHistorico.setOpacity(o);
      $('#opacidad-valor').textContent = e.target.value + '%';
      document.body.classList.toggle('transparente', o < 1);
    });
    $('#opacidad').addEventListener('dblclick', (e) => { e.target.value = 100; e.target.dispatchEvent(new Event('input')); });
    $('#hoy').addEventListener('click', () => { parar(); verHoy(!estado.verHoy); });
    $('#chk-calles').addEventListener('change', (e) => capaCalles.setVisible(e.target.checked));
    $('#chk-perimetros').addEventListener('change', (e) => {
      capaPerimetros.setVisible(e.target.checked);
      $('#leyenda-rec').hidden = !e.target.checked;
    });

    const sel = $('#favoritos');
    C.favoritos.forEach((f, k) => sel.add(new Option(f.nombre, k)));
    sel.addEventListener('change', () => {
      const f = C.favoritos[+sel.value];
      if (f) view.animate({ center: ol.proj.fromLonLat(f.lonlat), zoom: f.zoom, duration: 900 });
      sel.selectedIndex = 0;
    });

    $('#plegar').addEventListener('click', () => document.body.classList.toggle('panel-plegado'));

    // Móvil: el panel es una hoja inferior; se abre tocando la cabecera o "Leer más"
    const alternarPanel = (abrir) => {
      const ab = typeof abrir === 'boolean' ? abrir : !document.body.classList.contains('panel-abierto');
      document.body.classList.toggle('panel-abierto', ab);
      $('#expandir').textContent = ab ? 'Leer menos' : 'Leer más';
      $('#expandir').setAttribute('aria-expanded', ab);
    };
    $('#panel-cabecera').addEventListener('click', () => { if (esMovil()) alternarPanel(); });
    $('#expandir').addEventListener('click', () => alternarPanel());
    $('#descripcion').addEventListener('click', () => { if (esMovil() && !document.body.classList.contains('panel-abierto')) alternarPanel(true); });
    map.on('pointerdown', () => { if (esMovil()) alternarPanel(false); });

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'SELECT' || e.target.id === 'opacidad' ||
          e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); $('#next').click(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); $('#prev').click(); }
      else if (e.key === ' ') { e.preventDefault(); $('#play').click(); }
      else if (e.key === 'h' || e.key === 'H') { e.preventDefault(); $('#hoy').click(); }
    });
  }

  /* ---------- Arranque ---------- */
  async function iniciar() {
    if (!window.ol) {
      document.body.innerHTML = '<p style="padding:2em">No se pudo cargar OpenLayers. Ejecuta <code>1_Descargar_recursos.bat</code> o revisa la conexión.</p>';
      return;
    }
    capas = (await resolverWayback(C.capas.slice())).sort((a, b) => a.anio - b.anio);
    narrador = window.SofiaComun ? new SofiaComun.Narrador('audio/') : null;
    if (window.SofiaComun) SofiaComun.enlacePortal(document.querySelector('.cabecera'));
    crearMapa();
    construirTimeline();
    enlazarControles();
    const idx = leerHash();
    estado.respetarVista = idx >= 0; // con enlace compartido, el primer paso no mueve el mapa
    aplicar(idx >= 0 ? idx : 0); // sin enlace compartido: empieza por el primer paso
    if (idx < 0) encuadrarInicio();
    estado.respetarVista = false;
  }

  /* Sin enlace compartido: encuadra el recinto del primer paso (Mayrit), dejando libre
     lo que tapan el panel y la cabecera */
  function encuadrarInicio() { encuadrarRecinto(capas[0], false); }

  // Encuadra el límite vigente del paso (o sus yacimientos si no hay límite), dejando libre
  // lo que tapan panel y cabecera. Con soloSiHaceFalta, no mueve el mapa si ya se ve entero.
  function encuadrarRecinto(c, soloSiHaceFalta, animar) {
    if (!c) return;
    const src = fuenteGeojson(C.perimetros);
    const encuadrar = () => {
      let geom;
      const vigente = perimetroVigente(src, c.anio);
      const f = src.getFeatures().find((x) => x.get('tipo') === 'recinto' && x.get('desde') === vigente);
      if (f) geom = f.getGeometry();
      else {
        // Paso sin límite (antes de la ciudad): encuadrar sus yacimientos
        const ext = ol.extent.createEmpty();
        src.getFeatures().filter((x) => x.get('grupo') === c.id).forEach((x) => ol.extent.extend(ext, x.getGeometry().getExtent()));
        if (ol.extent.isEmpty(ext)) return;
        geom = ol.geom.Polygon.fromExtent(ext);
      }
      const mapa = map.getTargetElement().getBoundingClientRect();
      const panel = document.querySelector('.panel').getBoundingClientRect();
      const plegado = document.body.classList.contains('panel-plegado');
      const pad = esMovil()
        ? [70, 30, Math.max(40, mapa.bottom - panel.top + 30), 30]
        : [80, plegado ? 80 : Math.max(40, mapa.right - panel.left + 40), 50, 80];
      if (soloSiHaceFalta) {
        const tam = map.getSize();
        const visible = view.calculateExtent([tam[0] - pad[1] - pad[3], tam[1] - pad[0] - pad[2]]);
        if (ol.extent.containsExtent(visible, geom.getExtent())) return;
      }
      view.cancelAnimations();
      view.fit(geom, { padding: pad, maxZoom: 17.5, duration: animar ? 700 : 0 });
    };
    if (src.getFeatures().length) encuadrar();
    else src.once('featuresloadend', encuadrar);
  }



  document.addEventListener('DOMContentLoaded', iniciar);
})();
