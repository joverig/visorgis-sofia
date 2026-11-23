/* Explora Sofía · lugares (principales y secundarios), red de rutas a pie en los dos sentidos,
   lugares visitados y posición GPS (OpenLayers UMD) */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const VEL_PASEO = 4.5; // km/h para tiempos a pie
  const CATEGORIAS = {
    religioso: 'Iglesias y templos', roma: 'Serdica romana', museo: 'Museos', monumento: 'Monumentos',
    edificio: 'Edificios históricos', parque: 'Parques', mercado: 'Mercados',
    temporada: 'Solo en diciembre', visita: 'Visitas guiadas', plovdiv: 'Plovdiv (excursión)',
  };
  // Colores para distinguir los caminos que salen de un lugar (paleta sobria, legible sobre el papel)
  const PALETA = ['#8c2f39', '#2f5d7c', '#5f7a34', '#a8711c', '#6b4a7e', '#2f7f86', '#7a5a3a'];

  let panelM, capaEtqRutas;
  let map, view, bases, capaPuntos, capaEtiquetas, capaRutas, capaYo, narrador;
  const estado = { punto: null, ruta: null, sentido: 'ida', origen: null, filtro: null, filtroVisita: null, yo: null, seguir: false, base: 'calles' };

  /* ---------- lugares visitados: se guardan solo en este navegador (localStorage) ---------- */
  // Almacén compartido con el Itinerario (SofiaComun.visitados)
  const V = SofiaComun.visitados;
  const esVisitado = (p) => V.tiene(p.id);
  const puntos = [];            // { id, nombre, categoria, nivel, resumen, historia, coord(3857), num, feature, rutas[] }
  const porId = {};
  const rutasPorId = {};        // 'ruta-a--b' -> { r, sentido }
  const colorRuta = new Map();  // ruta -> color mientras hay un lugar abierto
  const esMovil = () => window.matchMedia('(max-width: 760px)').matches;
  const esPrincipal = (p) => p.nivel !== 'secundario';

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
  const zoomDe = (res) => Math.log2(156543.03392804097 / res);

  const S = ol.style;
  const fuente = (peso, px, extra) => (extra ? extra + ' ' : '') + peso + ' ' + px + 'px "Manrope", "Segoe UI", sans-serif';

  /* ---------- estilos de lugares ---------- */
  const cacheP = {}, cacheE = {};
  function estiloPunto(f) {
    const p = f.get('p');
    const sel = estado.punto === p;
    const parada = estado.ruta && (estado.ruta.paradas || []).includes(p.id);
    const oculto = !pasaFiltros(p);
    const vis = esVisitado(p);
    const prin = esPrincipal(p);
    const sobre = estado.sobre === p;
    const k = [p.id, sel, oculto, vis, parada, sobre].join('|');
    if (!cacheP[k]) {
      const a = oculto ? 0.35 : 1;
      if (prin) {
        const color = vis ? `rgba(95,122,52,${0.88 * a})` : `rgba(168,50,42,${a})`;
        cacheP[k] = new S.Style({
          image: new S.Circle({ radius: sel ? 13 : sobre ? 13 : (vis ? 10 : 11), fill: new S.Fill({ color }), stroke: new S.Stroke({ color: sel || sobre ? '#e0b04a' : '#fff', width: sel || sobre ? 4 : 2.5 }) }),
          text: new S.Text({ text: vis ? '✓' : String(p.num), font: fuente('700', vis ? 13 : 11), fill: new S.Fill({ color: '#fff' }) }),
          zIndex: sel ? 20 : 10,
        });
      } else {
        const color = vis ? `rgba(95,122,52,${0.85 * a})` : `rgba(184,134,43,${a})`;
        cacheP[k] = new S.Style({
          image: new S.Circle({ radius: sel || sobre ? 9 : parada ? 8 : 6, fill: new S.Fill({ color }), stroke: new S.Stroke({ color: sel || sobre ? '#a8322a' : '#fff', width: sel || parada || sobre ? 3 : 2 }) }),
          text: vis ? new S.Text({ text: '✓', font: fuente('700', 9), fill: new S.Fill({ color: '#fff' }) }) : undefined,
          zIndex: sel ? 19 : parada ? 12 : 8,
        });
      }
    }
    return cacheP[k];
  }
  function estiloEtiqueta(f, res) {
    const p = f.get('p');
    const sel = estado.punto === p;
    const parada = estado.ruta && (estado.ruta.paradas || []).includes(p.id);
    const prin = esPrincipal(p);
    if (!pasaFiltros(p) || (!sel && !parada && zoomDe(res) < (prin ? 14.5 : 15.8))) return null;
    const k = p.id + '|' + sel + '|' + parada;
    if (!cacheE[k]) {
      cacheE[k] = new S.Style({
        text: new S.Text({
          text: p.nombre, offsetY: prin ? -24 : -16,
          font: prin ? fuente(sel ? '700' : '600', sel ? 13.5 : 12.5) : fuente(sel ? '700' : '500', sel ? 12.5 : 11.5, 'italic'),
          fill: new S.Fill({ color: sel ? '#a8322a' : prin ? '#22262c' : '#5a5246' }),
          stroke: new S.Stroke({ color: '#fffaf1', width: 4 }),
        }),
        zIndex: sel ? 21 : prin ? 11 : 9,
      });
    }
    return cacheE[k];
  }

  /* ---------- estilos de rutas ---------- */
  // Red general: trazo fino punteado a pluma; caminos del lugar abierto: un color por camino;
  // ruta seleccionada: carmesí con contorno, flechas de sentido y trazo animado
  let fase = 0;
  const flecha = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 20;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.strokeStyle = '#7a1f19'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(4, 4); g.lineTo(17, 10); g.lineTo(4, 16); g.lineTo(8, 10); g.closePath(); g.fill(); g.stroke();
    return c;
  })();
  function geomSentido(r, sentido) {
    if (sentido !== 'vuelta') return r.feature.getGeometry();
    if (!r.inversa) r.inversa = new ol.geom.LineString(r.feature.getGeometry().getCoordinates().slice().reverse());
    return r.inversa;
  }
  function estiloRuta(f, res) {
    const r = f.get('r');
    const bus = r.tipo === 'transporte';
    if (estado.ruta === r) {
      const geom = geomSentido(r, estado.sentido);
      const est = [
        new S.Style({ geometry: geom, stroke: new S.Stroke({ color: '#fffaf1', width: 12, lineCap: 'round', lineJoin: 'round' }), zIndex: 40 }),
        new S.Style({ geometry: geom, stroke: new S.Stroke({ color: bus ? '#5c6f8a' : '#a8322a', width: 7, lineCap: 'round', lineJoin: 'round' }), zIndex: 41 }),
        new S.Style({ geometry: geom, stroke: new S.Stroke({ color: '#ffd9a8', width: 2.5, lineDash: [10, 16], lineDashOffset: -fase, lineCap: 'round' }), zIndex: 42 }),
      ];
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
    if (estado.sobre === r) {
      return [new S.Style({ stroke: new S.Stroke({ color: '#fffaf1', width: 11, lineCap: 'round', lineJoin: 'round' }), zIndex: 35 }),
              new S.Style({ stroke: new S.Stroke({ color: 'rgba(168,50,42,.9)', width: 6, lineCap: 'round', lineJoin: 'round', lineDash: bus ? [9, 8] : undefined }), zIndex: 36 })];
    }
    const color = colorRuta.get(r);
    if (color) {
      return [new S.Style({ stroke: new S.Stroke({ color: 'rgba(255,250,241,.95)', width: 8, lineCap: 'round', lineJoin: 'round' }), zIndex: 30 }),
              new S.Style({ stroke: new S.Stroke({ color, width: 4.5, lineCap: 'round', lineJoin: 'round', lineDash: bus ? [2, 9] : undefined }), zIndex: 31 })];
    }
    const segundoPlano = estado.punto || estado.ruta;
    const hecho = V.tiene(r.desde) && V.tiene(r.hasta);
    return estiloRed(segundoPlano ? 'fondo' : hecho ? 'hecho' : 'normal', bus);
  }
  // Red de caminos sin resaltar: punteado grueso de tinta con halo de papel, bien visible sobre el mapa
  const cacheRed = {};
  function estiloRed(modo, bus) {
    const k = modo + bus;
    if (!cacheRed[k]) {
      const tinta = modo === 'fondo' ? 'rgba(110,56,40,.38)' : modo === 'hecho' ? 'rgba(95,122,52,.85)' : 'rgba(110,56,40,.82)';
      cacheRed[k] = [new S.Style({ stroke: new S.Stroke({ color: 'rgba(255,250,241,.9)', width: 7, lineCap: 'round', lineJoin: 'round' }), zIndex: 9 }),
        new S.Style({ stroke: new S.Stroke({ color: tinta, width: 3.2, lineCap: 'round', lineJoin: 'round', lineDash: bus ? [9, 8] : [0.1, 7] }), zIndex: 10 })];
    }
    return cacheRed[k];
  }
  function animar() {
    if (!estado.ruta) return;
    fase = (fase + 0.8) % 26;
    capaRutas.changed();
    requestAnimationFrame(animar);
  }


  // Etiqueta de duración en mitad de cada camino: invita a tocarlo
  const cacheER = {};
  function estiloEtqRuta(f, res) {
    const r = f.get('r');
    const sel = estado.ruta === r, sobre = estado.sobre === r, color = colorRuta.get(r);
    if (!sel && !sobre && !color && zoomDe(res) < 15.3) return null;
    if (estado.ruta && !sel) return null;
    const bus = r.tipo === 'transporte';
    const k = r.id + sel + sobre + (color || '');
    if (!cacheER[k]) {
      const txt = (bus ? '🚇 ' : '🚶 ') + (bus ? 'transporte' : txtMin(r.minutos || minutos(r.distancia)));
      const fondo = sel || sobre ? '#a8322a' : color || '#fffaf1';
      cacheER[k] = new S.Style({ text: new S.Text({ text: txt, font: fuente('700', 11.5), fill: new S.Fill({ color: sel || sobre || color ? '#fff' : '#5a3a2c' }),
        backgroundFill: new S.Fill({ color: fondo }), backgroundStroke: new S.Stroke({ color: sel || sobre || color ? '#fff' : 'rgba(110,56,40,.55)', width: 1.5 }),
        padding: [3, 7, 2, 7] }), zIndex: sel ? 45 : 25 });
    }
    return cacheER[k];
  }
  function ponerSobre(obj) {
    if (estado.sobre === obj) return;
    estado.sobre = obj;
    document.querySelectorAll('.lista li.sobre').forEach((li) => li.classList.remove('sobre'));
    if (obj && obj.id && porId[obj.id] === obj) { const li = document.querySelector('.lista li[data-id="' + obj.id + '"]'); if (li) li.classList.add('sobre'); }
    refrescarMapa();
  }
  // Tocar el mapa vacío: deselecciona; si no hay nada seleccionado, en el móvil pliega el panel para ver más mapa
  function tocarVacio() {
    if (estado.ruta) cerrarRuta();
    else if (estado.punto) cerrarPunto();
    else if (esMovil()) panelM.plegar();
  }
  const LEYENDA = '<ul>' +
    '<li><span class="sim"><svg width="26" height="26"><circle cx="13" cy="13" r="10" fill="#a8322a" stroke="#fff" stroke-width="2.5"/><text x="13" y="17" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">1</text></svg></span>Lugar imprescindible: tócalo para ver su historia y los caminos que salen de él</li>' +
    '<li><span class="sim"><svg width="20" height="20"><circle cx="10" cy="10" r="6" fill="#b8862b" stroke="#fff" stroke-width="2"/></svg></span>Lugar secundario, de paso en los caminos</li>' +
    '<li><span class="sim"><svg width="26" height="26"><circle cx="13" cy="13" r="10" fill="#5f7a34" stroke="#fff" stroke-width="2.5"/><text x="13" y="17" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">✓</text></svg></span>Ya visitado (también se marca desde el Itinerario)</li>' +
    '<li><span class="sim"><svg width="40" height="12"><path d="M2 6h36" stroke="#fffaf1" stroke-width="7" stroke-linecap="round"/><path d="M2 6h36" stroke="#6e3828" stroke-width="3.2" stroke-dasharray="0.1 7" stroke-linecap="round"/></svg></span>Camino a pie: tócalo (o su etiqueta de minutos) para ver la ruta narrada</li>' +
    '<li><span class="sim"><svg width="40" height="12"><path d="M2 6h36" stroke="#a8322a" stroke-width="6" stroke-linecap="round"/></svg></span>Camino seleccionado, con flechas en el sentido de la marcha</li>' +
    '<li><span class="sim" style="font-weight:700;color:#2f5d7c">❄</span>Planes que solo existen en diciembre</li>' +
    '</ul><p>Toca el mapa vacío para cerrar la ficha. En el móvil, arrastra o toca la barrita del panel para ver más mapa.</p>';

  /* ---------- mapa ---------- */
  function crearMapa() {
    view = new ol.View({ center: ol.proj.fromLonLat([23.3260, 42.6950]), zoom: 15, minZoom: SofiaComun.ZOOM_MIN, maxZoom: 19 });
    capaRutas = new ol.layer.Vector({ source: new ol.source.Vector(), style: estiloRuta });
    capaPuntos = new ol.layer.Vector({ source: new ol.source.Vector(), style: estiloPunto });
    capaEtiquetas = new ol.layer.Vector({ source: capaPuntos.getSource(), style: estiloEtiqueta, declutter: true });
    capaYo = new ol.layer.Vector({ source: new ol.source.Vector(), zIndex: 50 });
    capaEtqRutas = new ol.layer.Vector({ source: new ol.source.Vector(), style: estiloEtqRuta, declutter: true });
    map = new ol.Map({ target: 'mapa', view, layers: [capaRutas, capaEtqRutas, capaPuntos, capaEtiquetas, capaYo] });
    map.addControl(new ol.control.ScaleLine({ units: 'metric' }));
    bases = SofiaComun.basesMapa(map);

    const tocable = (l) => l === capaPuntos || l === capaRutas || l === capaEtqRutas;
    const tolerancia = () => (SofiaComun.esTactil() ? 12 : 6);
    const queHay = (px) => {
      let tocado = null;
      map.forEachFeatureAtPixel(px, (f) => { if (!tocado || (f.get('p') && !tocado.get('p'))) tocado = f; }, { hitTolerance: tolerancia(), layerFilter: tocable });
      return tocado;
    };
    map.on('singleclick', (e) => {
      const tocado = queHay(e.pixel);
      if (!tocado) { tocarVacio(); return; }
      if (tocado.get('p')) abrirPunto(tocado.get('p'));
      else if (tocado.get('r')) {
        const r = tocado.get('r');
        const sentido = estado.punto && r.hasta === estado.punto.id ? 'vuelta' : 'ida';
        abrirRuta(r, sentido, estado.punto ? estado.punto.id : estado.origen);
      }
    });
    const flotante = SofiaComun.etiquetaFlotante(map);
    map.on('pointermove', (e) => {
      if (e.dragging || SofiaComun.esTactil()) return;
      const f = queHay(e.pixel);
      map.getTargetElement().style.cursor = f ? 'pointer' : '';
      const obj = f ? (f.get('p') || f.get('r')) : null;
      ponerSobre(obj);
      if (!obj) { flotante.ocultar(); return; }
      if (obj.nombre && f.get('p')) flotante.mostrar(e.pixel, obj.nombre + ' · toca para ver su historia');
      else { const s = sentidoDe(obj, 'ida'); flotante.mostrar(e.pixel, s.a.nombre + ' ↔ ' + s.b.nombre + ' · ' + (obj.tipo === 'transporte' ? 'en transporte' : txtMin(obj.minutos || minutos(obj.distancia)))); }
    });
    map.getViewport().addEventListener('mouseleave', () => { flotante.ocultar(); ponerSobre(null); });
    map.on('pointerdrag', () => { estado.seguir = false; });
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
    let n = 0;
    fmt.readFeatures(gp).forEach((f) => {
      const p = Object.assign({}, f.getProperties(), { coord: f.getGeometry().getCoordinates(), feature: f, rutas: [] });
      delete p.geometry;
      if (esPrincipal(p)) p.num = ++n;
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
        r.id = 'ruta-' + r.desde + '--' + r.hasta;
        rutasPorId[r.id] = { r, sentido: 'ida' };
        rutasPorId['ruta-' + r.hasta + '--' + r.desde] = { r, sentido: 'vuelta' };
        f.set('r', r);
        porId[r.desde].rutas.push(r); porId[r.hasta].rutas.push(r);
        (r.paradas || []).forEach((id) => porId[id] && porId[id].rutas.push(r));
        capaRutas.getSource().addFeature(f);
        const g = f.getGeometry(), et = new ol.Feature(new ol.geom.Point(g.getCoordinateAt(0.5)));
        et.set('r', r); capaEtqRutas.getSource().addFeature(et);
      });
    } catch (e) { console.info('Sin rutas todavía:', e.message); }
  }
  // Datos de una ruta en un sentido: textos, id (para el audio y el enlace), extremos y paradas en orden
  function sentidoDe(r, sentido) {
    const ida = sentido !== 'vuelta';
    const t = (ida ? r.ida : r.vuelta) || r.ida || {};
    return {
      id: ida ? 'ruta-' + r.desde + '--' + r.hasta : 'ruta-' + r.hasta + '--' + r.desde,
      a: porId[ida ? r.desde : r.hasta], b: porId[ida ? r.hasta : r.desde],
      paradas: (ida ? (r.paradas || []) : (r.paradas || []).slice().reverse()).map((id) => porId[id]).filter(Boolean),
      nombre: t.nombre, descripcion: t.descripcion || [], camino: t.camino || [],
    };
  }

  /* ---------- lista ---------- */
  function pasaFiltros(p) {
    if (estado.filtro && p.categoria !== estado.filtro) return false;
    if (estado.filtroVisita === 'pendientes' && esVisitado(p)) return false;
    if (estado.filtroVisita === 'visitados' && !esVisitado(p)) return false;
    return true;
  }
  function refrescarMapa() { capaPuntos.changed(); capaEtiquetas.changed(); capaRutas.changed(); if (capaEtqRutas) capaEtqRutas.changed(); }
  function pintarProgreso() {
    const n = puntos.filter(esVisitado).length;
    $('prog-n').textContent = n; $('prog-total').textContent = puntos.length;
    $('prog-barra').style.width = (100 * n / puntos.length) + '%';
    $('compartir').hidden = n === 0;
    const cont = $('filtros-estado'); cont.innerHTML = '';
    [[null, 'Todos'], ['pendientes', 'Pendientes'], ['visitados', 'Visitados (' + n + ')']].forEach(([v, t]) => {
      const b = document.createElement('button');
      b.textContent = t; b.className = estado.filtroVisita === v ? 'activo' : '';
      b.onclick = () => { estado.filtroVisita = v; pintarProgreso(); pintarLista(); refrescarMapa(); };
      cont.appendChild(b);
    });
  }
  function marcarVisitado(p, valor) {
    V.poner(p.id, valor);
    pintarBotonVisitado(); pintarProgreso(); pintarLista(); refrescarMapa();
  }
  function pintarBotonVisitado() {
    const p = estado.punto, b = $('visitado');
    if (!p) return;
    const v = esVisitado(p);
    b.setAttribute('aria-pressed', String(v));
    b.textContent = v ? 'Visitado' : 'Marcar como visitado';
    b.title = v ? 'Pulsa para desmarcarlo' : 'Guárdalo en este navegador como lugar visitado';
  }
  async function compartirProgreso() {
    const ids = puntos.filter(esVisitado).map((p) => p.id);
    const url = location.origin + location.pathname + '#visitados=' + ids.join(',');
    const texto = 'Mis lugares visitados en Sofía (' + ids.length + ' de ' + puntos.length + ')';
    try {
      if (navigator.share && esMovil()) { await navigator.share({ title: 'Explora Sofía', text: texto, url }); return; }
      await navigator.clipboard.writeText(url);
      alertaSuave('Enlace copiado. Ábrelo en otro dispositivo para llevar allí tus lugares visitados.');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      prompt('Copia este enlace:', url);
    }
  }
  function importarVisitados(lista) {
    const nuevos = lista.split(',').map((x) => x.trim()).filter((id) => porId[id] && !V.tiene(id));
    nuevos.forEach((id) => V.set.add(id));
    V.guardar();
    history.replaceState(null, '', location.pathname + location.search);
    alertaSuave(nuevos.length ? 'Se han añadido ' + nuevos.length + ' lugares visitados.' : 'Ya tenías todos esos lugares marcados.');
    pintarProgreso(); pintarLista(); refrescarMapa();
  }
  function pintarFiltros() {
    const cont = $('filtros');
    cont.innerHTML = '';
    const usadas = Object.keys(CATEGORIAS).filter((c) => puntos.some((p) => p.categoria === c));
    [null].concat(usadas).forEach((c) => {
      const b = document.createElement('button');
      b.textContent = c ? CATEGORIAS[c] : 'Todos los tipos';
      b.className = estado.filtro === c ? 'activo' : '';
      b.onclick = () => { estado.filtro = c; pintarFiltros(); pintarLista(); refrescarMapa(); };
      cont.appendChild(b);
    });
  }
  function pintarLista() {
    const ul = $('lista');
    ul.innerHTML = '';
    let lista = puntos.filter(pasaFiltros);
    if (estado.yo) lista = lista.slice().sort((a, b) => metros(estado.yo, a.coord) - metros(estado.yo, b.coord));
    [['Imprescindibles', lista.filter(esPrincipal)], ['También interesantes', lista.filter((p) => !esPrincipal(p))]].forEach(([titulo, grupo]) => {
      if (!grupo.length) return;
      const h = document.createElement('li'); h.className = 'grupo'; h.textContent = titulo; ul.appendChild(h);
      grupo.forEach((p) => {
        const li = document.createElement('li');
        li.innerHTML = '<span class="num"></span><span><b></b><small></small></span><span class="dist"></span>';
        const prin = esPrincipal(p);
        li.querySelector('.num').textContent = esVisitado(p) ? '✓' : prin ? p.num : '';
        li.className = (prin ? '' : 'secundario ') + (esVisitado(p) ? 'hecho' : '');
        li.querySelector('b').textContent = p.nombre;
        li.querySelector('small').textContent = (CATEGORIAS[p.categoria] || '') + (p.temporada && p.categoria !== 'temporada' ? ' · solo en diciembre' : '');
        if (estado.yo) li.querySelector('.dist').textContent = txtDist(metros(estado.yo, p.coord));
        li.onclick = () => abrirPunto(p);
        li.dataset.id = p.id;
        li.onmouseenter = () => ponerSobre(p); li.onmouseleave = () => ponerSobre(null);
        ul.appendChild(li);
      });
    });
    if (!lista.length) {
      const li = document.createElement('li'); li.className = 'vacio';
      li.textContent = estado.filtroVisita === 'visitados' ? 'Todavía no has marcado ningún lugar como visitado.' : '¡Lo has visitado todo! 🎉';
      ul.appendChild(li);
    }
  }

  /* ---------- ficha de lugar ---------- */
  function abrirPunto(p, sinMover) {
    if (narrador) narrador.parar();
    estado.punto = p; estado.ruta = null; estado.origen = null;
    $('vista-ruta').hidden = true; $('vista-lista').hidden = true; $('vista-ficha').hidden = false;
    document.body.classList.remove('historia-abierta');
    $('f-categoria').textContent = (esPrincipal(p) ? 'Imprescindible · ' : '') + (CATEGORIAS[p.categoria] || '');
    $('f-temporada').hidden = !p.temporada;
    $('f-categoria').classList.toggle('secundaria', !esPrincipal(p));
    $('f-nombre').textContent = p.nombre;
    $('f-resumen').textContent = p.resumen || '';
    $('f-itin').hidden = true;
    SofiaComun.enItinerario('explora').then((m) => { if (estado.punto === p) SofiaComun.chipsItinerario($('f-itin'), m[p.id]); });
    const h = $('f-historia'); h.innerHTML = '';
    (p.historia || []).forEach((t) => { const el = document.createElement('p'); el.textContent = t; h.appendChild(el); });
    pintarDistanciaYo();
    pintarRutas(p);
    if (narrador) narrador.preparar($('narrar'), p.id);
    pintarBotonVisitado();
    $('cuerpo').scrollTop = 0;
    if (esMovil()) panelM.normal();
    refrescarMapa();
    history.replaceState(null, '', '#' + p.id);
    if (!sinMover) {
      const ext = ol.extent.boundingExtent([p.coord]);
      p.rutas.filter((r) => r.tipo !== 'transporte').forEach((r) => ol.extent.extend(ext, r.feature.getGeometry().getExtent()));
      encuadrar(p.rutas.length ? ext : ol.extent.buffer(ext, 200), 17);
    }
  }
  // ✕ de la ficha del lugar: lo deselecciona y vuelve a la lista
  function cerrarPunto() {
    estado.punto = null; estado.ruta = null; estado.origen = null;
    colorRuta.clear();
    if (narrador) narrador.parar();
    $('vista-ficha').hidden = true; $('vista-ruta').hidden = true; $('vista-lista').hidden = false;
    refrescarMapa();
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
    colorRuta.clear();
    const prin = esPrincipal(p);
    $('f-rutas-tit').textContent = prin ? 'Caminos a pie desde aquí' : 'Está de paso en estos caminos';
    $('f-sin-rutas').textContent = prin ? 'Las rutas a pie se están preparando.' : 'No queda de paso en ninguna ruta de la red: acércate por tu cuenta si te interesa.';
    $('f-sin-rutas').hidden = p.rutas.length > 0;
    const orden = p.rutas.slice().sort((a, b) => (a.tipo === 'transporte') - (b.tipo === 'transporte') || a.distancia - b.distancia);
    orden.forEach((r, i) => {
      const color = PALETA[i % PALETA.length];
      colorRuta.set(r, color);
      // desde un principal, la ruta sale de él; desde un secundario, se muestra en su sentido principal
      const sentido = r.hasta === p.id ? 'vuelta' : 'ida';
      const s = sentidoDe(r, sentido);
      const li = document.createElement('li');
      if (r.tipo === 'transporte') li.className = 'transporte';
      li.innerHTML = '<div class="ruta-cab"><span class="muestra"></span><span><b></b><br><small></small></span><span class="t"><strong></strong></span></div>';
      li.querySelector('.muestra').style.background = color;
      li.querySelector('b').textContent = prin ? s.b.nombre : s.a.nombre + ' → ' + s.b.nombre;
      li.querySelector('small').textContent = s.nombre || '';
      li.querySelector('strong').textContent = r.tipo === 'transporte' ? 'En transporte' : txtMin(r.minutos || minutos(r.distancia));
      li.querySelector('.t').appendChild(document.createTextNode(txtDist(r.distancia)));
      li.onclick = () => abrirRuta(r, sentido, p.id);
      ul.appendChild(li);
    });
  }

  /* ---------- ficha de ruta (cada sentido es una entidad con su texto y su audio) ---------- */
  function abrirRuta(r, sentido, origen, sinMover) {
    if (narrador) narrador.parar();
    estado.ruta = r; estado.sentido = sentido === 'vuelta' ? 'vuelta' : 'ida';
    const s = sentidoDe(r, estado.sentido);
    estado.origen = origen && porId[origen] ? origen : s.a.id;
    estado.punto = null; colorRuta.clear();
    $('vista-lista').hidden = true; $('vista-ficha').hidden = true; $('vista-ruta').hidden = false;
    $('r-tipo').textContent = r.tipo === 'transporte' ? 'Mejor en transporte' : 'Ruta a pie';
    $('r-nombre').textContent = s.nombre || (s.a.nombre + ' – ' + s.b.nombre);
    $('r-desde').textContent = s.a.nombre; $('r-hasta').textContent = s.b.nombre;
    $('r-min').textContent = r.tipo === 'transporte' ? (r.transporte || 'Transporte público') : txtMin(r.minutos || minutos(r.distancia));
    $('r-dist').textContent = (r.tipo === 'transporte' ? 'a ' : 'andando · ') + txtDist(r.distancia);
    const t = $('r-texto'); t.innerHTML = '';
    s.descripcion.forEach((x) => { const el = document.createElement('p'); el.textContent = x; t.appendChild(el); });
    const ulp = $('r-paradas'); ulp.innerHTML = '';
    s.paradas.forEach((p) => {
      const li = document.createElement('li');
      const bt = document.createElement('button'); bt.textContent = p.nombre; bt.onclick = () => abrirPunto(p);
      li.appendChild(bt); ulp.appendChild(li);
    });
    $('r-paradas-tit').hidden = !s.paradas.length;
    const ul = $('r-camino'); ul.innerHTML = '';
    s.camino.forEach((x) => { const el = document.createElement('li'); el.textContent = x; ul.appendChild(el); });
    $('r-camino-tit').hidden = !s.camino.length;
    $('invertir').hidden = !r.vuelta;
    $('r-ir-desde').textContent = 'Ir a ' + s.b.nombre; $('r-ir-desde').onclick = () => abrirPunto(s.b);
    $('r-ir-hasta').textContent = 'Ir a ' + s.a.nombre; $('r-ir-hasta').onclick = () => abrirPunto(s.a);
    if (narrador) narrador.preparar($('narrar-ruta'), s.id);
    $('cuerpo').scrollTop = 0;
    if (esMovil()) panelM.normal();
    refrescarMapa();
    history.replaceState(null, '', '#' + s.id);
    requestAnimationFrame(animar);
    if (!sinMover) encuadrar(r.feature.getGeometry().getExtent(), 17.5);
  }
  // ⇄ cambia el sentido de la ruta: otro texto, otro audio y la animación al revés
  function invertirRuta() {
    if (!estado.ruta) return;
    abrirRuta(estado.ruta, estado.sentido === 'ida' ? 'vuelta' : 'ida', estado.origen, true);
  }
  // ✕ de la ficha de ruta: la deselecciona y vuelve al lugar desde el que se abrió
  function cerrarRuta() {
    const origen = estado.origen && porId[estado.origen];
    estado.ruta = null; estado.origen = null;
    if (narrador) narrador.parar();
    $('vista-ruta').hidden = true;
    if (origen) abrirPunto(origen, true);
    else { $('vista-lista').hidden = false; refrescarMapa(); history.replaceState(null, '', location.pathname + location.search); }
  }

  /* ---------- GPS ---------- */
  function activarGPS() {
    if (!navigator.geolocation) { alertaSuave('Tu navegador no permite conocer la ubicación.'); return; }
    if (estado.yo) { estado.seguir = true; view.animate({ center: estado.yo, zoom: Math.max(view.getZoom(), 16), duration: 500 }); return; }
    $('gps').classList.add('buscando');
    estado.seguir = true;
    navigator.geolocation.watchPosition((pos) => {
      const c = ol.proj.fromLonLat([pos.coords.longitude, pos.coords.latitude]);
      const primera = !estado.yo;
      estado.yo = c;
      const factor = 1 / Math.cos(pos.coords.latitude * Math.PI / 180);
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
  const alertaSuave = (txt) => SofiaComun.aviso(txt);

  /* ---------- controles ---------- */
  function enlazar() {
    $('volver-lista').onclick = cerrarPunto;
    $('cerrar-punto').onclick = cerrarPunto;
    $('cerrar-ruta').onclick = cerrarRuta;
    $('invertir').onclick = invertirRuta;
    $('visitado').onclick = () => estado.punto && marcarVisitado(estado.punto, !esVisitado(estado.punto));
    $('compartir').onclick = compartirProgreso;
    $('leer-mas').onclick = () => document.body.classList.add('historia-abierta');
    $('gps').onclick = activarGPS;
    SofiaComun.botonCapa($('capa'), bases);
    SofiaComun.visitados.alCambiar(() => { pintarProgreso(); pintarLista(); pintarBotonVisitado(); refrescarMapa(); });
    $('tirador').onclick = () => panelM.alternar();
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (estado.ruta) cerrarRuta(); else if (estado.punto) cerrarPunto(); } });
    SofiaComun.leyenda(document.querySelector('.botones-mapa'), LEYENDA);
    window.addEventListener('hashchange', irAlHash);
  }
  // #lugar  ·  #ruta-a--b (sentido a→b)  ·  #visitados=a,b,c
  function irAlHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h.startsWith('visitados=')) { importarVisitados(h.slice(10)); return false; }
    if (porId[h]) { if (porId[h] !== estado.punto) abrirPunto(porId[h]); return true; }
    const rs = rutasPorId[h];
    if (rs) { if (rs.r !== estado.ruta || rs.sentido !== estado.sentido) abrirRuta(rs.r, rs.sentido); return true; }
    return false;
  }

  async function iniciar() {
    if (!window.ol) { document.body.innerHTML = '<p style="padding:2em">No se pudo cargar OpenLayers.</p>'; return; }
    if (window.SofiaComun) {
      SofiaComun.enlacePortal(document.querySelector('.cabecera'));
      narrador = new SofiaComun.Narrador('audio/');
    }
    panelM = SofiaComun.panelMovil($('panel'));
    crearMapa();
    enlazar();
    SofiaComun.pistaMapa(map, 'explora', 'Toca un punto o un camino del mapa para ver su historia y la ruta narrada');
    await cargar();
    pintarProgreso(); pintarFiltros(); pintarLista();
    if (!irAlHash()) {
      const c = ol.proj.fromLonLat([23.326, 42.695]);
      encuadrar(ol.extent.boundingExtent(puntos.filter((p) => metros(p.coord, c) < 3000).map((p) => p.coord)), 16);
    }
  }
  document.addEventListener('DOMContentLoaded', iniciar);
})();
