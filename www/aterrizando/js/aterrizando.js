/* Aterrizando en Sofía · vuelos, traslado, servicios cercanos (mapa) y previsión del tiempo */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const D = window.ATERRIZA;
  const TIPOS = { super: ['carro', 'Supermercados', '#5f7a34'], farmacia: ['cruz', 'Farmacias', '#2f7f86'], hospital: ['H', 'Urgencias', '#a8322a'],
    metro: ['M', 'Metro', '#6b4a7e'], bus: ['bus', 'Bus y tranvía', '#2f5d7c'] };
  /* Glifos blancos en SVG (24x24): se leen igual en todos los móviles, a diferencia de los emojis */
  const GLIFOS = {
    carro: '<g fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4h3l2.3 10.5h10l2.2-7.5H6.6"/></g><circle cx="9.5" cy="19" r="1.8" fill="#fff"/><circle cx="16.5" cy="19" r="1.8" fill="#fff"/>',
    cruz: '<path d="M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z" fill="#fff"/>',
    H: '<path d="M6 4h3.2v6.4h5.6V4H18v16h-3.2v-6.6H9.2V20H6z" fill="#fff"/>',
    M: '<path d="M4 20V4h3.3L12 11.5 16.7 4H20v16h-3.2V9.6L12 17l-4.8-7.4V20z" fill="#fff"/>',
    bus: '<rect x="5" y="3" width="14" height="15" rx="2.5" fill="#fff"/><rect x="7" y="5.5" width="10" height="5.5" rx="1" fill="COLOR"/><circle cx="8.6" cy="14.6" r="1.3" fill="COLOR"/><circle cx="15.4" cy="14.6" r="1.3" fill="COLOR"/><path d="M7 18v2.5M17 18v2.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>'
  };
  const svgTipo = (t, tam, borde) => {
    const [g, , color] = TIPOS[t];
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + tam + '" height="' + tam + '" viewBox="-6 -6 36 36"><circle cx="12" cy="12" r="' + (borde ? 16.5 : 18) + '" fill="' + color + '"' + (borde ? ' stroke="' + borde + '" stroke-width="3"' : '') + '/>' + GLIFOS[g].replace(/COLOR/g, color) + '</svg>';
  };
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
      const tam = f.get('sel') ? 30 : 24;
      cache[k] = new S.Style({ image: new S.Icon({ src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgTipo(s.tipo, tam, f.get('sel') ? '#e0b04a' : '#fff')), width: tam, height: tam, opacity: oculto ? 0.25 : 1 }),
        zIndex: f.get('sel') ? 40 : 10 });
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
      if (t) { b.innerHTML = svgTipo(t, 20); b.appendChild(document.createTextNode(TIPOS[t][1])); } else b.textContent = 'Todo';
      b.className = filtro.t === t ? 'activo' : '';
      b.onclick = () => { filtro.t = t; lista(); if (capa) capa.changed(); };
      f.appendChild(b);
    });
    const ul = $('servicios'); ul.innerHTML = '';
    D.servicios.filter((s) => !filtro.t || s.tipo === filtro.t)
      .map((s) => Object.assign(s, { m: hav(D.casa.coord, s.coord) }))
      .sort((a, b) => a.m - b.m)
      .forEach((s) => {
        const li = document.createElement('li'); li.dataset.n = s.nombre;
        li.innerHTML = '<span class="ico"></span><span class="txt"><b></b><small></small></span><span class="lado"><span class="dist"></span><a target="_blank" rel="noopener">Cómo llegar</a></span>';
        li.querySelector('.ico').innerHTML = svgTipo(s.tipo, 28);
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
      cont.innerHTML = (titulo ? '<p class="nota">' + titulo + '</p>' : '') + '<p class="leyenda-tiempo">💧 Probabilidad de lluvia (❄ de nieve) · La barra va de la mínima a la máxima del día</p><ul class="dias-tiempo"></ul>';
      const fila = cont.querySelector('.dias-tiempo');
      const NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const tMin = Math.min(...d.temperature_2m_min), tMax = Math.max(...d.temperature_2m_max), rango = Math.max(1, tMax - tMin);
      d.time.forEach((t, i) => {
        const [, ico, txt] = wmo(d.weather_code[i]);
        const f = new Date(t + 'T12:00:00');
        const max = Math.round(d.temperature_2m_max[i]), min = Math.round(d.temperature_2m_min[i]);
        const p = d.precipitation_probability_max[i];
        const nieve = d.weather_code[i] >= 71 && d.weather_code[i] <= 86 && d.weather_code[i] !== 80 && d.weather_code[i] !== 81 && d.weather_code[i] !== 82;
        const li = document.createElement('li'); li.className = 'dia-t';
        li.innerHTML = '<div class="fecha"><span class="dn"></span><b></b></div>' +
          '<div class="cielo"><span class="ico" aria-hidden="true"></span><div><span class="txt"></span><span class="lluvia"></span></div></div>' +
          '<div class="temps"><span class="t-max"></span><span class="barra-t"><i></i></span><span class="t-min"></span></div>';
        li.querySelector('.dn').textContent = NOMBRES[f.getDay()];
        li.querySelector('.fecha b').textContent = f.getDate() + ' ' + MESES[f.getMonth()];
        li.querySelector('.ico').textContent = ico;
        li.querySelector('.txt').textContent = txt;
        li.querySelector('.lluvia').textContent = p == null ? '' : p < 10 ? 'Sin ' + (nieve ? 'nieve' : 'lluvia') : (nieve ? '❄ ' : '💧 ') + p + ' %';
        li.querySelector('.t-max').innerHTML = '<small>Máx.</small> ' + max + '°';
        li.querySelector('.t-min').innerHTML = '<small>Mín.</small> ' + min + '°';
        const barra = li.querySelector('.barra-t i');
        barra.style.left = ((d.temperature_2m_min[i] - tMin) / rango * 100) + '%';
        barra.style.right = ((tMax - d.temperature_2m_max[i]) / rango * 100) + '%';
        li.title = NOMBRES[f.getDay()] + ': ' + txt + ', máxima ' + max + ' °C y mínima ' + min + ' °C';
        fila.appendChild(li);
      });
    } catch (e) {
      cont.innerHTML = '<p class="nota">No se ha podido cargar la previsión. Lo normal a principios de diciembre: máximas de 2 a 8 °C y mínimas de -4 a 2 °C, nublado y a veces niebla.</p>';
    }
  }

  /* ---------- gastos ---------- */
  const eur = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2, useGrouping: 'always' }) + ' €';
  const rango = (a, b) => (Math.abs(a - b) < 0.005 ? eur(a) : eur(a) + ' – ' + eur(b));
  function gastos() {
    const cont = $('gastos'); if (!cont || !D.gastos) return;
    let tMin = 0, tMax = 0;
    const html = D.gastos.map((g) => {
      let dMin = 0, dMax = 0;
      const filas = g.lineas.map(([c, a, b, nota]) => {
        dMin += a; dMax += b;
        return '<li><span class="g-concepto">' + c + (nota ? '<small>' + nota + '</small>' : '') + '</span><span class="g-precio' + (a === 0 && b === 0 ? ' gratis' : '') + '">' + rango(a, b) + '</span></li>';
      }).join('');
      tMin += dMin; tMax += dMax;
      return '<section class="g-dia"><h3><span>' + g.dia + '</span><span class="g-sub">' + rango(dMin, dMax) + '</span></h3><ul>' + filas + '</ul></section>';
    }).join('');
    const redondo = (n, arriba) => (arriba ? Math.ceil(n / 5) * 5 : Math.floor(n / 5) * 5);
    cont.innerHTML = html +
      '<div class="g-total"><span>Total por persona</span><strong>' + eur(redondo(tMin)) + ' – ' + eur(redondo(tMax, true)) + '</strong>' +
      '<small>Para los siete: ' + eur(redondo(tMin * 7)) + ' – ' + eur(redondo(tMax * 7, true)) + '</small></div>' +
      '<p class="nota">Sin contar las copas en Bar Petak ni las compras y caprichos. Precios orientativos: los de las entradas son los publicados; los de comer y beber, lo habitual en cada sitio.</p>';
  }

  document.addEventListener('DOMContentLoaded', () => {
    SofiaComun.enlacePortal(document.querySelector('.cab-nav'));
    cuentaAtras(); vuelos(); casa(); lista(); tiempo(); gastos();
    // El mapa de «Cerca de casa» se crea al abrir la tarjeta (dentro de una tarjeta cerrada no tiene tamaño)
    const tc = $('t-cerca');
    const preparar = () => { if (!window.ol) return; if (!map) crearMapa(); else map.updateSize(); };
    tc.addEventListener('toggle', () => { if (tc.open) setTimeout(preparar, 30); });
    if (tc.open) preparar();
  });
})();
