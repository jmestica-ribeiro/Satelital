import { supabase } from "../lib/supabase";
import type { Viaje, EventoGPS, Alerta, Lugar, TipoEvento } from "./appData";

// Conductor válido = tiene nombre real, no es ID de dispositivo
function esConductorValido(nombre: string | null): boolean {
  if (!nombre) return false;
  if (nombre.startsWith("NID-")) return false;
  if (/^[0-9A-F]{10,}$/i.test(nombre.trim())) return false; // hex puro = ID dispositivo
  return true;
}

// ── Row shape from registros_vehiculos ──
export interface RegistroVehiculo {
  id: number;
  vehiculo: string;
  conductor: string;
  llave: string;
  tipo: string;
  dia: string;
  fecha: string;          // DATE → "2026-05-01"
  hora: string;           // TIME → "07:24:05"
  duracion: string | null; // INTERVAL → "00:01:24" or null
  velocidad_maxima: number | null;
  metros: number | null;
  km: number | null;
  zona: string | null;
  sitio: string | null;
  latitud: number | null;
  longitud: number | null;
  proveedor: string | null;
}

// Convierte un registro a EventoGPS interno
function rowToEvento(r: RegistroVehiculo, id: number): EventoGPS {
  const fechaHora = new Date(`${r.fecha}T${r.hora}`);
  const duracionMin = parseDuracion(r.duracion);
  return {
    id,
    vehiculo: r.vehiculo ?? "",
    conductorNombre: r.conductor ?? "",
    llave: r.llave ?? "",
    tipo: r.tipo as TipoEvento,
    dia: r.dia ?? "",
    fecha: fechaHora,
    duracionMin,
    velMax: r.velocidad_maxima ?? 0,
    metrica: r.metros ?? 0,
    km: r.km ?? 0,
    zona: r.zona ?? "",
    sitio: r.sitio ?? "N/A",
    lat: r.latitud ?? 0,
    lng: r.longitud ?? 0,
  };
}

