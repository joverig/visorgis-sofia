/* Aterrizando en Sofía · vuelos, traslado, servicios cercanos (mapa) y previsión del tiempo */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const D = window.ATERRIZA;
  const TIPOS = { super: ['🛒', 'Supermercados', '#5f7a34'], farmacia: ['✚', 'Farmacias', '#2f7f86'], hospital: ['H', 'Urgencias', '#a8322a'],
    metro: ['M', 'Metro', '#6b4a7e'], bus: ['🚌', 'Bus y tranvía', '#2f5d7c'] };
  const filtro = { t: null };
  const hav = (a, b) => {
    const r = Math.PI / 180, h = Math.sin((b[1] - a[1]) * r / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin((b[0] - a[0]) * r / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.sqrt(h));
  };
  const aPie = (m) => Math.max(1, Math.round(m * 1.3 / 1000 / 4.5 * 60));
  const gmDir = (modo, o, d) => 'https://www.google.com/maps/dir/?api=1&travelmode=' + modo + (o ? '&origin=' + o[1] + ',' + o[0] : '') + '&destination=' + d[1] + ',' + d[0];

  function cuentaAtras() {
    const salida = new Date('2026-12-04T16:50:00+01:00'), ahora = new Date();
    const dias = Math.ceil((salida - ahora) / 86400000);
    $('cuenta').textContent = dias > 1 ? 'Faltan ' + dias + ' días para despegar' : dias === 1 ? '¡Mañana despegáis!' : ahora < new Date('2026-12-09') ? '¡Ya estáis en Sofía!' : 'Viaje terminado. ¡Hasta la próxima!';
  }
  function vuelos() {
    const c = $('vuelos');
    D.vuelos.forEach((v) => {
      const a = document.createElement('article'); a.className = 'vuelo';
      a.innerHTML = '<span class="etq"></span><div class="horas"><div><b class="h1"></b><small class="d1"></small></div><span class="avion">✈</span><div><b class="h2"></b><small class="d2"></small></div></div><p class="codigo"></p><p class="nota"></p><a class="boton secundario" target="_blank" rel="noopener">Estado del vuelo</a>';
      a.querySelector('.etq').textContent = v.sentido + ' · ' + v.dia;
      a.querySelector('.h1').textContent = v.sale; a.querySelector('.d1').textContent = v.desde;
      a.querySelector('.h2').textContent = v.llega; a.querySelector('.d2').textContent = v.hasta;
      a.querySelector('.codigo').textContent = 'Ryanair ' + v.codigo;
      a.querySelector('.nota').textContent = v.nota;
      a.querySelector('a').href = 'https://www.flightradar24.com/data/flights/' + v.codigo.toLowerCase();
      c.appendChild(a);
    });
  }
  function casa() {
    $('direccion').textContent = D.casa.direccion;
    const dl = $('datos-casa');
    D.alojamiento.forEach(([k, v]) => { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; dl.append(dt, dd); });
    $('casa-maps').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('ulitsa Sredna Gora 16, 1303 Sofia');
    $('ir-coche').href = gmDir('driving', D.aeropuerto.coord, D.casa.coord);
    $('ir-metro').href = gmDir('transit', D.aeropuerto.coord, D.casa.coord);
  }

  /* ---------- mapa de servicios ---------- */
  let map, capa;
  const S = ol.style, cache = {};
  function estilo(f) {
    const s = f.get('s');
    if (!s) return new S.Style({ image: new S.Circle({ radius: 13, fill: new S.Fill({ color: '#22262c' }), stroke: new S.Stroke({ color: '#e0b04a', width: 3 }) }),
      text: new S.Text({ text: '⌂', font: '700 15px sans-serif', fill: new S.Fill({ color: '#fff' }) }), zIndex: 50 });
    const oculto = filtro.t && filtro.t !== s.tipo;
    const k = s.tipo + oculto + (f.get('sel') ? 1 : 0);
    if (!cache[k]) {
      const [ico, , color] = TIPOS[s.tipo];
      cache[k] = new S.Style({ image: new S.Circle({ radius: f.get('sel') ? 12 : 9, fill: new S.Fill({ color }), stroke: new S.Stroke({ color: f.get('sel') ? '#e0b04a' : '#fff', width: 2.5 }) }),
        text: new S.Text({ text: ico, font: '700 10px sans-serif', fill: new S.Fill({ color: '#fff' }) }), zIndex: f.get('sel') ? 40 : 10 });
      if (oculto) { cache[k].getImage().setOpacity(0.25); cache[k].setText(null); }
    }
    return cache[k];
  }
  function crearMapa() {
    const c = ol.proj.fromLonLat(D.casa.coord);
    capa = new ol.layer.Vector({ source: new ol.source.Vector(), style: estilo });
    map = new ol.Map({ target: 'mapa', layers: [capa], view: new ol.View({ center: c, zoom: 15.5, minZoom: SofiaComun.ZOOM_MIN, maxZoom: 19 }) });
    const bases = SofiaComun.basesMapa(map);
    SofiaComun.botonCapa($('capa'), bases);
    SofiaComun.localizador(map, $('gps'));
    const fc = new ol.Feature(new ol.geom.Point(c)); capa.getSource().addFeature(fc);
    D.servicios.forEach((s) => { const f = new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(s.coord))); f.set('s', s); s.f = f; capa.getSource().addFeature(f); });
    const ext = ol.extent.boundingExtent(D.servicios.filter((s) => s.tipo !== 'hospital').map((s) => ol.proj.fromLonLat(s.coord)).concat([c]));
    map.getView().fit(ext, { padding: [30, 30, 30, 60], maxZoom: 16.5 });
    map.on('singleclick', (e) => { const f = map.forEachFeatureAtPixel(e.pixel, (x) => x); if (f && f.get('s')) seleccionar(f.get('s'), true); });
  }
  function seleccionar(s, desdeMapa) {
    D.servicios.forEach((x) => x.f.set('sel', x === s));
    document.querySelectorAll('.servicios li').forEach((li) => li.classList.toggle('sel', li.dataset.n === s.nombre));
    map.getView().animate({ center: ol.proj.fromLonLat(s.coord), duration: 400 });
    if (desdeMapa) { const li = document.querySelector('.servicios li.sel'); if (li) li.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  }
  function lista() {
    const f = $('filtros'); f.innerHTML = '';
    [null].concat(Object.keys(TIPOS)).forEach((t) => {
      const b = document.createElement('button');
      b.textContent = t ? TIPOS[t][0] + ' ' + TIPOS[t][1] : 'Todo';
      b.className = filtro.t === t ? 'activo' : '';
      b.onclick = () => { filtro.t = t; lista(); capa.changed(); };
      f.appendChild(b);
    });
    const ul = $('servicios'); ul.innerHTML = '';
    D.servicios.filter((s) => !filtro.t || s.tipo === filtro.t)
      .map((s) => Object.assign(s, { m: hav(D.casa.coord, s.coord) }))
      .sort((a, b) => a.m - b.m)
      .forEach((s) => {
        const li = document.createElement('li'); li.dataset.n = s.nombre;
        li.innerHTML = '<span class="ico"></span><span class="txt"><b></b><small></small></span><span class="lado"><span class="dist"></span><a target="_blank" rel="noopener">Cómo llegar</a></span>';
        const ico = li.querySelector('.ico'); ico.textContent = TIPOS[s.tipo][0]; ico.style.background = TIPOS[s.tipo][2];
        li.querySelector('b').textContent = s.nombre;
        li.querySelector('small').textContent = s.horario;
        li.querySelector('.dist').textContent = (s.m < 1000 ? Math.round(s.m / 10) * 10 + ' m' : (s.m / 1000).toFixed(1).replace('.', ',') + ' km') + ' · ' + aPie(s.m) + ' min a pie';
        li.querySelector('a').href = gmDir('walking', null, s.coord);
        li.querySelector('a').onclick = (e) => e.stopPropagation();
        li.onclick = () => seleccionar(s);
        ul.appendChild(li);
      });
  }

  /* ---------- tiempo (Open-Meteo) ---------- */
  const WMO = [[0, '☀️', 'Despejado'], [1, '🌤', 'Casi despejado'], [2, '⛅', 'Nubes y claros'], [3, '☁️', 'Nublado'], [45, '🌫', 'Niebla'], [48, '🌫', 'Niebla helada'],
    [51, '🌦', 'Llovizna'], [56, '🌧', 'Llovizna helada'], [61, '🌧', 'Lluvia débil'], [63, '🌧', 'Lluvia'], [65, '🌧', 'Lluvia fuerte'], [66, '🌧', 'Lluvia helada'],
    [71, '🌨', 'Nieve débil'], [73, '🌨', 'Nieve'], [75, '❄️', 'Nevada fuerte'], [77, '🌨', 'Granizo fino'], [80, '🌦', 'Chubascos'], [85, '🌨', 'Chubascos de nieve'], [95, '⛈', 'Tormenta']];
  const wmo = (c) => { let r = WMO[0]; WMO.forEach((x) => { if (c >= x[0]) r = x; }); return r; };
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  async function tiempo() {
    const [lon, lat] = D.casa.coord;
    const base = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FSofia';
    const cont = $('tiempo');
    try {
      let j = await fetch(base + '&start_date=2026-12-04&end_date=2026-12-08').then((r) => r.json());
      let titulo = '';
      if (j.error || !j.daily) { // aún fuera del alcance de la previsión: se muestran los próximos días
        j = await fetch(base + '&forecast_days=7').then((r) => r.json());
        titulo = 'Todavía es pronto para la previsión del viaje (se publica unos 16 días antes). Mientras, así están los próximos días en Sofía:';
      }
      const d = j.daily;
      cont.innerHTML = (titulo ? '<p class="nota">' + titulo + '</p>' : '') + '<div class="dias-tiempo"></div>';
      const fila = cont.querySelector('.dias-tiempo');
      d.time.forEach((t, i) => {
        const [ico, txt] = wmo(d.weather_code[i]);
        const f = new Date(t + 'T12:00:00');
        const el = document.createElement('div'); el.className = 'dia-t';
        el.innerHTML = '<small></small><span class="ico"></span><b></b><span class="min"></span><span class="lluvia"></span><span class="txt"></span>';
        el.querySelector('small').textContent = DIAS[f.getDay()] + ' ' + f.getDate();
        el.querySelector('.ico').textContent = ico;
        el.querySelector('b').textContent = Math.round(d.temperature_2m_max[i]) + '°';
        el.querySelector('.min').textContent = Math.round(d.temperature_2m_min[i]) + '°';
        el.querySelector('.lluvia').textContent = d.precipitation_probability_max[i] != null ? '💧 ' + d.precipitation_probability_max[i] + ' %' : '';
        el.querySelector('.txt').textContent = txt;
        fila.appendChild(el);
      });
    } catch (e) {
      cont.innerHTML = '<p class="nota">No se ha podido cargar la previsión. Lo normal a principios de diciembre: máximas de 2 a 8 °C y mínimas de -4 a 2 °C, nublado y a veces niebla.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    SofiaComun.enlacePortal(document.querySelector('.cab-nav'));
    cuentaAtras(); vuelos(); casa(); lista(); tiempo();
    if (window.ol) crearMapa();
  });
})();
