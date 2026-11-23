/* Comer en Sofía · restaurantes recomendados del centro, distancia desde el usuario y enlace a Google Maps */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const S = ol.style;
  const esMovil = () => window.matchMedia('(max-width: 760px)').matches;
  let map, view, capaRest, capaEtq, capaYo;
  const rest = [], porId = {};
  const estado = { sel: null, yo: null };
  const PLATO = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="34" r="20" fill="none" stroke="#7a1f19" stroke-width="2.5"/><circle cx="32" cy="34" r="12" fill="none" stroke="#7a1f19" stroke-width="1.5" opacity=".6"/><path d="M8 10v14c0 3 2 5 4 5v25M12 10v12M16 10v14c0 3-2 5-4 5" fill="none" stroke="#7a1f19" stroke-width="2.5" stroke-linecap="round"/><path d="M54 10c-4 2-6 8-6 14 0 4 2 6 4 6v24" fill="none" stroke="#7a1f19" stroke-width="2.5" stroke-linecap="round"/></svg>';

  function metros(a, b) {
    const l1 = ol.proj.toLonLat(a), l2 = ol.proj.toLonLat(b), r = Math.PI / 180;
    const h = Math.sin((l2[1] - l1[1]) * r / 2) ** 2 + Math.cos(l1[1] * r) * Math.cos(l2[1] * r) * Math.sin((l2[0] - l1[0]) * r / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.sqrt(h));
  }
  const txtDist = (m) => (m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km');
  const minAndando = (m) => Math.max(1, Math.round(m * 1.3 / 1000 / 4.5 * 60));
  const notaTxt = (r) => (r.valoracion ? r.valoracion.nota.toFixed(1).replace('.', ',') : null);

  const cache = {};
  function estilo(f, res) {
    const r = f.get('r'), sel = estado.sel === r, z = Math.log2(156543.03392804097 / res);
    const k = r.id + sel + (z >= 15);
    if (!cache[k]) {
      const st = [new S.Style({
        image: new S.Circle({ radius: sel ? 12 : 9, fill: new S.Fill({ color: sel ? '#a8322a' : '#7a1f19' }), stroke: new S.Stroke({ color: sel ? '#e0b04a' : '#fff', width: sel ? 3.5 : 2.5 }) }),
        text: new S.Text({ text: '🍴', font: (sel ? 12 : 10) + 'px sans-serif' }), zIndex: sel ? 20 : 10,
      })];
      cache[k] = st;
    }
    return cache[k];
  }

  function estiloEtq(f, res) {
    const r = f.get('r'), sel = estado.sel === r;
    if (!sel && Math.log2(156543.03392804097 / res) < 15) return null;
    return new S.Style({ text: new S.Text({ text: r.nombre, offsetY: -20, font: '600 12px "Manrope", sans-serif', fill: new S.Fill({ color: sel ? '#a8322a' : '#22262c' }), stroke: new S.Stroke({ color: '#fffaf1', width: 4 }) }), zIndex: sel ? 21 : 11 });
  }
  function crearMapa() {
    view = new ol.View({ center: ol.proj.fromLonLat([23.324, 42.693]), zoom: 14.5, minZoom: 11, maxZoom: 19 });
    capaRest = new ol.layer.Vector({ source: new ol.source.Vector(), style: estilo });
    capaEtq = new ol.layer.Vector({ source: capaRest.getSource(), style: estiloEtq, declutter: true });
    capaYo = new ol.layer.Vector({ source: new ol.source.Vector(), zIndex: 50 });
    map = new ol.Map({ target: 'mapa', view, layers: [capaRest, capaEtq, capaYo] });
    map.addControl(new ol.control.ScaleLine({ units: 'metric' }));
    SofiaComun.capaCalles().catch(() => new ol.layer.Tile({ source: new ol.source.OSM() }))
      .then((c) => map.getLayers().insertAt(0, c));
    map.on('singleclick', (e) => {
      const f = map.forEachFeatureAtPixel(e.pixel, (x) => x, { hitTolerance: 6, layerFilter: (l) => l === capaRest });
      if (f) abrir(f.get('r'));
    });
    map.on('pointermove', (e) => {
      map.getTargetElement().style.cursor = map.hasFeatureAtPixel(e.pixel, { layerFilter: (l) => l === capaRest }) ? 'pointer' : '';
    });
  }
  function padding() {
    const m = map.getTargetElement().getBoundingClientRect(), p = $('panel').getBoundingClientRect();
    return esMovil() ? [80, 30, Math.max(40, m.bottom - p.top + 20), 30] : [80, Math.max(40, m.right - p.left + 30), 40, 70];
  }

  async function cargar() {
    const fmt = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' });
    const g = await (await fetch('datos/restaurantes.geojson', { cache: 'no-store' })).json();
    fmt.readFeatures(g).forEach((f) => {
      const r = Object.assign({}, f.getProperties(), { coord: f.getGeometry().getCoordinates(), feature: f });
      delete r.geometry;
      f.set('r', r); rest.push(r); porId[r.id] = r;
    });
    capaRest.getSource().addFeatures(rest.map((r) => r.feature));
  }

  function pintarLista() {
    const ul = $('lista'); ul.innerHTML = '';
    let l = rest.slice();
    if (estado.yo) l.sort((a, b) => metros(estado.yo, a.coord) - metros(estado.yo, b.coord));
    else l.sort((a, b) => ((b.valoracion && b.valoracion.nota) || 0) - ((a.valoracion && a.valoracion.nota) || 0));
    l.forEach((r, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="num"></span><span><b></b><small></small></span><span class="dist"></span>';
      li.querySelector('.num').textContent = i + 1;
      li.querySelector('b').textContent = r.nombre;
      const n = notaTxt(r);
      li.querySelector('small').innerHTML = (n ? '<span class="estrella">★ ' + n + '</span> · ' : '') + r.cocina + ' · ' + r.precio;
      if (estado.yo) li.querySelector('.dist').textContent = txtDist(metros(estado.yo, r.coord));
      li.onclick = () => abrir(r);
      ul.appendChild(li);
    });
    $('activar-gps').hidden = !!estado.yo;
  }

  function abrir(r) {
    estado.sel = r;
    $('vista-lista').hidden = true; $('vista-ficha').hidden = false;
    $('r-foto').innerHTML = PLATO + '<span class="letra">' + r.nombre.charAt(0) + '</span>';
    $('r-cocina').textContent = r.cocina;
    $('r-nombre').textContent = r.nombre;
    const n = notaTxt(r);
    $('r-nota').innerHTML = n ? '<b>★</b> ' + n + ' <small>(' + r.valoracion.opiniones.toLocaleString('es-ES') + ' opiniones)</small>' : '<small>Puntuación pendiente</small>';
    $('r-precio').textContent = r.precio;
    $('r-dir').textContent = r.direccion;
    $('r-resumen').textContent = r.resumen;
    const ul = $('r-platos'); ul.innerHTML = '';
    (r.platos || []).forEach((p) => { const li = document.createElement('li'); li.textContent = p; ul.appendChild(li); });
    const [lon, lat] = ol.proj.toLonLat(r.coord);
    // «Llévame»: abre Google Maps con la ruta a pie ya cargada (desde la posición actual del usuario)
    $('r-llevame').href = 'https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=' + lat.toFixed(6) + ',' + lon.toFixed(6);
    $('r-google').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(r.nombre + ', ' + r.direccion + ', Sofia');
    pintarYo();
    $('cuerpo').scrollTop = 0;
    if (esMovil()) $('panel').className = 'panel';
    capaRest.changed(); capaEtq.changed();
    history.replaceState(null, '', '#' + r.id);
    view.animate({ center: r.coord, zoom: Math.max(view.getZoom(), 16.5), duration: 500 });
  }
  function cerrar() {
    estado.sel = null;
    $('vista-ficha').hidden = true; $('vista-lista').hidden = false;
    capaRest.changed(); capaEtq.changed();
    history.replaceState(null, '', location.pathname + location.search);
  }
  function pintarYo() {
    const r = estado.sel, el = $('r-yo');
    if (!r || !estado.yo) { el.hidden = true; return; }
    const m = metros(estado.yo, r.coord);
    el.hidden = false;
    el.textContent = 'A ' + txtDist(m) + ' de ti · unos ' + minAndando(m) + ' min andando';
  }

  function activarGPS() {
    if (!navigator.geolocation) return;
    $('gps').classList.add('buscando');
    navigator.geolocation.watchPosition((pos) => {
      const c = ol.proj.fromLonLat([pos.coords.longitude, pos.coords.latitude]);
      const primera = !estado.yo;
      estado.yo = c;
      const src = capaYo.getSource(); src.clear();
      const yo = new ol.Feature(new ol.geom.Point(c));
      yo.setStyle(new S.Style({ image: new S.Circle({ radius: 8, fill: new S.Fill({ color: '#2f7f86' }), stroke: new S.Stroke({ color: '#fff', width: 3 }) }) }));
      src.addFeature(yo);
      $('gps').classList.remove('buscando'); $('gps').classList.add('activo');
      if (primera) {
        pintarLista();
        const ext = ol.extent.boundingExtent([c].concat(rest.slice().sort((a, b) => metros(c, a.coord) - metros(c, b.coord)).slice(0, 4).map((r) => r.coord)));
        view.fit(ext, { padding: padding(), maxZoom: 17, duration: 600 });
      }
      pintarYo();
    }, () => { $('gps').classList.remove('buscando'); }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
  }

  async function iniciar() {
    if (window.SofiaComun) SofiaComun.enlacePortal(document.querySelector('.cabecera'));
    crearMapa();
    await cargar();
    pintarLista();
    $('volver-lista').onclick = cerrar; $('cerrar').onclick = cerrar;
    $('gps').onclick = activarGPS; $('activar-gps').onclick = activarGPS;
    $('tirador').onclick = () => { const p = $('panel'); p.className = p.classList.contains('alto') ? 'panel bajo' : p.classList.contains('bajo') ? 'panel' : 'panel alto'; };
    const r = porId[location.hash.slice(1)];
    if (r) abrir(r);
    else view.fit(capaRest.getSource().getExtent(), { padding: padding(), maxZoom: 16 });
  }
  document.addEventListener('DOMContentLoaded', iniciar);
})();
