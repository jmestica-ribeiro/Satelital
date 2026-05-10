// Mock data layer — deterministic PRNG so results are reproducible

let _t = 1234567;
function rand() {
  _t |= 0; _t = (_t + 0x6d2b79f5) | 0;
  let r = Math.imul(_t ^ (_t >>> 15), 1 | _t);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
}
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function intBetween(a: number, b: number) { return Math.floor(rand() * (b - a + 1)) + a; }

export interface Conductor {
  id: number;
  nombre: string;
  legajo: string;
  telefono: string;
  email: string;
  base: string;
}

export interface Vehiculo {
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  tipo: string;
}

export interface Coordenada {
  lat: number;
  lng: number;
}

export interface Lugar {
  nombre: string;
  lat: number;
  lng: number;
  tipo: string;
}

// Tipos de evento GPS tal como vienen de la base de datos
export type TipoEvento = "IDE Alta" | "PARADA" | "IDE Baja" | "Exceso Vel." | "Zona";

export interface EventoGPS {
  id: number;
  vehiculo: string;          // patente
  conductorNombre: string;
  llave: string;             // ID interno del dispositivo
  tipo: TipoEvento;
  dia: string;               // "Viernes"
  fecha: Date;
  duracionMin: number;
  velMax: number;
  metrica: number;
  km: number;
  zona: string;              // descripción de zona GPS
  sitio: string;             // nombre del lugar
  lat: number;
  lng: number;
}

export interface Alerta {
  tipo: string;
  desc: string;
}

// Un viaje es la agrupación de eventos entre IDE Alta y IDE Baja
export interface Viaje {
  id: number;
  conductorId: number;
  patente: string;
  origen: Lugar;
  destino: Lugar;
  inicio: Date;
  fin: Date;
  duracionMin: number;
  distancia: number;
  velPromedio: number;
  velMax: number;
  paradas: number;           // cantidad de eventos PARADA entre IDE Alta e IDE Baja
  alertas: Alerta[];
  eventos: EventoGPS[];      // secuencia completa de eventos del viaje
}

export const CONDUCTORES: Conductor[] = [
  { id: 1,  nombre: "Carlos Méndez",    legajo: "L-1042", telefono: "+54 11 4521-9087", email: "cmendez@ribeiro.com.ar",    base: "CABA" },
  { id: 2,  nombre: "Lucía Fernández",  legajo: "L-1118", telefono: "+54 11 4533-2210", email: "lfernandez@ribeiro.com.ar", base: "Pilar" },
  { id: 3,  nombre: "Roberto Gómez",    legajo: "L-0987", telefono: "+54 11 4612-1198", email: "rgomez@ribeiro.com.ar",     base: "CABA" },
  { id: 4,  nombre: "María Acosta",     legajo: "L-1201", telefono: "+54 11 4798-0312", email: "macosta@ribeiro.com.ar",    base: "La Plata" },
  { id: 5,  nombre: "Diego Sosa",       legajo: "L-1305", telefono: "+54 11 4823-7711", email: "dsosa@ribeiro.com.ar",      base: "Pilar" },
  { id: 6,  nombre: "Julia Romero",     legajo: "L-1322", telefono: "+54 11 4881-4502", email: "jromero@ribeiro.com.ar",    base: "Vicente López" },
  { id: 7,  nombre: "Hernán Vargas",    legajo: "L-0855", telefono: "+54 11 4209-5588", email: "hvargas@ribeiro.com.ar",    base: "Avellaneda" },
  { id: 8,  nombre: "Sofía Castro",     legajo: "L-1410", telefono: "+54 11 4321-7700", email: "scastro@ribeiro.com.ar",    base: "CABA" },
  { id: 9,  nombre: "Marcelo Pereyra",  legajo: "L-0760", telefono: "+54 11 4502-9988", email: "mpereyra@ribeiro.com.ar",   base: "San Martín" },
  { id: 10, nombre: "Patricia Núñez",   legajo: "L-1190", telefono: "+54 11 4611-3322", email: "pnunez@ribeiro.com.ar",     base: "CABA" },
  { id: 11, nombre: "Federico Álvarez", legajo: "L-1077", telefono: "+54 11 4719-8821", email: "falvarez@ribeiro.com.ar",   base: "La Plata" },
  { id: 12, nombre: "Andrea Molina",    legajo: "L-1255", telefono: "+54 11 4833-1140", email: "amolina@ribeiro.com.ar",    base: "Pilar" },
  { id: 13, nombre: "Esteban Ríos",     legajo: "L-1389", telefono: "+54 11 4944-6711", email: "erios@ribeiro.com.ar",      base: "CABA" },
  { id: 14, nombre: "Valeria Ibarra",   legajo: "L-1456", telefono: "+54 11 4501-2233", email: "vibarra@ribeiro.com.ar",    base: "Vicente López" },
  { id: 15, nombre: "Gonzalo Páez",     legajo: "L-0921", telefono: "+54 11 4422-5566", email: "gpaez@ribeiro.com.ar",      base: "Avellaneda" },
  { id: 16, nombre: "Natalia Quiroga",  legajo: "L-1502", telefono: "+54 11 4677-8899", email: "nquiroga@ribeiro.com.ar",   base: "San Martín" },
];

