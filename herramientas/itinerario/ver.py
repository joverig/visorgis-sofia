import json, math, sys
from itin_base import C
R = json.load(open('tramos.json'))
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
def hav(a,b):
    r=math.pi/180; h=math.sin((b[1]-a[1])*r/2)**2+math.cos(a[1]*r)*math.cos(b[1]*r)*math.sin((b[0]-a[0])*r/2)**2
    return 2*6371000*math.asin(math.sqrt(h))
P = {f['properties']['id']: f['geometry']['coordinates'] for f in json.load(open('/home/claude/out/VisorGISSofia/www/viajando/datos/puntos.geojson'))['features']}
P.update(C)
EXTRA = {'vitoshablvd_mid': (23.3196,42.6915), 'maceonia': (23.3147,42.6943), 'tsarosv': (23.3300,42.6945), 'grafign': (23.3250,42.6930), 'zaimov': (23.3420,42.6990)}
P.update(EXTRA)
def cerca(k, rad=200):
    pts = dec(R[k][2])
    # densify
    dens=[]
    for i in range(len(pts)-1):
        a,b=pts[i],pts[i+1]; n=max(1,int(hav(a,b)/20))
        dens += [(a[0]+(b[0]-a[0])*j/n, a[1]+(b[1]-a[1])*j/n) for j in range(n)]
    out=[]
    for n,c in P.items():
        d=min(hav(c,q) for q in dens)
        if d<rad: out.append((round(d),n))
    return sorted(out)
for k in sys.argv[1:]: print(k, cerca(k))
