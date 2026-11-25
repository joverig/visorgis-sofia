# VisorGIS Sofía · guía para Claude

Web estática (OpenLayers 10.5, sin build) para un viaje de 7 personas a Sofía del 4 al 8 de diciembre de 2026.
Publicada en GitHub Pages: https://joverig.github.io/visorgis-sofia/ (repo `joverig/visorgis-sofia`).
Idioma: todo en español. Diseño pensado primero para móvil.

## Apps (carpeta `www/`)
| Carpeta | App | Datos |
|---|---|---|
| `index.html` | Portal / menú | — |
| `aterrizando/` | Aterrizando: llegada, alojamiento, tiempo, servicios cerca de casa, **Gastos** | `aterrizando/js/datos.js` |
| `itinerario/` | Itinerario día a día (paradas, caminos, reservas, comidas, opcionales, avisos, narración) | `itinerario/datos/itinerario.json` (GENERADO) |
| `en-el-tiempo/` | Sofía en el tiempo (capas históricas) | `en-el-tiempo/js/capas.js` |
| `explora/` | Explora Sofía (puntos principales/secundarios y rutas a pie) | `explora/datos/puntos.geojson`, `rutas.geojson` |
| `comer/` | Comer en Sofía (restaurantes, qué pedir) | `comer/datos/restaurantes.geojson` |
| `comun/` | Código compartido (`comun.js`: menú, narrador, capas base, panel móvil arrastrable, transiciones entre apps, demo con bocadillos, chips "En el itinerario") | — |

## Itinerario: cómo se genera (NO editar el JSON a mano)
Todo está en `herramientas/itinerario/`:
1. `itin_base.py` → diccionario `C` de coordenadas de cada lugar del itinerario (id → (lon, lat)).
2. `itin_orig/d*.py` → textos originales de cada día.
3. `build_dias.py` → construye cada día (funciones `P()` parada, `T()` camino, `g()` coge un paso del original con cambios, `rep()` reemplaza una frase). Escribe `itin/d*.py`.
4. `run_itin.py` → genera `www/itinerario/datos/itinerario.json` y `voz/textos/itinerario.json`.
   - Calcula minutos de cada camino (taxi: dur·1.3+2; a pie: dur), hora de salida/llegada y avisa con `ojo tiempos` si algo no cuadra.
   - Las rutas se guardan en `tramos.json` (clave `a>b:foot|car|tour` → [dist m, dur s, polilínea, puntos]). Si falta una ruta o han cambiado las coordenadas, la pide sola a `routing.openstreetmap.de` y la guarda. No hace falta ningún navegador.
   - El nombre visible de cada lugar está en el diccionario `NOMBRES` de `run_itin.py`.
5. Ejecutar: `1_Construir_itinerario.bat` (o `python build_dias.py && python run_itin.py` dentro de esa carpeta).

Marcas de un paso: `reserva='HH:MM'`, `opcional=True` (color lavanda), `comida='desayuno|comida|cena|tapas'`, `aviso='…'` + `avisoEtq='Reservar|Cuesta|Tiempo justo|Llegar pronto'`, `calle='plan B de comida en la calle'`, `descanso=True`, `narrar=False`, `explora='id'`, `comer='id'`, `precio='…'`, `alternativa='…'` (caminos), `salida='HH:MM'` (fuerza la salida de un camino), `tour=True` + `paradasTour` (el free tour del sábado, línea naranja con 19 paradas).

**Deuda conocida (a mejorar):** los cambios de texto se hacen con `rep()` sobre los originales, lo que obliga a repetir la frase vieja entera. Objetivo: pasar a un `lugares.json` único (Itinerario + Explora + Comer + Gastos) y un `itinerario.yaml` editable, y jubilar `itin_orig` + parches.
Explora se edita directamente en sus geojson (su generador `gen_todo.py` apunta a rutas antiguas). Caminos de Explora: `2_Recalcular_rutas_explora.bat` (`herramientas/explora/recalcular_rutas.py`, caché en `rutas_cache.json`) recalcula geometría, distancia y minutos de las rutas cuyos extremos se movieron; textos y paradas se editan a mano. Comer: `comer_datos.py` + retoques en el geojson publicado.

## Audios (narraciones con Azure)
- `4_Generar_audios.bat` (lo lanza el usuario; tarda). Usa `voz/config.json` y la clave en `voz/azure.txt` (**nunca** a GitHub ni al chat).
- Cada audio se identifica por hash SHA1 de `voz|estilo|rate|pitch|texto` (16 hex en mayúsculas) guardado en `voz/generados.json`. Si un texto cambia, su audio queda obsoleto: quitarlo de `www/<app>/audio/manifest.json` hasta regenerarlo para que no suene un audio equivocado.

## Publicar
1. Subir la versión: sustituir el número antiguo por el nuevo (formato `AAAAMMDDhhmm`) en todo `www` (`?v=` de los html) y en `www/version.txt`.
2. Commit y push a `main` (proyecto completo).
3. Rama `gh-pages` = copia exacta de `www/` + `.nojekyll`. Commit y push.
4. Mensajes de commit terminados con las líneas de atribución de Claude que indique la sesión.
5. Probar en local: `Arrancar_visor.bat` (o `python -m http.server` dentro de `www`).

## Reglas
- No publicar números de reserva, nombres de pasajeros ni datos personales. No poner el email del usuario en URLs ni User-Agent.
- Nunca subir `php/conn.php` ni `conn_l.php`.
- Fotos: no reutilizar fotos del alojamiento ni de terceros sin permiso. No hay fotos orientativas en Comer.
- Textos de la app dirigidos al viajero, nunca al desarrollador ("hemos decidido…", "no publicamos…").
- Ante dudas de datos (horarios, precios), comprobar en la web antes de escribirlos.

## Decisiones del viaje (para no rehacerlas)
- Taxi siempre que no se vaya andando; transporte público solo como alternativa.
- Bares que van justos de tiempo = opcionales (lavanda). Comidas y cenas destacadas con icono de cubiertos; plan B de comida en la calle donde tenga sentido, manteniendo la reserva como plan principal.
- Evitar cuestas pronunciadas (>15 %) y actividades de impacto; si alguna parada las tiene, marcarla como opcional con aviso.
- Reservas (todas para 7, hora de Sofía): Vie 23:00 Lavelé Garden · Sáb 11:00 Free Sofia Tour · Sáb 14:00 Izbata Tavern · Sáb 19:30 Hadjidraganovite Kashti · Dom bus Sofía→Plovdiv 09:00, vuelta 16:10 · Dom 21:30 Sense Rooftop (tapas) · Lun 13:30 Manastirska Magernitsa · Lun 20:00 Pod Lipite. Mar: aeropuerto con 2 h de margen (vuelo 17:25).
- Sábado: tras el tour y la cripta de Nevski, comida en Izbata Tavern 14:00 (reservada para 7). Lunes: Museo de las Ilusiones → Puente de las Águilas → Jardín del Príncipe → Siete Santos → Manastirska.

## Pendiente
- Migrar a `lugares.json` + `itinerario.yaml` (ver Deuda).