// "00:01:24" → minutos
function parseDuracion(d: string | null): number {
  if (!d) return 0;
  const parts = d.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

const fechaKey = (d: Date) => d.toISOString().slice(0, 10); // "2026-05-01"

// Agrupa eventos de un conductor en viajes (IDE Alta → IDE Baja, siempre mismo día)
function agruparEnViajes(eventos: EventoGPS[], _conductorNombre: string): Viaje[] {
  const viajes: Viaje[] = [];
  let viajeId = 1;

  // Ordenar por fecha+hora asc
  const sorted = [...eventos].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  let i = 0;
  while (i < sorted.length) {
    const ev = sorted[i];

    if (ev.tipo !== "IDE Alta") { i++; continue; }

    const inicio = ev;
    const diaInicio = fechaKey(inicio.fecha);
    let fin: EventoGPS | null = null;
    let j = i + 1;
    const intermedios: EventoGPS[] = [];

    while (j < sorted.length) {
      const next = sorted[j];
      // Nunca cruzar al día siguiente
      if (fechaKey(next.fecha) !== diaInicio) break;
      if (next.vehiculo !== inicio.vehiculo) { j++; continue; }
      if (next.tipo === "IDE Baja") { fin = next; j++; break; }
      if (next.tipo === "IDE Alta") break; // nuevo viaje sin cierre
      intermedios.push(next);
      j++;
    }

    if (!fin) { i = j; continue; } // IDE Alta sin IDE Baja ese mismo día → saltar

    const paradas = intermedios.filter(e => e.tipo === "PARADA").length;
    const velMax = Math.max(0, fin.velMax, ...intermedios.map(e => e.velMax));
    // Km total = suma de los eventos ACTIVIDAD del viaje (cada uno porta su tramo)
    const kmActividad = intermedios.filter(e => e.tipo === "ACTIVIDAD").reduce((s, e) => s + e.km, 0);
    const distancia = kmActividad > 0 ? +kmActividad.toFixed(3) : fin.km;
    const duracionMin = Math.max(1, Math.round((fin.fecha.getTime() - inicio.fecha.getTime()) / 60000));

    const alertas: Alerta[] = [];
    if (velMax > 110) alertas.push({ tipo: "exceso", desc: `Velocidad máxima ${velMax} km/h` });
    if (paradas >= 2) alertas.push({ tipo: "parada", desc: `${paradas} paradas no programadas` });
    if (intermedios.some(e => e.tipo === "Exceso Vel.")) alertas.push({ tipo: "exceso", desc: `Exceso de velocidad registrado` });

    const origenLugar: Lugar = {
      nombre: inicio.sitio !== "N/A" && inicio.sitio ? inicio.sitio : (inicio.zona || "Origen"),
      lat: inicio.lat, lng: inicio.lng, tipo: "gps",
    };
    const destinoLugar: Lugar = {
      nombre: fin.sitio !== "N/A" && fin.sitio ? fin.sitio : (fin.zona || "Destino"),
      lat: fin.lat, lng: fin.lng, tipo: "gps",
    };

    const velProm = duracionMin > 0 ? Math.round((distancia / (duracionMin / 60)) || 0) : 0;

    viajes.push({
      id: viajeId++,
      conductorId: 0,               // no hay ID numérico en la tabla — se usa nombre
      patente: inicio.vehiculo,
      origen: origenLugar,
      destino: destinoLugar,
      inicio: inicio.fecha,
      fin: fin.fecha,
      duracionMin,
      distancia,
      velPromedio: velProm,
      velMax,
      paradas,
      alertas,
      eventos: [inicio, ...intermedios, fin],
    });

    i = j;
  }

  return viajes.sort((a, b) => b.inicio.getTime() - a.inicio.getTime());
}

// ── Queries públicas ──

export async function fetchConductores(): Promise<string[]> {
  // Traer en páginas para superar el límite de 1000 de Supabase
  const pageSize = 1000;
  let offset = 0;
  const todos = new Set<string>();

  while (true) {
    const { data, error } = await supabase
      .from("registros_vehiculos")
      .select("conductor")
      .neq("conductor", null)
      .range(offset, offset + pageSize - 1);

    if (error || !data || data.length === 0) break;
    data.forEach(r => { if (r.conductor) todos.add(r.conductor as string); });
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  const validos = [...todos].filter(esConductorValido).sort();
  console.log("[supabase] conductores válidos →", validos);
  return validos;
}

export async function fetchViajesPorConductor(
  conductor: string,
  dateFrom: Date,
  dateTo: Date,
): Promise<Viaje[]> {
  const desde = dateFrom.toISOString().slice(0, 10);
  const hasta = dateTo.toISOString().slice(0, 10);

  // 1. Buscar qué vehículos manejó este conductor en el período
  const { data: vehiculosData } = await supabase
    .from("registros_vehiculos")
    .select("vehiculo")
    .eq("conductor", conductor)
    .gte("fecha", desde)
    .lte("fecha", hasta);

  if (!vehiculosData || vehiculosData.length === 0) return [];
  const vehiculos = [...new Set(vehiculosData.map(r => r.vehiculo as string))];

  // 2. Traer TODOS los eventos de esos vehículos en el período
  // (incluye filas donde conductor = NID-* que son IDE Alta/Baja del dispositivo)
  const { data, error } = await supabase
    .from("registros_vehiculos")
    .select("*")
    .in("vehiculo", vehiculos)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (error || !data || data.length === 0) return [];

  // 3. Filtrar: solo eventos de este conductor O eventos IDE de cualquier conductor del mismo vehículo
  const rows = (data as RegistroVehiculo[]).filter(r =>
    r.conductor === conductor ||
    r.tipo === "IDE Alta" ||
    r.tipo === "IDE Baja"
  );

  const eventos = rows.map((r, i) => rowToEvento(r, i));
  return agruparEnViajes(eventos, conductor);
}

export async function fetchEventosRecientes(limit = 200): Promise<EventoGPS[]> {
  const { data, error } = await supabase
    .from("registros_vehiculos")
    .select("*")
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as RegistroVehiculo[]).map((r, i) => rowToEvento(r, i));
}

export async function fetchStatsRecientes(dias = 7): Promise<{
  totalViajes: number;
  totalHoras: number;
  totalKm: number;
  conductoresActivos: number;
  alertas: number;
  porDia: { fecha: Date; label: string; viajes: number; horas: number }[];
  topConductores: { nombre: string; minutos: number; km: number; viajes: number }[];
  rango: { from: Date; to: Date };
} | null> {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (dias - 1));
  from.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("registros_vehiculos")
    .select("*")
    .gte("fecha", from.toISOString().slice(0, 10))
    .lte("fecha", to.toISOString().slice(0, 10))
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (error || !data || data.length === 0) return null;

  const eventos = (data as RegistroVehiculo[]).map((r, i) => rowToEvento(r, i));

  // Agrupar por conductor para obtener viajes
  const porConductor: Record<string, EventoGPS[]> = {};
  for (const ev of eventos) {
    if (!porConductor[ev.conductorNombre]) porConductor[ev.conductorNombre] = [];
    porConductor[ev.conductorNombre].push(ev);
  }

  let totalViajes = 0;
  let totalMin = 0;
  let totalKm = 0;
  let totalAlertas = 0;
  const conductoresActivos = new Set<string>();
  const statsConductor: Record<string, { nombre: string; minutos: number; km: number; viajes: number }> = {};
  const statsDia: Record<string, { fecha: Date; viajes: number; minutos: number }> = {};

  for (const [nombre, evs] of Object.entries(porConductor)) {
    const viajes = agruparEnViajes(evs, nombre);
    if (viajes.length === 0) continue;
    conductoresActivos.add(nombre);
    if (!statsConductor[nombre]) statsConductor[nombre] = { nombre, minutos: 0, km: 0, viajes: 0 };
    for (const v of viajes) {
      totalViajes++;
      totalMin += v.duracionMin;
      totalKm += v.distancia;
      totalAlertas += v.alertas.length;
      statsConductor[nombre].minutos += v.duracionMin;
      statsConductor[nombre].km += v.distancia;
      statsConductor[nombre].viajes++;
      const key = v.inicio.toISOString().slice(0, 10);
      if (!statsDia[key]) statsDia[key] = { fecha: new Date(key + "T00:00:00"), viajes: 0, minutos: 0 };
      statsDia[key].viajes++;
      statsDia[key].minutos += v.duracionMin;
    }
  }

  const DIAS_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const porDia = Array.from({ length: dias }, (_, i) => {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const stat = statsDia[key];
    return {
      fecha: d,
      label: DIAS_ES[d.getDay()],
      viajes: stat?.viajes ?? 0,
      horas: stat ? +(stat.minutos / 60).toFixed(1) : 0,
    };
  });

  const topConductores = Object.values(statsConductor)
    .sort((a, b) => b.minutos - a.minutos)
    .slice(0, 6);

  return {
    totalViajes,
    totalHoras: +(totalMin / 60).toFixed(1),
    totalKm: +totalKm.toFixed(0),
    conductoresActivos: conductoresActivos.size,
    alertas: totalAlertas,
    porDia,
    topConductores,
    rango: { from, to },
  };
}
