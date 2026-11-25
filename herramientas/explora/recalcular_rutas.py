# Recalcula los caminos de Explora Sofia (www/explora/datos/rutas.geojson) con OpenStreetMap.
# - Toma desde/hasta de cada ruta y sus coordenadas actuales de puntos.geojson.
# - Solo pide a routing.openstreetmap.de las rutas cuyos extremos han cambiado (cache en rutas_cache.json),
#   o todas con --todas.
# - Actualiza geometria, distancia y minutos (a pie: 75 m por minuto, como la app). Los textos,
#   paradas y narraciones NO se tocan: avisa si cambian los minutos o si una parada queda lejos del camino.
# Uso: python recalcular_rutas.py [--todas] [--prueba]   (--prueba: calcula pero no escribe nada)
import json, math, os, sys, time, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
DATOS = os.path.join(AQUI, '..', '..', 'www', 'explora', 'datos')
F_RUTAS = os.path.join(DATOS, 'rutas.geojson')
F_PUNTOS = os.path.join(DATOS, 'puntos.geojson')
F_CACHE = os.path.join(AQUI, 'rutas_cache.json')
M_POR_MIN = 75
TODAS = '--todas' in sys.argv
PRUEBA = '--prueba' in sys.argv


def leer(f):
    with open(f, encoding='utf-8') as h:
        return json.load(h)


def escribir(f, datos):
    with open(f, 'w', encoding='utf-8', newline='\n') as h:
        json.dump(datos, h, ensure_ascii=False)


def osrm(perfil, a, b):
    url = 'https://routing.openstreetmap.de/routed-%s/route/v1/driving/%.5f,%.5f;%.5f,%.5f?overview=full&geometries=geojson' % (
        perfil, a[0], a[1], b[0], b[1])
    req = urllib.request.Request(url, headers={'User-Agent': 'visorgis-sofia (recalcular rutas)'})
    for intento in range(3):
        try:
            d = json.load(urllib.request.urlopen(req, timeout=30))
            time.sleep(0.5)
            r = d['routes'][0]
            return round(r['distance']), [[round(x, 5), round(y, 5)] for x, y in r['geometry']['coordinates']]
        except Exception as e:
            if intento == 2:
                raise RuntimeError('No se pudo calcular la ruta (%s)' % e)
            time.sleep(3)


def dist_m(p, q):
    return math.hypot((p[0] - q[0]) * 82000, (p[1] - q[1]) * 111000)


def dist_a_linea(p, linea):
    mejor = 1e9
    for a, b in zip(linea, linea[1:]):
        ax, ay, bx, by = a[0] * 82000, a[1] * 111000, b[0] * 82000, b[1] * 111000
        px, py = p[0] * 82000, p[1] * 111000
        dx, dy = bx - ax, by - ay
        t = 0 if dx == dy == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        mejor = min(mejor, math.hypot(px - ax - t * dx, py - ay - t * dy))
    return mejor


rutas = leer(F_RUTAS)
puntos = {f['properties']['id']: f['geometry']['coordinates'] for f in leer(F_PUNTOS)['features']}
cache = leer(F_CACHE) if os.path.exists(F_CACHE) else {}
hechas = avisos = 0

for f in rutas['features']:
    q = f['properties']
    nombre = '%s -> %s' % (q['desde'], q['hasta'])
    if q['desde'] not in puntos or q['hasta'] not in puntos:
        print('  OJO %s: uno de los extremos ya no existe en puntos.geojson; la dejo como estaba' % nombre)
        avisos += 1
        continue
    a, b = puntos[q['desde']], puntos[q['hasta']]
    clave = q['desde'] + '>' + q['hasta']
    firma = [round(c, 5) for c in a + b]
    if not TODAS and cache.get(clave) == firma:
        continue
    perfil = 'car' if q.get('tipo') == 'transporte' else 'foot'
    print('  calculando %s (%s)...' % (nombre, 'coche' if perfil == 'car' else 'a pie'))
    distancia, linea = osrm(perfil, a, b)
    antes_d, antes_min = q.get('distancia'), q.get('minutos')
    q['distancia'] = distancia
    f['geometry'] = {'type': 'LineString', 'coordinates': linea}
    if perfil == 'foot':
        q['minutos'] = max(1, round(distancia / M_POR_MIN))
        if antes_min is not None and q['minutos'] != antes_min:
            print('     minutos: %s -> %s (revisa si los textos de esta ruta dicen los minutos)' % (antes_min, q['minutos']))
            avisos += 1
    print('     distancia: %s -> %s m' % (antes_d, distancia))
    for p in q.get('paradas', []):
        if p in puntos and dist_a_linea(puntos[p], linea) > 80:
            print('     OJO: la parada "%s" queda a %d m del camino nuevo' % (p, dist_a_linea(puntos[p], linea)))
            avisos += 1
    cache[clave] = firma
    hechas += 1

if hechas == 0:
    print('Todas las rutas estaban al dia (usa --todas para recalcularlas igualmente).')
elif PRUEBA:
    print('Modo prueba: %d rutas calculadas, no se ha escrito nada.' % hechas)
else:
    escribir(F_RUTAS, rutas)
    escribir(F_CACHE, cache)
    print('%d rutas recalculadas y guardadas en www/explora/datos/rutas.geojson.' % hechas)
if avisos:
    print('%d avisos: revisalos arriba.' % avisos)
