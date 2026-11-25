# Reconstruye los módulos itin/d*.py del itinerario revisado (reservas reales, descansos, taxis, opcionales)
import sys, os, copy, pprint
os.chdir(os.path.dirname(os.path.abspath(__file__))); os.makedirs('itin', exist_ok=True)
sys.path.insert(0, 'itin_orig')
import d1_vie as O1, d2_sab as O2, d3_dom as O3, d4_lun as O4, d5_mar as O5

def g(mod, _t, **cambios):
    p = copy.deepcopy(next(x for x in mod.DIA['pasos'] if x['titulo'] == _t))
    p.update(cambios); return p
def rep(p, a, b):
    t = [x.replace(a, b) for x in p['texto']]
    assert t != p['texto'], (p['titulo'], a[:50]); p['texto'] = t; return p
def P(lugar, hora, titulo, texto, **kw): return dict(lugar=lugar, hora=hora, titulo=titulo, texto=texto, **kw)
def T(modo, titulo, texto, **kw): return dict(modo=modo, titulo=titulo, texto=texto, **kw)
def guardar(nombre, D):
    open('itin/' + nombre + '.py', 'w', encoding='utf-8').write('# Generado por build_dias.py\nDIA = ' + pprint.pformat(D, width=200, sort_dicts=False) + '\n')

# ============ VIERNES ============
D = dict(id='vie', fecha='2026-12-04', titulo='Viernes 4', lema='Llegada y primera cena en el bulevar Vitosha', intro=[
 O1.DIA['intro'][0],
 'El plan tiene tres tiempos. Primero, el traslado en dos taxis oficiales, unos veinte minutos hasta la puerta; el metro M4, que sale de la misma terminal, queda como alternativa barata. Segundo, la cena: mesa reservada a las once en Lavelé Garden, en pleno bulevar Vitosha, a cinco minutos en taxi de casa. Y tercero, solo para quien aún tenga cuerda, una copa a la luz de las velas en Hambara, el bar más escondido de la ciudad.',
 'Haced la cuenta con calma: entre recoger maletas, el traslado y dejar las cosas en casa, estaréis listos para coger los taxis hacia las once menos cuarto. Bulgaria usa el euro desde enero de este año, así que no hace falta cambiar moneda, aunque conviene llevar algo de efectivo para los sitios pequeños. Hará frío, probablemente bajo cero al salir del restaurante: abrigo a mano desde el aeropuerto.'],
 pasos=[
 g(O1, 'Aterrizaje en la Terminal 2', precio='13-14 € por taxi · 0,80 € en metro'),
 T('taxi', 'Del aeropuerto a casa en taxi', [O1.DIA['pasos'][1]['texto'][1].replace(' Con maletas grandes y siete personas, es la opción que os recomiendo para esta primera noche.', ' Pedid dos taxis en el mostrador oficial: con maletas y siete personas, es lo más cómodo.'),
  'Si preferís el metro, la línea M4 va directa, sin transbordos, desde la Terminal 2 hasta la estación Opalchenska, a cinco minutos andando de la casa: unos veinticinco o treinta minutos y 0,80 euros.'],
  alternativa='Metro M4 hasta Opalchenska: unos 30 min, 0,80 €'),
 g(O1, 'La casa: Sredna Gora 16', hora='22:20'),
 T('taxi', 'De casa a Lavelé Garden en taxi', [
  'Unos cinco minutos de taxi hacia el este, el primer vistazo a Sofía de noche: la plaza Macedonia, una encrucijada de tranvías, y las calles de edificios de entreguerras hasta el bulevar Vitosha, la gran calle peatonal de la ciudad, iluminada de punta a punta en diciembre.',
  'Pedid dos taxis para las once menos cuarto. El restaurante está en el número 34 del bulevar, en el tramo de las tiendas; como el bulevar es peatonal, el taxi os dejará en la esquina con la calle Lavele.'],
  salida='22:45', alternativa='Andando: unos 15 min'),
 P('lavele', '23:00', 'Cena en Lavelé Garden', [
  'Lavelé Garden está en el número 34 del bulevar Vitosha, el corazón del paseo de Sofía. Su nombre viene de la calle Lavele, que cruza el bulevar justo aquí, y el local juega a ser un jardín en plena ciudad, con mucha planta y luz cálida.',
  'La cocina mezcla lo mediterráneo y lo balcánico: pizzas, pastas y risottos para quien llegue con hambre de casa, y para estrenarse en lo búlgaro, la ensalada balcánica con queso sirene de granja. Es una cena tranquila después del viaje, sin prisas: mañana el día empieza a las once.',
  'Mesa reservada para siete a las once de la noche. Si el vuelo se retrasa, avisad al restaurante.'],
  comer='lavele', comida='cena', reserva='23:00', precio='15-25 € por persona'),
 T('pie', 'De Lavelé Garden a Hambara', [
  'Doce minutos hacia el este. Seguís por la calle Graf Ignatiev, la de las tiendas y los tranvías, hasta la plaza Slaveykov, donde dos escritores de bronce, padre e hijo, Petko y Pencho Slaveykov, conversan sentados en un banco.',
  'Desde allí os metéis por calles más estrechas hasta la calle 6 de Septiembre. El nombre recuerda el 6 de septiembre de 1885, el día de la Unificación de Bulgaria, cuando el principado del norte y la Rumelia Oriental, con capital en Plovdiv, se unieron en un solo Estado.'],
  opcional=True),
 g(O1, 'Si aún tenéis ganas: Hambara', hora='00:30', titulo='Opcional: una vela en Hambara', opcional=True),
 g(O1, 'De Hambara a casa', alternativa='Taxi: unos 5 min, 3-5 € · Si no vais a Hambara: de Lavelé a casa, 15 min andando'),
 g(O1, 'De vuelta en casa', hora='01:00'),
])
guardar('d1_vie', D)

