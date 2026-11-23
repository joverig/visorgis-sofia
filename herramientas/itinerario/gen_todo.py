import json, math, sys, copy, os, importlib
sys.path.insert(0, '.'); sys.path.insert(0, 'itin')
from itin_base import C
from explora_nuevos import N
REPO = '/home/claude/visorgis-sofia'
OUT = '/home/claude/out/VisorGISSofia'
W = OUT + '/www'

def dec(s):
    i=la=lo=0; o=[]
    while i<len(s):
        for k in range(2):
            sh=r=0
            while True:
                b=ord(s[i])-63; i+=1; r|=(b&31)<<sh; sh+=5
                if b<32: break
            v=~(r>>1) if r&1 else r>>1
            if k==0: la+=v
            else: lo+=v
        o.append((lo/1e5, la/1e5))
    return o
def enc(pts):
    o=''; pla=plo=0
    def e(v):
        v = ~(v<<1) if v<0 else v<<1; s=''
        while v>=32: s+=chr((32|(v&31))+63); v>>=5
        return s+chr(v+63)
    for lo,la in pts:
        a=round(la*1e5); b=round(lo*1e5); o+=e(a-pla)+e(b-plo); pla,plo=a,b
    return o
def hav(a,b):
    r=math.pi/180; h=math.sin((b[1]-a[1])*r/2)**2+math.cos(a[1]*r)*math.cos(b[1]*r)*math.sin((b[0]-a[0])*r/2)**2
    return 2*6371000*math.asin(math.sqrt(h))

# ---------- A. Explora: puntos y rutas ----------
pts = json.load(open(REPO + '/www/viajando/datos/puntos.geojson'))
rts = json.load(open(REPO + '/www/viajando/datos/rutas.geojson'))
ids = {f['properties']['id'] for f in pts['features']}
for n in N:
    n = dict(n); c = n.pop('coord'); n['nivel'] = 'secundario'
    assert n['id'] not in ids, n['id']
    pts['features'].append({'type': 'Feature', 'properties': n, 'geometry': {'type': 'Point', 'coordinates': list(c)}})
coords = {f['properties']['id']: f['geometry']['coordinates'] for f in pts['features']}
nuevos = [n['id'] for n in N]
for f in rts['features']:
    p = f['properties']
    if p.get('tipo') == 'transporte': continue
    g = f['geometry']['coordinates']
    dens = []; acum = [0.0]
    for i in range(len(g)-1):
        a, b = g[i], g[i+1]; L = hav(a, b); k = max(1, int(L/10))
        for j in range(k): dens.append(((a[0]+(b[0]-a[0])*j/k, a[1]+(b[1]-a[1])*j/k), acum[-1] + L*j/k))
        acum.append(acum[-1] + L)
    par = list(p.get('paradas') or [])
    pos = {}
    for pid in par + nuevos:
        if pid in (p['desde'], p['hasta']): continue
        d, s = min((hav(coords[pid], q), s) for q, s in dens)
        if pid in par or (d < 40 and 30 < s < acum[-1] - 30): pos[pid] = s
    nuevos_aqui = [x for x in pos if x not in par]
    if nuevos_aqui: print('paradas nuevas', p['desde'], p['hasta'], nuevos_aqui)
    p['paradas'] = sorted(pos, key=lambda x: pos[x])
os.makedirs(W + '/explora/datos', exist_ok=True)
json.dump(pts, open(W + '/explora/datos/puntos.geojson', 'w'), ensure_ascii=False, indent=1)
json.dump(rts, open(W + '/explora/datos/rutas.geojson', 'w'), ensure_ascii=False)

# ---------- B. Textos de voz de Explora ----------
vz = OUT + '/voz/textos/'
lugares = json.load(open(vz + 'viajando.json')) if os.path.exists(vz + 'viajando.json') else json.load(open(vz + 'explora.json'))
rutasv = json.load(open(vz + 'viajando_rutas.json')) if os.path.exists(vz + 'viajando_rutas.json') else json.load(open(vz + 'explora_rutas.json'))
lugares = [dict(x, app='explora') for x in lugares if x['id'] not in nuevos]
for n in N:
    lugares.append({'app': 'explora', 'id': n['id'], 'texto': n['nombre'] + '. ' + n['resumen'] + ' ' + ' '.join(n['historia'])})
rutasv = [dict(x, app='explora') for x in rutasv]
json.dump(lugares, open(vz + 'explora.json', 'w'), ensure_ascii=False, indent=1)
json.dump(rutasv, open(vz + 'explora_rutas.json', 'w'), ensure_ascii=False, indent=1)
for v in ('viajando.json', 'viajando_rutas.json'):
    if os.path.exists(vz + v): os.remove(vz + v)

