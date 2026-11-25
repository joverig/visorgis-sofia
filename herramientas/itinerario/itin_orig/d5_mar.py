# Martes 8 de diciembre · vuelta
DIA = dict(id='mar', fecha='2026-12-08', titulo='Martes 8', lema='Banitsa y vuelta a casa',
 intro=[
 'Último día. El vuelo de vuelta sale a las cinco y veinticinco de la tarde, así que tenéis la mañana entera para despedir Sofía sin prisas. La salida del apartamento es a las once, pero el alojamiento guarda las maletas: podéis dejarlas preparadas y recogerlas antes de ir al aeropuerto.',
 'Empezamos como empiezan los búlgaros: con un desayuno de banitsa recién hecha y boza en Sofiyska Banitsa, un mostrador de toda la vida de la calle Graf Ignatiev. Después, últimas compras en el bulevar Vitosha y un último paseo hasta el Mercado Central, donde podréis llevaros dulces, especias o miel. Hacia la una, de vuelta a casa para recoger el equipaje.',
 'A las dos y media, metro M4 desde Opalchenska hasta la Terminal 2 del aeropuerto: veinticinco minutos y 0,80 euros. Con siete personas y maletas también podéis pedir dos taxis. Ryanair factura en la Terminal 2; llegad con dos horas de margen para los controles. Y si os ha sobrado algo de efectivo, no hace falta cambiarlo: es el mismo euro de casa.'],
 pasos=[
 dict(lugar='casa', hora='09:00', titulo='Último día: maletas listas', narrar=False, texto=['Dejad las maletas preparadas antes de salir: el check-out es a las 11:00 y el alojamiento las guarda.']),
 dict(modo='pie', titulo='De casa a Sofiyska Banitsa', texto=[
  'Veinte minutos de paseo matinal hacia el este. Cruzáis la plaza Macedonia y el bulevar Vitosha a la altura del Palacio de Justicia, el punto de encuentro del sábado, y seguís hasta la calle Graf Ignatiev. A esta hora la ciudad se está despertando: tranvías llenos, gente con café para llevar y, en cada esquina, el olor a masa horneada de las panaderías.']),
 dict(lugar='banitsa', hora='09:30', titulo='Desayuno: banitsa y boza', comer='banitsa', precio='5-10 € por persona', texto=[
  'Sofiyska Banitsa es un pequeño mostrador de los de siempre, que solo hace banitsa y la borda, según las guías locales. La banitsa es el desayuno nacional búlgaro: capas finísimas de masa de hojaldre, rellenas de queso sirene, huevo y yogur, horneadas en grandes bandejas redondas y cortadas en porciones. Se come caliente, de pie o paseando.',
  'La compañera tradicional es la boza, una bebida espesa, de color marrón claro y sabor entre dulce y ácido, hecha con cereal fermentado. Es herencia otomana, y en Bulgaria se toma desde hace siglos con la banitsa del desayuno. No a todo el mundo le gusta, pero hay que probarla una vez; si no os convence, pedid ayran, yogur batido con agua y sal.',
  'Hay otra costumbre ligada a la banitsa: en Nochevieja se hornea una con papelitos escondidos dentro, con deseos para el año nuevo. A vosotros os toca un deseo sencillo: volver.']),
 dict(modo='pie', titulo='De la banitsa al bulevar Vitosha', texto=[
  'Cinco minutos hacia el sur por calles laterales hasta el tramo central del bulevar Vitosha, el de las tiendas.']),
 dict(lugar='vitosha', hora='10:00', titulo='Últimas compras en el bulevar Vitosha', explora='vitosha', texto=[
  'Por la mañana, Vitoshka tiene otro carácter: menos paseo y más vida cotidiana, terrazas con los primeros cafés y tiendas abriendo. Es el momento de las últimas compras.',
  'Algunas ideas de recuerdos con sentido: productos de rosa de Damasco del valle de las Rosas, que produce buena parte del aceite de rosa del mundo; vino de mavrud o melnik, uvas autóctonas búlgaras; una rakía de calidad; miel y hierbas de montaña para infusión, o una pieza de cerámica de Troyan, con sus característicos dibujos de gotas y ojos de pavo real.',
  'Si alguien quiere ver algo más en lugar de compras, la iglesia de Santa Nedelya, al final del bulevar, abre temprano y está de camino a la siguiente parada.']),
 dict(modo='pie', titulo='Del bulevar Vitosha al Mercado Central', texto=[
  'Unos doce minutos hacia el norte por el bulevar Vitosha hasta Santa Nedelya, y después por el bulevar Maria Luiza, pasando junto a la estatua de Santa Sofía y la mezquita de Banya Bashi. Es el mismo camino del sábado, pero ahora ya sabéis lo que estáis viendo.']),
 dict(lugar='halite', hora='11:30', titulo='Último paseo por el Mercado Central', comer='halite', explora='halite', texto=[
  'Volvéis al Halite, esta vez sin prisa por comer: es el sitio para llevarse comestibles. En los puestos hay lukanka, el embutido curado y aplastado típico de Bulgaria; queso sirene y kashkaval al vacío; lyutenitsa, la salsa de pimiento rojo y tomate asados que todas las familias hacen en otoño; especias como la sharena sol, la «sal de colores» de hierbas que se pone en la mesa, y dulces orientales.',
  'Si os da hambre, tomad algo ligero en los puestos de arriba: el vuelo es a media tarde y la comida en el avión no compite con esto.']),
 dict(modo='pie', titulo='Del mercado a casa', texto=[
  'Veinte minutos hacia el oeste, por las calles de detrás de la sinagoga, el gran edificio de cúpula que visteis el sábado, la mayor sinagoga sefardí de Europa: sus fieles hablaban judeoespañol, una lengua prima del castellano. Desde allí, en línea casi recta, volvéis a vuestro barrio a recoger las maletas.']),
 dict(lugar='casa', hora='13:30', titulo='Recoger las maletas', texto=[
  'De vuelta en Sredna Gora para recoger el equipaje que dejasteis por la mañana. Repasad que no queda nada en el apartamento, y si os ha sobrado comida, se agradece dejarla ordenada o llevárosla.',
  'Es buen momento para comer algo rápido en el barrio, en alguna panadería o en el supermercado de la esquina, antes de salir hacia el aeropuerto a las dos y media. Desde aquí hasta la estación de metro Opalchenska hay cinco minutos andando con las maletas.']),
 dict(modo='metro', titulo='Metro de Opalchenska al aeropuerto', alternativa='Taxi: unos 20 min, 13-14 € por coche', texto=[
  'Desde Opalchenska, la línea M4 va directa a la Terminal 2, sin transbordos, en unos veinticinco o treinta minutos; mirad en los carteles que el tren vaya a «Летище София», Aeropuerto de Sofía, porque la línea comparte vías con la M1 en parte del recorrido. El billete cuesta 0,80 euros y se paga con tarjeta en el torno.',
  'El tren atraviesa el centro bajo tierra y después sale a la superficie hacia el este, entre barrios de bloques y zonas industriales, con la montaña Vitosha alejándose en la ventanilla de la derecha. Última imagen de Sofía.']),
 dict(lugar='aeropuerto', hora='15:15', titulo='Terminal 2 y vuelo de vuelta', precio='Vuelo FR6409 · 17:25 → Madrid 20:10', texto=[
  'Llegáis a la Terminal 2 unas dos horas antes del vuelo, que es lo recomendable con los controles de seguridad. Ryanair factura aquí; si por algún motivo os tocara la Terminal 1, hay un autobús lanzadera gratuito entre las dos.',
  'El vuelo FR6409 sale a las cinco y veinticinco y aterriza en Madrid a las ocho y diez, hora española. Atrás quedan cuatro días, dos ciudades y dos mil años de historia.',
  'Довиждане, Sofía: «dovizhdane», hasta la vista. Gracias por recorrer la ciudad con esta guía.']),
 ])
