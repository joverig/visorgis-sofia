# Sofía en el tiempo · visorgis_sofia

Visor web de la evolución histórica de Sofía (Bulgaria): de la aldea neolítica de Slatina y la
**Serdica romana** al **Sredets** medieval, la **Sofya otomana**, la capital de 1878, la ciudad
socialista de los grandes barrios de bloques y la imagen de satélite de hoy.

**Ver online:** https://joverig.github.io/visorgis-sofia/

## Funciones
- Línea temporal con fundido entre épocas, reproducción y atajos (← → año, espacio, H comparar con hoy).
- Capa de **límites, puertas, hitos y barrios** con fecha: el límite vigente en continuo y los
  anteriores en discontinuo.
- Imágenes de satélite del archivo de Esri (World Imagery Wayback) desde 2014.
- Control de opacidad, botón **Ver hoy**, textos de contexto histórico y diseño adaptado a móvil.

## Estructura
- `www/` — el visor (HTML + CSS + JS, sin build). Es lo que se publica.
  - `js/capas.js` — pasos de la línea temporal y textos.
  - `js/visor.js` — lógica (OpenLayers 10, build UMD).
  - `datos_propios/recintos_sofia.geojson` — límites, puertas, hitos y barrios con fecha (`desde`/`hasta`).
- `Arrancar_visor.bat` — servidor local en http://localhost:8081/.

## Fuentes y atribuciones
- Imagen de satélite: Esri, Maxar, Earthstar Geographics y GIS User Community (World Imagery y Wayback).
- Rótulos de calles: © OpenStreetMap contributors © CARTO.
- Recreaciones históricas: elaboración propia, **trazados aproximados y orientativos**; no tienen
  valor arqueológico ni oficial.
- [OpenLayers](https://openlayers.org/) (BSD-2-Clause).

## Licencia
Código bajo licencia MIT. Los datos e imágenes mantienen la licencia de su fuente.
