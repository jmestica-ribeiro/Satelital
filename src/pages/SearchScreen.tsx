import { useState, useMemo, useEffect, useCallback } from "react";
import {
  CONDUCTORES, filtrarViajes, fmtDate, fmtTime, fmtDuration, fmtKm,
  dateOnly, type Viaje,
} from "../data/appData";
import { fetchConductores, fetchViajesPorConductor } from "../data/supabaseData";
import { Avatar, Button, Tag, Icons, DateRangePicker } from "../components/ui";
import { TripDetailDialog } from "./TripDetailDialog";

interface Props {
  onAddToast: (type: "success" | "error" | "info", title: string, desc?: string) => void;
  onGoTo: (screen: string) => void;
}

export function SearchScreen({ onAddToast, onGoTo }: Props) {
  // Modo: "real" si hay datos en Supabase, "mock" si está vacía
  const [modo, setModo] = useState<"real" | "mock" | "loading">("loading");

  // Lista de conductores reales (de Supabase) o mock
  const [conductoresReales, setConductoresReales] = useState<string[]>([]);

  // Conductor seleccionado (nombre string — válido tanto para real como mock)
  const [conductorNombre, setConductorNombre] = useState<string | null>(null);
  const [conductorQuery, setConductorQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [range, setRange] = useState(() => {
    const f = new Date(); f.setDate(f.getDate() - 29);
    return { from: f, to: new Date() };
  });
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [openTrip, setOpenTrip] = useState<Viaje | null>(null);
  const [recientes, setRecientes] = useState<string[]>([]);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loadingViajes, setLoadingViajes] = useState(false);

  // Al montar: detectar si hay datos reales
  useEffect(() => {
    fetchConductores().then(lista => {
      if (lista.length > 0) {
        setConductoresReales(lista);
        setModo("real");
        setRecientes(lista.slice(0, 3));
      } else {
        setModo("mock");
        setRecientes(["Roberto Gómez", "Sofía Castro", "Carlos Méndez"]);
      }
    });
  }, []);

  // Lista de nombres para el autocomplete
  const listaNombres: string[] = modo === "real"
    ? conductoresReales
    : CONDUCTORES.map(c => c.nombre);

  const sugerencias = conductorQuery.length >= 2
    ? listaNombres.filter(n => n.toLowerCase().includes(conductorQuery.toLowerCase())).slice(0, 8)
    : [];

  const handleSelectNombre = useCallback((nombre: string) => {
    setConductorNombre(nombre);
    setConductorQuery(nombre);
    setShowSuggestions(false);
    setRecientes(prev => [nombre, ...prev.filter(n => n !== nombre)].slice(0, 5));
  }, []);

  // Cargar viajes al cambiar conductor o rango
  useEffect(() => {
    if (!conductorNombre) { setViajes([]); return; }
    setLoadingViajes(true);

    if (modo === "real") {
      fetchViajesPorConductor(conductorNombre, range.from, range.to).then(data => {
        setViajes(data);
        setLoadingViajes(false);
      });
    } else {
      // Fallback mock
      const c = CONDUCTORES.find(x => x.nombre === conductorNombre);
      if (c) {
        const data = filtrarViajes({ conductorId: c.id, dateFrom: range.from, dateTo: range.to })
          .sort((a, b) => b.inicio.getTime() - a.inicio.getTime());
        setViajes(data);
      }
      setLoadingViajes(false);
    }
  }, [conductorNombre, range.from, range.to, modo]);

  const dias = useMemo(() => {
    const map = new Map<string, { fecha: Date; viajes: Viaje[]; minutos: number; km: number }>();
    for (const v of viajes) {
      const key = dateOnly(v.inicio).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { fecha: dateOnly(v.inicio), viajes: [], minutos: 0, km: 0 });
      const d = map.get(key)!;
      d.viajes.push(v);
      d.minutos += v.duracionMin;
      d.km += v.distancia;
    }
    return [...map.values()].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }, [viajes]);

  const totalMin = viajes.reduce((s, v) => s + v.duracionMin, 0);
  const totalKm = viajes.reduce((s, v) => s + v.distancia, 0);
  const totalDias = Math.floor((dateOnly(range.to).getTime() - dateOnly(range.from).getTime()) / 86400000) + 1;
  const maxHorasDia = Math.max(...dias.map(d => d.minutos / 60), 1);

  const shortName = (full: string) => {
    const head = full.split(" — ")[0];
    return head.length > 36 ? head.slice(0, 36) + "…" : head;
  };

  // Conductor mock para mostrar legajo/base si aplica
  const conductorMock = modo === "mock" ? CONDUCTORES.find(c => c.nombre === conductorNombre) : null;

  return (
    <div className="m-shell">
      <header className="m-topbar">
        <div className="m-brand">
          <div className="logo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L4 8v8l8 6 8-6V8l-8-6z"/><path d="M12 22V12"/><path d="M4 8l8 4 8-4"/>
            </svg>
          </div>
          <span>Satelitrack</span>
          {modo === "mock" && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "var(--warn-100)", color: "var(--warn-700)", marginLeft: 4 }}>
              DEMO
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {conductorNombre && (
            <Button variant="ghost" size="sm" onClick={() => { setConductorNombre(null); setConductorQuery(""); }}>
              Cambiar persona
            </Button>
          )}
          <Button variant="ghost" size="sm" icon={<Icons.Dashboard />} onClick={() => onGoTo("dashboard")}>
            Búsqueda rápida
          </Button>
        </div>
      </header>

      <main className="m-main">
        {/* Hero */}
        <section className="m-hero">
          <h1 className="m-title">¿De quién querés ver los viajes?</h1>
          <p className="m-sub">
            Buscá a la persona y elegí un período. Vas a ver qué días manejó y cuántas horas.
          </p>
          <div className="m-search" style={{ position: "relative" }}>
            <Icons.Search />
            <input
              className="m-search-input"
              placeholder={modo === "loading" ? "Conectando…" : "Buscar por nombre, legajo o base…"}
              value={conductorQuery}
              onChange={e => { setConductorQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              disabled={false}
            />
            {showSuggestions && sugerencias.length > 0 && (
              <div className="autocomplete-list">
                {sugerencias.map(nombre => (
                  <button key={nombre} className="autocomplete-item" onMouseDown={() => handleSelectNombre(nombre)}>
                    <Avatar name={nombre} size="sm"/>
                    <span>{nombre}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {!conductorNombre && recientes.length > 0 && (
            <div className="m-recent">
              <span className="m-recent-label">Recientes:</span>
              <div className="m-recent-chips">
                {recientes.map(nombre => (
                  <button key={nombre} className="m-chip" onClick={() => handleSelectNombre(nombre)}>
                    <Avatar name={nombre} size="sm"/>
                    <span>{nombre}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Results */}
        {conductorNombre && (
          <section className="m-results">
            {/* Person header */}
            <div className="m-person">
              <Avatar name={conductorNombre} size="lg"/>
              <div className="m-person-body">
                <div className="m-person-name">{conductorNombre}</div>
                {conductorMock ? (
                  <div className="m-person-sub">Legajo {conductorMock.legajo} · {conductorMock.base}</div>
                ) : (
                  <div className="m-person-sub">Conductor registrado</div>
                )}
              </div>
              <div className="m-person-actions">
                <DateRangePicker from={range.from} to={range.to} onChange={setRange}/>
              </div>
            </div>

            {loadingViajes ? (
              <div className="m-empty">
                <div className="m-empty-icon" style={{ animation: "spin 1s linear infinite" }}><Icons.Clock /></div>
                <div className="m-empty-title">Cargando viajes…</div>
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <div className="m-summary">
                  <div className="m-stat accent">
                    <div className="m-stat-label">Horas manejadas</div>
                    <div className="m-stat-value">{fmtDuration(totalMin)}</div>
                  </div>
                  <div className="m-stat">
                    <div className="m-stat-label">Días con viajes</div>
                    <div className="m-stat-value">{dias.length}</div>
                    <div className="m-stat-sub">de {totalDias} {totalDias === 1 ? "día" : "días"}</div>
                  </div>
                  <div className="m-stat">
                    <div className="m-stat-label">Distancia</div>
                    <div className="m-stat-value">{fmtKm(totalKm)}</div>
                  </div>
                  <div className="m-stat">
                    <div className="m-stat-label">Viajes</div>
                    <div className="m-stat-value">{viajes.length}</div>
                  </div>
                </div>

                {/* Days list */}
                {dias.length === 0 ? (
                  <div className="m-empty">
                    <div className="m-empty-icon"><Icons.Calendar /></div>
                    <div className="m-empty-title">Sin viajes en este período</div>
                    <div className="m-empty-sub">
                      {conductorNombre} no registró viajes entre {fmtDate(range.from)} y {fmtDate(range.to)}.
                    </div>
                  </div>
                ) : (
                  <div className="m-days">
                    {dias.map(d => {
                      const key = d.fecha.toISOString().slice(0, 10);
                      const isOpen = openDay === key;
                      const pct = ((d.minutos / 60) / maxHorasDia) * 100;
                      return (
                        <div key={key} className={`m-day ${isOpen ? "open" : ""}`}>
                          <button className="m-day-head" onClick={() => setOpenDay(isOpen ? null : key)} aria-expanded={isOpen}>
                            <div className="m-day-date">
                              <div className="dow">{d.fecha.toLocaleDateString("es-AR", { weekday: "long" })}</div>
                              <div className="dnum">{d.fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "long" })}</div>
                            </div>
                            <div className="m-day-bar">
                              <div className="m-day-bar-track">
                                <div className="m-day-bar-fill" style={{ width: `${pct}%` }}/>
                              </div>
                            </div>
                            <div className="m-day-stats">
                              <div className="m-day-hours">{fmtDuration(d.minutos)}</div>
                              <div className="m-day-meta">{d.viajes.length} {d.viajes.length === 1 ? "viaje" : "viajes"} · {fmtKm(d.km)}</div>
                            </div>
                            <div className="m-day-chev">
                              <Icons.ChevronDown />
                            </div>
                          </button>

                          {isOpen && (
                            <div className="m-day-trips">
                              {d.viajes.map(v => (
                                <button key={v.id} className="m-trip" onClick={() => setOpenTrip(v)}>
                                  <div className="m-trip-time">
                                    <div className="t1">{fmtTime(v.inicio)}</div>
                                    <div className="m-trip-arrow"/>
                                    <div className="t2">{fmtTime(v.fin)}</div>
                                  </div>
                                  <div className="m-trip-route">
                                    <div className="m-trip-line">
                                      <span className="dot start"/><span className="m-trip-place">{shortName(v.origen.nombre)}</span>
                                    </div>
                                    <div className="m-trip-line">
                                      <span className="dot end"/><span className="m-trip-place">{shortName(v.destino.nombre)}</span>
                                    </div>
                                  </div>
                                  <div className="m-trip-stats">
                                    <div className="m-trip-dur">{fmtDuration(v.duracionMin)}</div>
                                    <div className="m-trip-km">{fmtKm(v.distancia)} · {v.patente}</div>
                                  </div>
                                  {v.alertas.length > 0 && <Tag color="amber" dot>{v.alertas.length}</Tag>}
                                  <Icons.ChevronRight />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer */}
                {dias.length > 0 && (
                  <div className="m-footer">
                    <Button variant="secondary" icon={<Icons.FileText />} onClick={() => onAddToast("success", "PDF generado", `Reporte de ${conductorNombre}`)}>
                      Exportar PDF
                    </Button>
                    <Button variant="secondary" icon={<Icons.Download />} onClick={() => onAddToast("success", "Excel generado", `Reporte de ${conductorNombre}`)}>
                      Exportar Excel
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>

      <TripDetailDialog trip={openTrip} onClose={() => setOpenTrip(null)}/>
    </div>
  );
}
