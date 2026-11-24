/* Aterrizando · datos del viaje (sin nombres ni números de reserva) */
window.ATERRIZA = {
  casa: { nombre: 'La casa', direccion: 'ulitsa Sredna Gora 16, 1303 Sofía (barrio de Vazrazhdane)', coord: [23.31025, 42.69675] },
  aeropuerto: { coord: [23.41558, 42.68863] },
  vuelos: [
    { sentido: 'Ida', codigo: 'FR6410', fecha: '2026-12-04', dia: 'Viernes 4 dic', sale: '16:50', llega: '21:20', desde: 'Madrid-Barajas (MAD)', hasta: 'Sofía (SOF), Terminal 2',
      nota: 'Hora local de Sofía: una hora más que en España.' },
    { sentido: 'Vuelta', codigo: 'FR6409', fecha: '2026-12-08', dia: 'Martes 8 dic', sale: '17:25', llega: '20:10', desde: 'Sofía (SOF), Terminal 2', hasta: 'Madrid-Barajas (MAD)',
      nota: 'Salid hacia el aeropuerto a las 14:30. El alojamiento guarda las maletas después del check-out.' },
  ],
  alojamiento: [
    ['Entrada', 'De 15:00 a 00:00, autónoma con código digital (os lo envía el alojamiento)'],
    ['Salida', 'Hasta las 11:00'],
    ['Maletas', 'Se pueden dejar guardadas el último día hasta la hora de ir al aeropuerto'],
    ['Metro más cercano', 'Opalchenska (M1 y M4), a unos 5 minutos: la M4 va directa al aeropuerto'],
  ],
  // Servicios cercanos (datos de OpenStreetMap, noviembre de 2026)
  servicios: [
    { tipo: 'super', nombre: 'Lidl', horario: 'L-S 7:30-21:30 · D 8:00-21:00', coord: [23.30965, 42.69555] },
    { tipo: 'super', nombre: 'Billa', horario: 'Todos los días 8:00-22:00', coord: [23.30879, 42.69809] },
    { tipo: 'super', nombre: 'ProMarket', horario: 'Todos los días 7:00-22:00', coord: [23.31268, 42.69371] },
    { tipo: 'super', nombre: 'Dar', horario: 'Todos los días 8:00-22:00', coord: [23.31143, 42.69468] },
    { tipo: 'super', nombre: 'Non Stop My Shop (tienda 24 h)', horario: 'Abierta 24 horas', coord: [23.31607, 42.69927] },
    { tipo: 'farmacia', nombre: 'Farmacia 24 h junto al metro Opalchenska', horario: 'Abierta 24 horas', coord: [23.31001, 42.69833] },
    { tipo: 'farmacia', nombre: 'Nove Farm', horario: 'Abierta 24 horas', coord: [23.30681, 42.69917] },
    { tipo: 'farmacia', nombre: 'Betty', horario: 'L-V 8:00-20:30 · S-D 9:00-20:00', coord: [23.31026, 42.69830] },
    { tipo: 'farmacia', nombre: 'SOpharmacy', horario: 'Todos los días 10:00-21:00', coord: [23.30809, 42.69853] },
    { tipo: 'hospital', nombre: 'Hospital Pirogov (urgencias)', horario: 'Urgencias 24 horas · el gran hospital de emergencias de Bulgaria', coord: [23.30737, 42.69009] },
    { tipo: 'hospital', nombre: 'Academia Médica Militar (urgencias)', horario: 'Urgencias 24 horas', coord: [23.30373, 42.68435] },
    { tipo: 'metro', nombre: 'Metro Opalchenska (M1 · M4)', horario: 'Aprox. 5:00-24:00 · M4 directo al aeropuerto', coord: [23.31120, 42.69970] },
    { tipo: 'metro', nombre: 'Metro Serdika (M1 · M2 · M4)', horario: 'Centro histórico · enlace con la M2 (NDK, Lavov Most)', coord: [23.32035, 42.69803] },
    { tipo: 'bus', nombre: 'Parada de autobús «Metrostantsia Opalchenska»', horario: 'Autobuses urbanos', coord: [23.31004, 42.69904] },
    { tipo: 'bus', nombre: 'Tranvía · plaza Vazrazhdane', horario: 'Tranvías hacia el centro y el oeste', coord: [23.31438, 42.69740] },
    { tipo: 'bus', nombre: 'Tranvía · plaza Macedonia', horario: 'Tranvías por Aleksandar Stamboliyski', coord: [23.31434, 42.69428] },
  ],
  /* Gastos previstos por persona (euros). Taxis: precio por coche / 3,5 (dos coches para 7). [concepto, mín, máx, nota] */
  gastos: [
    { dia: 'Viernes 4', lineas: [
      ['Metro del aeropuerto a casa', 0.8, 0.8],
      ['Taxi de casa a Raketa', 1.5, 2, '5-7 € por coche'],
      ['Cena en Raketa Rakia Bar', 10, 20],
      ['Copa en Hambara', 3, 9, 'Solo efectivo'] ] },
    { dia: 'Sábado 5', lineas: [
      ['Propina del Free Sofia Tour', 5, 10],
      ['Comida en el Mercado Central', 8, 12],
      ['Cripta de Alejandro Nevski', 10, 10],
      ['Mercado navideño alemán', 3, 8],
      ['Metro del NDK a Lavov Most', 0.8, 0.8],
      ['Cena en Hadjidraganovite Kashti', 20, 30],
      ['Cóctel por Tsar Shishman', 7, 14] ] },
    { dia: 'Domingo 6 · Plovdiv', lineas: [
      ['Autobús Sofía → Plovdiv', 11, 11],
      ['Casas-museo del casco antiguo', 3.58, 3.58],
      ['Teatro Romano', 3.58, 3.58],
      ['Comida en Pavaj', 12, 18],
      ['Gran Basílica del Obispo', 7.57, 7.57],
      ['Autobús Plovdiv → Sofía', 11, 11],
      ['Taxi de la estación al Sense', 1.5, 2, '5-7 € por coche'],
      ['Copa en Sense Rooftop Bar', 10, 15] ] },
    { dia: 'Lunes 7', lineas: [
      ['Taxi a la iglesia de Boyana', 2.3, 2.9, '8-10 € por coche'],
      ['Iglesia de Boyana', 6.14, 6.14],
      ['Museo Nacional de Historia', 9, 9],
      ['Taxi del museo a Manastirska', 2.3, 2.9, '8-10 € por coche'],
      ['Comida en Manastirska Magernitsa', 15, 25],
      ['Pista de hielo con patines', 5, 8],
      ['Taxi del bulevar Vitosha a Pod Lipite', 1.2, 1.7, '4-6 € por coche'],
      ['Cena en Pod Lipite', 10, 25],
      ['Taxi de Pod Lipite a casa', 1.5, 2, '5-7 € por coche'] ] },
    { dia: 'Martes 8', lineas: [
      ['Desayuno: banitsa y boza', 5, 10],
      ['Metro de casa al aeropuerto', 0.8, 0.8] ] },
  ],
};