# ============ SÁBADO ============
tour = g(O2, 'Free Sofia Tour en español', reserva='11:00', explora='freetour')
rep(tour, 'Escuchad bien y tomad nota de lo que os llame la atención: por la tarde volveréis con calma a los sitios que más os interesen.',
    'El tour termina junto a la catedral de Alejandro Nevski: ahí mismo bajaréis a su cripta, y después iréis a comer a Izbata Tavern, a ocho minutos.')
rep(tour, 'No hace falta reservar, y al final', 'Tenéis plaza apuntada para siete, y al final')
rep(tour, 'El recorrido os llevará por las ruinas de Serdica, la Rotonda de San Jorge, la iglesia de Santa Nedelya, la mezquita y la sinagoga, la plaza de la Independencia y la zona de la catedral.',
    'El recorrido oficial tiene diecinueve paradas: Santa Nedelya, la estatua de Santa Sofía, la iglesia de Santa Petka, las ruinas romanas del Largo, la mezquita de Banya Bashi, la sinagoga, los Baños Minerales y sus fuentes, los tres edificios del Largo, la Rotonda, el Jardín de la Ciudad, el Teatro Nacional, el antiguo Palacio Real, la iglesia rusa, Santa Sofía y, al final, Alejandro Nevski. El guía puede cambiar el orden según el grupo.')
TOUR = [('Palacio de Justicia', (23.31995, 42.6955), 'justicia'), ('Iglesia de Sveta Nedelya', (23.32124, 42.69655), 'nedelya'),
 ('Estatua de Santa Sofía', (23.3214, 42.69796), 'estatua'), ('Iglesia de Santa Petka', (23.32218, 42.69787), 'petka'),
 ('Ruinas romanas del Largo (Serdica)', (23.3219, 42.6982), 'serdica'), ('Mezquita de Banya Bashi', (23.32256, 42.69951), 'banyabashi'),
 ('Sinagoga de Sofía', (23.321, 42.7), 'sinagoga'), ('Baños Minerales · Museo de Sofía', (23.32418, 42.6996), 'banos'),
 ('Fuentes de agua mineral', (23.3232, 42.6998), None), ('Consejo de Ministros', (23.32366, 42.69827), None),
 ('Antigua Casa del Partido', (23.32527, 42.69722), None), ('Presidencia', (23.32386, 42.69679), 'largo'),
 ('Rotonda de San Jorge', (23.32332, 42.69689), 'rotonda'), ('Jardín de la Ciudad', (23.32549, 42.6952), 'jardin'),
 ('Teatro Nacional Iván Vázov', (23.3261, 42.6941), 'teatro'), ('Galería Nacional (antiguo Palacio Real)', (23.3276, 42.6962), 'galeria'),
 ('Iglesia rusa de San Nicolás', (23.32893, 42.69569), 'rusa'), ('Basílica de Santa Sofía', (23.33116, 42.69636), 'santasofia'),
 ('Catedral de Alejandro Nevski', (23.33276, 42.69577), 'nevski')]
PTOUR = [dict(n=i + 1, nombre=a, coord=list(b), explora=c) for i, (a, b, c) in enumerate(TOUR)]
nev = g(O2, 'Catedral de Alejandro Nevski y su cripta', hora='13:00')
rep(nev, 'Abre de martes a domingo de diez a seis y la entrada cuesta diez euros: si vais justos de tiempo, haced la cripta primero. Y quien quiera hacer el tour del comunismo, a las cuatro, que avise al grupo y quede después en el mercado navideño.',
    'Abre de martes a domingo de diez a seis y la entrada cuesta diez euros. Calculad unos cuarenta minutos: el hambre aprieta, y la comida os espera a ocho minutos andando.')
izb = P('izbata', '14:00', 'Comida en Izbata Tavern', [
 'Izbata significa «la bodega», y eso es: una taberna tradicional en un sótano, a cinco minutos de la catedral. Abrió en 2010 con una idea sencilla, recuperar recetas búlgaras casi olvidadas, de las que se cocinaban en las casas, y servirlas a precios razonables y en raciones generosas.',
 'Para empezar, una ensalada shopska, la de tomate, pepino y queso sirene rallado por encima, con una rakía bien fría, que es como se hace aquí. Después, la especialidad de la casa: cerdo guisado al vino que llega a la mesa dentro de una hogaza de pan. Las costillas también tienen fama. Y dejad sitio para el helado casero, que es de lo más alabado.',
 'Abre todos los días de once a doce de la noche. Tenéis mesa reservada para siete a las dos. Después de comer, dos taxis a casa a descansar.'],
 comida='comida', comer='izbata', precio='15-25 € por persona',
 reserva='14:00',
 calle='Si alguien prefiere algo más rápido: Egur Egur, cocina armenia, a dos calles de Nevski, o un bocado rápido en las cafeterías del bulevar Vitosha camino de casa.')
