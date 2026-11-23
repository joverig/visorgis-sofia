/* Aterrizando · datos del viaje (sin nombres ni números de reserva) */
window.ATERRIZA = {
  casa: { nombre: 'La casa', direccion: 'ulitsa Sredna Gora 16, 1303 Sofía (barrio de Vazrazhdane)', coord: [23.31025, 42.69675],
    nota: 'Posición aproximada en el mapa (a la altura del número 16).' },
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
  // Servicios cercanos (OpenStreetMap, noviembre de 2026). Horarios orientativos: comprobadlos in situ.
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
};
