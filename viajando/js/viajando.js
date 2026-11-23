/* Viajando por Sofía · puntos de interés, rutas a pie entre ellos y posición GPS (OpenLayers UMD) */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const VEL_PASEO = 4.5; // km/h para tiempos a pie
  const CATEGORIAS = {
    religioso: 'Iglesias y templos', roma: 'Serdica romana', museo: 'Museos', monumento: 'Monumentos',
    edificio: 'Edificios históricos', parque: 'Parques', mercado: 'Mercados',
  };
  const BASES = {
    calles: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', atr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', clase: 'base-calles' },
    satelite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', atr: 'Imagen: Esri, Maxar, Earthstar Geographics' },
  };

  let map, view, capaBase, capaPuntos, capaEtiquetas, capaRutas, capaYo, narrador;
  const estado = { punto: null, ruta: null, filtro: null, yo: null, seguir: false, base: 'calles' };
  const puntos = [];          // { id, nombre, categoria, resumen, historia, coord(3857), num, feature }
  const porId = {};
  const rutasPorId = {};
  const esMovil = () => window.matchMedia('(max-width: 760px)').matches;

  /* ---------- utilidades ---------- */
  function metros(a, b) { // a, b en EPSG:3857 -> metros reales
    const ll1 = ol.proj.toLonLat(a), ll2 = ol.proj.toLonLat(b);
    const R = 6371000, r = Math.PI / 180;
    const df = (ll2[1] - ll1[1]) * r, dl = (ll2[0] - ll1[0]) * r;
    const h = Math.sin(df / 2) ** 2 + Math.cos(ll1[1] * r) * Math.cos(ll2[1] * r) * Math.sin(dl / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const txtDist = (m) => (m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km');
  const minutos = (m) => Math.max(1, Math.round(m / 1000 / VEL_PASEO * 60));
  const txtMin = (min) => (min < 60 ? min + ' min' : Math.floor(min / 60) + ' h ' + (min % 60) + ' min');

  /* ---------- estilos ---------- */
  const S = ol.style;
  const fuente = (peso, px) => peso + ' ' + px + 'px "Manrope", "Segoe UI", sans-serif';
  const cacheP = {}, cacheE = {};
  function estiloPunto(f) {
    const p = f.get('p');
    const sel = estado.punto === p;
    const oculto = estado.filtro && p.categoria !== estado.filtro;
    const k = [p.id, sel, oculto].join('|');
    if (!cacheP[k]) {
      cacheP[k] = new S.Style({
        image: new S.Circle({
          radius: sel ? 13 : 11,
          fill: new S.Fill({ color: oculto ? 'rgba(168,50,42,.35)' : '#a8322a' }),
          stroke: new S.Stroke({ color: sel ? '#e0b04a' : '#fff', width: sel ? 4 : 2.5 }),
        }),
        text: new S.Text({ text: String(p.num), font: fuente('700', 11), fill: new S.Fill({ color: '#fff' }) }),
        zIndex: sel ? 20 : 10,
      });
    }
    return cacheP[k];
  }
  function estiloEtiqueta(f, res) {
    const p = f.get('p');
    const sel = estado.punto === p;
    if ((estado.filtro && p.categoria !== estado.filtro) || (!sel && view.getZoomForResolution(res) < 14.5)) return null;
    const k = p.id + '|' + sel;
    if (!cacheE[k]) {
      cacheE[k] = new S.Style({
        text: new S.Text({
          text: p.nombre, offsetY: -24, font: fuente(sel ? '700' : '600', sel ? 13.5 : 12.5), fill: new S.Fill({ color: sel ? '#a8322a' : '#22262c' }),
          stroke: new S.Stroke({ color: '#fffaf1', width: 4 }),
        }),
        zIndex: sel ? 21 : 11,
      });
    }
    return cacheE[k];
  }
  // Rutas: red completa en dorado discontinuo, las del lugar elegido en turquesa y la seleccionada en carmesí animado
  let fase = 0;                       // desplazamiento del trazo animado
  const flecha = (() => {             // flecha blanca para el sentido de la marcha
    const c = document.createElement('canvas'); c.width = c.height = 20;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.strokeStyle = '#7a1f19'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(4, 4); g.lineTo(17, 10); g.lineTo(4, 16); g.lineTo(8, 10); g.closePath(); g.fill(); g.stroke();
    return c;
  })();
  function estiloRuta(f, res) {
    const r = f.get('r');
    const sel = estado.ruta === r;
    const delPunto = estado.punto && (r.desde === estado.punto.id || r.hasta === estado.punto.id);
    const bus = r.tipo === 'transporte';
    if (sel) {
      const geom = rutaOrientada(r);
      const est = [
        new S.Style({ geometry: geom, stroke: new S.Stroke({ color: '#fffaf1', width: 13, lineCap: 'round', lineJoin: 'round' }), zIndex: 40 }),
        new S.Style({ geometry: geom, stroke: new S.Stroke({ color: bus ? '#5c6f8a' : '#a8322a', width: 8, lineCap: 'round', lineJoin: 'round' }), zIndex: 41 }),
        new S.Style({ geometry: geom, stroke: new S.Stroke({ color: '#ffd9a8', width: 3, lineDash: [10, 16], lineDashOffset: -fase, lineCap: 'round' }), zIndex: 42 }),
      ];
      // flechas de sentido cada ~120 px de pantalla
      const coords = geom.getCoordinates(), paso = res * 120;
      let acum = 0;
      for (let i = 1; i < coords.length; i++) {
        const [x1, y1] = coords[i - 1], [x2, y2] = coords[i], L = Math.hypot(x2 - x1, y2 - y1);
        acum += L;
        if (acum >= paso && L > res * 8) {
          acum = 0;
          est.push(new S.Style({ geometry: new ol.geom.Point([(x1 + x2) / 2, (y1 + y2) / 2]), zIndex: 43,
            image: new S.Icon({ img: flecha, imgSize: [20, 20], scale: 0.8, rotation: -Math.atan2(y2 - y1, x2 - x1), rotateWithView: true }) }));
        }
      }
      return est;
    }
    if (delPunto) {
      return [new S.Style({ stroke: new S.Stroke({ color: '#fffaf1', width: 10, lineCap: 'round', lineJoin: 'round' }), zIndex: 30 }),
              new S.Style({ stroke: new S.Stroke({ color: bus ? '#5c6f8a' : '#1f6f77', width: 6, lineCap: 'round', lineJoin: 'round', lineDash: bus ? [2, 10] : undefined }), zIndex: 31 })];
    }
    if (estado.punto || estado.ruta) {   // resto de la red, en segundo plano pero reconocible
      return new S.Style({ stroke: new S.Stroke({ color: 'rgba(176,120,28,.6)', width: 2.5, lineCap: 'round', lineDash: bus ? [1, 8] : [7, 7] }), zIndex: 10 });
    }
    return [new S.Style({ stroke: new S.Stroke({ color: 'rgba(74,40,10,.8)', width: 6.5, lineCap: 'round' }), zIndex: 10 }),
            new S.Style({ stroke: new S.Stroke({ color: '#f2b538', width: 3.5, lineCap: 'round', lineDash: bus ? [1, 9] : [12, 7] }), zIndex: 11 })];
  }
  // Geometría de la ruta en el sentido de la marcha (desde el lugar abierto hacia el otro)
  function rutaOrientada(r) { return r.feature.getGeometry(); }   // ya viene ordenada de 'desde' a 'hasta'
  function animar() {
    if (!estado.ruta) return;
    fase = (fase + 0.8) % 26;
    capaRutas.changed();
    requestAnimationFrame(animar);
  }

  /* ---------- mapa ---------- */
  function crearMapa() {
    view = new ol.View({ center: ol.proj.fromLonLat([23.3260, 42.6950]), zoom: 15, minZoom: 11, maxZoom: 19 });
    capaBase = new ol.layer.Tile({ className: 'base-calles', source: new ol.source.XYZ({ url: BASES.calles.url, attributions: BASES.calles.atr, maxZoom: 19 }) });
    capaRutas = new ol.layer.Vector({ source: new ol.source.Vector(), style: estiloRuta });
    capaPuntos = new ol.layer.Vector({ source: new ol.source.Vector(), style: estiloPunto });
    capaEtiquetas = new ol.layer.Vector({ source: capaPuntos.getSource(), style: estiloEtiqueta, declutter: true });
    capaYo = new ol.layer.Vector({ source: new ol.source.Vector(), zIndex: 50 });
    map = new ol.Map({ target: 'mapa', view, layers: [capaBase, capaRutas, capaPuntos, capaEtiquetas, capaYo] });
    map.addControl(new ol.control.ScaleLine({ units: 'metric' }));

    map.on('singleclick', (e) => {
      let tocado = null;
      map.forEachFeatureAtPixel(e.pixel, (f) => { if (!tocado) tocado = f; }, { hitTolerance: 6, layerFilter: (l) => l !== capaYo && l !== capaEtiquetas });
      if (!tocado) return;
      if (tocado.get('p')) abrirPunto(tocado.get('p'));
      else if (tocado.get('r')) abrirRuta(tocado.get('r'), estado.punto ? estado.punto.id : estado.origen);
    });
    map.on('pointermove', (e) => {
      if (e.dragging) return;
      map.getTargetElement().style.cursor = map.hasFeatureAtPixel(e.pixel, { hitTolerance: 6, layerFilter: (l) => l !== capaYo && l !== capaEtiquetas }) ? 'pointer' : '';
    });
    map.on('pointerdrag', () => { estado.seguir = false; $('gps').classList.remove('activo'); if (estado.yo) $('gps').classList.add('activo'); });
  }

  function padding() {
    const m = map.getTargetElement().getBoundingClientRect();
    const p = $('panel').getBoundingClientRect();
    return esMovil() ? [80, 30, Math.max(40, m.bottom - p.top + 20), 30] : [80, Math.max(40, m.right - p.left + 30), 40, 70];
  }
  function encuadrar(ext, maxZoom) {
    view.cancelAnimations();
    view.fit(ext, { padding: padding(), maxZoom: maxZoom || 17, duration: 600 });
  }

  /* ---------- datos ---------- */
  async function cargar() {
    const fmt = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' });
    const gp = await (await fetch('datos/puntos.geojson', { cache: 'no-store' })).json();
    fmt.readFeatures(gp).forEach((f, i) => {
      const p = Object.assign({}, f.getProperties(), { num: i + 1, coord: f.getGeometry().getCoordinates(), feature: f, rutas: [] });
      delete p.geometry;
      f.set('p', p);
      puntos.push(p); porId[p.id] = p;
    });
    capaPuntos.getSource().addFeatures(puntos.map((p) => p.feature));
    try {
      const gr = await (await fetch('datos/rutas.geojson', { cache: 'no-store' })).json();
      fmt.readFeatures(gr).forEach((f) => {
        const r = Object.assign({}, f.getProperties(), { feature: f });
        delete r.geometry;
        if (!porId[r.desde] || !porId[r.hasta]) return;
        r.id = r.id || ('ruta-' + r.desde + '--' + r.hasta);
        rutasPorId[r.id] = r;
        f.set('r', r);
        porId[r.desde].rutas.push(r); porId[r.hasta].rutas.push(r);
        capaRutas.getSource().addFeature(f);
      });
    } catch (e) { console.info('Sin rutas todavía:', e.message); }
  }

  /* ---------- lista ---------- */
  function pintarFiltros() {
    const cont = $('filtros');
    cont.innerHTML = '';
    const usadas = Object.keys(CATEGORIAS).filter((c) => puntos.some((p) => p.categoria === c));
    [null].concat(usadas).forEach((c) => {
      const b = document.createElement('button');
      b.textContent = c ? CATEGORIAS[c] : 'Todos';
      b.className = estado.filtro === c ? 'activo' : '';
      b.onclick = () => { estado.filtro = c; pintarFiltros(); pintarLista(); capaPuntos.changed(); capaEtiquetas.changed(); };
      cont.appendChild(b);
    });
  }
  function pintarLista() {
    const ul = $('lista');
    ul.innerHTML = '';
    let lista = puntos.filter((p) => !estado.filtro || p.categoria === estado.filtro);
    if (estado.yo) lista = lista.slice().sort((a, b) => metros(estado.yo, a.coord) - metros(estado.yo, b.coord));
    lista.forEach((p) => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="num"></span><span><b></b><small></small></span><span class="dist"></span>';
      li.querySelector('.num').textContent = p.num;
      li.querySelector('b').textContent = p.nombre;
      li.querySelector('small').textContent = CATEGORIAS[p.categoria] || '';
      if (estado.yo) li.querySelector('.dist').textContent = txtDist(metros(estado.yo, p.coord));
      li.onclick = () => abrirPunto(p);
      ul.appendChild(li);
    });
  }

  /* ---------- ficha ---------- */
  function abrirPunto(p, sinMover) {
    estado.punto = p; estado.ruta = null; estado.origen = null;
    $('vista-ruta').hidden = true;
    document.body.classList.remove('historia-abierta');
    $('vista-lista').hidden = true; $('vista-ficha').hidden = false;
    $('f-categoria').textContent = CATEGORIAS[p.categoria] || '';
    $('f-nombre').textContent = p.nombre;
    $('f-resumen').textContent = p.resumen || '';
    const h = $('f-historia'); h.innerHTML = '';
    (p.historia || []).forEach((t) => { const el = document.createElement('p'); el.textContent = t; h.appendChild(el); });
    pintarDistanciaYo();
    pintarRutas(p);
    if (narrador) narrador.preparar($('narrar'), p.id);
    $('cuerpo').scrollTop = 0;
    if (esMovil()) $('panel').className = 'panel';
    capaPuntos.changed(); capaEtiquetas.changed(); capaRutas.changed();
    history.replaceState(null, '', '#' + p.id);
    if (!sinMover) {
      const ext = ol.extent.boundingExtent([p.coord]);
      p.rutas.filter((r) => r.tipo !== 'transporte').forEach((r) => ol.extent.extend(ext, r.feature.getGeometry().getExtent()));
      encuadrar(p.rutas.length ? ext : ol.extent.buffer(ext, 200), 17);
    }
  }
  function cerrarPunto() {
    estado.punto = null; estado.ruta = null; estado.origen = null;
    if (narrador) narrador.parar();
    $('vista-ficha').hidden = true; $('vista-ruta').hidden = true; $('vista-lista').hidden = false;
    capaPuntos.changed(); capaEtiquetas.changed(); capaRutas.changed();
    history.replaceState(null, '', location.pathname + location.search);
  }
  function pintarDistanciaYo() {
    const p = estado.punto, el = $('f-yo');
    if (!p || !estado.yo) { el.hidden = true; return; }
    const m = metros(estado.yo, p.coord);
    el.hidden = false;
    el.textContent = 'A ' + txtDist(m) + ' de ti en línea recta · unos ' + txtMin(minutos(m * 1.3)) + ' andando';
  }
  function pintarRutas(p) {
    const ul = $('f-rutas'); ul.innerHTML = '';
    $('f-sin-rutas').hidden = p.rutas.length > 0;
    p.rutas.slice().sort((a, b) => (a.tipo === 'transporte') - (b.tipo === 'transporte') || a.distancia - b.distancia).forEach((r) => {
      const otro = porId[r.desde === p.id ? r.hasta : r.desde];
      const li = document.createElement('li');
      if (r.tipo === 'transporte') li.className = 'transporte';
      li.innerHTML = '<div class="ruta-cab"><span><b></b><br><small></small></span><span class="t"><strong></strong></span></div>';
      li.querySelector('b').textContent = otro.nombre;
      li.querySelector('small').textContent = r.nombre || '';
      li.querySelector('strong').textContent = r.tipo === 'transporte' ? 'En transporte' : txtMin(r.minutos || minutos(r.distancia));
      li.querySelector('.t').appendChild(document.createTextNode(txtDist(r.distancia)));
      li.onclick = () => abrirRuta(r, p.id);
      ul.appendChild(li);
    });
  }
  // Ficha propia de una ruta; origen = id del lugar desde el que se recorre
  function abrirRuta(r, origen, sinMover) {
    if (narrador) narrador.parar();
    estado.ruta = r;
    estado.origen = origen && (origen === r.desde || origen === r.hasta) ? origen : r.desde;
    // La ruta es una entidad con sentido propio (desde -> hasta), como su texto; el origen solo sirve para volver con la ✕
    const a = porId[r.desde], b = porId[r.hasta];
    $('vista-lista').hidden = true; $('vista-ficha').hidden = true; $('vista-ruta').hidden = false;
    $('r-tipo').textContent = r.tipo === 'transporte' ? 'Mejor en transporte' : 'Ruta a pie';
    $('r-nombre').textContent = r.nombre || (a.nombre + ' – ' + b.nombre);
    $('r-desde').textContent = a.nombre; $('r-hasta').textContent = b.nombre;
    $('r-min').textContent = r.tipo === 'transporte' ? (r.transporte || 'Transporte público') : txtMin(r.minutos || minutos(r.distancia));
    $('r-dist').textContent = (r.tipo === 'transporte' ? 'a ' : 'andando · ') + txtDist(r.distancia);
    const t = $('r-texto'); t.innerHTML = '';
    (r.descripcion || []).forEach((x) => { const el = document.createElement('p'); el.textContent = x; t.appendChild(el); });
    const ul = $('r-camino'); ul.innerHTML = '';
    (r.camino || []).forEach((x) => { const el = document.createElement('li'); el.textContent = x; ul.appendChild(el); });
    $('r-camino-tit').hidden = !(r.camino && r.camino.length);
    $('r-ir-desde').textContent = 'Ir a ' + b.nombre; $('r-ir-desde').onclick = () => abrirPunto(b);
    $('r-ir-hasta').textContent = 'Ir a ' + a.nombre; $('r-ir-hasta').onclick = () => abrirPunto(a);
    if (narrador) narrador.preparar($('narrar-ruta'), r.id);
    $('cuerpo').scrollTop = 0;
    if (esMovil()) $('panel').className = 'panel';
    estado.punto = null; inversasLimpias();
    capaPuntos.changed(); capaEtiquetas.changed(); capaRutas.changed();
    history.replaceState(null, '', '#' + r.id + (estado.origen !== r.desde ? '~' + estado.origen : ''));
    requestAnimationFrame(animar);
    if (!sinMover) encuadrar(r.feature.getGeometry().getExtent(), 17.5);
  }
  function inversasLimpias() { /* las geometrías invertidas se reutilizan; nada que limpiar */ }
  // ✕ de la ficha de ruta: deja de seleccionarla y vuelve al lugar de origen
  function cerrarRuta() {
    const origen = estado.origen && porId[estado.origen];
    estado.ruta = null; estado.origen = null;
    if (narrador) narrador.parar();
    $('vista-ruta').hidden = true;
    if (origen) abrirPunto(origen, true);
    else { $('vista-lista').hidden = false; capaRutas.changed(); history.replaceState(null, '', location.pathname + location.search); }
  }

  /* ---------- GPS ---------- */
  let vigilancia = null;
  function activarGPS() {
    if (!navigator.geolocation) { alertaSuave('Tu navegador no permite conocer la ubicación.'); return; }
    if (estado.yo) { estado.seguir = true; view.animate({ center: estado.yo, zoom: Math.max(view.getZoom(), 16), duration: 500 }); return; }
    $('gps').classList.add('buscando');
    estado.seguir = true;
    vigilancia = navigator.geolocation.watchPosition((pos) => {
      const c = ol.proj.fromLonLat([pos.coords.longitude, pos.coords.latitude]);
      const primera = !estado.yo;
      estado.yo = c;
      const factor = 1 / Math.cos(pos.coords.latitude * Math.PI / 180); // metros reales -> unidades 3857
      const src = capaYo.getSource(); src.clear();
      const prec = new ol.Feature(new ol.geom.Circle(c, Math.min(pos.coords.accuracy, 500) * factor));
      prec.setStyle(new S.Style({ fill: new S.Fill({ color: 'rgba(47,127,134,.15)' }), stroke: new S.Stroke({ color: 'rgba(47,127,134,.5)', width: 1 }) }));
      const yo = new ol.Feature(new ol.geom.Point(c));
      yo.setStyle(new S.Style({ image: new S.Circle({ radius: 8, fill: new S.Fill({ color: '#2f7f86' }), stroke: new S.Stroke({ color: '#fff', width: 3 }) }) }));
      src.addFeatures([prec, yo]);
      $('gps').classList.remove('buscando'); $('gps').classList.add('activo');
      if (primera || estado.seguir) view.animate({ center: c, zoom: primera ? Math.max(view.getZoom(), 16) : view.getZoom(), duration: 500 });
      pintarDistanciaYo();
      if (primera) pintarLista();
    }, (err) => {
      $('gps').classList.remove('buscando');
      alertaSuave(err.code === 1 ? 'Has denegado el acceso a la ubicación. Puedes activarlo en los permisos del navegador.' : 'No se ha podido obtener tu ubicación.');
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
  }
  function alertaSuave(txt) {
    const d = document.createElement('div');
    d.textContent = txt;
    d.style.cssText = 'position:absolute;left:50%;top:70px;transform:translateX(-50%);background:#22262c;color:#fff;padding:8px 14px;border-radius:10px;font-size:13px;z-index:99;max-width:90%;';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 4000);
  }

  /* ---------- controles ---------- */
  function enlazar() {
    $('volver-lista').onclick = cerrarPunto;
    $('cerrar-ruta').onclick = cerrarRuta;
    $('leer-mas').onclick = () => document.body.classList.add('historia-abierta');
    $('gps').onclick = activarGPS;
    $('capa').onclick = () => {
      estado.base = estado.base === 'calles' ? 'satelite' : 'calles';
      const b = BASES[estado.base];
      capaBase.setSource(new ol.source.XYZ({ url: b.url, attributions: b.atr, maxZoom: 19 }));
      map.getTargetElement().classList.toggle('satelite', estado.base === 'satelite');
      $('capa').title = estado.base === 'calles' ? 'Cambiar a satélite' : 'Cambiar a mapa de calles';
      $('capa').classList.toggle('activo', estado.base === 'satelite');
    };
    // Hoja inferior en móvil: el tirador alterna entre bajo, medio y alto
    $('tirador').onclick = () => {
      const p = $('panel');
      p.className = p.classList.contains('alto') ? 'panel bajo' : p.classList.contains('bajo') ? 'panel' : 'panel alto';
    };
    window.addEventListener('hashchange', irAlHash);
  }

  // #lugar  o  #ruta-a--b  (opcionalmente ~origen)
  function irAlHash() {
    const [h, origen] = decodeURIComponent(location.hash.slice(1)).split('~');
    if (porId[h]) { if (porId[h] !== estado.punto) abrirPunto(porId[h]); return true; }
    if (rutasPorId[h]) { if (rutasPorId[h] !== estado.ruta) abrirRuta(rutasPorId[h], origen); return true; }
    return false;
  }

  async function iniciar() {
    if (!window.ol) { document.body.innerHTML = '<p style="padding:2em">No se pudo cargar OpenLayers.</p>'; return; }
    if (window.SofiaComun) {
      SofiaComun.enlacePortal(document.querySelector('.cabecera'));
      narrador = new SofiaComun.Narrador('audio/');
    }
    crearMapa();
    enlazar();
    await cargar();
    pintarFiltros(); pintarLista();
    if (!irAlHash()) {   // vista inicial: el centro (los lugares a más de 3 km quedan fuera del encuadre)
      const c = ol.proj.fromLonLat([23.326, 42.695]);
      encuadrar(ol.extent.boundingExtent(puntos.filter((p) => metros(p.coord, c) < 3000).map((p) => p.coord)), 16);
    }
  }
  document.addEventListener('DOMContentLoaded', iniciar);
})();
