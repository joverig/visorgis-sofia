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
  function estiloRuta(f) {
    const r = f.get('r');
    const sel = estado.ruta === r;
    const delPunto = estado.punto && (r.desde === estado.punto.id || r.hasta === estado.punto.id);
    if (sel) {
      return [new S.Style({ stroke: new S.Stroke({ color: '#fffaf1', width: 10 }), zIndex: 30 }),
              new S.Style({ stroke: new S.Stroke({ color: '#a8322a', width: 6 }), zIndex: 31 })];
    }
    if (delPunto) {
      return [new S.Style({ stroke: new S.Stroke({ color: '#fffaf1', width: 8 }), zIndex: 20 }),
              new S.Style({ stroke: new S.Stroke({ color: '#2f7f86', width: 4.5 }), zIndex: 21 })];
    }
    return new S.Style({ stroke: new S.Stroke({ color: estado.punto ? 'rgba(47,127,134,.25)' : 'rgba(47,127,134,.65)', width: 3, lineDash: [1, 7], lineCap: 'round' }) });
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
      else if (tocado.get('r')) elegirRuta(tocado.get('r'), true);
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
    estado.punto = p; estado.ruta = null;
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
      p.rutas.forEach((r) => ol.extent.extend(ext, r.feature.getGeometry().getExtent()));
      encuadrar(p.rutas.length ? ext : ol.extent.buffer(ext, 200), 17);
    }
  }
  function cerrarPunto() {
    estado.punto = null; estado.ruta = null;
    if (narrador) narrador.parar();
    $('vista-ficha').hidden = true; $('vista-lista').hidden = false;
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
    p.rutas.slice().sort((a, b) => a.distancia - b.distancia).forEach((r) => {
      const otro = porId[r.desde === p.id ? r.hasta : r.desde];
      const li = document.createElement('li');
      li.innerHTML = '<div class="ruta-cab"><span><b></b><br><small></small></span><span class="t"><strong></strong></span></div>' +
                     '<div class="ruta-det"></div>';
      li.querySelector('b').textContent = otro.nombre;
      li.querySelector('small').textContent = CATEGORIAS[otro.categoria] || '';
      li.querySelector('strong').textContent = txtMin(r.minutos || minutos(r.distancia));
      li.querySelector('.t').appendChild(document.createTextNode(txtDist(r.distancia)));
      const det = li.querySelector('.ruta-det');
      if (r.nota) { const n = document.createElement('p'); n.className = 'nota'; n.textContent = r.nota; det.appendChild(n); }
      if (r.camino && r.camino.length) {
        const t = document.createElement('p'); t.innerHTML = '<b>Por el camino verás:</b>'; det.appendChild(t);
        const lu = document.createElement('ul');
        r.camino.forEach((c) => { const x = document.createElement('li'); x.textContent = c; lu.appendChild(x); });
        det.appendChild(lu);
      } else if (!r.nota) {
        const t = document.createElement('p'); t.textContent = 'Un paseo tranquilo por calles del centro.'; det.appendChild(t);
      }
      const ir = document.createElement('button'); ir.className = 'ir'; ir.textContent = 'Ir a ' + otro.nombre;
      ir.onclick = (e) => { e.stopPropagation(); abrirPunto(otro); };
      det.appendChild(ir);
      li.querySelector('.ruta-cab').onclick = () => elegirRuta(r === estado.ruta ? null : r, true);
      r.li = li;
      ul.appendChild(li);
    });
  }
  function elegirRuta(r, mover) {
    if (r && estado.punto && r.desde !== estado.punto.id && r.hasta !== estado.punto.id) {
      abrirPunto(porId[r.desde], true);
    }
    estado.ruta = r;
    document.querySelectorAll('.rutas > li').forEach((li) => li.classList.remove('activa'));
    if (r && r.li) { r.li.classList.add('activa'); r.li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    capaRutas.changed();
    if (r && mover) encuadrar(r.feature.getGeometry().getExtent(), 17.5);
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
    window.addEventListener('hashchange', () => {
      const p = porId[location.hash.slice(1)];
      if (p && p !== estado.punto) abrirPunto(p);
    });
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
    const inicial = porId[location.hash.slice(1)];
    if (inicial) abrirPunto(inicial);
    else encuadrar(capaPuntos.getSource().getExtent(), 15);
  }
  document.addEventListener('DOMContentLoaded', iniciar);
})();