mer = g(O2, 'Mercado navideño alemán', hora='18:20', calle='Vino caliente, salchichas y dulces en las casetas: para picar antes de la cena, sin quitar el hambre.')
rep(mer, 'Es buen momento para que el grupo se reúna si alguien ha ido al tour del comunismo.', 'No os entretengáis demasiado: a las siete y media os esperan para cenar.')
kas = g(O2, 'Cena con música folk: Hadjidraganovite Kashti', hora='19:30', reserva='19:30', comida='cena')
rep(kas, 'todos los días, menos los martes, a partir de las ocho hay música', 'todos los días, menos los martes, de ocho a once hay música')
rep(kas, 'Mesa para siete reservada cerca de los músicos, en el +359 899 917 837.', 'Mesa reservada para siete a las siete y media: la música empieza a las ocho, así que la tendréis entera.')
tks = g(O2, 'De Hadjidraganovite Kashti a la calle Tsar Shishman', modo='taxi', alternativa='Andando: unos 35 min')
tks['texto'] = ['Unos ocho minutos de taxi atravesando el centro de norte a sur: el puente de los Leones, el bulevar Maria Luiza con la mezquita iluminada, el Largo y el bulevar Tsar Osvoboditel, con la iglesia rusa y sus cúpulas doradas.',
 'La calle Tsar Shishman lleva el nombre de Iván Shishman, el último zar de Tarnovo, que cayó ante los otomanos a finales del siglo catorce. Es una calle corta y con encanto, llena de tiendas de diseño, cafés y bares en edificios antiguos.']
shi = g(O2, 'Copas por Tsar Shishman', hora='22:15', explora='shishman')
pet = g(O2, 'Si el grupo quiere bailar: Bar Petak', hora='23:15', titulo='Opcional: a bailar en Bar Petak', opcional=True)
rep(pet, 'Es opcional, claro: mañana el autobús a Plovdiv sale a las nueve.', 'Es opcional, y la noche se alarga: mañana el taxi a la estación sale a las ocho y veinte.')
D = dict(id='sab', fecha='2026-12-05', titulo='Sábado 5', lema='Sofía a fondo y cena con música', intro=[
 O2.DIA['intro'][0],
 'La mañana empieza a las once con el Free Sofia Tour en español, que sale del Palacio de Justicia y termina, dos horas después, junto a la catedral de Alejandro Nevski. Allí mismo bajaréis a su cripta de iconos, y a las dos, comida en Izbata Tavern, una taberna de cocina búlgara de las de antes a ocho minutos andando. La Rotonda, Serdica y el resto del centro ya los habréis visto con el guía. Desayunad bien: hasta las dos no hay comida.',
 'A las tres y cuarto, taxi a casa: dos horas y media para descansar antes de la noche. A las seis salís hacia el mercado navideño alemán del Jardín de la Ciudad, ya con las luces encendidas, y a las siete y media, la cena-espectáculo del viaje en Hadjidraganovite Kashti, con música folclórica en directo. Para rematar, copas en la calle Tsar Shishman y, para quien quiera bailar, Bar Petak.'],
 pasos=[
 g(O2, 'Salida de casa', texto=['Salid con veinte minutos de margen. Hasta las dos no hay comida: si no habéis desayunado fuerte, comprad una banitsa por el camino.']),
 g(O2, 'De casa al Palacio de Justicia'),
 tour,
 T('pie', 'El recorrido del free tour', salida='11:00', tour=True, minutos=120, paradasTour=PTOUR, texto=[
  'El guía os lleva a pie desde el Palacio de Justicia hasta la catedral de Alejandro Nevski, con diecinueve paradas por el centro monumental. Primero hacia el norte: Santa Nedelya, la estatua de Santa Sofía, la pequeña iglesia de Santa Petka, medio enterrada, y las ruinas romanas de Serdica. Después la mezquita de Banya Bashi, la sinagoga y los Baños Minerales, con sus fuentes de agua caliente.',
  'Luego el tour vuelve al Largo, el conjunto de edificios comunistas que forman el Consejo de Ministros, la antigua Casa del Partido y la Presidencia, con la Rotonda escondida en su patio. Y termina hacia el este por el Jardín de la Ciudad, el Teatro Nacional, el antiguo Palacio Real, la iglesia rusa y Santa Sofía, hasta Nevski.',
  'Son unas dos horas sin prisa y en terreno llano. No hace falta seguir el mapa: el guía puede cambiar el orden. Las paradas están marcadas en naranja.']),
 nev,
 T('pie', 'De la catedral a Izbata Tavern', ['Ocho minutos hacia el sudoeste. Bajáis desde la plaza de Nevski dejando a la derecha la basílica de Santa Sofía y la tumba del Soldado Desconocido, cruzáis el bulevar Tsar Osvoboditel y seguís por calles tranquilas de edificios de principios del siglo veinte.',
  'La taberna está en la calle Slavyanska, número 18, en el sótano del edificio.']),
 izb,
 T('taxi', 'De Izbata a casa en taxi', ['Unos diez minutos de taxi hacia el oeste, cruzando el centro por el bulevar Vitosha y la plaza Macedonia hasta vuestro barrio. Pedid en el restaurante que os llamen dos taxis. Toca recargar pilas: la noche es larga.'], salida='15:15', alternativa='Andando: unos 25 min'),
 P('casa', '15:30', 'Descanso en casa', ['Dos horas y media para descansar, ducharse y cambiarse. A las seis, salida hacia el mercado navideño.'], narrar=False, descanso=True),
 T('pie', 'De casa al mercado navideño alemán', salida='18:00', texto=['Unos veinte minutos hacia el este, ya de noche. Cruzáis la plaza Macedonia y el bulevar Vitosha a la altura del Palacio de Justicia, y seguís hasta el Jardín de la Ciudad, el parque más antiguo de Sofía, trazado en la década de 1870 frente al Teatro Nacional.',
  'Lo reconoceréis por el edificio blanco y rojo del teatro iluminado y, en estas fechas, por las casetas de madera y el olor a vino caliente.'], alternativa='Taxi: unos 7 min'),
 mer,
 T('taxi', 'Del mercado navideño a Hadjidraganovite Kashti', ['Siete minutos de taxi hacia el norte. Pasáis junto a la Presidencia y el Largo, bajáis por el bulevar Maria Luiza con el Mercado Central y la mezquita iluminada, y cruzáis el puente de los Leones, con sus cuatro leones de bronce sobre el río Vladayska. El restaurante está a un paso, en la calle Kozloduy.'],
  alternativa='Andando: unos 22 min'),
 kas, tks, shi,
 g(O2, 'De Tsar Shishman a Bar Petak', opcional=True),
 pet,
 g(O2, 'De vuelta a casa', alternativa='Taxi: unos 5 min, 3-5 € · Si no vais a Petak: taxi desde Tsar Shishman'),
 g(O2, 'De vuelta en casa', texto=['Poned el despertador: mañana a las 8:20 salen los taxis hacia la estación de autobuses.']),
])
guardar('d2_sab', D)