export const VEHICULOS: Vehiculo[] = [
  { patente: "AE321FK", marca: "Toyota",     modelo: "Hilux SRV",    año: 2023, tipo: "Pickup" },
  { patente: "AD884NV", marca: "Volkswagen", modelo: "Amarok",       año: 2022, tipo: "Pickup" },
  { patente: "AC119PQ", marca: "Ford",       modelo: "Ranger XLT",   año: 2024, tipo: "Pickup" },
  { patente: "AB778LM", marca: "Renault",    modelo: "Kangoo",       año: 2022, tipo: "Utilitario" },
  { patente: "AF205TX", marca: "Peugeot",    modelo: "Partner",      año: 2023, tipo: "Utilitario" },
  { patente: "AE612BG", marca: "Fiat",       modelo: "Toro Volcano", año: 2023, tipo: "Pickup" },
  { patente: "AC901WJ", marca: "Chevrolet",  modelo: "S10 LTZ",      año: 2024, tipo: "Pickup" },
  { patente: "AD445RH", marca: "Ford",       modelo: "Transit",      año: 2022, tipo: "Furgón" },
  { patente: "AE733KP", marca: "Mercedes",   modelo: "Sprinter 415", año: 2023, tipo: "Furgón" },
  { patente: "AB200CV", marca: "Toyota",     modelo: "Corolla",      año: 2024, tipo: "Auto" },
  { patente: "AC557HD", marca: "Volkswagen", modelo: "Saveiro",      año: 2023, tipo: "Pickup" },
  { patente: "AF018QL", marca: "Renault",    modelo: "Master",       año: 2022, tipo: "Furgón" },
  { patente: "AD992ZY", marca: "Peugeot",    modelo: "208",          año: 2024, tipo: "Auto" },
  { patente: "AE154JM", marca: "Citroën",    modelo: "Berlingo",     año: 2023, tipo: "Utilitario" },
];

