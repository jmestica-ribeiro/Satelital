import type { Viaje } from "../data/appData";
import { fmtTime, fmtDate, fmtDuration, fmtKm, getConductor, getVehiculo } from "../data/appData";
import { Button, Icons, Tag } from "../components/ui";

interface Props { trip: Viaje | null; onClose: () => void; }

export function TripDetailDialog({ trip, onClose }: Props) {
  if (!trip) return null;

  const conductor = getConductor(trip.conductorId);
  const vehiculo = getVehiculo(trip.patente);

  return (
    <div className="dialog-mask" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog" style={{ width: 720 }}>
        <div className="dialog-header">
          <div>
            <h2>Detalle del viaje</h2>
            <div className="meta">
              {conductor?.nombre} · {fmtDate(trip.inicio)} · {fmtTime(trip.inicio)} → {fmtTime(trip.fin)}
            </div>
          </div>
          <button className="btn btn-ghost icon-only" onClick={onClose}><Icons.X /></button>
        </div>

        <div className="dialog-body" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Map placeholder */}
          <div className="map-placeholder" style={{ height: 220 }}>
            <div className="map-grid"/>
            {/* Route line SVG */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 720 220" preserveAspectRatio="none">
              <path d="M 120 160 C 200 100, 400 130, 520 70" stroke="var(--p-500)" strokeWidth="2.5" fill="none" strokeDasharray="6 3" opacity="0.7"/>
              <circle cx="120" cy="160" r="7" fill="var(--success-500)"/>
              <circle cx="520" cy="70" r="7" fill="var(--danger-500)"/>
              {trip.paradas >= 1 && <circle cx="280" cy="125" r="5" fill="var(--warn-500)"/>}
              {trip.paradas >= 2 && <circle cx="400" cy="105" r="5" fill="var(--warn-500)"/>}
            </svg>
            <div style={{ position: "absolute", bottom: 12, left: 16, display: "flex", gap: 12, fontSize: 12, color: "var(--text-color-secondary)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success-500)", display: "inline-block" }}/>
                {trip.origen.nombre.split(" — ")[0]}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--danger-500)", display: "inline-block" }}/>
                {trip.destino.nombre.split(" — ")[0]}
              </span>
            </div>
            <div className="map-attribution">Mapa esquemático · GPS Satelitrack</div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Duración",     value: fmtDuration(trip.duracionMin) },
              { label: "Distancia",    value: fmtKm(trip.distancia) },
              { label: "Vel. promedio",value: `${trip.velPromedio} km/h` },
              { label: "Vel. máxima",  value: `${trip.velMax} km/h` },
            ].map(s => (
              <div key={s.label} style={{ padding: "12px 16px", background: "var(--surface-50)", border: "1px solid var(--border-color)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-color-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Info row */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: "var(--text-color-secondary)" }}>
              <span style={{ fontWeight: 600, color: "var(--text-color)" }}>Vehículo: </span>
              {vehiculo?.marca} {vehiculo?.modelo} · {trip.patente}
            </div>
            {trip.alertas.length > 0 && trip.alertas.map((a, i) => (
              <Tag key={i} color="amber" dot>{a.desc}</Tag>
            ))}
          </div>

          {/* Timeline de eventos GPS */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Recorrido · eventos GPS</div>
            <div className="timeline">
              {trip.eventos.map((ev, i) => {
                const isFirst = i === 0;
                const isLast = i === trip.eventos.length - 1;
                const dotClass = isFirst ? "start" : isLast ? "end" : ev.tipo === "PARADA" ? "stop" : ev.tipo === "Exceso Vel." ? "warn" : "stop";
                const tipoLabel: Record<string, string> = {
                  "IDE Alta":    "Inicio",
                  "IDE Baja":    "Llegada",
                  "PARADA":      "Parada",
                  "Exceso Vel.": "Exceso",
                  "Zona":        "Zona",
                };
                return (
                  <div key={ev.id} className="timeline-row">
                    <div className="timeline-time">
                      <div className="label">{fmtTime(ev.fecha)}</div>
                      <div>{tipoLabel[ev.tipo] ?? ev.tipo}</div>
                    </div>
                    <div className="timeline-rail"><div className={`timeline-dot ${dotClass}`}/></div>
                    <div className="timeline-content">
                      <div className="place" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {ev.sitio !== "N/A" ? ev.sitio : ev.tipo === "Exceso Vel." ? `Velocidad máxima: ${ev.velMax} km/h` : "Punto intermedio"}
                        <span className={`ev-badge ev-${ev.tipo.toLowerCase().replace(/\s|\./g, "-")}`}>{ev.tipo}</span>
                      </div>
                      <div className="detail" style={{ display: "flex", gap: 12 }}>
                        {ev.duracionMin > 0 && <span>{ev.duracionMin} min{ev.tipo === "PARADA" ? " · Motor apagado" : ""}</span>}
                        {ev.km > 0 && <span>{ev.km.toLocaleString("es-AR", { minimumFractionDigits: 1 })} km recorridos</span>}
                        <span style={{ color: "var(--text-color-tertiary)", fontSize: 11 }}>{ev.lat.toFixed(5)}, {ev.lng.toFixed(5)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          <Button variant="secondary" icon={<Icons.FileText />}>Exportar PDF</Button>
        </div>
      </div>
    </div>
  );
}

