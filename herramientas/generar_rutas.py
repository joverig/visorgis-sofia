import json
exec(open('textos_rutas.py').read())
R=json.load(open('rutas_red.json'))
P={f['properties']['id']:f['geometry']['coordinates'] for f in json.load(open('../VisorGISSofia/www/viajando/datos/puntos.geojson'))['features']}
import math
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
feats=[];voz=[]
for a,b,dist,p in R:
    g=dec(p)
    if m(g[0],P[a])>m(g[0],P[b]): g=g[::-1]          # siempre de 'desde' a 'hasta'
    nombre,desc,camino=T[(a,b)]
    rid=f'ruta-{a}--{b}'
    feats.append({"type":"Feature","properties":{"id":rid,"tipo":"pie","desde":a,"hasta":b,"nombre":nombre,"distancia":dist,"minutos":max(1,round(dist/1000/4.5*60)),"descripcion":desc,"camino":camino},"geometry":{"type":"LineString","coordinates":g}})
    voz.append({"app":"viajando","id":rid,"texto":nombre+". "+" ".join(desc)+" Por el camino verás: "+"; ".join(camino)+"."})
for (a,b),(nombre,desc,tr) in TRANSPORTE.items():
    rid=f'ruta-{a}--{b}'; dist=round(m(P[a],P[b]))
    feats.append({"type":"Feature","properties":{"id":rid,"tipo":"transporte","desde":a,"hasta":b,"nombre":nombre,"distancia":dist,"transporte":tr,"descripcion":desc,"camino":[]},"geometry":{"type":"LineString","coordinates":[P[a],P[b]]}})
    voz.append({"app":"viajando","id":rid,"texto":nombre+". "+" ".join(desc)})
json.dump({"type":"FeatureCollection","features":feats},open('../VisorGISSofia/www/viajando/datos/rutas.geojson','w'),ensure_ascii=False,separators=(',',':'))
json.dump(voz,open('../VisorGISSofia/voz/textos/viajando_rutas.json','w'),ensure_ascii=False,indent=1)
print(len(feats), sum(len(v['texto']) for v in voz),'caracteres de narracion')
