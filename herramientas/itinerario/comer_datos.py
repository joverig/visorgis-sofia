import json, sys
sys.path.insert(0, '.')
from fotos import foto
ORIG = json.load(open('restaurantes_orig.geojson'))
base = {f['properties']['id']: (f['properties'], f['geometry']['coordinates']) for f in ORIG['features']}

# Qué pedir (de reseñas y foros) + foto representativa + datos extra para los 15 que ya estaban
EXTRA = {
 'cosmos': dict(categoria='restaurante', foto='alta', pedir=[
   'El menú degustación (también lo hay vegetariano), con maridaje de vinos búlgaros si os apetece darse un capricho',
   'Si vais a la carta, pedid varios platos al centro para compartir: es lo que más se recomienda',
   'De postre, el famoso dulce de rosa búlgara'], nota_pedir='Cocina de autor: reservad, y contad con un precio alto para Sofía.'),
 'moma': dict(categoria='restaurante', foto='patatnik', horario='12:30-23:30 (últimas comandas 22:30)', telefono='+359 885 622 020', pedir=[
   'Patatnik, el pastel de patata, queso y hierbas de los Ródopes',
   'Cordero (pierna o guiso) con un tinto mavrud o melnik de su carta',
   'Ensalada servida en cuenco de pan y, de postre, los dulces búlgaros de la casa']),
 'hadjidraganov': dict(categoria='restaurante', foto='lukanka_alt', pedir=[
   'Los embutidos de elaboración propia: la salchicha de pollo es la que más se recomienda',
   'Ensalada de la casa para empezar', 'Tarta de miel (medena torta) de postre']),
 'manastirska': dict(categoria='restaurante', foto='gyuveche', horario='12:00-23:00', telefono='+359 899 949 400', itinerario='Lunes 7 · comida', pedir=[
   'Platos de cazuela al horno de recetas monásticas: el gyuveche es la apuesta segura',
   'Carnes a la parrilla, albóndigas caseras (kyufteta) o caza, según temporada',
   'Una carta de vinos búlgaros muy completa: buen sitio para probar uno de la zona de Melnik']),
 'madeinhome': dict(categoria='restaurante', foto='kyopolou', pedir=[
   'La carta cambia: preguntad por los platos del día',
   'Mezze para compartir, sobre todo las berenjenas', 'La sopa de pollo y los siropes caseros de frambuesa o saúco'],
   nota_pedir='Solo efectivo y suele llenarse: id antes de las 19:00 o reservad.'),
 'shtastliveca': dict(categoria='restaurante', foto='kavarma', telefono='+359 2 441 1155', pedir=[
   'Meshana skara, la parrillada mixta, uno de los clásicos búlgaros',
   'Cordero asado y calamares a la plancha, de lo más alabado',
   'De postre, la tarta de chocolate «motel»'], nota_pedir='Carta larguísima y numerada; las reseñas son irregulares, mejor ir a lo clásico.'),
 'podlipite': dict(categoria='restaurante', foto='cheverme', horario='12:00-23:00', telefono='+359 886 801 227', itinerario='Lunes 7 · cena', pedir=[
   'Las carnes de su propia granja, a la brasa o en cazuela',
   'Pastas para untar y entrantes de la cocina tradicional (kyopolou, lyutenitsa)',
   'Pedid consejo: cocinan recetas de todas las regiones del país'], nota_pedir='Abierto desde 1926; reservad mesa para 7.'),
 'oborishte35': dict(categoria='restaurante', foto='shopska', pedir=[
   'Ensalada shopska de entrante', 'Platos de cocina búlgara y europea a la carta', 'Una copa de vino del país']),
 'maminkolio': dict(categoria='restaurante', foto='sarmi', pedir=[
   'Sarmi (hojas rellenas de arroz y carne)', 'Sopas y guisos caseros del día', 'Kebapche y kyufte a la parrilla']),
 'balaban': dict(categoria='bar', foto='mavrud', pedir=[
   'Copas de mavrud, melnik o rubin, uvas autóctonas búlgaras', 'Tablas de quesos y embutidos para acompañar']),
 'chevermeto': dict(categoria='restaurante', foto='cheverme', pedir=[
   'El chevermé, el cordero asado entero que da nombre al local', 'Espectáculo folclórico durante la cena']),
 'kashti': dict(categoria='restaurante', foto='cheverme', horario='11:30-23:30', telefono='+359 899 917 837', itinerario='Sábado 5 · cena', pedir=[
   'Cordero (muy alabado por lo tierno) o parrillada mixta para compartir',
   'Para los atrevidos, los platos de casquería de la cocina antigua',
   'Rakía o vino búlgaro mientras suena la música folclórica (desde las 20:00, menos los martes)']),
 'bankovich': dict(categoria='restaurante', foto='pljeskavica', pedir=[
   'Pljeskavica, la gran hamburguesa serbia a la parrilla', 'Ćevapi con cebolla y kajmak', 'Ensalada de pimientos asados']),
 'raketa': dict(categoria='restaurante', foto='rakia', horario='cocina 12:00-23:00, barra hasta medianoche', telefono='+359 2 444 6111', itinerario='Viernes 4 · cena', pedir=[
   'Rakía: tienen más de 170; pedid que os aconsejen una de ciruela y otra de uva',
   'Pan «gitano» y ensalada de la rakía para picar', 'Corazones de pollo y albóndigas, de lo más recomendado',
   'Codillo entero para compartir y, de postre, la tarta «Raketa»'], nota_pedir='Decoración de la época socialista y platos de metal como los de las abuelas.'),
 'egur': dict(categoria='restaurante', foto='khorovats', pedir=[
   'Khorovats, la parrillada armenia', 'Dulces armenios de postre']),
}
NUEVOS = [
 dict(id='halite', nombre='Mercado Central (Halite)', cocina='Puestos de comida', categoria='mercado', precio='€', direccion='bulevar Knyaginya Maria Luiza 25',
      horario='7:00-23:00', coord=[23.32180, 42.70000], foto='banitsa', itinerario='Sábado 5 · comida',
      resumen='El mercado cubierto de 1911, junto a la mezquita: en la planta alta y en el sótano hay puestos donde comer barato y rápido, perfecto para que cada uno pique lo que quiera.',
      pedir=['Banitsa recién hecha', 'Parrilla de los puestos: kebapche y kyufte', 'Dulces y frutos secos para llevar']),
 dict(id='banitsa', nombre='Sofiyska Banitsa', cocina='Banitsa y boza', categoria='desayuno', precio='€', direccion='Graf Ignatiev 7',
      horario='lun-vie 7:00-15:00 (según OpenStreetMap; los fines de semana puede variar)', coord=[23.32311, 42.69376], foto='boza', itinerario='Martes 8 · desayuno',
      resumen='Un mostrador de los de toda la vida que solo hace una cosa, y la borda: banitsa, el hojaldre de queso que desayunan los búlgaros, acompañada de boza.',
      pedir=['Banitsa de queso recién salida del horno', 'Boza, la bebida espesa y dulzona de cereal fermentado (o un ayran, si la boza no os convence)']),
 dict(id='izbata', nombre='Izbata Tavern', cocina='Búlgara tradicional', categoria='restaurante', precio='€€', direccion='Slavyanska 18',
      horario='11:00-23:00', telefono='+359 889 895 533', coord=[23.32978, 42.69255], foto='drob',
      resumen='Taberna en un sótano acogedor, con recetas búlgaras casi olvidadas y precios razonables. Alternativa del plan si queréis bajar el gasto.',
      pedir=['Cerdo al vino servido en pan', 'Costillas', 'El helado casero de postre'], nota_pedir='Conviene reservar.'),
 dict(id='vodenitsa', nombre='Vodenitzata', cocina='Búlgara con espectáculo', categoria='restaurante', precio='€€€', direccion='Dragalevtsi, a los pies del Vitosha',
      coord=[23.30352, 42.62147], foto='cheverme',
      resumen='Un viejo molino de agua en el bosque, fuera del centro, con espectáculo folclórico que termina con los nestinari bailando descalzos sobre las brasas. Taxi y reserva imprescindibles.',
      pedir=['Cordero, que las reseñas describen como «se deshace en la boca»', 'Ensalada de pimientos asados', 'Helado cremoso de postre']),
 dict(id='hambara', nombre='Hambara', cocina='Bar a la luz de las velas', categoria='bar', precio='€', direccion='6 de Septiembre 22 (al fondo del callejón)',
      horario='aprox. 21:00-3:00, lun-sáb', coord=[23.32552, 42.69015], foto='velas', itinerario='Viernes 4 · copa',
      resumen='El «granero»: un bar sin cartel ni electricidad, iluminado solo con velas, al fondo de un callejón oscuro. Fue refugio de intelectuales en la época comunista. Hay que llamar a la puerta de madera.',
      pedir=['Rakía o vino de la casa', 'Combinados sencillos: no es sitio de cócteles'], nota_pedir='Solo efectivo. Es pequeño: con 7, llegad pronto.'),
 dict(id='onemore', nombre='One More Bar', cocina='Cócteles', categoria='bar', precio='€€', direccion='Tsar Shishman 12',
      coord=[23.33076, 42.69257], foto='coctel', itinerario='Sábado 5 · copas',
      resumen='Cócteles en una casa antigua con encanto, en plena calle Tsar Shishman. El favorito de las guías locales para empezar la noche.',
      pedir=['Un cóctel de autor de la carta', 'Si dudáis, pedid uno con rakía o con hierbas búlgaras']),
 dict(id='cincol', nombre='5L Speakeasy', cocina='Cócteles', categoria='bar', precio='€€', direccion='Tsar Shishman 15',
      coord=[23.33030, 42.69160], foto='coctel', itinerario='Sábado 5 · copas',
      resumen='Speakeasy de cócteles creativos a unos pasos del One More Bar, en la calle de los bares.',
      pedir=['Cócteles creativos: dejad que el barman os proponga']),
 dict(id='petak', nombre='Bar Petak', cocina='Bar de baile', categoria='bar', precio='€', direccion='General Gurko 21',
      horario='22:00-6:00', coord=[23.32765, 42.69257], foto='cerveza', itinerario='Sábado 5 · si hay marcha',
      resumen='Si el grupo quiere bailar hasta tarde, aquí se alarga la noche.', pedir=['Cerveza búlgara o un combinado']),
 dict(id='sense', nombre='Sense Rooftop Bar', cocina='Bar en azotea', categoria='bar', precio='€€€', direccion='Tsar Osvoboditel 16 (Sense Hotel)',
      coord=[23.33139, 42.69420], foto='vino', itinerario='Domingo 6 · noche',
      resumen='La azotea del Sense Hotel, con la catedral de Alejandro Nevski iluminada enfrente. Para una copa tranquila con vistas.',
      pedir=['Una copa de vino búlgaro o un cóctel mirando a la catedral']),
 dict(id='pavaj', nombre='Pavaj', cocina='Búlgara moderna', categoria='restaurante', precio='€€', direccion='Zlatarska 7, Kapana (Plovdiv)', ciudad='Plovdiv',
      horario='horario no verificado: id pronto o preguntad al llegar', coord=[24.74879, 42.14914], foto='carpa', itinerario='Domingo 6 · comida en Plovdiv',
      resumen='El restaurante que repiten todas las reseñas de Plovdiv, en el corazón del barrio de Kapana: cocina búlgara con un giro moderno, producto fresco del día y pan casero. Siempre lleno.',
      pedir=['El 6 de diciembre es Nikulden: preguntad por la carpa o el pescado del día',
             'Ensalada Pavaj y la tabla de quesos', 'Albóndigas de la casa', 'Tarta de queso con baklava de postre']),
]
feats = []
for i, (p, c) in base.items():
    p = dict(p); e = dict(EXTRA.get(i, {}))
    fk = e.pop('foto', None)
    if fk == 'lukanka_alt': fk = 'moussaka'
    p.update(e); p['platos'] = p.pop('pedir', p.get('platos'))
    if fk: p['foto'] = foto(fk)
    feats.append({'type': 'Feature', 'properties': p, 'geometry': {'type': 'Point', 'coordinates': c}})
for n in NUEVOS:
    n = dict(n); c = n.pop('coord'); n['foto'] = foto(n['foto']); n['platos'] = n.pop('pedir'); n.setdefault('valoracion', None)
    feats.append({'type': 'Feature', 'properties': n, 'geometry': {'type': 'Point', 'coordinates': c}})
json.dump({'type': 'FeatureCollection', 'features': feats}, open('/home/claude/out/VisorGISSofia/www/comer/datos/restaurantes.geojson', 'w'), ensure_ascii=False, indent=1)
print(len(feats))