export const LUGARES: Lugar[] = [
  { nombre: "Sede Central — Av. Corrientes 1234, CABA",         lat: -34.6037, lng: -58.3816, tipo: "sede" },
  { nombre: "Depósito Pilar — Ruta 8 Km 45, Pilar",             lat: -34.4585, lng: -58.9128, tipo: "deposito" },
  { nombre: "Sucursal Vicente López — Av. del Libertador 5678", lat: -34.5311, lng: -58.4855, tipo: "sucursal" },
  { nombre: "Centro Logístico Avellaneda — Mitre 1500",         lat: -34.6610, lng: -58.3650, tipo: "logistica" },
  { nombre: "Cliente Tecpetrol — Della Paolera 297, CABA",      lat: -34.5912, lng: -58.3712, tipo: "cliente" },
  { nombre: "Cliente YPF — Macacha Güemes 515, Puerto Madero",  lat: -34.6098, lng: -58.3653, tipo: "cliente" },
  { nombre: "Polo Industrial Pilar — Ruta 8 Panamericana",      lat: -34.4622, lng: -58.9421, tipo: "industrial" },
  { nombre: "Cliente Mercado Libre — Caseros 3039, La Plata",   lat: -34.9300, lng: -57.9523, tipo: "cliente" },
  { nombre: "Centro de Distribución San Martín — Constituyentes 800", lat: -34.5680, lng: -58.5460, tipo: "logistica" },
  { nombre: "Aeropuerto Ezeiza — Terminal A",                   lat: -34.8222, lng: -58.5358, tipo: "aeropuerto" },
  { nombre: "Aeropuerto Aeroparque — Av. Costanera",            lat: -34.5592, lng: -58.4156, tipo: "aeropuerto" },
  { nombre: "Cliente Techint — Della Paolera 299, CABA",        lat: -34.5912, lng: -58.3712, tipo: "cliente" },
  { nombre: "Sucursal La Plata — Calle 7 N° 920",               lat: -34.9214, lng: -57.9544, tipo: "sucursal" },
  { nombre: "Cliente PAE — Olga Cossettini 1545, CABA",         lat: -34.6090, lng: -58.3651, tipo: "cliente" },
  { nombre: "Depósito Tigre — Av. Cazón 1450",                  lat: -34.4264, lng: -58.5797, tipo: "deposito" },
  { nombre: "Cliente Bunge — 25 de Mayo 501, CABA",             lat: -34.6065, lng: -58.3719, tipo: "cliente" },
  { nombre: "Cliente Arcor — Maipú 1210, CABA",                 lat: -34.5953, lng: -58.3779, tipo: "cliente" },
  { nombre: "Cliente Newsan — Camino Centenario, Berazategui",  lat: -34.7651, lng: -58.2180, tipo: "cliente" },
];

function haversine(a: Lugar, b: Lugar) {
  const R = 6371;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat));
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Interpola coordenadas a lo largo de la ruta para simular eventos GPS
function interpolarCoordenada(origen: Lugar, destino: Lugar, t: number): Coordenada {
  return {
    lat: origen.lat + (destino.lat - origen.lat) * t,
    lng: origen.lng + (destino.lng - origen.lng) * t,
  };
}

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const LLAVES: Record<string, string> = {};
let _llaveCounter = 0x0001FDBF0000;

function getLlave(patente: string) {
  if (!LLAVES[patente]) {
    _llaveCounter += intBetween(1000, 9999);
    LLAVES[patente] = _llaveCounter.toString(16).toUpperCase().padStart(12, "0");
  }
  return LLAVES[patente];
}

const ASIGNACIONES = CONDUCTORES.map((c, i) => ({ conductorId: c.id, patente: VEHICULOS[i % VEHICULOS.length].patente }));