# ============ DOMINGO ============
avt = g(O3, 'Estación Central de Autobuses', hora='08:35', reserva='09:00')
avt['texto'] = ['La Tsentralna Avtogara concentra casi todos los autobuses de largo recorrido de Sofía. El vuestro es de la compañía Karat-S, a las nueve en punto, con los billetes ya comprados para los siete: de ida a las nueve y de vuelta desde Plovdiv a las cuatro y diez.',
 'Comprobad el número de andén en las pantallas y subid con tiempo: con siete personas conviene ir juntos a la cola. Si no habéis desayunado, en el vestíbulo hay cafés y puestos de banitsa para llevar.']
yug = g(O3, 'Llegada a Plovdiv: estación Yug')
rep(yug, 'Desde aquí hasta el casco antiguo hay unos veinticinco minutos andando', 'Desde aquí hasta el casco antiguo hay unos veinticinco minutos andando, así que mejor coged un taxi en la parada de la estación')
rep(yug, 'es aquí donde volveréis a las cinco menos cuarto para coger el autobús de vuelta.', 'el autobús de vuelta sale a las cuatro y diez; comprobad en el billete si sale de aquí mismo.')
his = g(O3, 'El casco antiguo y la puerta Hisar Kapiya', hora='11:35')
rep(his, 'Pero sobre todo, perdeos un rato por las calles', 'Tenéis algo menos de una hora: sobre todo, perdeos un rato por las calles')
tea = g(O3, 'El Teatro Romano', hora='13:00')
rep(tea, 'Si no queréis pagar la entrada,', 'Ojo: cierra para comer de doce y media a una, así que llegad a la una en punto. Si no queréis pagar la entrada,')
kap = g(O3, 'Comida en Kapana: día de pescado', hora='13:30', comida='comida',
        avisoEtq='Tiempo justo', aviso='Tiempo justo: el autobús de vuelta sale a las 16:10. Si a las 13:45 no estáis sentados en Pavaj, id a Smokini, Skapto o Green Library.',
        calle='Banitsa o döner para llevar en la calle peatonal Knyaz Aleksandar I, si vais muy justos.')
kap['texto'] = [kap['texto'][0],
 'Pavaj, en la calle Zlatarska, es el nombre que repiten todas las reseñas: cocina búlgara con un toque moderno, producto fresco del día y pan casero. Hoy es Nikulden y no aceptan reservas, así que id directos y preguntad por el pescado del día o por la carpa.',
 'Vais con el tiempo justo: el autobús de vuelta sale a las cuatro y diez. Si a la una y cuarenta y cinco no estáis sentados, tenéis alternativas a dos pasos: Smokini, en la calle Otets Paisiy, para comer con mesa; Skapto, de hamburguesas, rápido y con sitio para grupos; o Green Library, la de la fachada verde, con bocadillos y platos sanos para comer en media hora.']
bas = g(O3, 'La Gran Basílica del Obispo', hora='14:55')
bas['texto'] = bas['texto'][:2] + ['En invierno abre de nueve a seis. Calculad unos cuarenta minutos y salid hacia las cuatro menos veinticinco: el taxi a la estación tarda cinco minutos y el autobús no espera.']
tbas = T('taxi', 'De la basílica a la estación', ['Cinco minutos de taxi hacia el sur por el centro moderno de Plovdiv, de vuelta a la estación por la que llegasteis. Hay taxis en la plaza central, junto a la basílica; con siete personas, pedid dos.'], alternativa='Andando: unos 20 min')
vuelta = g(O3, 'Estación Yug: autobús de vuelta', hora='15:55', reserva='16:10', titulo='Estación: autobús de vuelta')
vuelta['texto'] = ['Último vistazo a Plovdiv. El autobús de vuelta de Karat-S sale a las cuatro y diez y llega a Sofía hacia las seis y media. Comprobad en el billete el andén o la parada exacta.',
 'Durante el viaje anochece pronto: en diciembre el sol se pone hacia las cinco. Buen momento para descansar y para que cada uno cuente lo que más le ha gustado del día.']
