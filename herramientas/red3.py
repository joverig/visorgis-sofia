# Red entre lugares PRINCIPALES: vecinos naturales (Delaunay) + filtro Physarum; los secundarios se recogen despues con desvios
import json, math, itertools, heapq
import numpy as np
from scipy.spatial import Delaunay
from scipy.sparse.csgraph import minimum_spanning_tree
exec(open('nuevos_puntos.py').read())
F={f['properties']['id']:f['geometry']['coordinates'] for f in json.load(open('../VisorGISSofia/www/viajando/datos/puntos.geojson'))['features']}
ids=PRINCIPALES
CL=math.cos(math.radians(42.69))
X=np.array([[F[k][0]*111320*CL, F[k][1]*111320] for k in ids])
d=lambda i,j: float(np.linalg.norm(X[i]-X[j]))
def dseg(p,a,b):
    ab=b-a; t=max(0,min(1,np.dot(p-a,ab)/np.dot(ab,ab))); return float(np.linalg.norm(p-(a+t*ab)))
E={tuple(sorted(e)) for s in Delaunay(X).simplices for e in itertools.combinations(s,2)}
E={e for e in E if all(dseg(X[k],X[e[0]],X[e[1]])>45 for k in range(len(ids)) if k not in e)}
n=len(ids); M=np.zeros((n,n))
for i,j in E: M[i,j]=d(i,j)
mst={tuple(sorted(x)) for x in zip(*minimum_spanning_tree(M).nonzero())}
def sp(a,b,sin):
    dist={a:0};h=[(0,a)]
    while h:
        x,u=heapq.heappop(h)
        if u==b: return x
        if x>dist[u]: continue
        for e in E:
            if e==sin or u not in e: continue
            v=e[1] if e[0]==u else e[0]; nx=x+d(u,v)
            if nx<dist.get(v,1e18): dist[v]=nx; heapq.heappush(h,(nx,v))
    return 1e18
for e in sorted(E,key=lambda e:-d(*e)):
    if e in mst: continue
    L=d(*e)
    if (L>300 and sp(e[0],e[1],e)<1.2*L) or L>2500: E.discard(e)
red=[[ids[i],ids[j],round(d(i,j))] for i,j in sorted(E,key=lambda e:d(*e))]
for r in red: print(r)
print(len(red))
json.dump(red,open('red3.json','w'))
