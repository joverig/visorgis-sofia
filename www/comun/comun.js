/* Recursos comunes de las apps de Sofía.
 *  - SofiaComun.enlacePortal(contenedor): añade el enlace «Portal» al principio del contenedor.
 *  - SofiaComun.Narrador(baseAudio): botón de narración. Lee baseAudio + 'manifest.json'
 *    (lista de ids con audio) y reproduce baseAudio + id + '.mp3'. Si un texto aún no tiene
 *    audio, el botón aparece desactivado como «Narración próximamente».
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

  window.SofiaComun = { enlacePortal, Narrador, ICONO };
})();
