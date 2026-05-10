import React, { useMemo, useState } from "react";
import { getStats, getConductor, VIAJES, fmtDate, fmtTime, fmtDuration, HOY, type Viaje } from "../data/appData";
import { Avatar, Button, BarChart, KpiCard, Icons } from "../components/ui";
import { TripDetailDialog } from "./TripDetailDialog";

interface Props {
  onGoTo: (screen: string) => void;
  onAddToast: (type: "success" | "error" | "info", title: string, desc?: string) => void;
}

export function DashboardScreen({ onGoTo, onAddToast: _onAddToast }: Props) {
  const stats = useMemo(() => getStats(HOY), []);
  const ultimosViajes = useMemo(() => VIAJES.slice(0, 6), []);
  const [openTrip, setOpenTrip] = useState<Viaje | null>(null);

  const shortName = (full: string) => {
    const head = full.split(" — ")[0];
    return head.length > 32 ? head.slice(0, 32) + "…" : head;
  };

  return (
    <div className="content">
      {/* Greeting */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Buenos días, Operador 👋
          </h1>
          <div style={{ marginTop: 4, color: "var(--text-color-secondary)", fontSize: 14 }}>
            Resumen de la flota · Últimos 7 días · {fmtDate(stats.rango.from)} — {fmtDate(stats.rango.to)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" icon={<Icons.Calendar />}>Cambiar período</Button>
          <Button variant="primary" icon={<Icons.Search />} onClick={() => onGoTo("search")}>
            Buscar viajes
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KpiCard label="Horas de manejo" value={stats.totalHoras.toLocaleString("es-AR")} unit="hs"
          icon={<Icons.Clock />} color="indigo" trend={{ dir: "up", value: "+8.2%" }} sub="vs. semana anterior"/>
        <KpiCard label="Viajes registrados" value={stats.totalViajes.toLocaleString("es-AR")}
          icon={<Icons.Route />} color="emerald" trend={{ dir: "up", value: "+12" }} sub="vs. semana anterior"/>
        <KpiCard label="Distancia recorrida" value={stats.totalKm.toLocaleString("es-AR")} unit="km"
          icon={<Icons.Truck />} color="sky" trend={{ dir: "down", value: "-3.1%" }} sub="vs. semana anterior"/>
        <KpiCard label="Conductores activos" value={stats.conductoresActivos} unit={`/ 16`}
          icon={<Icons.Users />} color="amber" sub={`${stats.alertas} alertas en el período`}/>
      </div>

      {/* Charts row */}
      <div className="grid-2-1">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Actividad diaria</h3>
              <div className="subtitle">Horas de manejo por día</div>
            </div>
            <div className="btn-group">
              <button className="seg active">Horas</button>
              <button className="seg">Viajes</button>
              <button className="seg">Km</button>
            </div>
          </div>
          <div className="card-body">
            <BarChart data={stats.porDia}/>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>Top conductores</h3>
              <div className="subtitle">Por horas de manejo</div>
            </div>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {stats.topConductores.map((tc, i) => {
              const c = getConductor(tc.id);
              if (!c) return null;
              const max = stats.topConductores[0].minutos;
              const pct = (tc.minutos / max) * 100;
              return (
                <div key={tc.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 12, color: "var(--text-color-tertiary)", fontWeight: 600, width: 16 }}>{i + 1}</span>
                      <Avatar name={c.nombre} size="sm"/>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nombre}</div>
                    </div>
                    <div style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: "var(--text-color-secondary)", fontWeight: 600, flexShrink: 0 }}>
                      {fmtDuration(tc.minutos)}
                    </div>
                  </div>
                  <div className="pbar">
                    <span style={{ width: `${pct}%`, display: "block", height: "100%", borderRadius: 999, background: "linear-gradient(90deg, var(--p-500), var(--p-600))", transition: "width 0.6s ease" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent trips + fleet */}
      <div className="grid-2-1">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Viajes recientes</h3>
              <div className="subtitle">Últimos 6 viajes registrados por el GPS</div>
            </div>
            <Button variant="ghost" size="sm" iconRight={<Icons.ArrowRight />} onClick={() => onGoTo("search")}>
              Ver todos
            </Button>
          </div>
          <div className="card-body tight">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Conductor</th>
                    <th>Origen → Destino</th>
                    <th style={{ textAlign: "right" }}>Duración</th>
                    <th style={{ textAlign: "right" }}>Inicio</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosViajes.map(v => {
                    const c = getConductor(v.conductorId);
                    return (
                      <tr key={v.id} onClick={() => setOpenTrip(v)}>
                        <td>
                          <div className="driver-cell">
                            <Avatar name={c!.nombre} size="sm"/>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 500 }}>{c!.nombre}</div>
                              <div style={{ fontSize: 12, color: "var(--text-color-secondary)" }}>{v.patente}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="cell-stack">
                            <div className="primary" style={{ fontSize: 13 }}>{shortName(v.origen.nombre)}</div>
                            <div className="secondary" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Icons.ArrowRight /> {shortName(v.destino.nombre)}
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }} className="num">{fmtDuration(v.duracionMin)}</td>
                        <td style={{ textAlign: "right" }} className="num text-secondary">
                          <div style={{ fontSize: 13 }}>{fmtTime(v.inicio)}</div>
                          <div style={{ fontSize: 11 }}>{fmtDate(v.inicio)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>Estado de la flota</h3>
              <div className="subtitle">Hoy, {fmtDate(HOY)}</div>
            </div>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FleetRow label="En ruta ahora"    value={5}               color="emerald" icon={<Icons.Truck />}/>
            <FleetRow label="En base"          value={9}               color="sky"     icon={<Icons.MapPin />}/>
            <FleetRow label="Mantenimiento"    value={2}               color="amber"   icon={<Icons.Settings />}/>
            <FleetRow label="Alertas activas"  value={stats.alertas}   color="rose"    icon={<Icons.Alert />}/>
            <div style={{ paddingTop: 12, borderTop: "1px solid var(--border-color)", marginTop: 4 }}>
              <Button variant="secondary" size="sm" style={{ width: "100%" }} iconRight={<Icons.ArrowRight />}>
                Ver mapa de flota
              </Button>
            </div>
          </div>
        </div>
      </div>

      <TripDetailDialog trip={openTrip} onClose={() => setOpenTrip(null)}/>
    </div>
  );
}

function FleetRow({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: `var(--${color}-50, var(--surface-100))`, display: "flex", alignItems: "center", justifyContent: "center", color: `var(--${color}-600, var(--text-color-secondary))`, flexShrink: 0 }}>
          {icon}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      </div>
      <span style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}
