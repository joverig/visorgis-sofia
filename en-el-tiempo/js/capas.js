/*
 * Configuración del visor: línea temporal de Sofía.
 * Cada entrada es un "paso" del slider; se ordenan por `anio`.
 *
 * `descripcion` es una lista de párrafos; el que empieza por "En el mapa:" se destaca.
 *
 * Tipos de fuente:
 *   - vacia   : paso sin imagen propia (lo dibuja la capa de límites, puertas e hitos)
 *   - wayback : { type:'wayback', fecha:'AAAA-MM' } → versión del archivo de Esri World Imagery
 *               más cercana a esa fecha (se resuelve al arrancar)
 *   - xyz     : { type:'xyz', url }
 */
(function () {
  const RECINTOS = 'datos_propios/recintos_sofia.geojson?v=202611230939';
  const ATR_REC = 'Recreación aproximada de elaboración propia a partir de bibliografía divulgativa y arqueológica. Trazados orientativos, no arqueológicos.';
  const ATR_ESRI = 'Imagen: Esri, Maxar, Earthstar Geographics y GIS User Community (World Imagery Wayback)';
  const ESRI_HOY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  const recreacion = (id, anio, etiqueta, titulo, descripcion) => ({
    id, anio, etiqueta, titulo, tipo: 'recreacion', descripcion,
    fuente: { type: 'vacia' }, atribucion: ATR_REC,
  });
  const satelite = (anio, titulo, descripcion) => ({
    id: 'esri' + anio, anio, etiqueta: String(anio), titulo, tipo: 'foto', descripcion,
    fuente: { type: 'wayback', fecha: anio + '-07' }, atribucion: ATR_ESRI,
  });

  window.VISOR_CONFIG = {
    centro: [23.3219, 42.6977], // plaza Sveta Nedelya
    zoom: 15,
    minZoom: 4,
    maxZoom: 19,
    transicionSeg: 1.4,
    pausaSeg: 1.8,
    perimetros: RECINTOS,
    waybackConfig: 'https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json',

    favoritos: [
      { nombre: 'Serdica · plaza Sveta Nedelya', lonlat: [23.3215, 42.6970], zoom: 17 },
      { nombre: 'Catedral de Alejandro Nevski', lonlat: [23.3328, 42.6958], zoom: 17 },
      { nombre: 'Bulevar Vitosha y NDK', lonlat: [23.3200, 42.6890], zoom: 16 },
      { nombre: 'Estación central', lonlat: [23.3215, 42.7115], zoom: 16 },
      { nombre: 'Parque Borisova Gradina', lonlat: [23.3420, 42.6830], zoom: 15 },
      { nombre: 'Mladost y Business Park', lonlat: [23.3780, 42.6420], zoom: 14 },
      { nombre: 'Lyulin', lonlat: [23.2580, 42.7150], zoom: 14 },
      { nombre: 'Boyana y faldas del Vitosha', lonlat: [23.2700, 42.6440], zoom: 14 },
      { nombre: 'Toda la ciudad', lonlat: [23.3250, 42.6900], zoom: 11 },
    ],

    capas: [
      recreacion('antes', -6000, 'Neolítico', 'Antes de la ciudad: manantiales y aldeas', [
        'La llanura de Sofía, rodeada por el Vitosha, el Balcán y el Lyulin, está habitada desde hace unos ocho mil años. En el barrio de Slatina se excavó una aldea del Neolítico temprano, de hacia el 6000 a. C., con casas de barro y madera: es uno de los asentamientos agrícolas más antiguos de Europa.',
        'Lo que atrajo a la gente fue el agua: decenas de manantiales minerales y termales brotan en el centro de la actual ciudad, junto a los ríos Vladayska y Perlovska. Milenios después, los tracios serdos se asentaron aquí y dieron nombre al lugar: Serdica.',
        'En el mapa: los puntos marrones señalan, de forma aproximada, la aldea neolítica de Slatina y los manantiales del centro.',
      ]),
      recreacion('serdica1', 180, '180', 'Ulpia Serdica: la ciudad romana amurallada', [
        'Roma incorporó el territorio de los serdos en el siglo I. Bajo Trajano (98-117) la ciudad recibió el rango de municipio con el nombre de Ulpia Serdica, y creció como cruce de caminos entre Singidunum (Belgrado) y Constantinopla, en la gran vía militar de los Balcanes.',
        'En el año 170 los costobocos la incendiaron, y entre 176 y 180, bajo Marco Aurelio, se levantó su primera muralla, como recuerdan las inscripciones de las puertas. Dentro, un trazado en cuadrícula con el cardo y el decumano cruzándose en el foro, bajo la actual plaza Sveta Nedelya.',
        'En el mapa: el recinto romano y sus cuatro puertas. Los restos de la puerta este se ven hoy en el paso subterráneo entre la Presidencia y el Consejo de Ministros.',
      ]),
      recreacion('serdica2', 330, 's. IV', '«Serdica es mi Roma»: la ciudad de Constantino', [
        'En el siglo IV Serdica vive su apogeo. Es capital de la provincia de Dacia Mediterránea, Galerio promulga aquí en 311 el edicto que pone fin a la persecución de los cristianos, y a Constantino el Grande se atribuye la frase «Serdica es mi Roma»: llegó a pensar en ella como capital antes de elegir Bizancio.',
        'La ciudad desborda la muralla: fuera quedan un anfiteatro levantado a finales del siglo III, termas y una gran necrópolis cristiana al este. En 343 se celebra el Concilio de Serdica. Tras la destrucción por los hunos (441-447), Justiniano la reconstruye en el siglo VI con una segunda muralla exterior.',
        'En el mapa: la ciudad amurallada ampliada; la rotonda de San Jorge, el anfiteatro y la basílica de Santa Sofía, que acabará dando nombre a la ciudad.',
      ]),
      recreacion('sredets', 809, '809', 'Sredets, ciudad búlgara', [
        'En 809 el kan Krum conquista Serdica para el Primer Imperio búlgaro, y la ciudad pasa a llamarse Sredets, «la del centro». Es una plaza fuerte de frontera entre Bulgaria y Bizancio, que cambia de manos varias veces: bizantina de nuevo entre 1018 y 1185, y búlgara otra vez con el Segundo Imperio.',
        'La vida se concentra dentro de las viejas murallas romanas, reparadas una y otra vez. En las afueras, al pie del Vitosha, se pintan los frescos de la iglesia de Boyana (1259), una obra maestra del arte medieval europeo. Desde el siglo XIV empieza a usarse el nombre de Sofía, por la basílica de Santa Sofía.',
        'En el mapa: el recinto medieval, que reutiliza la muralla tardorromana.',
      ]),
      recreacion('otomana', 1500, 's. XVI', 'Sofya otomana', [
        'En 1382 los otomanos toman la ciudad. Durante casi cinco siglos Sofya es la capital del beylerbeylik de Rumelia, el gobierno de toda la Europa otomana, y una ciudad de mezquitas, baños, bazares y caravasares. Las murallas se abandonan y la ciudad crece sin cerca, con barrios turcos, búlgaros, judíos y armenios.',
        'De esa época quedan la mezquita de Banya Bashi (1576), junto a los manantiales, y la Büyük Camii, hoy Museo Arqueológico. Con la decadencia del imperio, la ciudad se empobrece: según las estimaciones, pasa de unos 70.000 habitantes a finales del siglo XVIII a menos de 20.000 hacia 1870.',
        'En el mapa: la mancha aproximada de la ciudad otomana, mucho mayor que la antigua Serdica pero ya sin murallas.',
      ]),
      recreacion('liberacion', 1878, '1878', 'Liberación y nueva capital', [
        'En enero de 1878, durante la guerra ruso-turca, las tropas rusas entran en Sofía. La ciudad que encuentran está medio vacía: tiene unos 11.600 habitantes. Aun así, en 1879 se elige como capital del nuevo Principado de Bulgaria, por su posición central en el territorio búlgaro.',
        'Empieza una transformación radical: el plan del arquitecto checo Antonín Kolář (1880) superpone una cuadrícula europea a las callejas otomanas, se derriban muchas mezquitas y se abren los grandes bulevares Tsar Osvoboditel y Dondukov.',
        'En el mapa: la ciudad de 1878, todavía con la forma de la Sofya otomana.',
      ]),
      recreacion('capital1900', 1900, '1900', 'Una capital europea en obras', [
        'En veinte años Sofía se convierte en una capital moderna. Se construyen el Parlamento (1884), el palacio del príncipe, la estación de tren (1888), la universidad, el Teatro Nacional Iván Vázov (1907) y la catedral de Alejandro Nevski (1882-1912), dedicada a los soldados rusos caídos en la liberación.',
        'La población pasa de 20.000 a casi 70.000 habitantes, y aparecen los primeros barrios fuera del centro: Poduyane al este, Konyovitsa y Banishora al oeste y norte. El parque Borisova Gradina empieza a plantarse en 1884 y el tranvía eléctrico llega en 1901.',
        'En el mapa: la ciudad desborda la antigua Sofya otomana y aparecen los primeros barrios.',
      ]),
      recreacion('entreguerras', 1934, '1934', 'Entreguerras: la ciudad se extiende', [
        'Tras las guerras balcánicas y la Primera Guerra Mundial llegan miles de refugiados, y Sofía crece hasta unos 290.000 habitantes en 1934. Surgen barrios residenciales como Lozenets, Iztok o Lagera, y el plan del urbanista alemán Adolf Muesmann (1938) intenta ordenar el crecimiento con anillos y radiales.',
        'Es una época de arquitectura ecléctica y modernista en el centro, con el Palacio de Justicia, el Banco Nacional y el Mercado Central. En 1943-1944 los bombardeos aliados destruyen buena parte de la ciudad.',
        'En el mapa: la mancha urbana de entreguerras y los barrios nuevos.',
      ]),
      recreacion('socialista', 1960, '1960', 'La Sofía socialista', [
        'Después de 1944 Bulgaria entra en la órbita soviética. Sobre las ruinas del centro se levanta el conjunto del Largo (años 50), con la antigua sede del Partido, el hotel Balkan y el TZUM, en estilo clasicista estalinista. Al excavar sus cimientos aparecen los restos de Serdica.',
        'La industrialización atrae a cientos de miles de personas del campo y se construyen los primeros grandes barrios de bloques: Hadzhi Dimitar, Krasno Selo, Zaharna Fabrika. Sofía supera los 600.000 habitantes.',
        'En el mapa: la ciudad de 1960 y los primeros barrios de bloques.',
      ]),
      recreacion('panelki', 1985, '1985', 'Los grandes barrios de bloques', [
        'Los años 70 y 80 son los del panel prefabricado: Mladost, Lyulin, Druzhba, Nadezhda y Studentski Grad levantan decenas de miles de viviendas en las afueras, con bloques de hasta dieciséis plantas. La ciudad se acerca al millón de habitantes.',
        'En 1981, para celebrar los 1.300 años del Estado búlgaro, se inaugura el Palacio Nacional de Cultura (NDK) al final del bulevar Vitosha. Se proyecta el metro, que no abrirá hasta 1998.',
        'En el mapa: la gran expansión de los barrios de bloques hacia el este y el oeste.',
      ]),
      recreacion('transicion', 2005, '2005', 'Transición y nuevo siglo', [
        'Tras 1989 cae el régimen comunista y Sofía vive una transición difícil: privatizaciones, emigración y construcción sin control. Desde finales de los 90 la ciudad se recupera: se abre la primera línea de metro (1998), la nueva terminal del aeropuerto (2006) y, en 2007, Bulgaria entra en la Unión Europea.',
        'Crecen los barrios residenciales al pie del Vitosha (Boyana, Dragalevtsi, Simeonovo) y el Business Park Sofia en Mladost atrae a empresas de servicios y tecnología.',
        'En el mapa: la ciudad hacia 2005, con el crecimiento hacia el sur y el aeropuerto.',
      ]),
      satelite(2014, 'Imagen de satélite de 2014', [
        'La primera versión archivada de la imagen de alta resolución de Esri. Sofía tiene 1,3 millones de habitantes y el metro ya tiene dos líneas; las obras de la segunda, que atraviesa el centro, han sacado a la luz una gran parte de Serdica, que en 2016 se abrirá al público como complejo arqueológico junto a la estación Serdica.',
        'En el mapa: compara el centro con el recinto romano; cambia la opacidad para ver qué queda bajo los bulevares.',
      ]),
      satelite(2018, 'Imagen de satélite de 2018', [
        'Bulgaria preside el Consejo de la UE en el primer semestre de 2018 y Sofía renueva parte del centro, como la calle Graf Ignatiev y el entorno del NDK. La ciudad crece hacia el sur y el este con nuevos bloques de viviendas y oficinas.',
        'En el mapa: las grúas de Mladost 4 y del sur, en Manastirski Livadi y Krastova Vada.',
      ]),
      satelite(2021, 'Imagen de satélite de 2021', [
        'Durante la pandemia se termina la tercera línea de metro, de oeste a este por el centro, y continúa la expansión residencial hacia el Vitosha.',
        'En el mapa: las nuevas urbanizaciones del sur, entre la circunvalación y la montaña.',
      ]),
      satelite(2024, 'Imagen de satélite de 2024', [
        'Una de las versiones más recientes del archivo de Esri. Sofía es una de las capitales que más crecen de la Unión Europea, con una fuerte economía de servicios e informática, y debate cómo frenar la construcción en las faldas del Vitosha.',
        'En el mapa: compara con 2014 para ver los nuevos barrios del sur y del este.',
      ]),
      {
        id: 'actual', anio: 2100, etiqueta: 'Hoy', titulo: 'Imagen actual', tipo: 'foto',
        descripcion: [
          'La imagen de satélite más reciente de Esri World Imagery, la misma que aparece de fondo y con el botón «Ver hoy».',
          'Usa el control de opacidad sobre cualquier época: con el recinto de Serdica se ve cómo el cardo máximo romano sigue hoy el eje de los bulevares Maria Luiza y Vitosha, y con la ciudad de 1878 se entiende cuánto cambió en un siglo.',
        ],
        fuente: { type: 'xyz', url: ESRI_HOY },
        atribucion: 'Imagen: Esri, Maxar, Earthstar Geographics y GIS User Community',
      },
    ],

    fondo: { url: ESRI_HOY, atribucion: 'Esri, Maxar, Earthstar Geographics' },
    calles: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      atribucion: 'Rótulos: Esri',
    },
  };
})();