# ---------- C. Itinerario ----------
R = json.load(open('tramos.json'))
NOMBRES = {'aeropuerto': 'Aeropuerto (T2)', 'casa': 'Casa · Sredna Gora 16', 'raketa': 'Raketa Rakia Bar', 'hambara': 'Hambara',
 'justicia': 'Palacio de Justicia', 'halite': 'Mercado Central (Halite)', 'serdica': 'Ruinas de Serdica', 'rotonda': 'Rotonda de San Jorge',
 'nevski': 'Catedral de Alejandro Nevski', 'mercadoaleman': 'Mercado navideño alemán', 'navidadndk': 'Sofia Christmas Fest (NDK)',
 'kashti': 'Hadjidraganovite Kashti', 'shishman': 'Calle Tsar Shishman', 'petak': 'Bar Petak', 'avtogara': 'Estación Central de Autobuses',
 'pdv_yug': 'Plovdiv · estación Yug', 'pdv_hisar': 'Plovdiv · casco antiguo', 'pdv_nebet': 'Plovdiv · Nebet Tepe', 'pdv_teatro': 'Plovdiv · Teatro Romano',
 'pdv_kapana': 'Plovdiv · Kapana', 'pdv_basilica': 'Plovdiv · Basílica del Obispo', 'sense': 'Sense Rooftop Bar', 'boyana': 'Iglesia de Boyana',
 'historia': 'Museo Nacional de Historia', 'manastirska': 'Manastirska Magernitsa', 'pistahielo': 'Pista de hielo del NDK',
 'vitosha': 'Bulevar Vitosha', 'podlipite': 'Pod Lipite', 'banitsa': 'Sofiyska Banitsa'}
MIN_FIJO = {('aeropuerto', 'casa', 'metro'): 30, ('casa', 'aeropuerto', 'metro'): 30, ('navidadndk', 'kashti', 'metro'): 12, ('avtogara', 'pdv_yug', 'bus'): 140, ('pdv_yug', 'avtogara', 'bus'): 140}
MESES = {'vie': 'Viernes 4 de diciembre', 'sab': 'Sábado 5 de diciembre', 'dom': 'Domingo 6 de diciembre', 'lun': 'Lunes 7 de diciembre', 'mar': 'Martes 8 de diciembre'}
dias = []; voz = []
for mod in ('d1_vie', 'd2_sab', 'd3_dom', 'd4_lun', 'd5_mar'):
    D = copy.deepcopy(importlib.import_module(mod).DIA)
    did = D['id']
    D['audio'] = 'itin-' + did + '-intro'
    voz.append({'app': 'itinerario', 'id': D['audio'], 'texto': MESES[did] + '. ' + D['lema'] + '. ' + ' '.join(D['intro'])})
    pasos = []; npar = 0; nt = 0; ult = None
    for i, p in enumerate(D['pasos']):
        if 'lugar' in p:
            npar += 1; ult = p['lugar']
            p['tipo'] = 'parada'; p['n'] = npar
            p['nombre'] = NOMBRES[p['lugar']]
            narrar = p.pop('narrar', True)
            p['audio'] = 'itin-' + did + '-p' + str(npar) if narrar else None
            if narrar: voz.append({'app': 'itinerario', 'id': p['audio'], 'texto': p['titulo'] + '. ' + ' '.join(p['texto'])})
        else:
            nt += 1
            a = ult; b = D['pasos'][i+1]['lugar']
            perfil = 'foot' if p['modo'] == 'pie' else 'car'
            k = a + '>' + b + ':' + perfil
            if k in R: dist, dur, geom = R[k]
            else:
                dist, dur, g = R[b + '>' + a + ':' + perfil]; geom = enc(list(reversed(dec(g))))
            p.update(tipo='tramo', desde=a, hasta=b, dist=dist, geom=geom,
                     min=MIN_FIJO.get((a, b, p['modo']), round(dur/60 * (1.25 if p['modo'] == 'taxi' else 1))))
            p['audio'] = 'itin-' + did + '-t' + str(nt)
            voz.append({'app': 'itinerario', 'id': p['audio'], 'texto': p['titulo'] + '. ' + ' '.join(p['texto'])})
        pasos.append(p)
    D['pasos'] = pasos
    dias.append(D)
lug = {k: {'nombre': NOMBRES[k], 'coord': list(C[k])} for k in NOMBRES}
os.makedirs(W + '/itinerario/datos', exist_ok=True)
json.dump({'dias': dias, 'lugares': lug}, open(W + '/itinerario/datos/itinerario.json', 'w'), ensure_ascii=False)
json.dump(voz, open(vz + 'itinerario.json', 'w'), ensure_ascii=False, indent=1)
pal = sum(len(x['texto'].split()) for x in voz)
print('itinerario: dias', len(dias), 'narraciones', len(voz), 'palabras', pal, 'caracteres', sum(len(x['texto']) for x in voz))
print('explora lugares', len(lugares), 'rutas', len(rutasv))