sen = g(O3, 'Noche tranquila: Sense Rooftop Bar', hora='21:30', titulo='Cena de tapas en Sense Rooftop Bar', reserva='21:30', comida='tapas', precio='20-35 € por persona')
sen['texto'] = [sen['texto'][0],
 'Es un sitio elegante, con código de vestimenta smart casual por la noche: nada de ropa deportiva. Hoy cenáis aquí, de tapas, con mesa reservada para siete a las nueve y media: picad varios platos al centro y acompañad con un vino búlgaro o un cóctel de la casa, sin prisas.']
D = dict(id='dom', fecha='2026-12-06', titulo='Domingo 6', lema='Plovdiv en día de pescado', intro=[
 O3.DIA['intro'][0], O3.DIA['intro'][1],
 'El plan: taxi a la estación y autobús de las nueve, llegada a las once y veinte, taxi hasta lo alto del casco antiguo, el mirador de Nebet Tepe para quien quiera subir, y el Teatro Romano, comida en el barrio de Kapana y la Gran Basílica del Obispo antes del autobús de vuelta de las cuatro y diez. A las seis y media estaréis en Sofía, con tiempo para pasar por casa, y a las nueve y media, cena de tapas en la azotea del Sense con la catedral iluminada. Llevad calzado con buena suela: el empedrado del casco antiguo resbala si hay humedad.'],
 pasos=[
 g(O3, 'Salida hacia la estación', hora='08:20', titulo='Salida en taxi hacia la estación', texto=['Pedid dos taxis para las 8:20: en siete minutos estáis en la estación.']),
 T('taxi', 'De casa a la Estación Central de Autobuses', salida='08:20', texto=['Siete minutos de taxi hacia el norte, por el bulevar Maria Luiza todavía tranquilo a esta hora de domingo. La estación de autobuses es el edificio moderno junto a la Estación Central de ferrocarril.'], alternativa='Metro: Opalchenska → Estación Central, 2 paradas'),
 avt,
 g(O3, 'Autobús de Sofía a Plovdiv'),
 yug,
 T('taxi', 'De la estación Yug al casco antiguo', ['Unos cinco minutos de taxi hacia el norte, cruzando el centro moderno, de avenidas anchas y edificios de los siglos diecinueve y veinte. Pedid que os deje en la puerta Hisar Kapiya; si no puede subir por el empedrado, os dejará al pie de la colina, junto a la plaza Dzhumaya.',
  'Al empezar a subir, el asfalto se convierte en empedrado de cantos rodados y aparecen las primeras casas del Renacimiento búlgaro, de colores, con sus pisos altos volados sobre la calle.'], alternativa='Andando: unos 25 min'),
 his,
 g(O3, 'De Hisar Kapiya a Nebet Tepe', opcional=True),
 g(O3, 'El mirador de Nebet Tepe', titulo='Opcional: el mirador de Nebet Tepe', opcional=True, avisoEtq='Cuesta', aviso='Subida corta pero empinada, por empedrado que resbala. Quien prefiera no subir puede esperar en un café de Hisar Kapiya y reunirse con el grupo de bajada al Teatro Romano.'),
 g(O3, 'De Nebet Tepe al Teatro Romano'),
 tea,
 g(O3, 'Del Teatro Romano al barrio de Kapana'),
 kap,
 g(O3, 'De Kapana a la Gran Basílica del Obispo'),
 bas, tbas, vuelta,
 g(O3, 'Autobús de Plovdiv a Sofía', alternativa='2 h 20 min · llegada hacia las 18:30'),
 g(O3, 'De vuelta en Sofía', hora='18:30', texto=['Llegada a la Estación Central de Autobuses. Taxi a casa: siete minutos.']),
 T('taxi', 'De la estación a casa', ['Siete minutos de taxi hacia el sur, de vuelta a vuestro barrio.']),
 P('casa', '18:50', 'Descanso en casa', ['Dos horas para descansar y cambiarse: en el Sense piden ropa smart casual. A las 21:20, taxi.'], narrar=False, descanso=True),
 T('taxi', 'De casa al Sense Hotel', ['Unos diez minutos en taxi atravesando el centro de oeste a este: la plaza Macedonia, el Palacio de Justicia, Santa Nedelya y el Largo, hasta el bulevar Tsar Osvoboditel. El Sense Hotel está frente al Museo Arqueológico, a un paso de la iglesia rusa; el bar está en la novena planta.']),
 sen,
 T('taxi', 'Del Sense Hotel a casa', ['Cinco minutos de taxi de vuelta hacia el oeste, cruzando la plaza del Largo con sus edificios iluminados. Mañana se puede dormir un poco más: la salida es a las diez menos veinte.'], alternativa='Andando: unos 28 min'),
 g(O3, 'De vuelta en casa', hora='23:45', texto=['Mañana, taxis a Boyana a las 9:40.']),
])
guardar('d3_dom', D)

