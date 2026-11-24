/* Recursos comunes de las apps de Sofía.
 *  - SofiaComun.enlacePortal(contenedor): añade el enlace «Menú» al principio del contenedor.
 *  - SofiaComun.Narrador(baseAudio): botón de narración. Lee baseAudio + 'manifest.json'
 *    (lista de ids con audio) y reproduce baseAudio + id + '.mp3'. Si un texto aún no tiene
 *    audio, el botón aparece desactivado como «Narración próximamente».
 *  - SofiaComun.capaCalles(): promesa con el mapa de calles vectorial de OpenFreeMap, con estilo
 *    propio (papel) y rótulos en castellano cuando existen o, si no, en alfabeto latino.
 */
(function () {
  const ICONO = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4.5v15L19.5 12z"/></svg>',
    pausa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.5 5h4v14h-4zM13.5 5h4v14h-4z"/></svg>',
    auris: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3a9 9 0 0 0-9 9v6a3 3 0 0 0 3 3h2v-8H5v-1a7 7 0 0 1 14 0v1h-3v8h2a3 3 0 0 0 3-3v-6a9 9 0 0 0-9-9z"/></svg>',
    volver: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.5 5.5 8 12l6.5 6.5 1.5-1.5-5-5 5-5z"/></svg>',
  };

  function enlacePortal(contenedor, href) {
    if (!contenedor) return;
    const a = document.createElement('a');
    a.className = 'portal-volver'; a.href = href || '../'; a.title = 'Volver al menú de apps de Sofía';
    a.innerHTML = ICONO.volver + 'Menú';
    contenedor.insertBefore(a, contenedor.firstChild);
  }

  function Narrador(baseAudio) {
    const audio = new Audio();
    let disponibles = null, boton = null, idActual = null;
    const listo = fetch(baseAudio + 'manifest.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : [])).catch(() => [])
      .then((l) => { disponibles = new Set(Array.isArray(l) ? l : (l.audios || [])); });

    function pintar(estado) {
      if (!boton) return;
      boton.classList.toggle('sonando', estado === 'sonando');
      if (estado === 'sin') {
        boton.disabled = true; boton.innerHTML = ICONO.auris + 'Narración próximamente';
      } else {
        boton.disabled = false;
        boton.innerHTML = (estado === 'sonando' ? ICONO.pausa + 'Pausa' : ICONO.play + 'Escuchar') +
          '<span class="barra"><i></i></span>';
      }
    }
    audio.addEventListener('ended', () => pintar('parado'));
    audio.addEventListener('pause', () => pintar('parado'));
    audio.addEventListener('play', () => pintar('sonando'));
    audio.addEventListener('timeupdate', () => {
      const i = boton && boton.querySelector('.barra i');
      if (i && audio.duration) i.style.width = (100 * audio.currentTime / audio.duration) + '%';
    });

    this.preparar = function (btn, id) {
      boton = btn; idActual = id;
      try { audio.pause(); } catch (e) {}
      pintar('sin');
      listo.then(() => {
        if (idActual !== id) return;
        if (!disponibles.has(id)) return pintar('sin');
        audio.src = baseAudio + id + '.mp3';
        pintar('parado');
        btn.onclick = () => { if (audio.paused) audio.play().catch(() => {}); else audio.pause(); };
      });
    };
    this.parar = function () { try { audio.pause(); } catch (e) {} };
  }

  /* ---------- mapa base vectorial (OpenFreeMap) con rótulos en castellano o en alfabeto latino ---------- */
  const zoomDe = (res) => Math.log2(156543.03392804097 / res);
  // Transliteración oficial búlgara (sistema de 2009) para los nombres que solo están en cirílico
  const TRANS = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
    р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya' };
  function transliterar(t) {
    return t.replace(/[а-яА-Я]/g, (c) => {
      const l = TRANS[c.toLowerCase()] || c;
      return c === c.toLowerCase() ? l : l.charAt(0).toUpperCase() + l.slice(1);
    });
  }
  const esLatino = (t) => t && !/[а-яА-Я]/.test(t);
  const nombreLatino = (f) => {
    const es = f.get('name:es'), lat = f.get('name:latin'), en = f.get('name_en'), n = f.get('name') || '';
    return es || (esLatino(lat) && lat) || (esLatino(en) && en) || transliterar(n);
  };
  const S = window.ol && ol.style;
  const fuente = (peso, px, extra) => (extra ? extra + ' ' : '') + peso + ' ' + px + 'px "Manrope", "Segoe UI", sans-serif';
  const cacheBase = {};
  const B = {
    fondo: '#f4efe6', agua: '#cddde1', aguaTxt: '#5b7f8a', parque: '#e2e8d2', bosque: '#d9e2c7', edificio: '#e9e2d6', edificioBorde: '#ddd4c4',
    via: '#ffffff', viaBorde: '#ddd2bf', menor: '#fffdf9', senda: '#c9bda7', tren: '#c2b8a6', texto: '#7b7062', lugar: '#8f8371',
  };
  function estBase(clave, crear) { return cacheBase[clave] || (cacheBase[clave] = crear()); }
  function estiloBase(f, res) {
    const capa = f.get('layer'), clase = f.get('class'), tipo = f.getType(), z = zoomDe(res);
    switch (capa) {
      case 'water': return estBase('agua', () => new S.Style({ fill: new S.Fill({ color: B.agua }) }));
      case 'waterway': return z < 12 ? null : estBase('rio', () => new S.Style({ stroke: new S.Stroke({ color: B.agua, width: 2 }) }));
      case 'park': return estBase('parque', () => new S.Style({ fill: new S.Fill({ color: B.parque }) }));
      case 'landcover':
        if (clase === 'wood' || clase === 'forest') return estBase('bosque', () => new S.Style({ fill: new S.Fill({ color: B.bosque }) }));
        if (clase === 'grass') return estBase('parque', () => new S.Style({ fill: new S.Fill({ color: B.parque }) }));
        return null;
      case 'landuse':
        if (clase === 'cemetery' || clase === 'grass') return estBase('parque', () => new S.Style({ fill: new S.Fill({ color: B.parque }) }));
        return null;
      case 'building':
        return z < 14.5 ? null : estBase('edif', () => new S.Style({ fill: new S.Fill({ color: B.edificio }), stroke: new S.Stroke({ color: B.edificioBorde, width: 0.6 }) }));
      case 'transportation': {
        if (tipo !== 'LineString' && tipo !== 'MultiLineString') return null;
        if (f.get('brunnel') === 'tunnel') return null;
        const k = Math.max(0.35, Math.pow(2, z - 15.5));
        if (clase === 'rail' || clase === 'transit') {
          return z < 13 ? null : estBase('tren' + Math.round(z), () => new S.Style({ stroke: new S.Stroke({ color: B.tren, width: 1.2, lineDash: [4, 4] }), zIndex: 2 }));
        }
        if (clase === 'path' || clase === 'track') {
          return z < 15 ? null : estBase('senda' + Math.round(z), () => new S.Style({ stroke: new S.Stroke({ color: B.senda, width: 1, lineDash: [3, 3] }), zIndex: 2 }));
        }
        if (z < 6 || (z < 9 && !['motorway', 'trunk', 'primary'].includes(clase)) || (z < 11 && !['motorway', 'trunk', 'primary', 'secondary'].includes(clase))) return null;
        const mayor = ['motorway', 'trunk', 'primary', 'secondary'].includes(clase);
        const media = clase === 'tertiary';
        if (!mayor && !media && z < 13.5) return null;
        const ancho = (mayor ? 9 : media ? 7 : clase === 'service' ? 3 : 5) * k;
        const kz = (mayor ? 'M' : media ? 'T' : clase === 'service' ? 'S' : 'm') + Math.round(z * 2);
        return estBase('via' + kz, () => [
          new S.Style({ stroke: new S.Stroke({ color: B.viaBorde, width: ancho + 1.6, lineCap: 'round', lineJoin: 'round' }), zIndex: mayor ? 4 : 3 }),
          new S.Style({ stroke: new S.Stroke({ color: mayor || media ? B.via : B.menor, width: ancho, lineCap: 'round', lineJoin: 'round' }), zIndex: mayor ? 6 : 5 }),
        ]);
      }
      case 'transportation_name': {
        const mayor = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'].includes(clase);
        if (z < (mayor ? 14 : 15.5)) return null;
        const n = nombreLatino(f); if (!n) return null;
        return new S.Style({ text: new S.Text({ text: n, placement: 'line', font: fuente('500', mayor ? 11.5 : 10.5), fill: new S.Fill({ color: B.texto }), stroke: new S.Stroke({ color: B.fondo, width: 3 }), maxAngle: 0.6 }), zIndex: 20 });
      }
      case 'place': {
        const n = nombreLatino(f); if (!n) return null;
        if (clase === 'country') return z > 7 ? null : new S.Style({ text: new S.Text({ text: n.toUpperCase(), font: fuente('600', 11), fill: new S.Fill({ color: B.lugar }), stroke: new S.Stroke({ color: B.fondo, width: 3 }) }) });
        if (clase === 'town' && z < 9) return null;
        if (clase === 'city' || clase === 'town') return z > 13 ? null : new S.Style({ text: new S.Text({ text: n, font: fuente('700', 15), fill: new S.Fill({ color: B.lugar }), stroke: new S.Stroke({ color: B.fondo, width: 3 }) }) });
        if (['suburb', 'quarter', 'neighbourhood'].includes(clase)) {
          return z < 13 ? null : new S.Style({ text: new S.Text({ text: n.toUpperCase(), font: fuente('600', 10.5), fill: new S.Fill({ color: B.lugar }), stroke: new S.Stroke({ color: B.fondo, width: 3 }) }), zIndex: 15 });
        }
        return null;
      }
      case 'water_name': {
        const n = nombreLatino(f); if (!n || z < 13) return null;
        return new S.Style({ text: new S.Text({ text: n, placement: tipo === 'Point' ? 'point' : 'line', font: fuente('500', 11, 'italic'), fill: new S.Fill({ color: B.aguaTxt }), stroke: new S.Stroke({ color: B.fondo, width: 3 }) }) });
      }
      default: return null;
    }
  }
  async function capaCalles() {
    const tj = await (await fetch('https://tiles.openfreemap.org/planet')).json();
    const src = new ol.source.VectorTile({
      format: new ol.format.MVT(), url: tj.tiles[0], maxZoom: tj.maxzoom || 14,
      attributions: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    });
    return new ol.layer.VectorTile({ source: src, style: estiloBase, declutter: true, background: B.fondo, className: 'base-vectorial' });
  }


  /* ---------- lugares visitados: un único almacén compartido por Explora e Itinerario ---------- */
  const CLAVE_VISITADOS = 'sofia-viajando-visitados';
  const oyentesVisitados = [];
  function leerVisitados() { try { return new Set(JSON.parse(localStorage.getItem(CLAVE_VISITADOS)) || []); } catch (e) { return new Set(); } }
  const visitados = {
    set: leerVisitados(),
    tiene(id) { return this.set.has(id); },
    poner(id, valor) {
      if (valor) this.set.add(id); else this.set.delete(id);
      try { localStorage.setItem(CLAVE_VISITADOS, JSON.stringify([...this.set])); } catch (e) { /* modo privado */ }
    },
    guardar() { try { localStorage.setItem(CLAVE_VISITADOS, JSON.stringify([...this.set])); } catch (e) {} },
    alCambiar(fn) { oyentesVisitados.push(fn); },
  };
  // Si se marca un lugar en otra pestaña (p. ej. en el Itinerario), se refleja aquí
  window.addEventListener('storage', (e) => {
    if (e.key !== CLAVE_VISITADOS) return;
    visitados.set = leerVisitados();
    oyentesVisitados.forEach((fn) => { try { fn(); } catch (x) {} });
  });

  /* ---------- mapas base: OpenStreetMap (vector con estilo propio) o satélite ---------- */
  const ESRI_SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const ESRI_REF = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
  // Añade las dos bases al mapa (por debajo de todo) y devuelve { alternar(), base }
  function basesMapa(map) {
    const sat = new ol.layer.Group({ visible: false, zIndex: -1, layers: [
      new ol.layer.Tile({ source: new ol.source.XYZ({ url: ESRI_SAT, maxZoom: 19, attributions: 'Imagen: Esri, Maxar, Earthstar Geographics' }) }),
      new ol.layer.Tile({ opacity: 0.9, source: new ol.source.XYZ({ url: ESRI_REF, maxZoom: 19 }) }),
    ] });
    const ctl = { base: 'calles', calles: null, satelite: sat };
    map.getLayers().insertAt(0, sat);
    capaCalles().catch(() => new ol.layer.Tile({ className: 'base-calles', source: new ol.source.OSM() }))
      .then((c) => { c.setZIndex(-2); ctl.calles = c; c.setVisible(ctl.base === 'calles'); map.getLayers().insertAt(0, c); });
    ctl.alternar = function () {
      ctl.base = ctl.base === 'calles' ? 'satelite' : 'calles';
      if (ctl.calles) ctl.calles.setVisible(ctl.base === 'calles');
      sat.setVisible(ctl.base === 'satelite');
      map.getTargetElement().classList.toggle('satelite', ctl.base === 'satelite');
      return ctl.base;
    };
    return ctl;
  }
  // Botones redondos «Mi posición» y «Satélite / OpenStreetMap» (si el contenedor no los tiene ya)
  const SVG_GPS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 3h-2.06A7 7 0 0 0 13 5.06V3h-2v2.06A7 7 0 0 0 5.06 11H3v2h2.06A7 7 0 0 0 11 18.94V21h2v-2.06A7 7 0 0 0 18.94 13H21zm-9 6a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>';
  const SVG_CAPA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 3 9 5-9 5-9-5zm-7.2 8.6L12 15.6l7.2-4 1.8 1L12 17.6l-9-5zm0 4L12 19.6l7.2-4 1.8 1L12 21.6l-9-5z"/></svg>';
  function botonCapa(btn, bases) {
    const pintar = () => {
      const sat = bases.base === 'satelite';
      btn.title = sat ? 'Cambiar a mapa (OpenStreetMap)' : 'Cambiar a satélite';
      btn.setAttribute('aria-label', btn.title);
      btn.classList.toggle('activo', sat);
    };
    btn.innerHTML = SVG_CAPA; pintar();
    btn.onclick = () => { bases.alternar(); pintar(); };
  }
  // Posición del usuario: punto azul con su precisión; llama a alMover(coord3857) en cada lectura
  function localizador(map, btn, alMover) {
    const S = ol.style;
    const capa = new ol.layer.Vector({ source: new ol.source.Vector(), zIndex: 60 });
    map.addLayer(capa);
    const est = { yo: null, seguir: false, activo: false };
    btn.innerHTML = SVG_GPS;
    map.on('pointerdrag', () => { est.seguir = false; });
    btn.onclick = () => {
      const view = map.getView();
      if (est.yo) { est.seguir = true; view.animate({ center: est.yo, zoom: Math.max(view.getZoom(), 16), duration: 500 }); return; }
      if (!navigator.geolocation || est.activo) return;
      est.activo = true; est.seguir = true; btn.classList.add('buscando');
      navigator.geolocation.watchPosition((pos) => {
        const c = ol.proj.fromLonLat([pos.coords.longitude, pos.coords.latitude]);
        const primera = !est.yo; est.yo = c;
        const factor = 1 / Math.cos(pos.coords.latitude * Math.PI / 180);
        const src = capa.getSource(); src.clear();
        const prec = new ol.Feature(new ol.geom.Circle(c, Math.min(pos.coords.accuracy, 500) * factor));
        prec.setStyle(new S.Style({ fill: new S.Fill({ color: 'rgba(47,127,134,.15)' }), stroke: new S.Stroke({ color: 'rgba(47,127,134,.5)', width: 1 }) }));
        const yo = new ol.Feature(new ol.geom.Point(c));
        yo.setStyle(new S.Style({ image: new S.Circle({ radius: 8, fill: new S.Fill({ color: '#2f7f86' }), stroke: new S.Stroke({ color: '#fff', width: 3 }) }) }));
        src.addFeatures([prec, yo]);
        btn.classList.remove('buscando'); btn.classList.add('activo');
        const view = map.getView();
        if (primera || est.seguir) view.animate({ center: c, zoom: primera ? Math.max(view.getZoom(), 16) : view.getZoom(), duration: 500 });
        if (alMover) alMover(c, primera);
      }, (err) => {
        est.activo = false; btn.classList.remove('buscando');
        aviso(err.code === 1 ? 'Has denegado el acceso a la ubicación. Puedes activarlo en los permisos del navegador.' : 'No se ha podido obtener tu ubicación.');
      }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
    };
    return est;
  }
  function aviso(txt) {
    document.querySelectorAll('.aviso').forEach((x) => x.remove());
    const d = document.createElement('div');
    d.className = 'aviso'; d.textContent = txt;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 4000);
  }
  // Zoom mínimo común: se puede alejar hasta ver toda Europa
  const ZOOM_MIN = 4;

  /* ---------- ayudas para descubrir el mapa (pensadas sobre todo para el móvil) ---------- */
  // Aviso de primera visita: «toca un punto o un camino». Se cierra al tocar algo y no vuelve a salir.
  function pistaMapa(map, clave, texto) {
    const k = 'sofia-pista-' + clave;
    try { if (localStorage.getItem(k)) return; } catch (e) { return; }
    const d = document.createElement('div');
    d.className = 'pista-mapa';
    d.innerHTML = '<span class="dedo" aria-hidden="true">👆</span><span class="txt"></span><button aria-label="Cerrar aviso">✕</button>';
    d.querySelector('.txt').textContent = texto;
    const cerrar = () => { d.classList.add('fuera'); setTimeout(() => d.remove(), 350); try { localStorage.setItem(k, '1'); } catch (e) {} };
    d.querySelector('button').onclick = cerrar;
    document.body.appendChild(d);
    map.once('singleclick', cerrar);
    return cerrar;
  }
  // Botón ⓘ con la leyenda de símbolos
  function leyenda(contenedor, html) {
    if (!contenedor) return;
    const b = document.createElement('button');
    b.className = contenedor.classList.contains('sofia-botones') ? 'sofia-redondo' : 'redondo';
    b.title = 'Cómo se usa'; b.setAttribute('aria-label', 'Cómo se usa');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2zm0-8h-2V7h2z"/></svg>';
    const caja = document.createElement('div');
    caja.className = 'leyenda-caja'; caja.hidden = true;
    caja.innerHTML = '<button class="cerrar-leyenda" aria-label="Cerrar">✕</button><h3>Cómo se usa</h3>' + html;
    caja.querySelector('.cerrar-leyenda').onclick = () => { caja.hidden = true; };
    b.onclick = (e) => { e.stopPropagation(); caja.hidden = !caja.hidden; };
    contenedor.appendChild(b);
    document.body.appendChild(caja);
  }
  // Etiqueta flotante al pasar el ratón (solo con ratón; en el móvil no estorba)
  function etiquetaFlotante(map) {
    const el = document.createElement('div');
    el.className = 'etiqueta-flotante'; el.hidden = true;
    map.getTargetElement().appendChild(el);
    return {
      mostrar(px, texto) { el.textContent = texto; el.hidden = false; el.style.left = (px[0] + 14) + 'px'; el.style.top = (px[1] - 10) + 'px'; },
      ocultar() { el.hidden = true; },
    };
  }
  // En el móvil: botón «Ver lista» cuando el panel está plegado
  /* Hoja inferior del móvil con tres alturas (bajo · normal · alto). Se cambia tocando el
   * tirador o arrastrando con el dedo: desde el tirador o la parte de arriba de la hoja, hacia
   * arriba desde el contenido (si la hoja no está del todo abierta) o hacia abajo cuando el
   * contenido ya está arriba del todo. */
  function panelMovil(panel) {
    const b = document.createElement('button');
    b.className = 'ver-lista'; b.hidden = true;
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>Ver lista';
    document.body.appendChild(b);
    const ESTADOS = ['bajo', '', 'alto'];
    const actual = () => (panel.classList.contains('alto') ? 'alto' : panel.classList.contains('bajo') ? 'bajo' : '');
    const poner = (clase) => { panel.style.height = ''; panel.className = 'panel' + (clase ? ' ' + clase : ''); b.hidden = clase !== 'bajo'; };
    b.onclick = () => poner('');

    // Alturas reales de cada estado (se miden aplicando la clase sin transición)
    function alturas() {
      const prev = panel.className, h = panel.style.height;
      panel.style.transition = 'none'; panel.style.height = '';
      const r = ESTADOS.map((c) => { panel.className = 'panel' + (c ? ' ' + c : ''); return panel.getBoundingClientRect().height; });
      panel.className = prev; panel.style.height = h; void panel.offsetHeight; panel.style.transition = '';
      return r;
    }
    const cuerpo = panel.querySelector('.panel-cuerpo') || panel;
    let g = null;
    panel.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1 || window.innerWidth > 760) return;
      const t = e.touches[0], top = panel.getBoundingClientRect().top;
      const enAsa = !!e.target.closest('.tirador') || (t.clientY - top < 34 && !e.target.closest('button, a, input, select'));
      g = { x0: t.clientX, y0: t.clientY, y: t.clientY, t0: e.timeStamp, h0: panel.getBoundingClientRect().height, enAsa, modo: null, hist: [] };
    }, { passive: true });
    panel.addEventListener('touchmove', (e) => {
      if (!g) return;
      const y = e.touches[0].clientY, dy = y - g.y0, dx = e.touches[0].clientX - g.x0;
      if (!g.modo) {
        if (Math.abs(dy) < 7 && Math.abs(dx) < 7) return;
        const enScroll = e.target.closest('.panel-cuerpo') && cuerpo.scrollHeight > cuerpo.clientHeight + 2;
        if (Math.abs(dx) > Math.abs(dy)) g.modo = 'scroll';     // gesto horizontal (filtros, etc.)
        else if (g.enAsa) g.modo = 'arrastre';
        else if (dy < 0 && actual() !== 'alto') g.modo = 'arrastre';
        else if (dy > 0 && (!enScroll || cuerpo.scrollTop <= 0)) g.modo = 'arrastre';
        else g.modo = 'scroll';
        if (g.modo === 'arrastre') { g.alt = alturas(); panel.style.transition = 'none'; panel.classList.add('arrastrando'); g.y0 = y; }
      }
      if (g.modo !== 'arrastre') return;
      e.preventDefault();
      const max = g.alt[2] + 20, min = g.alt[0] - 30;
      panel.style.height = Math.max(min, Math.min(max, g.h0 - (y - g.y0))) + 'px';
      g.hist.push([e.timeStamp, y]); if (g.hist.length > 5) g.hist.shift();
    }, { passive: false });
    const fin = () => {
      if (!g || g.modo !== 'arrastre') { g = null; return; }
      const h = panel.getBoundingClientRect().height, H = g.hist;
      const v = H.length > 1 ? (H[H.length - 1][1] - H[0][1]) / Math.max(1, H[H.length - 1][0] - H[0][0]) : 0;   // px/ms, + = hacia abajo
      let i;
      if (Math.abs(v) > 0.45) {                       // gesto rápido: un escalón en esa dirección desde donde estaba
        const ini = ESTADOS.indexOf(actual());
        i = Math.max(0, Math.min(2, ini + (v < 0 ? 1 : -1)));
      } else {                                        // gesto lento: la altura más cercana
        i = 0; g.alt.forEach((a, k) => { if (Math.abs(a - h) < Math.abs(g.alt[i] - h)) i = k; });
      }
      panel.style.transition = ''; panel.classList.remove('arrastrando');
      poner(ESTADOS[i]); g = null;
    };
    panel.addEventListener('touchend', fin); panel.addEventListener('touchcancel', fin);
    return { plegar: () => poner('bajo'), normal: () => poner(''), alternar: () => poner(panel.classList.contains('alto') ? 'bajo' : panel.classList.contains('bajo') ? '' : 'alto'), poner };
  }
  const esTactil = () => window.matchMedia('(pointer: coarse)').matches;


  /* ---------- Saltos entre apps: cortinilla de entrada + botón «Volver a …» ----------
   * Al pulsar un enlace que lleva a otra app (p. ej. Itinerario → Comer en Sofía) se guarda
   * en sessionStorage de dónde venía el usuario. La app de destino muestra una cortinilla con
   * su nombre y color (para que se note el cambio de entorno) y un botón para volver justo
   * al punto de partida (la URL con su #ficha). */
  const BA = 'fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const APPS = {
    itinerario: { nombre: 'Itinerario', lema: 'El plan del viaje, día a día', color: '#a8322a',
      ico: '<g ' + BA + '><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8" stroke-dasharray="2.6 2.4"/></g>' },
    explora: { nombre: 'Explora Sofía', lema: 'Lugares, historia y caminos a pie', color: '#2f7f86',
      ico: '<g ' + BA + '><circle cx="12" cy="12" r="9"/></g><path d="m15.8 8.2-2.2 5.4-5.4 2.2 2.2-5.4z" fill="#fff"/>' },
    comer: { nombre: 'Comer en Sofía', lema: 'Dónde comer y qué pedir', color: '#7a1f19',
      ico: '<g ' + BA + '><path d="M5.5 3v5.5a3 3 0 0 0 6 0V3M8.5 3v5.5M8.5 11.5V21M18 21V3c-2.3 1.3-3.5 4.2-3.5 7.8 0 2 1.4 3 3.5 3"/></g>' },
    aterrizando: { nombre: 'Aterrizando', lema: 'Vuelos, traslado y casa', color: '#2f5d7c',
      ico: '<path d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0v5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5z" fill="#fff"/>' },
    'en-el-tiempo': { nombre: 'Sofía en el tiempo', lema: 'La ciudad a lo largo de los siglos', color: '#6b4a7e',
      ico: '<g ' + BA + '><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></g>' }
  };
  const CLAVE_SALTO = 'sofia-salto';
  const appDe = (url) => { const m = new URL(url, location.href).pathname.match(/\/([^/]+)\/(?:index\.html)?$/); return m && APPS[m[1]] ? m[1] : null; };
  const leerSalto = () => { try { return JSON.parse(sessionStorage.getItem(CLAVE_SALTO)); } catch (e) { return null; } };
  const guardarSalto = (v) => { try { v ? sessionStorage.setItem(CLAVE_SALTO, JSON.stringify(v)) : sessionStorage.removeItem(CLAVE_SALTO); } catch (e) { /* sin almacenamiento */ } };
  const svgApp = (id, tam) => '<svg viewBox="0 0 24 24" width="' + tam + '" height="' + tam + '" aria-hidden="true">' + APPS[id].ico + '</svg>';

  function salir(href) {
    document.body.classList.add('sofia-saliendo');
    setTimeout(() => { location.href = href; }, 220);
  }
  function cortinilla(id, desde) {
    const a = APPS[id], c = document.createElement('div');
    c.className = 'sofia-cortinilla'; c.style.background = a.color;
    c.innerHTML = '<div class="sc-caja"><span class="sc-ico">' + svgApp(id, 44) + '</span><strong></strong><span class="sc-lema"></span>' +
      (desde ? '<small></small>' : '') + '</div>';
    c.querySelector('strong').textContent = a.nombre;
    c.querySelector('.sc-lema').textContent = a.lema;
    if (desde) c.querySelector('small').textContent = 'Vienes de ' + APPS[desde].nombre;
    document.body.appendChild(c);
    const quitar = () => { if (!c.parentNode) return; c.classList.add('fuera'); setTimeout(() => c.remove(), 450); };
    c.onclick = quitar; setTimeout(quitar, 1300);
  }
  function botonVolver(s) {
    const a = APPS[s.desde], b = document.createElement('div');
    b.className = 'sofia-volver-app';
    b.style.setProperty('--app', a.color);
    b.innerHTML = '<a><span class="sv-ico">' + svgApp(s.desde, 16) + '</span><span class="sv-txt">Volver a <b></b></span></a><button type="button" aria-label="Quitar">✕</button>';
    b.querySelector('b').textContent = a.nombre;
    const enlace = b.querySelector('a'); enlace.href = s.url;
    enlace.onclick = (e) => { e.preventDefault(); guardarSalto({ desde: s.hacia, hacia: s.desde, regreso: true, t: Date.now() }); salir(s.url); };
    b.querySelector('button').onclick = () => { guardarSalto(null); b.classList.add('fuera'); setTimeout(() => b.remove(), 300); };
    document.body.appendChild(b);
    requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add('visible')));
  }
  function iniciarSaltos() {
    const aqui = appDe(location.href);
    if (!aqui) { guardarSalto(null); return; }           // portal u otra página: se olvida el salto
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin) return;
      const destino = appDe(u.href);
      if (!destino) { if (/\/$/.test(u.pathname) && !destino) guardarSalto(null); return; }   // Menú
      if (destino === aqui) return;
      e.preventDefault();
      guardarSalto({ desde: aqui, url: location.href, hacia: destino, t: Date.now() });
      salir(u.href);
    }, true);
    const s = leerSalto();
    if (!s || s.hacia !== aqui || Date.now() - s.t > 6 * 3600e3) { if (s && s.desde === aqui) guardarSalto(null); return; }
    if (!s.vista) { cortinilla(aqui, s.regreso ? null : s.desde); s.vista = true; guardarSalto(s.regreso ? null : s); }
    if (!s.regreso) botonVolver(s);
  }
  // Al volver con el botón «atrás» del navegador (bfcache) se quita el fundido de salida
  window.addEventListener('pageshow', () => document.body && document.body.classList.remove('sofia-saliendo'));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarSaltos); else iniciarSaltos();

  /* Paradas del itinerario que enlazan con una ficha de Explora o de Comer: { id → [{ href, txt }] } */
  let itinPromesa = null;
  function enItinerario(campo) {
    itinPromesa = itinPromesa || fetch('../itinerario/datos/itinerario.json').then((r) => r.json()).catch(() => ({ dias: [] }));
    return itinPromesa.then((d) => {
      const m = {};
      d.dias.forEach((dia) => dia.pasos.forEach((p) => {
        if (p.tipo !== 'parada' || !p[campo]) return;
        (m[p[campo]] = m[p[campo]] || []).push({ href: '../itinerario/#' + (p.audio || dia.id + '-p' + p.n), txt: dia.titulo + (p.hora ? ', ' + p.hora : '') });
      }));
      return m;
    });
  }
  /* Pinta en `cont` uno o varios enlaces «En el itinerario: …» */
  function chipsItinerario(cont, lista) {
    cont.innerHTML = ''; cont.hidden = !lista || !lista.length;
    (lista || []).forEach((x) => {
      const a = document.createElement('a'); a.className = 'chip-itin'; a.href = x.href;
      a.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8" stroke-dasharray="2.6 2.4"/></g></svg><span></span>';
      a.querySelector('span').textContent = 'En el itinerario: ' + x.txt + ' ›';
      cont.appendChild(a);
    });
  }

  /* ---------- Demo guiada: bocadillos que señalan qué se puede tocar ----------
   * demo({ clave, pasos: [{ el, titulo, texto, antes }], alFinal })
   *  - el: selector, elemento o función que devuelve un elemento o un rectángulo {x, y, w, h}
   *  - antes: función (puede devolver promesa) que prepara la pantalla para ese paso
   * Se lanza sola la primera vez (por app) y se puede repetir con el botón «Ver demo». */
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  function rectDe(el) {
    if (typeof el === 'function') el = el();
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) return null;
    if (el.getBoundingClientRect) {
      if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return null;
      const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, el };
    }
    return el;
  }
  function demo(cfg) {
    let i = -1, vivo = true;
    document.querySelectorAll('.pista-mapa').forEach((d) => d.remove());
    try { localStorage.setItem('sofia-pista-' + cfg.clave, '1'); } catch (e) { /* nada */ }
    const capa = document.createElement('div'); capa.className = 'sofia-demo';
    capa.innerHTML = '<div class="sd-foco"></div><div class="sd-bocadillo" role="dialog" aria-live="polite"><span class="sd-flecha"></span>' +
      '<b class="sd-tit"></b><p class="sd-txt"></p><div class="sd-pie"><span class="sd-puntos"></span><button class="sd-saltar" type="button">Saltar</button><button class="sd-sig" type="button"></button></div></div>';
    document.body.appendChild(capa);
    const foco = capa.querySelector('.sd-foco'), boc = capa.querySelector('.sd-bocadillo'), flecha = capa.querySelector('.sd-flecha');
    const fin = async () => {
      if (!vivo) return; vivo = false;
      try { localStorage.setItem('sofia-demo-' + cfg.clave, '1'); } catch (e) { /* nada */ }
      capa.classList.add('fuera'); setTimeout(() => capa.remove(), 300);
      if (cfg.alFinal) cfg.alFinal();
    };
    const sig = async () => {
      if (!vivo) return;
      i++;
      if (i >= cfg.pasos.length) return fin();
      const p = cfg.pasos[i];
      capa.classList.add('cambiando');
      if (p.antes) { await p.antes(); await esperar(380); }
      let r = rectDe(p.el);
      if (r && r.el && r.el.scrollIntoView) {
        const vr = r.el.getBoundingClientRect();
        if (vr.bottom > innerHeight - 10 || vr.top < 0) { r.el.scrollIntoView({ block: 'center', behavior: 'instant' }); await esperar(60); r = rectDe(p.el); }
      }
      if (!vivo) return;
      if (!r && p.opcional) { capa.classList.remove('cambiando'); return sig(); }
      const m = 6;
      if (r) Object.assign(foco.style, { left: (r.x - m) + 'px', top: (r.y - m) + 'px', width: (r.w + 2 * m) + 'px', height: (r.h + 2 * m) + 'px', borderRadius: (p.redondo ? '50%' : '14px') });
      else Object.assign(foco.style, { left: '50%', top: '45%', width: '0px', height: '0px' });
      boc.querySelector('.sd-tit').textContent = p.titulo || '';
      boc.querySelector('.sd-txt').textContent = p.texto;
      boc.querySelector('.sd-puntos').innerHTML = cfg.pasos.map((_, k) => '<i' + (k === i ? ' class="on"' : '') + '></i>').join('');
      boc.querySelector('.sd-sig').textContent = i === cfg.pasos.length - 1 ? '¡Entendido!' : 'Siguiente ›';
      boc.querySelector('.sd-saltar').hidden = i === cfg.pasos.length - 1;
      // Bocadillo encima o debajo del foco, donde haya más sitio
      const W = Math.min(330, innerWidth - 24); boc.style.width = W + 'px';
      const bh = boc.offsetHeight || 150;
      let top, abajo;
      if (!r) { top = innerHeight / 2 - bh / 2; abajo = null; }
      else if (r.y + r.h + m + 14 + bh < innerHeight - 8) { top = r.y + r.h + m + 14; abajo = true; }
      else if (r.y - m - 14 - bh > 8) { top = r.y - m - 14 - bh; abajo = false; }
      else { top = Math.max(8, Math.min(innerHeight - bh - 8, r.y + r.h / 2 - bh / 2)); abajo = null; }
      const cx = r ? r.x + r.w / 2 : innerWidth / 2;
      const left = Math.max(12, Math.min(innerWidth - W - 12, cx - W / 2));
      Object.assign(boc.style, { top: top + 'px', left: left + 'px' });
      flecha.hidden = abajo === null; flecha.className = 'sd-flecha ' + (abajo ? 'arriba' : 'abajo');
      flecha.style.left = Math.max(16, Math.min(W - 16, cx - left)) + 'px';
      capa.classList.remove('cambiando');
      boc.querySelector('.sd-sig').focus({ preventScroll: true });
    };
    boc.querySelector('.sd-sig').onclick = (e) => { e.stopPropagation(); sig(); };
    boc.querySelector('.sd-saltar').onclick = (e) => { e.stopPropagation(); fin(); };
    capa.onclick = (e) => { if (!boc.contains(e.target)) sig(); };
    document.addEventListener('keydown', function k(e) { if (!vivo) return document.removeEventListener('keydown', k); if (e.key === 'Escape') fin(); else if (e.key === 'ArrowRight' || e.key === 'Enter') sig(); });
    sig();
  }
  /* Lanza la demo la primera vez y añade el botón para repetirla */
  function demoApp(contenedor, cfg) {
    if (contenedor) {
      const b = document.createElement('button');
      b.className = (contenedor.classList.contains('sofia-botones') ? 'sofia-redondo' : 'redondo') + ' boton-demo';
      b.title = 'Ver la demo'; b.setAttribute('aria-label', 'Ver la demo de cómo se usa');
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-.1 15.6a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm1.4-5.1c-.6.4-.8.6-.8 1.3v.4h-1.9v-.5c0-1.2.4-1.8 1.3-2.4.7-.5 1-.8 1-1.4 0-.6-.5-1.1-1.3-1.1-.8 0-1.4.5-1.5 1.3l-1.9-.2C8.4 8.3 9.9 7 12 7c2 0 3.4 1.1 3.4 2.8 0 1.2-.6 1.9-1.7 2.7z"/></svg>';
      b.onclick = () => demo(cfg);
      contenedor.appendChild(b);
    }
    let visto = false;
    try { visto = !!localStorage.getItem('sofia-demo-' + cfg.clave); } catch (e) { visto = true; }
    if (!visto) setTimeout(() => { if (!document.querySelector('.sofia-demo')) demo(cfg); }, document.querySelector('.sofia-cortinilla') ? 1900 : 900);
  }
  /* De una lista de coordenadas, la primera que se ve en el mapa sin quedar tapada por la hoja inferior */
  function coordVisible(map, coords) {
    const t = map.getTargetElement().getBoundingClientRect(), panel = document.getElementById('panel');
    const bajo = panel && innerWidth <= 760 ? panel.getBoundingClientRect().top - 30 : t.bottom - 30;
    const izq = innerWidth <= 760 ? 70 : (panel ? panel.getBoundingClientRect().right + 30 : 30);
    return coords.find((c) => { const px = map.getPixelFromCoordinate(c); if (!px) return false; const x = t.left + px[0], y = t.top + px[1]; return x > izq && x < innerWidth - 30 && y > 120 && y < bajo; }) || null;
  }
  /* Rectángulo de un punto del mapa en pantalla, para señalarlo en la demo */
  function rectMapa(map, coord, r) {
    const px = map.getPixelFromCoordinate(coord), t = map.getTargetElement().getBoundingClientRect();
    if (!px) return null; r = r || 20;
    return { x: t.left + px[0] - r, y: t.top + px[1] - r, w: 2 * r, h: 2 * r };
  }

  window.SofiaComun = { enlacePortal, Narrador, ICONO, capaCalles, visitados, basesMapa, botonCapa, localizador, aviso, ZOOM_MIN, pistaMapa, leyenda, etiquetaFlotante, panelMovil, esTactil, APPS, enItinerario, chipsItinerario, demo, demoApp, rectMapa, coordVisible };
})();
