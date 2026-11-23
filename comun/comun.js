/* Recursos comunes de las apps de Sofía.
 *  - SofiaComun.enlacePortal(contenedor): añade el enlace «Portal» al principio del contenedor.
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
    a.className = 'portal-volver'; a.href = href || '../'; a.title = 'Volver al portal de Sofía';
    a.innerHTML = ICONO.volver + 'Portal';
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

  window.SofiaComun = { enlacePortal, Narrador, ICONO, capaCalles, visitados, basesMapa, botonCapa, localizador, aviso, ZOOM_MIN };
})();