# ============ LUNES ============
ilu = P('ilusiones', '10:00', 'Museo de las Ilusiones', [
 'Una hora y media para jugar. El Museo de las Ilusiones abrió en diciembre de 2019 en el bulevar Maria Luiza, a dos pasos de la mezquita de Banya Bashi, y forma parte de una cadena internacional nacida en Zagreb en 2015. Son unos cuatrocientos metros cuadrados con más de sesenta montajes que juegan con la óptica, la perspectiva y la física.',
 'Hay un túnel giratorio que hace perder el equilibrio aunque el suelo esté quieto, una habitación cabeza abajo, salas donde unos parecen gigantes y otros enanos, y una sala a oscuras donde se dibuja con luz y la sombra se queda pegada a la pared. El personal explica el truco de cada montaje y ayuda a sacar la foto buena: con siete personas, las fotos de grupo dan mucho juego.',
 'Abre todos los días de diez a ocho y a primera hora está más tranquilo. La entrada ronda los diecisiete euros por persona y se puede comprar online. A las once y media, dos taxis hacia el Puente de las Águilas.'],
 precio='Unos 17 € por persona', explora='ilusiones', avisoEtq='Llegar pronto', aviso='Llegad a las diez, a la apertura: a partir de las once se llena.')
agu = P('aguilas', '11:40', 'El Puente de las Águilas', [
 'Cuatro águilas de bronce, cada una sobre su columna, vigilan este puente sobre el río Perlovska, construido en 1891. Recuerdan el lugar donde los sofiotas salieron a recibir a los prisioneros de guerra que volvían a casa tras la liberación de 1878, y las águilas simbolizan la protección de los que regresaban.',
 'Hoy es uno de los cruces más concurridos de la ciudad y el punto de reunión habitual de manifestaciones y protestas. Al otro lado empieza Borisova Gradina, el gran parque de Sofía. Vosotros seguís a la derecha, hacia el Jardín del Príncipe.'],
 explora='aguilas', precio='Gratis')
eje = P('ejercito', '11:55', 'El Jardín del Príncipe y el monumento que ya no está', [
 'El Knyazheska Gradina, el Jardín del Príncipe, es un parque llano y abierto entre la universidad y el Puente de las Águilas. En su centro se levantó en 1954, en plena época estalinista, el Monumento al Ejército Soviético: un soldado de bronce con el fusil en alto, rodeado por una campesina con su hijo y un obrero, sobre una columna de treinta y siete metros.',
 'Después de 1989 se convirtió en el monumento más incómodo de la ciudad. En 2011 unos artistas pintaron una noche a sus soldados como superhéroes de cómic y la foto dio la vuelta al mundo. En diciembre de 2023 empezaron a desmontar las figuras más altas, entre protestas, y en 2026 se retiraron los andamios: hoy veréis el pedestal y lo que queda del conjunto. Los bancos del parque son buen sitio para descansar un rato.'],
 explora='ejercito', precio='Gratis')
sie = P('siete', '12:45', 'La iglesia de los Siete Santos', [
 'Por fuera parece una iglesia más, pero se construyó en 1528 como mezquita: la Kara Camii, la Mezquita Negra, por el color oscuro de su piedra, y se atribuye al gran arquitecto otomano Mimar Sinan. Tras la liberación quedó abandonada y llegó a usarse como prisión.',
 'Entre 1901 y 1902 los arquitectos Yordan Milanov y Petko Momchilov la convirtieron en iglesia ortodoxa, dedicada a los siete santos, los discípulos de Cirilo y Metodio que difundieron el alfabeto eslavo. Entrad en silencio, que es una iglesia en uso. Su jardín, en la animada calle Graf Ignatiev, es punto de encuentro del barrio. A la una y veinte, cinco minutos andando hasta el restaurante.'],
 explora='siete', precio='Entrada libre')
man = g(O4, 'Comida en Manastirska Magernitsa', reserva='13:30', comida='comida')
pis = g(O4, 'Tarde a elegir: la pista de hielo', titulo='Opcional: la pista de hielo del NDK', hora='17:15', opcional=True)
pis['texto'] = ['La pista de hielo del Sofia Christmas Fest abre de once de la mañana a once de la noche durante toda la feria, hasta el veintiocho de diciembre. Calculad entre cinco y ocho euros con el alquiler de patines.',
 'Un lunes a última hora de la tarde habrá algo más de gente, sobre todo estudiantes, pero sin agobios. Abrigaos bien: de noche el hielo está a cero grados. Quien no quiera patinar puede adelantarse a las casetas del Christmas Fest, a un paso, y esperar al resto con un vino caliente.',
 'Mientras tanto, fijaos en el NDK: su forma angulosa, de hormigón y cristal oscuro, es la del gran monumento a la Bulgaria socialista de los años ochenta. Sus jardines tienen fuentes y, al fondo, la montaña.']
