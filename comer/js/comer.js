/* Comer en Sofía · restaurantes, bares y desayunos recomendados, qué pedir, distancia desde el usuario y enlace a Google Maps */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const S = ol.style;
  const esMovil = () => window.matchMedia('(max-width: 760px)').matches;
  let map, view, capaRest, capaEtq, capaYo, bases, panelM;
  const rest = [], porId = {};
  const estado = { sel: null, yo: null, filtro: null };
  const TIPOS = { restaurante: 'Restaurantes', bar: 'Bares y copas', desayuno: 'Desayuno', mercado: 'Mercado' };
  const COLOR = { restaurante: '#7a1f19', bar: '#2f5d7c', desayuno: '#a8711c', mercado: '#5f7a34' };
  /* Glifos blancos en SVG (24x24): más claros que los emojis a tamaño de marcador */
  const B = 'fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  const GLIFOS = {
    restaurante: '<g ' + B + '><path d="M5.5 3v5.5a3 3 0 0 0 6 0V3M8.5 3v5.5M8.5 11.5V21"/><path d="M18 21V3c-2.3 1.3-3.5 4.2-3.5 7.8 0 2 1.4 3 3.5 3"/></g>',
    bar: '<g ' + B + '><path d="M4 4h16l-8 8.5zM12 12.5V20M8 20h8"/></g><path d="M7.2 7.2h9.6L12 12.3z" fill="#fff"/>',
    desayuno: '<g ' + B + '><path d="M4 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5c-.8 1 .8 2 0 3M12 3.5c-.8 1 .8 2 0 3"/></g>',
    mercado: '<g ' + B + '><path d="M3 10h18l-2 10H5zM8 10l3-6M16 10l-3-6M9 13.5v3.5M15 13.5v3.5M12 13.5v3.5"/></g>'
  };
  const svgCat = (c, tam, borde) => '<svg xmlns="http://www.w3.org/2000/svg" width="' + tam + '" height="' + tam + '" viewBox="-6 -6 36 36"><circle cx="12" cy="12" r="' + (borde ? 16.3 : 18) + '" fill="' + (COLOR[c] || COLOR.restaurante) + '"' + (borde ? ' stroke="' + borde + '" stroke-width="3.4"' : '') + '/>' + (GLIFOS[c] || GLIFOS.restaurante) + '</svg>';
  const pasa = (r) => !estado.filtro || r.categoria === estado.filtro;

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
    const oculto = !pasa(r);
    const k = r.id + sel + oculto;
    if (!cache[k]) {
      const tam = sel ? 32 : 24;
      const st = [new S.Style({
        image: new S.Icon({ src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgCat(r.categoria, tam, sel ? '#e0b04a' : '#fff')), width: tam, height: tam, opacity: oculto ? 0.3 : 1 }),
        zIndex: sel ? 20 : 10,
      })];
      cache[k] = st;
    }
    return cache[k];
  }

  function estiloEtq(f, res) {
    const r = f.get('r'), sel = estado.sel === r;
    if (!pasa(r) || (!sel && Math.log2(156543.03392804097 / res) < 15)) return null;
    return new S.Style({ text: new S.Text({ text: r.nombre, offsetY: -20, font: '600 12px "Manrope", sans-serif', fill: new S.Fill({ color: sel ? '#a8322a' : '#22262c' }), stroke: new S.Stroke({ color: '#fffaf1', width: 4 }) }), zIndex: sel ? 21 : 11 });
  }
  function crearMapa() {
    view = new ol.View({ center: ol.proj.fromLonLat([23.324, 42.693]), zoom: 14.5, minZoom: SofiaComun.ZOOM_MIN, maxZoom: 19 });
    capaRest = new ol.layer.Vector({ source: new ol.source.Vector(), style: estilo });
    capaEtq = new ol.layer.Vector({ source: capaRest.getSource(), style: estiloEtq, declutter: true });
    capaYo = new ol.layer.Vector({ source: new ol.source.Vector(), zIndex: 50 });
    map = new ol.Map({ target: 'mapa', view, layers: [capaRest, capaEtq, capaYo] });
    map.addControl(new ol.control.ScaleLine({ units: 'metric' }));
    bases = SofiaComun.basesMapa(map);
    map.on('singleclick', (e) => {
      const f = map.forEachFeatureAtPixel(e.pixel, (x) => x, { hitTolerance: SofiaComun.esTactil() ? 12 : 6, layerFilter: (l) => l === capaRest });
      if (f) abrir(f.get('r'));
      else if (estado.sel) cerrar();
      else if (esMovil()) panelM.plegar();
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
    pintarFiltros();
    let l = rest.filter(pasa);
    if (estado.yo) l.sort((a, b) => metros(estado.yo, a.coord) - metros(estado.yo, b.coord));
    else l.sort((a, b) => ((b.valoracion && b.valoracion.nota) || 0) - ((a.valoracion && a.valoracion.nota) || 0));
    l.forEach((r, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="num"></span><span><b></b><small></small></span><span class="dist"></span>';
      li.querySelector('.num').textContent = i + 1;
      li.querySelector('b').textContent = r.nombre;
      const n = notaTxt(r);
      li.querySelector('small').innerHTML = (n ? '<span class="estrella">★ ' + n + '</span> · ' : '') + esc(r.cocina) + ' · ' + r.precio + (r.ciudad ? ' · <b class="ciudad">' + esc(r.ciudad) + '</b>' : '') + (r.itinerario ? '<span class="en-plan">' + esc(r.itinerario) + '</span>' : '');
      if (estado.yo) li.querySelector('.dist').textContent = txtDist(metros(estado.yo, r.coord));
      li.onclick = () => abrir(r);
      ul.appendChild(li);
    });
    $('activar-gps').hidden = !!estado.yo;
  }

  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function pintarFiltros() {
    const cont = $('filtros'); cont.innerHTML = '';
    [null].concat(Object.keys(TIPOS).filter((t) => rest.some((r) => r.categoria === t))).forEach((t) => {
      const b = document.createElement('button');
      if (t) { b.innerHTML = svgCat(t, 20); b.appendChild(document.createTextNode(TIPOS[t])); } else b.textContent = 'Todos';
      b.className = estado.filtro === t ? 'activo' : '';
      b.onclick = () => { estado.filtro = t; pintarLista(); capaRest.changed(); capaEtq.changed(); };
      cont.appendChild(b);
    });
  }
  function abrir(r) {
    estado.sel = r;
    $('vista-lista').hidden = true; $('vista-ficha').hidden = false;
    $('r-cocina').textContent = r.cocina;
    $('r-nombre').textContent = r.nombre;
    const n = notaTxt(r);
    $('r-nota').innerHTML = n ? '<b>★</b> ' + n + ' <small>(' + r.valoracion.opiniones.toLocaleString('es-ES') + ' opiniones)</small>' : '<small>Puntuación pendiente</small>';
    $('r-precio').textContent = r.precio;
    $('r-dir').textContent = r.direccion;
    $('r-horario').hidden = !r.horario; $('r-horario').textContent = r.horario ? 'Horario: ' + r.horario : '';
    $('r-tel').hidden = !r.telefono; if (r.telefono) { $('r-tel').href = 'tel:' + r.telefono.replace(/\s/g, ''); $('r-tel').textContent = 'Reservas: ' + r.telefono; }
    $('r-plan').hidden = !r.itinerario; $('r-plan').textContent = r.itinerario ? 'En el itinerario: ' + r.itinerario : '';
    $('r-nota-pedir').hidden = !r.nota_pedir; $('r-nota-pedir').textContent = r.nota_pedir || '';
    $('r-resumen').textContent = r.resumen;
    const ul = $('r-platos'); ul.innerHTML = '';
    (r.platos || []).forEach((p) => { const li = document.createElement('li'); li.textContent = p; ul.appendChild(li); });
    const [lon, lat] = ol.proj.toLonLat(r.coord);
    // «Llévame»: abre Google Maps con la ruta a pie ya cargada (desde la posición actual del usuario)
    $('r-llevame').href = 'https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=' + lat.toFixed(6) + ',' + lon.toFixed(6);
    $('r-google').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(r.nombre + ', ' + r.direccion + ', ' + (r.ciudad || 'Sofia'));
    pintarYo();
    $('cuerpo').scrollTop = 0;
    if (esMovil()) panelM.normal();
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
    if (estado.yo) { view.animate({ center: estado.yo, zoom: Math.max(view.getZoom(), 16), duration: 500 }); return; }
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
    panelM = SofiaComun.panelMovil($('panel'));
    if (window.SofiaComun) SofiaComun.enlacePortal(document.querySelector('.cabecera'));
    crearMapa();
    await cargar();
    pintarLista();
    $('volver-lista').onclick = cerrar; $('cerrar').onclick = cerrar;
    $('gps').onclick = activarGPS; $('activar-gps').onclick = activarGPS;
    SofiaComun.botonCapa($('capa'), bases);
    $('tirador').onclick = () => panelM.alternar();
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && estado.sel) cerrar(); });
    const r = porId[location.hash.slice(1)];
    if (r) abrir(r);
    else view.fit(ol.extent.boundingExtent(rest.filter((x) => !x.ciudad && metros(x.coord, ol.proj.fromLonLat([23.324, 42.694])) < 4000).map((x) => x.coord)), { padding: padding(), maxZoom: 16 });
  }
  document.addEventListener('DOMContentLoaded', iniciar);
})();
