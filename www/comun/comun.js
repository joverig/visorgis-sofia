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


  window.SofiaComun = { enlacePortal, Narrador, ICONO, capaCalles };
})();