ndk = g(O2, 'Sofia Christmas Fest frente al NDK', hora='18:15', calle='Puestos de comida y bebida caliente: buen sitio para merendar algo, sin quitar el hambre para la cena.')
ndk['texto'] = ndk['texto'][:2] + ['Paseaos por las casetas con un vino caliente o un chocolate, con todas las luces encendidas. A las siete, el bulevar Vitosha, que arranca justo aquí.']
vit = g(O4, 'Paseo por el bulevar Vitosha', hora='19:00')
rep(vit, 'Tomaos un café antes de ir a cenar.', 'A las ocho menos cuarto, dos taxis hacia Pod Lipite.')
pod = g(O4, 'Cena de despedida en Pod Lipite', reserva='20:00', comida='cena')
rep(pod, 'Mesa reservada para siete en el +359 886 801 227.', 'Mesa reservada para siete a las ocho.')
D = dict(id='lun', fecha='2026-12-07', titulo='Lunes 7', lema='Ilusiones, águilas y Navidad', intro=[
 'Último día completo en Sofía, y hoy toca un día sin cuestas ni madrugones: una mañana de juego y paseo tranquilo por el centro, una comida de las de recordar y una tarde de luces de Navidad antes de la cena de despedida.',
 'Hoy se puede dormir un poco más. A las diez menos cuarto, dos taxis al Museo de las Ilusiones, una hora y media de juego y fotos de grupo. Después, un paseo corto y llano por el este del centro: el Puente de las Águilas, el Jardín del Príncipe, donde estaba el monumento al Ejército Soviético, y la iglesia de los Siete Santos, que fue mezquita. A la una y media, comida reservada en Manastirska Magernitsa, a cinco minutos.',
 'Después de comer, a casa a descansar hora y media. A las cinco, ya de noche y vestidos para la cena, la tarde es de Navidad: la pista de hielo frente al NDK, para quien quiera patinar, las casetas del Sofia Christmas Fest y el bulevar Vitosha iluminado. Y a las ocho, cena de despedida en Pod Lipite, un clásico abierto desde 1926, con productos de su propia granja.'],
 pasos=[
 P('casa', '09:45', 'Salida hacia el Museo de las Ilusiones', ['Pedid dos taxis para las 9:45.'], narrar=False),
 T('taxi', 'De casa al Museo de las Ilusiones', ['Unos diez minutos de taxi hacia el noreste. Cruzáis el centro hasta el bulevar Maria Luiza, el de la mezquita de Banya Bashi y el Mercado Central. El museo está en el número 16, a un paso de la mezquita.'], alternativa='Andando: unos 25 min · metro hasta Serdika'),
 ilu,
 T('taxi', 'Del museo al Puente de las Águilas', ['Unos diez minutos de taxi hacia el sudeste, pasando por el Largo y el bulevar Tsar Osvoboditel, el de los adoquines amarillos, con el Parlamento y la universidad. Pedid que os dejen en el puente, Orlov Most.'], salida='11:30', alternativa='Andando: unos 30 min'),
 agu,
 T('pie', 'Del puente al Jardín del Príncipe', ['Cinco minutos en llano hacia el oeste, por el borde del parque, hasta el gran pedestal del antiguo monumento.']),
 eje,
 T('pie', 'Del Jardín del Príncipe a los Siete Santos', ['Unos diez minutos en llano hacia el oeste, por calles de edificios de entreguerras, hasta la calle Graf Ignatiev. La iglesia está en medio de un pequeño jardín.'], salida='12:35'),
 sie,
 T('pie', 'De los Siete Santos a Manastirska Magernitsa', ['Cinco minutos en llano hacia el oeste, por calles tranquilas, hasta la calle Han Asparuh. El restaurante está en el número 67.'], salida='13:20'),
 man,
 T('taxi', 'Del restaurante a casa', ['Unos diez minutos de taxi hacia el noroeste, de vuelta a vuestro barrio para descansar después de la comida. Al restaurante pedidle que os llame a dos taxis.'], salida='15:15', alternativa='Andando: unos 30 min'),
 P('casa', '15:30', 'Descanso en casa', ['Hora y media para descansar después de la comida. Salid a las 17:00 ya vestidos para la cena: hoy no volvéis a casa hasta la noche.'], narrar=False, descanso=True),
 T('taxi', 'De casa a la pista de hielo del NDK', ['Unos diez minutos de taxi hacia el sur, hasta la gran explanada del Palacio Nacional de Cultura. A esta hora ya es de noche y las luces de la feria se ven desde lejos.'], salida='17:00', alternativa='Andando: unos 25 min'),
 pis,
 T('pie', 'De la pista al Christmas Fest', ['Dos minutos: las casetas del Christmas Fest rodean la pista, en la misma explanada frente al Palacio Nacional de Cultura.']),
 ndk,
 g(O4, 'De la pista al bulevar Vitosha', titulo='Del Christmas Fest al bulevar Vitosha'),
 vit,
 T('taxi', 'Del bulevar Vitosha a Pod Lipite', O4.DIA['pasos'][11]['texto'], salida='19:45', alternativa='Andando: unos 35 min'),
 pod,
 g(O4, 'De Pod Lipite a casa'),
 g(O4, 'De vuelta en casa', texto=['Maletas hechas esta noche: mañana la salida del apartamento es a las 11:00.']),
])
guardar('d4_lun', D)