function generarViajes(): Viaje[] {
  const viajes: Viaje[] = [];
  const hoy = new Date(2026, 4, 10);
  let viajeId = 10000;
  let eventoId = 90000;

  for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - dayOffset);
    const dow = fecha.getDay();
    if (dow === 0) continue;
    const isSat = dow === 6;
    const n = isSat ? intBetween(3, 6) : intBetween(8, 13);
    const conductores = [...CONDUCTORES].sort(() => rand() - 0.5).slice(0, n);

    for (const c of conductores) {
      const veh = ASIGNACIONES.find(a => a.conductorId === c.id)!;
      const numViajes = isSat ? intBetween(1, 3) : intBetween(2, 5);
      let hora = intBetween(7, 9) * 60 + intBetween(0, 30);
      let lastLugar: Lugar | null = null;
      const llave = getLlave(veh.patente);
      const diaNombre = DIAS_SEMANA[dow];
      const zona = `(UB45) Zona AMBA — ARG`;

      for (let v = 0; v < numViajes; v++) {
        const origen = lastLugar ?? pick(LUGARES);
        let destino: Lugar;
        do { destino = pick(LUGARES); } while (destino.nombre === origen.nombre);

        const dist = +(haversine(origen, destino) * (0.95 + rand() * 0.5)).toFixed(1);
        const vel = intBetween(35, 65);
        const durMin = Math.round((dist / vel) * 60) + intBetween(5, 25);
        const finMin = hora + durMin;
        if (finMin > 21 * 60) break;

        const inicio = new Date(fecha); inicio.setHours(0, 0, 0, 0); inicio.setMinutes(hora);
        const fin = new Date(fecha); fin.setHours(0, 0, 0, 0); fin.setMinutes(finMin);
        const paradas = intBetween(0, 2);
        const velMax = vel + intBetween(15, 40);

        const alertas: Alerta[] = [];
        if (velMax > 110) alertas.push({ tipo: "exceso", desc: `Velocidad máxima ${velMax} km/h` });
        if (paradas >= 2) alertas.push({ tipo: "parada", desc: `${paradas} paradas no programadas` });

        // Generar secuencia de eventos GPS del viaje
        const eventos: EventoGPS[] = [];

        // IDE Alta — encendido en origen
        eventos.push({
          id: eventoId++,
          vehiculo: veh.patente,
          conductorNombre: c.nombre,
          llave,
          tipo: "IDE Alta",
          dia: diaNombre,
          fecha: inicio,
          duracionMin: 0,
          velMax: 0,
          metrica: 0,
          km: 0,
          zona,
          sitio: origen.nombre.split(" — ")[0],
          lat: origen.lat,
          lng: origen.lng,
        });

        // Eventos PARADA intermedios
        for (let p = 0; p < paradas; p++) {
          const t = (p + 1) / (paradas + 1);
          const coord = interpolarCoordenada(origen, destino, t);
          const tParada = new Date(inicio.getTime() + (fin.getTime() - inicio.getTime()) * t);
          const minParada = intBetween(5, 18);
          eventos.push({
            id: eventoId++,
            vehiculo: veh.patente,
            conductorNombre: c.nombre,
            llave,
            tipo: "PARADA",
            dia: diaNombre,
            fecha: tParada,
            duracionMin: minParada,
            velMax: 0,
            metrica: 0,
            km: +(dist * t).toFixed(1),
            zona,
            sitio: "N/A",
            lat: coord.lat,
            lng: coord.lng,
          });
        }

        // Exceso de velocidad si corresponde
        if (velMax > 110) {
          const coord = interpolarCoordenada(origen, destino, 0.6);
          const tExceso = new Date(inicio.getTime() + (fin.getTime() - inicio.getTime()) * 0.6);
          eventos.push({
            id: eventoId++,
            vehiculo: veh.patente,
            conductorNombre: c.nombre,
            llave,
            tipo: "Exceso Vel.",
            dia: diaNombre,
            fecha: tExceso,
            duracionMin: 0,
            velMax,
            metrica: velMax,
            km: +(dist * 0.6).toFixed(1),
            zona,
            sitio: "N/A",
            lat: coord.lat,
            lng: coord.lng,
          });
        }

        // IDE Baja — apagado en destino
        eventos.push({
          id: eventoId++,
          vehiculo: veh.patente,
          conductorNombre: c.nombre,
          llave,
          tipo: "IDE Baja",
          dia: diaNombre,
          fecha: fin,
          duracionMin: durMin,
          velMax,
          metrica: 0,
          km: dist,
          zona,
          sitio: destino.nombre.split(" — ")[0],
          lat: destino.lat,
          lng: destino.lng,
        });

        viajes.push({
          id: viajeId++,
          conductorId: c.id,
          patente: veh.patente,
          origen,
          destino,
          inicio,
          fin,
          duracionMin: durMin,
          distancia: dist,
          velPromedio: vel,
          velMax,
          paradas,
          alertas,
          eventos,
        });

        hora = finMin + intBetween(15, 90);
        lastLugar = destino;
      }
    }
  }
  return viajes.sort((a, b) => b.inicio.getTime() - a.inicio.getTime());
}

