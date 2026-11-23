import json, math, itertools
import numpy as np
from scipy.spatial import Delaunay
from scipy.sparse.csgraph import minimum_spanning_tree
F=json.load(open('../VisorGISSofia/www/viajando/datos/puntos.geojson'))['features']
ids=[f['properties']['id'] for f in F]
N={f['properties']['id']:f['properties']['nombre'] for f in F}
NUM={k:i+1 for i,k in enumerate(ids)}
CL=math.cos(math.radians(42.69))
X=np.array([[f['geometry']['coordinates'][0]*111320*CL, f['geometry']['coordinates'][1]*111320] for f in F])
d=lambda i,j: float(np.linalg.norm(X[i]-X[j]))
def dseg(p,a,b):
    ab=b-a; t=max(0,min(1,np.dot(p-a,ab)/np.dot(ab,ab))); return float(np.linalg.norm(p-(a+t*ab)))
# 1. Malla de vecinos naturales (Delaunay): triangulos, nunca salta por encima de un punto
tri=Delaunay(X); E=set()
for s in tri.simplices:
    for i,j in itertools.combinations(sorted(s),2): E.add((i,j))
# 2. Fuera aristas que rozan otro lugar (< 45 m de la recta)
E={e for e in E if all(dseg(X[k],X[e[0]],X[e[1]])>45 for k in range(len(ids)) if k not in e)}
# 3. Physarum suave: tubos largos (>900 m) se atrofian si hay rodeo por la red < 1.25x; siempre se conserva el arbol minimo (conectividad)
n=len(ids); M=np.zeros((n,n))
for i,j in E: M[i,j]=d(i,j)
mst={tuple(sorted(x)) for x in zip(*minimum_spanning_tree(M).nonzero())}
import heapq
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
    if L>300 and sp(e[0],e[1],e)<1.2*L: E.discard(e)
    elif L>2500: E.discard(e)
red=[(ids[i],ids[j]) for i,j in sorted(E,key=lambda e:d(*e))]
json.dump(red,open('red.json','w'))
deg={k:0 for k in ids}
for a,b in red: deg[a]+=1; deg[b]+=1
print(len(red))
for i,j in sorted(E,key=lambda e:d(*e)): print(f"{i+1:>2} {N[ids[i]][:26]:26} - {j+1:>2} {N[ids[j]][:26]:26} {d(i,j):6.0f}")
print(deg)
# dibujo
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
for nombre,lim in [('red_centro.png',(X[:,0].min(),X[:,1].min())),('red_toda.png',None)]:
    fig,ax=plt.subplots(figsize=(12,10),dpi=110); ax.set_facecolor('#f6f1e7'); fig.patch.set_facecolor('#f6f1e7')
    for i,j in E: ax.plot(X[[i,j],0],X[[i,j],1],color='#a8322a',lw=2.2,zorder=1)
    ax.scatter(X[:,0],X[:,1],s=260,c='#a8322a',edgecolors='white',linewidths=2,zorder=2)
    for k in range(n):
        ax.text(X[k,0],X[k,1],str(k+1),ha='center',va='center',color='white',fontsize=8,fontweight='bold',zorder=3)
        ax.text(X[k,0],X[k,1]+45,N[ids[k]].split(' (')[0],ha='center',fontsize=7.5,color='#22262c',zorder=3)
    if nombre=='red_centro.png':
        c=[k for k in range(n) if ids[k] not in('boyana','historia','artesocialista','ndk','borisova')]
        ax.set_xlim(X[c,0].min()-150,X[c,0].max()+150); ax.set_ylim(X[c,1].min()-120,X[c,1].max()+150)
    ax.set_aspect('equal'); ax.set_xticks([]); ax.set_yticks([])
    ax.set_title('Red de conexiones (líneas rectas, antes de pasar a calles)' + (' · centro' if nombre=='red_centro.png' else ' · completa'),fontsize=11)
    fig.tight_layout(); fig.savefig(nombre); plt.close(fig)
