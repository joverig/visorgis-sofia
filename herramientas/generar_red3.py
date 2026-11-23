import json, math
exec(open('nuevos_puntos.py').read()); exec(open('textos_rutas3.py').read())
W='../VisorGISSofia/'
pg=json.load(open(W+'www/viajando/datos/puntos.geojson'))
feats=[f for f in pg['features'] if f['properties']['id'] in PRINCIPALES or True]
ids={f['properties']['id'] for f in feats}
for (pid,nombre,cat,_,resumen,hist) in NUEVOS:
    if pid in ids: continue
    feats.append({"type":"Feature","properties":{"id":pid,"nombre":nombre,"categoria":cat,"resumen":resumen,"historia":hist},"geometry":{"type":"Point","coordinates":COORD[pid]}})
for f in feats: f['properties']['nivel']='principal' if f['properties']['id'] in PRINCIPALES else 'secundario'
orden={k:i for i,k in enumerate(PRINCIPALES)}
feats.sort(key=lambda f:(f['properties']['nivel']!='principal', orden.get(f['properties']['id'],99)))
json.dump({"type":"FeatureCollection","features":feats},open(W+'www/viajando/datos/puntos.geojson','w'),ensure_ascii=False,separators=(',',':'))
P={f['properties']['id']:f['geometry']['coordinates'] for f in feats}
def dec(s):
    i=la=lo=0;o=[]
    while i<len(s):
        for k in range(2):
            sh=r=0
            while True:
                b=ord(s[i])-63;i+=1;r|=(b&31)<<sh;sh+=5
                if b<32:break
            v=~(r>>1) if r&1 else r>>1
            if k==0: la+=v
            else: lo+=v
        o.append([round(lo/1e5,5),round(la/1e5,5)])
    return o
def m(a,b):
    r=math.pi/180;return 6371000*math.hypot((b[0]-a[0])*r*math.cos(a[1]*r),(b[1]-a[1])*r)
def sent(t): return {"nombre":t[0],"descripcion":t[1],"camino":t[2]}
rf=[];voz=[]
for a,b,dist,p,par in json.load(open('rutas_red3.json')):
    g=dec(p)
    if m(g[0],P[a])>m(g[0],P[b]): g=g[::-1]
    ida,vuelta=T[(a,b)]
    rf.append({"type":"Feature","properties":{"tipo":"pie","desde":a,"hasta":b,"distancia":dist,"minutos":max(1,round(dist/1000/4.5*60)),"paradas":par,"ida":sent(ida),"vuelta":sent(vuelta)},"geometry":{"type":"LineString","coordinates":g}})
    for (x,y,t) in [(a,b,ida),(b,a,vuelta)]:
        voz.append({"app":"viajando","id":f"ruta-{x}--{y}","texto":t[0]+". "+" ".join(t[1])+(" Por el camino verás: "+"; ".join(t[2])+"." if t[2] else "")})
for (a,b),(tr,ida,vuelta) in TRANSPORTE.items():
    rf.append({"type":"Feature","properties":{"tipo":"transporte","desde":a,"hasta":b,"distancia":round(m(P[a],P[b])),"transporte":tr,"paradas":[],"ida":sent(ida),"vuelta":sent(vuelta)},"geometry":{"type":"LineString","coordinates":[P[a],P[b]]}})
    for (x,y,t) in [(a,b,ida),(b,a,vuelta)]:
        voz.append({"app":"viajando","id":f"ruta-{x}--{y}","texto":t[0]+". "+" ".join(t[1])})
json.dump({"type":"FeatureCollection","features":rf},open(W+'www/viajando/datos/rutas.geojson','w'),ensure_ascii=False,separators=(',',':'))
json.dump(voz,open(W+'voz/textos/viajando_rutas.json','w'),ensure_ascii=False,indent=1)
# narracion de los lugares (incluye los nuevos): mismo formato que exportar_textos
vl=[{"app":"viajando","id":f['properties']['id'],"texto":f['properties']['nombre']+". "+f['properties']['resumen']+" "+" ".join(f['properties']['historia'])} for f in feats]
old=json.load(open(W+'voz/textos/viajando.json'))
oldids={o['id'] for o in old}
nuevos=[v for v in vl if v['id'] not in oldids]
json.dump(old+nuevos,open(W+'voz/textos/viajando.json','w'),ensure_ascii=False,indent=1)
print('puntos',len(feats),'rutas',len(rf),'textos ruta',len(voz),sum(len(v['texto']) for v in voz),'nuevos lugares',len(nuevos),sum(len(v['texto']) for v in nuevos))