export const VIAJES = generarViajes();
export const HOY = new Date(2026, 4, 10);

// Todos los eventos GPS aplanados, ordenados por fecha desc
export const EVENTOS_GPS: EventoGPS[] = VIAJES
  .flatMap(v => v.eventos)
  .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

// ── Formatters ──
export const fmtDate = (d: Date) => d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
export const fmtTime = (d: Date) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
export const fmtDateTime = (d: Date) => `${fmtDate(d)} ${fmtTime(d)}`;
export const fmtDuration = (min: number) => {
  const h = Math.floor(min / 60); const m = min % 60;
  return h === 0 ? `${m} min` : `${h}h ${m.toString().padStart(2, "0")}m`;
};
export const fmtKm = (n: number) => `${n.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;

// ── Utils ──
export const dateOnly = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const sameDay = (a: Date, b: Date) => dateOnly(a).getTime() === dateOnly(b).getTime();
export const inRange = (d: Date, from: Date, to: Date) => {
  const t = dateOnly(d).getTime();
  return t >= dateOnly(from).getTime() && t <= dateOnly(to).getTime();
};
export const getInitials = (nombre: string) => {
  const parts = nombre.split(" ");
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
};

export const getConductor = (id: number) => CONDUCTORES.find(c => c.id === id);
export const getVehiculo = (patente: string) => VEHICULOS.find(v => v.patente === patente);

export interface FiltrarViajesParams { conductorId?: number; dateFrom?: Date; dateTo?: Date; }
export const filtrarViajes = ({ conductorId, dateFrom, dateTo }: FiltrarViajesParams) =>
  VIAJES.filter(v => {
    if (conductorId && v.conductorId !== conductorId) return false;
    if (dateFrom && dateTo) return inRange(v.inicio, dateFrom, dateTo);
    return true;
  });

export interface DashStats {
  totalViajes: number; totalHoras: number; totalKm: number;
  conductoresActivos: number; alertas: number;
  porDia: { fecha: Date; label: string; viajes: number; horas: number }[];
  topConductores: { id: number; viajes: number; minutos: number; km: number }[];
  rango: { from: Date; to: Date };
}
export function getStats(refDate = HOY): DashStats {
  const from = new Date(refDate); from.setDate(refDate.getDate() - 6); from.setHours(0, 0, 0, 0);
  const to = new Date(refDate); to.setHours(23, 59, 59, 999);
  const recientes = VIAJES.filter(v => v.inicio >= from && v.inicio <= to);
  const totalMin = recientes.reduce((s, v) => s + v.duracionMin, 0);
  const totalKm = recientes.reduce((s, v) => s + v.distancia, 0);
  const conductoresActivos = new Set(recientes.map(v => v.conductorId)).size;
  const alertas = recientes.reduce((s, v) => s + v.alertas.length, 0);
  const porDia = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(refDate); d.setDate(refDate.getDate() - (6 - i));
    const items = recientes.filter(v => sameDay(v.inicio, d));
    return { fecha: d, label: d.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", ""), viajes: items.length, horas: +(items.reduce((s, v) => s + v.duracionMin, 0) / 60).toFixed(1) };
  });
  const porConductor: Record<number, { id: number; viajes: number; minutos: number; km: number }> = {};
  for (const v of recientes) {
    if (!porConductor[v.conductorId]) porConductor[v.conductorId] = { id: v.conductorId, viajes: 0, minutos: 0, km: 0 };
    porConductor[v.conductorId].viajes++;
    porConductor[v.conductorId].minutos += v.duracionMin;
    porConductor[v.conductorId].km += v.distancia;
  }
  const topConductores = Object.values(porConductor).sort((a, b) => b.minutos - a.minutos).slice(0, 6);
  return { totalViajes: recientes.length, totalHoras: +(totalMin / 60).toFixed(1), totalKm: +totalKm.toFixed(0), conductoresActivos, alertas, porDia, topConductores, rango: { from, to } };
}
