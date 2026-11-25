# Esqueleto del itinerario: paradas (coordenadas lon,lat) y tramos por día
C = {
 'aeropuerto': (23.41558, 42.68863), 'casa': (23.31025, 42.69675),
 'raketa': (23.34201, 42.69828), 'hambara': (23.32552, 42.69015),
 'justicia': (23.31995, 42.69550), 'halite': (23.32180, 42.69999),
 'serdica': (23.32190, 42.69820), 'rotonda': (23.32332, 42.69689), 'nevski': (23.33276, 42.69577),
 'mercadoaleman': (23.32575, 42.69500), 'navidadndk': (23.31915, 42.68690),
 'kashti': (23.32261, 42.70659), 'shishman': (23.33050, 42.69200), 'petak': (23.32765, 42.69257),
 'avtogara': (23.32323, 42.71034),
 'pdv_yug': (24.74428, 42.13601), 'pdv_hisar': (24.75330, 42.15000), 'pdv_nebet': (24.75199, 42.15131),
 'pdv_teatro': (24.75110, 42.14699), 'pdv_kapana': (24.74879, 42.14914), 'pdv_basilica': (24.75259, 42.14406),
 'sense': (23.33139, 42.69420),
 'boyana': (23.26650, 42.64470), 'historia': (23.27081, 42.65500), 'manastirska': (23.32460, 42.68934),
 'pistahielo': (23.31850, 42.68620), 'vitosha': (23.31960, 42.69150), 'podlipite': (23.33548, 42.68176),
 'banitsa': (23.32311, 42.69376),
 'izbata': (23.32978, 42.69255), 'ilusiones': (23.32272, 42.70044), 'aguilas': (23.33749, 42.69055),
 'ejercito': (23.33449, 42.69069), 'siete': (23.32760, 42.68995),
 'lavele': (23.31955, 42.69475), 'banos': (23.32418, 42.69960), 'zhenski': (23.32058, 42.70280),
}
# (dia, [parada, modo, parada, modo, parada ...])  modo: pie | taxi | metro | bus
DIAS = [
 ('vie', ['aeropuerto', 'metro', 'casa', 'taxi', 'raketa', 'pie', 'hambara', 'pie', 'casa']),
 ('sab', ['casa', 'pie', 'justicia', 'pie', 'halite', 'pie', 'serdica', 'pie', 'rotonda', 'pie', 'nevski', 'pie',
          'mercadoaleman', 'pie', 'navidadndk', 'metro', 'kashti', 'pie', 'shishman', 'pie', 'petak', 'pie', 'casa']),
 ('dom', ['casa', 'pie', 'avtogara', 'bus', 'pdv_yug', 'pie', 'pdv_hisar', 'pie', 'pdv_nebet', 'pie', 'pdv_teatro', 'pie',
          'pdv_kapana', 'pie', 'pdv_basilica', 'pie', 'pdv_yug', 'bus', 'avtogara', 'taxi', 'sense', 'pie', 'casa']),
 ('lun', ['casa', 'taxi', 'boyana', 'pie', 'historia', 'taxi', 'manastirska', 'pie', 'pistahielo', 'pie', 'vitosha', 'taxi',
          'podlipite', 'taxi', 'casa']),
 ('mar', ['casa', 'pie', 'banitsa', 'pie', 'vitosha', 'pie', 'halite', 'pie', 'casa', 'metro', 'aeropuerto']),
]
def tramos():
    out = []
    for d, seq in DIAS:
        for i in range(1, len(seq), 2):
            out.append((d, seq[i-1], seq[i], seq[i+1]))
    return out
if __name__ == '__main__':
    import json
    T = {}
    for d, a, m, b in tramos():
        perfil = 'foot' if m == 'pie' else 'car'
        T[a + '>' + b + ':' + perfil] = [C[a], C[b], perfil]
    print(len(T)); open('tramos_req.json', 'w').write(json.dumps(T))
