/* Itinerario · el plan día a día (4-8 de diciembre): paradas y caminos con narración, mapa del día
   (Sofía y Plovdiv), lugares visitados compartidos con Explora Sofía (OpenLayers UMD) */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const S = ol.style;
  const V = SofiaComun.visitados;
  const esMovil = () => window.matchMedia('(max-width: 760px)').matches;
  const fuente = (peso, px, extra) => (extra ? extra + ' ' : '') + peso + ' ' + px + 'px "Manrope", "Segoe UI", sans-serif';
  const MODOS = {
    pie: { nombre: 'A pie', icono: '🚶', color: 'rgba(110,56,40,.82)', dash: [0.1, 7], gm: 'walking' },
    taxi: { nombre: 'En taxi', icono: '🚕', color: '#5c6f8a', dash: [10, 7], gm: 'driving' },
    metro: { nombre: 'En metro', icono: 'Ⓜ', color: '#6b4a7e', dash: [12, 6], gm: 'transit' },
    bus: { nombre: 'En autobús', icono: '🚌', color: '#2f5d7c', dash: [14, 8], gm: 'transit' },
    tour: { nombre: 'Free tour a pie, con guía', icono: '👥', color: '#d9661f', dash: undefined, gm: 'walking' },
  };
  const COLOR_TOUR = '#d9661f';
  const NO_VISITABLES = new Set(['casa', 'aeropuerto', 'avtogara', 'pdv_yug']);
  const GLIFO = { casa: '⌂', aeropuerto: '✈', avtogara: '🚌', pdv_yug: '🚌' };
  /* Comidas y cenas (dorado, cubiertos), paradas opcionales (lavanda) y reservas */
  const COLOR_COMIDA = '#b8862b', COLOR_OPC = '#8b7aa8';
  const COMIDAS = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', tapas: 'Cena de tapas' };
  const CUBIERTOS = '<g fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3v5.5a3 3 0 0 0 6 0V3M8.5 3v5.5M8.5 11.5V21"/><path d="M18 21V3c-2.3 1.3-3.5 4.2-3.5 7.8 0 2 1.4 3 3.5 3"/></g>';
  const svgComida = (tam, borde, n) => '<svg xmlns="http://www.w3.org/2000/svg" width="' + tam + '" height="' + tam + '" viewBox="-6 -6 36 36"><circle cx="12" cy="12" r="' + (borde ? 16.2 : 18) + '" fill="' + COLOR_COMIDA + '"' +
    (borde ? ' stroke="' + borde + '" stroke-width="3.6"' : '') + '/>' + CUBIERTOS + '</svg>';
  const tipoParada = (p) => (p.comida ? 'comida' : p.opcional ? 'opcional' : GLIFO[p.lugar] ? 'logistica' : 'normal');

  let map, view, bases, capaTramos, capaParadas, capaEtq, capaEtqT, capaTour, narrador, panelM;
  let datos = null;
  const estado = { dia: null, paso: null, zona: null, sobre: null };
  const fmt = new ol.format.Polyline();

  /* ---------- utilidades ---------- */
  const txtDist = (m) => (m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',') + ' km');
  const txtMin = (min) => (min < 60 ? min + ' min' : Math.floor(min / 60) + ' h' + (min % 60 ? ' ' + (min % 60) + ' min' : ''));
  const coordDe = (lugar) => ol.proj.fromLonLat(datos.lugares[lugar].coord);
  const esPlovdiv = (lugar) => lugar.startsWith('pdv_');

  /* ---------- estilos ---------- */
  const cacheP = {}, cacheE = {}, cacheT = {};
  function estiloParada(f) {
    const p = f.get('p');
    const sel = (estado.paso && estado.paso.lugar === p.lugar) || estado.sobre === p;
    const vis = !NO_VISITABLES.has(p.lugar) && V.tiene(p.lugar);
    const k = p.lugar + p.n + sel + vis;
    if (!cacheP[k]) {
      const g = GLIFO[p.lugar], tipo = tipoParada(p);
      if (tipo === 'comida' && !vis) {
        const tam = sel ? 34 : 28;
        cacheP[k] = new S.Style({ image: new S.Icon({ src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgComida(tam, sel ? '#e0b04a' : '#fff')), width: tam, height: tam }), zIndex: sel ? 30 : 22 });
      } else {
        const color = vis ? 'rgba(95,122,52,.92)' : g ? '#2f7f86' : tipo === 'opcional' ? COLOR_OPC : '#a8322a';
        cacheP[k] = new S.Style({
          image: new S.Circle({ radius: sel ? 14 : 11.5, fill: new S.Fill({ color }),
            stroke: new S.Stroke({ color: sel ? '#e0b04a' : '#fff', width: sel ? 4 : 2.5, lineDash: tipo === 'opcional' && !sel ? [4, 3] : undefined }) }),
          text: new S.Text({ text: vis ? '✓' : g || String(p.n), font: fuente('700', g ? 13 : 11.5), fill: new S.Fill({ color: '#fff' }) }),
          zIndex: sel ? 30 : 20,
        });
      }
    }
    return cacheP[k];
  }
  function estiloEtq(f, res) {
    const p = f.get('p');
    const sel = estado.paso && estado.paso.lugar === p.lugar;
    if (!sel && Math.log2(156543.03392804097 / res) < 14) return null;
    const k = p.lugar + sel;
    if (!cacheE[k]) {
      cacheE[k] = new S.Style({
        text: new S.Text({ text: p.nombre, offsetY: -25, font: fuente(sel ? '700' : '600', sel ? 13.5 : 12.5),
          fill: new S.Fill({ color: sel ? '#a8322a' : '#22262c' }), stroke: new S.Stroke({ color: '#fffaf1', width: 4 }) }),
        zIndex: sel ? 31 : 21,
      });
    }
    return cacheE[k];
  }
  /* Paradas del free tour: puntos naranjas pequeños, numerados, sobre la línea del recorrido */
  const cacheTour = {};
  function estiloTour(f, res) {
    const q = f.get('q'), t = f.get('t');
    const zoom = Math.log2(156543.03392804097 / res);
    const activo = estado.paso === t || estado.sobre === q || estado.sobre === t;
    const conNombre = activo ? zoom >= 15.5 : zoom >= 17;
    const k = q.n + '|' + activo + conNombre + (zoom >= 15);
    if (!cacheTour[k]) {
      const est = [new S.Style({ image: new S.Circle({ radius: activo ? 8 : 6.5, fill: new S.Fill({ color: COLOR_TOUR }), stroke: new S.Stroke({ color: '#fff', width: 2 }) }),
        text: zoom >= 15 ? new S.Text({ text: String(q.n), font: fuente('700', activo ? 9.5 : 8.5), fill: new S.Fill({ color: '#fff' }) }) : undefined, zIndex: activo ? 27 : 15 })];
      if (conNombre) est.push(new S.Style({ text: new S.Text({ text: q.nombre, offsetY: -16, font: fuente('600', 11), fill: new S.Fill({ color: '#8a3a0c' }),
        stroke: new S.Stroke({ color: '#fffaf1', width: 3.5 }) }), zIndex: activo ? 27 : 14 }));
      cacheTour[k] = est;
    }
    return cacheTour[k];
  }
  let fase = 0;
  const flecha = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 20;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.strokeStyle = '#7a1f19'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(4, 4); g.lineTo(17, 10); g.lineTo(4, 16); g.lineTo(8, 10); g.closePath(); g.fill(); g.stroke();
    return c;
  })();
  const flechaSuave = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 16;
    const g = c.getContext('2d'); g.fillStyle = 'rgba(168,50,42,.85)'; g.strokeStyle = '#fffaf1'; g.lineWidth = 1.5; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(3, 3); g.lineTo(13, 8); g.lineTo(3, 13); g.lineTo(6, 8); g.closePath(); g.stroke(); g.fill();
    return c;
  })();
  function estiloTramo(f, res) {
    const t = f.get('t');
    const m = MODOS[t.modo];
    if (estado.paso === t) {
      const geom = f.getGeometry();
      const est = [
        new S.Style({ stroke: new S.Stroke({ color: '#fffaf1', width: 12, lineCap: 'round', lineJoin: 'round' }), zIndex: 40 }),
        new S.Style({ stroke: new S.Stroke({ color: t.modo === 'pie' ? '#a8322a' : m.color, width: 7, lineCap: 'round', lineJoin: 'round' }), zIndex: 41 }),
        new S.Style({ stroke: new S.Stroke({ color: '#ffd9a8', width: 2.5, lineDash: [10, 16], lineDashOffset: -fase, lineCap: 'round' }), zIndex: 42 }),
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
    if (estado.sobre === t) {
      return [new S.Style({ stroke: new S.Stroke({ color: '#fffaf1', width: 11, lineCap: 'round', lineJoin: 'round' }), zIndex: 35 }),
        new S.Style({ stroke: new S.Stroke({ color: t.modo === 'pie' ? 'rgba(168,50,42,.9)' : m.color, width: 6, lineCap: 'round', lineJoin: 'round' }), zIndex: 36 })];
    }
    if (estado.siguiente === t) {
      // Camino que sale de la parada abierta: se marca con suavidad hacia dónde seguir
      const k2 = 'sig' + t.modo;
      if (!cacheT[k2]) cacheT[k2] = [new S.Style({ stroke: new S.Stroke({ color: 'rgba(255,250,241,.95)', width: 9, lineCap: 'round', lineJoin: 'round' }), zIndex: 28 }),
        new S.Style({ stroke: new S.Stroke({ color: t.modo === 'pie' ? 'rgba(168,50,42,.55)' : m.color + 'aa', width: 4, lineCap: 'round', lineJoin: 'round', lineDash: t.modo === 'pie' ? undefined : m.dash }), zIndex: 29 })];
      // Flechas quietas y discretas a lo largo del camino, en el sentido de la marcha
      const est = cacheT[k2].slice(), coords = f.getGeometry().getCoordinates(), paso = res * 90;
      let acum = paso * 0.5;
      for (let i = 1; i < coords.length; i++) {
        const [x1, y1] = coords[i - 1], [x2, y2] = coords[i], L = Math.hypot(x2 - x1, y2 - y1);
        acum += L;
        if (acum >= paso && L > res * 6) {
          acum = 0;
          est.push(new S.Style({ geometry: new ol.geom.Point([(x1 + x2) / 2, (y1 + y2) / 2]), zIndex: 30,
            image: new S.Icon({ img: flechaSuave, imgSize: [16, 16], scale: 0.85, rotation: -Math.atan2(y2 - y1, x2 - x1), rotateWithView: true }) }));
        }
      }
      return est;
    }
    const tenue = (estado.paso && estado.paso.tipo === 'tramo') || t.opcional;
    const k = t.modo + tenue + !!t.opcional;
    if (!cacheT[k]) {
      cacheT[k] = [new S.Style({ stroke: new S.Stroke({ color: 'rgba(255,250,241,.9)', width: 7, lineCap: 'round', lineJoin: 'round' }), zIndex: 9 }),
        new S.Style({ stroke: new S.Stroke({ color: t.opcional ? COLOR_OPC : m.color, width: 3.2, lineCap: 'round', lineJoin: 'round', lineDash: m.dash }), zIndex: 10, }),];
      if (tenue && !t.opcional) cacheT[k][1].getStroke().setColor(t.modo === 'pie' ? 'rgba(110,56,40,.4)' : m.color + '66');
      if (t.opcional) cacheT[k][1].getStroke().setColor(COLOR_OPC + (estado.paso && estado.paso.tipo === 'tramo' ? '66' : 'bb'));
    }
    return cacheT[k];
  }
  function animar() {
    if (!estado.paso || estado.paso.tipo !== 'tramo') return;
    fase = (fase + 0.8) % 26;
    capaTramos.changed();
    requestAnimationFrame(animar);
  }

  /* ---------- mapa ---------- */
  function crearMapa() {
    view = new ol.View({ center: ol.proj.fromLonLat([23.32, 42.695]), zoom: 14, minZoom: SofiaComun.ZOOM_MIN, maxZoom: 19 });
    capaTramos = new ol.layer.Vector({ source: new ol.source.Vector(), style: estiloTramo });
    capaParadas = new ol.layer.Vector({ source: new ol.source.Vector(), style: estiloParada });
    capaEtq = new ol.layer.Vector({ source: capaParadas.getSource(), style: estiloEtq, declutter: true });
    capaEtqT = new ol.layer.Vector({ source: new ol.source.Vector(), style: estiloEtqTramo, declutter: true });
    capaTour = new ol.layer.Vector({ source: new ol.source.Vector(), style: estiloTour });
    map = new ol.Map({ target: 'mapa', view, layers: [capaTramos, capaTour, capaEtqT, capaParadas, capaEtq] });
    map.addControl(new ol.control.ScaleLine({ units: 'metric' }));
    bases = SofiaComun.basesMapa(map);
    SofiaComun.botonCapa($('capa'), bases);
    SofiaComun.localizador(map, $('gps'));
    const tocable = (l) => l === capaParadas || l === capaTramos || l === capaEtqT || l === capaTour;
    const queHay = (px) => {
      let f = null;
      map.forEachFeatureAtPixel(px, (x) => { if (!f || (x.get('p') && !f.get('p'))) f = x; }, { hitTolerance: SofiaComun.esTactil() ? 12 : 6, layerFilter: tocable });
      return f;
    };
    map.on('singleclick', (e) => {
      const f = queHay(e.pixel);
      if (!f) { tocarVacio(); return; }
      abrirPaso(f.get('p') || f.get('t'));
      if (f.get('q')) marcarParadaTour(f.get('q'));
    });
    const flotante = SofiaComun.etiquetaFlotante(map);
    map.on('pointermove', (e) => {
      if (e.dragging || SofiaComun.esTactil()) return;
      const f = queHay(e.pixel);
      map.getTargetElement().style.cursor = f ? 'pointer' : '';
      const obj = f ? (f.get('q') || f.get('p') || f.get('t')) : null;
      ponerSobre(obj);
      if (!obj) flotante.ocultar();
      else if (f.get('q')) flotante.mostrar(e.pixel, '👥 Free tour · ' + obj.n + '. ' + obj.nombre);
      else if (obj.tipo === 'parada') flotante.mostrar(e.pixel, (obj.hora ? obj.hora + ' · ' : '') + obj.titulo);
      else flotante.mostrar(e.pixel, MODOS[obj.modo].icono + ' ' + obj.titulo + ' · ' + txtMin(obj.min));
    });
    map.getViewport().addEventListener('mouseleave', () => { flotante.ocultar(); ponerSobre(null); });
  }
  function padding() {
    const m = map.getTargetElement().getBoundingClientRect(), p = $('panel').getBoundingClientRect();
    return esMovil() ? [80, 30, Math.max(40, m.bottom - p.top + 20), 30] : [80, Math.max(40, m.right - p.left + 30), 40, 70];
  }
  function encuadrar(ext, maxZoom) {
    view.cancelAnimations();
    view.fit(ext, { padding: padding(), maxZoom: maxZoom || 17, duration: 600 });
  }
  function refrescar() { capaParadas.changed(); capaEtq.changed(); capaTramos.changed(); capaEtqT.changed(); capaTour.changed(); }
  // Etiqueta con el medio y los minutos en mitad de cada camino del día: invita a tocarlo
  const cacheET = {};
  function estiloEtqTramo(f) {
    const t = f.get('t');
    const sel = estado.paso === t, sobre = estado.sobre === t;
    if (estado.paso && estado.paso.tipo === 'tramo' && !sel) return null;
    const sig = estado.siguiente === t;
    const k = t.audio + sel + sobre + sig;
    if (!cacheET[k]) {
      const m = MODOS[t.modo];
      const activo = sel || sobre;
      cacheET[k] = new S.Style({ text: new S.Text({ text: (sig ? 'Siguiente · ' : '') + m.icono + ' ' + (t.tour ? 'Free tour · ' : '') + txtMin(t.min), font: fuente('700', 11.5),
        fill: new S.Fill({ color: activo ? '#fff' : sig ? '#a8322a' : t.modo === 'pie' ? '#5a3a2c' : m.color }),
        backgroundFill: new S.Fill({ color: activo ? '#a8322a' : '#fffaf1' }), backgroundStroke: new S.Stroke({ color: activo ? '#fff' : sig ? '#a8322a' : t.modo === 'pie' ? 'rgba(110,56,40,.55)' : m.color, width: 1.5 }),
        padding: [3, 7, 2, 7] }), zIndex: sel ? 45 : sig ? 35 : 25 });
    }
    return cacheET[k];
  }
  function ponerSobre(obj) {
    if (estado.sobre === obj) return;
    estado.sobre = obj;
    document.querySelectorAll('.pasos li.sobre').forEach((li) => li.classList.remove('sobre'));
    if (obj && obj.li) obj.li.classList.add('sobre');
    refrescar();
  }
  function tocarVacio() {
    if (estado.paso) cerrarPaso();
    else if (esMovil()) panelM.plegar();
  }
  const LEYENDA = '<ul>' +
    '<li><span class="sim"><svg width="26" height="26"><circle cx="13" cy="13" r="10" fill="#a8322a" stroke="#fff" stroke-width="2.5"/><text x="13" y="17" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">3</text></svg></span>Parada del día, en orden: tócala para ver la hora, el precio y su narración</li>' +
    '<li><span class="sim">' + svgComida(28) + '</span>Comida o cena (las reservadas llevan la etiqueta «Reservado»)</li>' +
    '<li><span class="sim"><svg width="26" height="26"><circle cx="13" cy="13" r="10" fill="' + COLOR_OPC + '" stroke="#fff" stroke-width="2.5" stroke-dasharray="4 3"/><text x="13" y="17" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">4</text></svg></span>Opcional: copas para quien tenga cuerda (camino en lavanda)</li>' +
    '<li><span class="sim"><svg width="26" height="26"><circle cx="13" cy="13" r="10" fill="#2f7f86" stroke="#fff" stroke-width="2.5"/><text x="13" y="17" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">⌂</text></svg></span>Casa, aeropuerto o estación de autobuses</li>' +
    '<li><span class="sim"><svg width="26" height="26"><circle cx="13" cy="13" r="10" fill="#5f7a34" stroke="#fff" stroke-width="2.5"/><text x="13" y="17" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">✓</text></svg></span>Ya visitado (compartido con Explora Sofía)</li>' +
    '<li><span class="sim"><svg width="40" height="16"><path d="M2 8h36" stroke="' + COLOR_TOUR + '" stroke-width="3.6"/><circle cx="20" cy="8" r="6" fill="' + COLOR_TOUR + '" stroke="#fff" stroke-width="2"/></svg></span>👥 Free tour: recorrido con guía y sus paradas</li>' +
    '<li><span class="sim"><svg width="40" height="12"><path d="M2 6h36" stroke="#6e3828" stroke-width="3.2" stroke-dasharray="0.1 7" stroke-linecap="round"/></svg></span>🚶 A pie</li>' +
    '<li><span class="sim"><svg width="40" height="12"><path d="M2 6h36" stroke="#5c6f8a" stroke-width="3.2" stroke-dasharray="10 7"/></svg></span>🚕 En taxi</li>' +
    '<li><span class="sim"><svg width="40" height="12"><path d="M2 6h36" stroke="#6b4a7e" stroke-width="3.2" stroke-dasharray="12 6"/></svg></span>Ⓜ En metro · 🚌 en autobús (azul)</li>' +
    '</ul><p>Toca un camino o su etiqueta de minutos para ver la ruta narrada. Toca el mapa vacío para cerrar la ficha.</p>';

  /* ---------- día ---------- */
  function pintarPestanas() {
    const cont = $('dias'); cont.innerHTML = '';
    datos.dias.forEach((d) => {
      const b = document.createElement('button');
      const [dia, num] = d.titulo.split(' ');
      b.innerHTML = '<small></small><b></b>';
      b.querySelector('small').textContent = dia.slice(0, 3);
      b.querySelector('b').textContent = num;
      b.className = estado.dia === d ? 'activo' : '';
      b.title = d.titulo + ' · ' + d.lema;
      b.onclick = () => abrirDia(d);
      cont.appendChild(b);
    });
  }
  function zonasDe(d) {
    const z = { sofia: [], plovdiv: [] };
    d.pasos.forEach((p) => { if (p.tipo === 'parada') (esPlovdiv(p.lugar) ? z.plovdiv : z.sofia).push(coordDe(p.lugar)); });
    return z;
  }
  function encuadrarDia(d, zona) {
    const z = zonasDe(d);
    const pts = zona === 'plovdiv' ? z.plovdiv : zona === 'sofia' ? z.sofia : (z.plovdiv.length ? z.plovdiv : z.sofia);
    const ext = ol.extent.boundingExtent(pts);
    // Más los tramos (no el autobús) que quedan dentro de la zona
    const enPlovdiv = zona === 'plovdiv' || (!zona && z.plovdiv.length > 0);
    capaTramos.getSource().getFeatures().forEach((f) => {
      const t = f.get('t');
      if (t.modo !== 'bus' && esPlovdiv(t.desde) === enPlovdiv && esPlovdiv(t.hasta) === enPlovdiv) ol.extent.extend(ext, f.getGeometry().getExtent());
    });
    encuadrar(ext, 16.5);
    $('zona').querySelectorAll('button').forEach((b) => b.classList.toggle('activo', b.dataset.zona === (zona || (z.plovdiv.length ? 'plovdiv' : 'sofia'))));
  }
  function cargarCapasDia(d) {
    const sp = capaParadas.getSource(), st = capaTramos.getSource();
    sp.clear(); st.clear(); capaEtqT.getSource().clear(); capaTour.getSource().clear();
    const vistos = new Set();
    d.pasos.forEach((p) => {
      if (p.tipo === 'parada') {
        if (vistos.has(p.lugar)) return;
        vistos.add(p.lugar);
        const f = new ol.Feature(new ol.geom.Point(coordDe(p.lugar)));
        f.set('p', p); sp.addFeature(f);
      } else {
        const g = fmt.readGeometry(p.geom, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
        if (p.tour) p.modo = 'tour';
        const f = new ol.Feature(g); f.set('t', p); p.feature = f; st.addFeature(f);
        (p.paradasTour || []).forEach((q) => {
          if (q.n === 1 || q.n === p.paradasTour.length) return; // inicio y final ya son paradas del día
          const fq = new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(q.coord))); fq.set('q', q); fq.set('t', p); capaTour.getSource().addFeature(fq);
        });
        const et = new ol.Feature(new ol.geom.Point(g.getCoordinateAt(0.5))); et.set('t', p); capaEtqT.getSource().addFeature(et);
      }
    });
  }
  function abrirDia(d, sinMover) {
    if (narrador) narrador.parar();
    estado.dia = d; estado.paso = null; estado.siguiente = null;
    cargarCapasDia(d);
    pintarPestanas();
    $('vista-paso').hidden = true; $('vista-dia').hidden = false;
    $('d-fecha').textContent = d.titulo + ' de diciembre';

    $('d-lema').textContent = d.lema;
    const intro = $('d-intro'); intro.innerHTML = '';
    d.intro.forEach((t) => { const el = document.createElement('p'); el.textContent = t; intro.appendChild(el); });
    document.body.classList.remove('historia-abierta');
    if (narrador) narrador.preparar($('d-narrar'), d.audio);
    const z = zonasDe(d);
    $('zona').hidden = !(z.plovdiv.length && z.sofia.length);
    pintarPasos(d);
    $('cuerpo').scrollTop = 0;
    if (esMovil()) panelM.normal();
    refrescar();
    history.replaceState(null, '', '#' + d.id);
    if (!sinMover) encuadrarDia(d);
  }
  function pintarPasos(d) {
    const ul = $('pasos'); ul.innerHTML = '';
    d.pasos.forEach((p) => {
      const li = document.createElement('li');
      if (p.tipo === 'parada') {
        const vis = !NO_VISITABLES.has(p.lugar) && V.tiene(p.lugar);
        const tipo = tipoParada(p);
        li.className = 'parada' + (vis ? ' hecho' : '') + ' ' + tipo + (p.descanso ? ' descanso' : '');
        li.innerHTML = '<span class="num"></span><span><span class="hora"></span><b></b><small></small><span class="marcas"></span></span>';
        if (tipo === 'comida' && !vis) li.querySelector('.num').innerHTML = svgComida(30);
        else li.querySelector('.num').textContent = vis ? '✓' : GLIFO[p.lugar] || p.n;
        li.querySelector('.hora').textContent = p.hora;
        li.querySelector('.marcas').innerHTML = marcas(p, true);
        li.querySelector('b').textContent = p.titulo;
        li.querySelector('small').textContent = p.nombre + (p.precio ? ' · ' + p.precio : '');
      } else {
        const m = MODOS[p.modo];
        li.className = 'tramo modo-' + p.modo;
        li.innerHTML = '<span class="ico"></span><span class="txt"></span><span class="t"></span>';
        li.querySelector('.ico').textContent = m.icono;
        li.querySelector('.txt').textContent = p.titulo;
        const t = li.querySelector('.t');
        if (p.salida) { t.innerHTML = '<b></b><small></small>'; t.querySelector('b').textContent = p.salida + ' → ' + p.llegada; t.querySelector('small').textContent = txtMin(p.min) + ' · ' + txtDist(p.dist); }
        else t.textContent = txtMin(p.min) + ' · ' + txtDist(p.dist);
        if (p.opcional) li.classList.add('opcional');
      }
      li.onclick = () => abrirPaso(p);
      p.li = li;
      li.onmouseenter = () => ponerSobre(p.tipo === 'parada' ? capaParadas.getSource().getFeatures().map((f) => f.get('p')).find((x) => x.lugar === p.lugar) || p : p);
      li.onmouseleave = () => ponerSobre(null);
      ul.appendChild(li);
    });
  }

  /* Etiquetas de una parada: reservado, comida, opcional, tiempo justo */
  function marcas(p, corto) {
    const m = [];
    if (p.reserva) m.push('<span class="marca m-reservado">✓ Reservado · ' + p.reserva + '</span>');
    if (p.comida && !corto) m.push('<span class="marca m-comida">' + COMIDAS[p.comida] + '</span>');
    if (p.opcional) m.push('<span class="marca m-opcional">Opcional</span>');
    if (p.aviso) m.push('<span class="marca m-aviso">⚠ ' + (p.avisoEtq || 'Aviso') + '</span>');
    return m.join('');
  }

  /* ---------- paso: parada o tramo ---------- */
  function idPaso(p, d) { return p.audio || ((d || estado.dia).id + '-p' + p.n); }
  function abrirPaso(p, sinMover) {
    if (narrador) narrador.parar();
    estado.paso = p;
    // El camino que sigue a esta parada (si lo hay) se resalta levemente
    const ip = estado.dia.pasos.indexOf(p);
    estado.siguiente = p.tipo === 'parada' && estado.dia.pasos[ip + 1] && estado.dia.pasos[ip + 1].tipo === 'tramo' ? estado.dia.pasos[ip + 1] : null;
    $('vista-dia').hidden = true; $('vista-paso').hidden = false;
    document.body.classList.remove('historia-abierta');
    const esParada = p.tipo === 'parada';
    $('p-tipo').textContent = esParada ? (p.hora ? p.hora + ' · ' : '') + estado.dia.titulo : MODOS[p.modo].icono + ' ' + MODOS[p.modo].nombre + (p.salida ? ' · ' + p.salida + ' → ' + p.llegada : '') + ' · ' + estado.dia.titulo;
    $('p-titulo').textContent = p.titulo;
    $('p-sub').textContent = esParada ? p.nombre : datos.lugares[p.desde].nombre + ' → ' + datos.lugares[p.hasta].nombre;
    $('p-fila').hidden = esParada;
    // Escuchar: en los caminos va junto a los minutos, arriba; en las paradas, junto a «visitado»
    (esParada ? document.querySelector('#vista-paso .acciones-ficha') : $('p-fila')).insertBefore($('p-narrar'), esParada ? $('p-visitado') : null);
    if (!esParada) { $('p-min').textContent = txtMin(p.min); $('p-dist').textContent = (p.salida ? 'sale ' + p.salida + ' · llega ' + p.llegada + ' · ' : '') + MODOS[p.modo].nombre.toLowerCase() + ' · ' + txtDist(p.dist); }
    $('p-precio').hidden = !p.precio; $('p-precio').textContent = p.precio || '';
    $('p-marcas').innerHTML = esParada ? marcas(p) : (p.opcional ? marcas(p) : ''); $('p-marcas').hidden = !$('p-marcas').innerHTML;
    $('p-aviso').hidden = !p.aviso; $('p-aviso').textContent = p.aviso || '';
    $('p-calle').hidden = !p.calle; $('p-calle').innerHTML = p.calle ? '<b>Plan B en la calle</b>' : ''; if (p.calle) $('p-calle').appendChild(document.createTextNode(p.calle));
    $('p-alt').hidden = !p.alternativa; $('p-alt').textContent = p.alternativa ? 'Alternativa: ' + p.alternativa : '';
    const ul = $('p-datos'); ul.innerHTML = '';
    (p.datos || []).forEach((t) => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
    ul.hidden = !(p.datos || []).length;
    const lt = $('p-tour');
    lt.hidden = !p.paradasTour; lt.innerHTML = '';
    if (p.paradasTour) {
      const h = document.createElement('h3'); h.textContent = 'Las ' + p.paradasTour.length + ' paradas del free tour'; lt.appendChild(h);
      const ol_ = document.createElement('ol');
      p.paradasTour.forEach((q) => {
        const li = document.createElement('li'); li.dataset.n = q.n;
        if (q.explora) { const a = document.createElement('a'); a.href = '../explora/#' + q.explora; a.textContent = q.nombre; li.appendChild(a); }
        else li.textContent = q.nombre;
        li.onmouseenter = () => ponerSobre(q); li.onmouseleave = () => ponerSobre(null);
        ol_.appendChild(li);
      });
      lt.appendChild(ol_);
      const n = document.createElement('p'); n.className = 'nota-tour'; n.textContent = 'Recorrido indicativo: el guía puede cambiar el orden o saltarse alguna parada.'; lt.appendChild(n);
    }
    const tx = $('p-texto'); tx.innerHTML = '';
    p.texto.forEach((t) => { const el = document.createElement('p'); el.textContent = t; tx.appendChild(el); });
    $('p-narrar').hidden = !p.audio;
    if (narrador && p.audio) narrador.preparar($('p-narrar'), p.audio);
    // Visitado (compartido con Explora)
    const visitable = esParada && !NO_VISITABLES.has(p.lugar);
    $('p-visitado').hidden = !visitable;
    if (visitable) pintarVisitado();
    // Qué pedir (restaurantes): arriba, bajo el nombre del sitio
    $('p-pedir').hidden = !(esParada && p.comer);
    if (esParada && p.comer) $('p-pedir').href = '../comer/#' + p.comer;
    $('p-explora').hidden = !(esParada && p.explora);
    if (esParada && p.explora) $('p-explora').href = '../explora/#' + p.explora;
    // Enlaces
    const ir = $('p-ir'); ir.innerHTML = '';
    const enlace = (txt, href, cls) => { const a = document.createElement('a'); a.textContent = txt; a.href = href; a.className = cls || 'ver-google'; if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; } ir.appendChild(a); };
    if (esParada) {
      const [lon, lat] = datos.lugares[p.lugar].coord;
      enlace('Cómo llegar', 'https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=' + lat + ',' + lon, 'llevame');
    } else {
      const [lo1, la1] = datos.lugares[p.desde].coord, [lo2, la2] = datos.lugares[p.hasta].coord;
      enlace('Abrir en Google Maps', 'https://www.google.com/maps/dir/?api=1&travelmode=' + MODOS[p.modo].gm + '&origin=' + la1 + ',' + lo1 + '&destination=' + la2 + ',' + lo2, 'llevame');
    }
    // Anterior / siguiente
    const i = estado.dia.pasos.indexOf(p);
    const ant = estado.dia.pasos[i - 1], sig = estado.dia.pasos[i + 1];
    $('p-ant').disabled = !ant; $('p-sig').disabled = !sig;
    $('p-ant').onclick = () => ant && abrirPaso(ant); $('p-sig').onclick = () => sig && abrirPaso(sig);
    $('p-cuenta').textContent = (i + 1) + '/' + estado.dia.pasos.length;
    $('cuerpo').scrollTop = 0;
    if (esMovil()) panelM.normal();
    refrescar();
    history.replaceState(null, '', '#' + idPaso(p));
    if (!esParada) requestAnimationFrame(animar);
    if (!sinMover) {
      // Centrar en la parada elegida, en la parte del mapa que deja libre el panel
      if (esParada) encuadrar(ol.extent.boundingExtent([coordDe(p.lugar)]), Math.min(18, Math.max(view.getZoom(), 16)));
      else encuadrar(p.feature.getGeometry().getExtent(), p.modo === 'bus' ? 9 : 17);
    }
  }
  function marcarParadaTour(q) {
    const li = document.querySelector('#p-tour li[data-n="' + q.n + '"]');
    document.querySelectorAll('#p-tour li.activa').forEach((x) => x.classList.remove('activa'));
    if (li) { li.classList.add('activa'); li.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  }
  function pintarVisitado() {
    const p = estado.paso, b = $('p-visitado');
    if (!p || p.tipo !== 'parada') return;
    const v = V.tiene(p.lugar);
    b.setAttribute('aria-pressed', String(v));
    b.textContent = v ? 'Visitado' : 'Marcar como visitado';
  }
  function cerrarPaso() {
    if (narrador) narrador.parar();
    estado.paso = null; estado.siguiente = null;
    $('vista-paso').hidden = true; $('vista-dia').hidden = false;
    pintarPasos(estado.dia);
    refrescar();
    history.replaceState(null, '', '#' + estado.dia.id);
  }

  /* ---------- arranque ---------- */
  function diaInicial() {
    const hoy = new Date();
    const iso = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
    return datos.dias.find((d) => d.fecha === iso) || datos.dias[0];
  }
  function irAlHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return false;
    for (const d of datos.dias) {
      if (h === d.id) { abrirDia(d); return true; }
      const p = d.pasos.find((x) => idPaso(x, d) === h);
      if (p) { if (estado.dia !== d) abrirDia(d, true); abrirPaso(p); return true; }
    }
    return false;
  }
  async function iniciar() {
    if (!window.ol || !window.SofiaComun) { document.body.innerHTML = '<p style="padding:2em">No se pudo cargar el mapa.</p>'; return; }
    SofiaComun.enlacePortal(document.querySelector('.cabecera'));
    narrador = new SofiaComun.Narrador('audio/');
    panelM = SofiaComun.panelMovil($('panel'));
    crearMapa();
    SofiaComun.pistaMapa(map, 'itinerario', 'Toca una parada o un camino del mapa para ver la hora, el precio y escuchar su narración');
    datos = await (await fetch('datos/itinerario.json', { cache: 'no-store' })).json();
    $('volver-dia').onclick = cerrarPaso; $('cerrar-paso').onclick = cerrarPaso;
    $('p-visitado').onclick = () => { const p = estado.paso; if (!p) return; V.poner(p.lugar, !V.tiene(p.lugar)); pintarVisitado(); refrescar(); };
    $('zona').querySelectorAll('button').forEach((b) => { b.onclick = () => encuadrarDia(estado.dia, b.dataset.zona); });
    $('leer-mas').onclick = () => document.body.classList.add('historia-abierta');
    $('tirador').onclick = () => panelM.alternar();
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && estado.paso) cerrarPaso(); });
    SofiaComun.leyenda(document.querySelector('.botones-mapa'), LEYENDA);
    V.alCambiar(() => { pintarVisitado(); if (estado.dia) pintarPasos(estado.dia); refrescar(); });
    window.addEventListener('hashchange', irAlHash);
    if (!irAlHash()) abrirDia(diaInicial());
    prepararDemo();
  }
  function prepararDemo() {
    let abierto = false;
    const paradas = () => (estado.dia ? estado.dia.pasos.filter((p) => p.tipo === 'parada') : []);
    SofiaComun.demoApp(document.querySelector('.botones-mapa'), {
      clave: 'itinerario',
      pasos: [
        { titulo: 'Toca el mapa', texto: 'Cada número es una parada del día: tócalo para abrir su ficha. Las líneas son los caminos a pie entre paradas, y también se pueden tocar.', redondo: true,
          antes: () => { if (estado.paso) cerrarPaso(); panelM.normal(); },
          el: () => { const c = SofiaComun.coordVisible(map, paradas().map((p) => coordDe(p.lugar))); return c && SofiaComun.rectMapa(map, c, 22); }, opcional: true },
        { titulo: 'Los días del viaje', texto: 'Cambia de día aquí. Debajo tienes la presentación del día y la lista de paradas.', el: '#dias' },
        { titulo: 'Adelante y atrás', texto: 'Dentro de una parada, pasa a la siguiente o vuelve a la anterior sin salir de la ficha.', el: '.nav-pasos',
          antes: () => { const p = paradas()[0]; if (p) { abrirPaso(p); abierto = true; } } },
        { titulo: 'Escucha la historia', texto: 'Pulsa «Escuchar» para oír la narración del lugar mientras caminas.', el: '#p-narrar' },
        { titulo: 'Más información', texto: 'Arrastra la ficha hacia arriba con el dedo para leerla entera; hacia abajo, para volver a ver el mapa.', el: '#tirador', antes: () => { $('cuerpo').scrollTop = 0; } },
        { titulo: 'Volver', texto: '«El día» te devuelve al resumen del día. Y «Menú», arriba, a las demás apps del viaje.', el: '#volver-dia' }
      ],
      alFinal: () => { if (abierto && estado.paso) cerrarPaso(); }
    });
  }
  document.addEventListener('DOMContentLoaded', iniciar);
})();
