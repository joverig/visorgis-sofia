import json, math, sys, copy, os, importlib, time, urllib.request
AQUI = os.path.dirname(os.path.abspath(__file__)); os.chdir(AQUI)
sys.path.insert(0, AQUI); sys.path.insert(0, os.path.join(AQUI, 'itin'))
from itin_base import C
REPO = OUT = os.path.dirname(os.path.dirname(AQUI))   # raíz del proyecto (C:\Trabajo\VisorGISSofia)
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

vz = OUT + '/voz/textos/'
# ---------- C. Itinerario ----------
R = json.load(open('tramos.json'))
nuevas = []
def ruta(pts, perfil):
    # Pide la ruta a OSRM (routing.openstreetmap.de) y devuelve [distancia m, duración s, polilínea]
    url = 'https://routing.openstreetmap.de/routed-%s/route/v1/driving/%s?overview=full' % (perfil, ';'.join('%.5f,%.5f' % tuple(c) for c in pts))
    req = urllib.request.Request(url, headers={'User-Agent': 'visorgis-sofia/1.0'})
    d = json.load(urllib.request.urlopen(req, timeout=30)); time.sleep(0.5)
    r0 = d['routes'][0]; print('  ruta nueva', perfil, round(r0['distance']), 'm')
    return [round(r0['distance']), round(r0['duration']), r0['geometry']]
NOMBRES = {'aeropuerto': 'Aeropuerto (T2)', 'casa': 'Casa · Sredna Gora 16', 'raketa': 'Raketa Rakia Bar', 'hambara': 'Hambara',
 'justicia': 'Palacio de Justicia', 'halite': 'Mercado Central (Halite)', 'serdica': 'Ruinas de Serdica', 'rotonda': 'Rotonda de San Jorge',
 'nevski': 'Catedral de Alejandro Nevski', 'mercadoaleman': 'Mercado navideño alemán', 'navidadndk': 'Sofia Christmas Fest (NDK)',
 'kashti': 'Hadjidraganovite Kashti', 'shishman': 'Calle Tsar Shishman', 'petak': 'Bar Petak', 'avtogara': 'Estación Central de Autobuses',
 'pdv_yug': 'Plovdiv · estación Yug', 'pdv_hisar': 'Plovdiv · casco antiguo', 'pdv_nebet': 'Plovdiv · Nebet Tepe', 'pdv_teatro': 'Plovdiv · Teatro Romano',
 'pdv_kapana': 'Plovdiv · Kapana', 'pdv_basilica': 'Plovdiv · Basílica del Obispo', 'sense': 'Sense Rooftop Bar', 'boyana': 'Iglesia de Boyana',
 'historia': 'Museo Nacional de Historia', 'manastirska': 'Manastirska Magernitsa', 'pistahielo': 'Pista de hielo del NDK',
 'vitosha': 'Bulevar Vitosha', 'podlipite': 'Pod Lipite', 'banitsa': 'Sofiyska Banitsa',
 'izbata': 'Izbata Tavern', 'ilusiones': 'Museo de las Ilusiones', 'aguilas': 'Puente de las Águilas',
 'ejercito': 'Jardín del Príncipe (Knyazheska Gradina)', 'siete': 'Iglesia de los Siete Santos',
 'lavele': 'Lavelé Garden', 'banos': 'Baños Minerales · Museo de Historia de Sofía', 'zhenski': 'Zhenski Pazar'}
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
            if p.get('tour'): k = a + '>' + b + ':tour'
            if p.get('tour'): pts = [C[a]] + [q['coord'] for q in p['paradasTour'][1:-1]] + [C[b]]
            else: pts = [C[a], C[b]]
            pts = [[round(c[0], 5), round(c[1], 5)] for c in pts]
            if k not in R and (b + '>' + a + ':' + perfil) in R and not p.get('tour'):
                dist, dur, g = R[b + '>' + a + ':' + perfil][:3]; geom = enc(list(reversed(dec(g))))
            else:
                if k in R and len(R[k]) == 3: R[k].append(pts); nuevas.append(k)   # rutas antiguas: se anotan sus puntos
                if k not in R or R[k][3] != pts: R[k] = ruta(pts, perfil) + [pts]; nuevas.append(k)
                dist, dur, geom = R[k][:3]
            p.update(tipo='tramo', desde=a, hasta=b, dist=dist, geom=geom,
                     min=p.pop('minutos', None) or MIN_FIJO.get((a, b, p['modo']), (round(dur/60*1.3)+2 if p['modo'] == 'taxi' else round(dur/60))))
            p['audio'] = 'itin-' + did + '-t' + str(nt)
            voz.append({'app': 'itinerario', 'id': p['audio'], 'texto': p['titulo'] + '. ' + ' '.join(p['texto'])})
        pasos.append(p)
    # Hora de salida y de llegada de cada camino: llega a la hora de la parada siguiente;
    # sale esos minutos antes (redondeado a 5 min), salvo que el camino fije su propia salida
    def amin(h): hh, mm = map(int, h.split(':')); return hh * 60 + mm
    def ahora(m): m %= 1440; return '%02d:%02d' % (m // 60, m % 60)
    for i, p in enumerate(pasos):
        if p['tipo'] != 'tramo': continue
        prev = pasos[i - 1]; nxt = pasos[i + 1]
        lleg = amin(nxt['hora']); ini = amin(prev['hora'])
        if lleg < ini: lleg += 1440
        sal = amin(p['salida']) if p.get('salida') else (lleg - p['min']) // 5 * 5
        if sal < ini: sal = ini
        if not p.get('salida') and sal + p['min'] < lleg - 20 and False: pass
        p['salida'] = ahora(sal); p['llegada'] = ahora(lleg)
        if sal - ini < 0 or lleg - sal < p['min'] - 2: print('  ojo tiempos', did, p['titulo'], p['salida'], p['llegada'], p['min'])
    D['pasos'] = pasos
    dias.append(D)
lug = {k: {'nombre': NOMBRES[k], 'coord': list(C[k])} for k in NOMBRES}
os.makedirs(W + '/itinerario/datos', exist_ok=True)
json.dump({'dias': dias, 'lugares': lug}, open(W + '/itinerario/datos/itinerario.json', 'w'), ensure_ascii=False)
json.dump(voz, open(vz + 'itinerario.json', 'w'), ensure_ascii=False, indent=1)
if nuevas: json.dump(R, open('tramos.json', 'w')); print('rutas calculadas y guardadas en tramos.json:', nuevas)
pal = sum(len(x['texto'].split()) for x in voz)
print('itinerario: dias', len(dias), 'narraciones', len(voz), 'palabras', pal, 'caracteres', sum(len(x['texto']) for x in voz))