# ============ MARTES ============
ban = g(O5, 'Desayuno: banitsa y boza', comida='desayuno')
D = dict(id='mar', fecha='2026-12-08', titulo='Martes 8', lema='Banitsa, baños y vuelta a casa', intro=[
 O5.DIA['intro'][0],
 'Empezamos como empiezan los búlgaros: con un desayuno de banitsa recién hecha y boza en Sofiyska Banitsa, un mostrador de toda la vida de la calle Graf Ignatiev. Después, los Baños Minerales Centrales, el edificio más bonito de Sofía, que hoy guarda el Museo de Historia de la ciudad, con la mezquita de Banya Bashi y las fuentes de agua termal enfrente. Y para terminar, compras de verdad en el Zhenski Pazar, el mercado popular de la ciudad, a diez minutos de casa.',
 'Hacia las dos y media, recogéis las maletas y salís directos al aeropuerto en dos taxis: unos veinte minutos y trece o catorce euros por coche. Si preferís el metro, la línea M4 sale de Opalchenska, a cinco minutos de casa. Ryanair factura en la Terminal 2. Y si os ha sobrado algo de efectivo, en el aeropuerto hay buenas tiendas de productos búlgaros.'],
 pasos=[
 g(O5, 'Último día: maletas listas'),
 g(O5, 'De casa a Sofiyska Banitsa'),
 ban,
 T('pie', 'De la banitsa a los Baños Minerales', ['Unos diez minutos hacia el norte. Subís por el bulevar Vitosha hasta la iglesia de Santa Nedelya y seguís por el bulevar Maria Luiza, con la estatua de Santa Sofía en su columna y, al fondo, la cúpula y el minarete de la mezquita de Banya Bashi.',
  'El edificio de los Baños es inconfundible: piedra clara, cerámica de colores y cúpulas, justo detrás de la mezquita, en la plaza Banski.']),
 P('banos', '10:15', 'Baños Minerales y Museo de Historia de Sofía', [
  'Sofía nació alrededor de estas aguas. Bajo la plaza brotan manantiales termales, a más de cuarenta grados, que ya aprovecharon tracios y romanos; por eso los otomanos levantaron aquí sus baños, y por eso la mezquita de enfrente se llama Banya Bashi, «muchos baños». Es de 1566 y se atribuye al taller del gran arquitecto Mimar Sinan.',
  'Los Baños Minerales Centrales se inauguraron en 1913: un edificio de estilo Secesión vienesa con cúpulas, mosaicos y cerámica de colores inspirados en las iglesias bizantinas y el arte búlgaro. Funcionaron como baños públicos hasta 1986, y desde 2015 guardan el Museo Regional de Historia de Sofía, que cuenta la ciudad desde la prehistoria hasta el siglo veinte: no os perdáis la sala de la familia real ni los carruajes.',
  'El sábado los visteis por fuera con el guía del free tour; hoy toca entrar. El museo abre de martes a domingo, de diez a seis, y la entrada cuesta unos pocos euros. Si el sábado no os dio tiempo, al salir probad el agua de las fuentes de la plaza, junto a la mezquita: sabe un poco a hierro y sale templada incluso en diciembre.'],
  precio='Unos 3-5 €', explora='banos'),
 T('pie', 'De los Baños al Zhenski Pazar', ['Unos diez minutos hacia el noroeste. Dejáis atrás el Mercado Central y la sinagoga y bajáis por calles de comercios pequeños, cada vez más populares, hasta el bulevar Stefan Stambolov, donde empiezan los puestos del mercado.']),
 P('zhenski', '12:00', 'Compras y comida en el Zhenski Pazar', [
  'El Zhenski Pazar, «el mercado de las Mujeres», es el mercado al aire libre más antiguo y grande de Sofía. Funciona desde finales del siglo diecinueve, y el nombre viene de que eran las mujeres de los pueblos de alrededor quienes bajaban a vender sus productos. Hoy es una larga calle de puestos, con gente del barrio, regateo y un ambiente muy distinto al del centro.',
  'Es el mejor sitio para llevarse comestibles a buen precio: miel de montaña, especias, hierbas para infusión, lukanka, el embutido curado típico, queso sirene y kashkaval, lyutenitsa, la salsa de pimiento y tomate asados, y frutos secos. También hay puestos de ropa, menaje y recuerdos baratos.',
  'Llevad efectivo y cuidado con las carteras, como en cualquier mercado concurrido. Hacia la una y media, comed algo en los puestos y cafés de alrededor: hay comida rápida, casera y barata. A las dos y cuarto, de vuelta a casa a por las maletas.'],
  calle='Comida rápida y barata en los puestos y cafés del mercado antes de ir al aeropuerto.', comida='comida', explora='zhenski'),
 T('pie', 'Del Zhenski Pazar a casa', ['Unos quince minutos hacia el sur, por calles residenciales hasta vuestro barrio, a recoger las maletas.']),
 g(O5, 'Recoger las maletas', hora='14:30', texto=[
  'De vuelta en Sredna Gora para recoger el equipaje que dejasteis guardado por la mañana. Repasad que no queda nada en el apartamento y salid directos hacia el aeropuerto.',
  'Pedid dos taxis para las tres menos diez: en veinte minutos estáis en la terminal.']),
 T('taxi', 'Taxi de casa al aeropuerto', salida='14:50', texto=['Unos veinte minutos de taxi hacia el este, cruzando por última vez el centro: el Largo, el bulevar Tsar Osvoboditel con el Parlamento y la catedral a un lado, y el bulevar Tsarigradsko Shose, la vieja carretera de Constantinopla, con la montaña Vitosha alejándose detrás. Última imagen de Sofía.'],
  alternativa='Metro M4 desde Opalchenska: unos 30 min, 0,80 €'),
 g(O5, 'Terminal 2 y vuelo de vuelta', hora='15:15', texto=[
  'Llegáis a la Terminal 2 unas dos horas antes del vuelo, que es lo recomendable para los controles de seguridad. Ryanair factura aquí; si por algún motivo os tocara la Terminal 1, hay un autobús lanzadera gratuito entre las dos.'] + O5.DIA['pasos'][10]['texto'][1:]),
])
guardar('d5_mar', D)
print('ok')
