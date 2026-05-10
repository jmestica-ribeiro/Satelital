import React, { useState, useRef, useEffect } from "react";
import { getInitials, type Conductor } from "../data/appData";

// ── Icons ──────────────────────────────────────────────────────────────────
const ic = (d: string, extra?: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={extra}>{d.split("|").map((p, i) => <path key={i} d={p}/>)}</svg>
);

export const Icons = {
  Dashboard:    () => ic("M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z|M9 22V12h6v10"),
  Search:       () => ic("M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0"),
  Reports:      () => ic("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M16 13H8|M16 17H8|M10 9H8"),
  Clock:        () => ic("M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z|M12 6v6l4 2"),
  Route:        () => ic("M3 17l2-2 4 4 10-10-2-2L9 17 5 13l-2 2z"),
  Truck:        () => ic("M1 3h15v13H1z|M16 8h4l3 3v5h-7V8z|M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z|M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"),
  Users:        () => ic("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|M23 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75|M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"),
  Alert:        () => ic("M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z|M12 9v4|M12 17h.01"),
  MapPin:       () => ic("M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z|M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"),
  Settings:     () => ic("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"),
  ArrowRight:   () => ic("M5 12h14|M12 5l7 7-7 7"),
  ChevronDown:  () => ic("M6 9l6 6 6-6"),
  ChevronRight: () => ic("M9 18l6-6-6-6"),
  X:            () => ic("M18 6L6 18|M6 6l12 12"),
  Calendar:     () => ic("M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z|M16 2v4|M8 2v4|M3 10h18"),
  FileText:     () => ic("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M16 13H8|M16 17H8|M10 9H8"),
  Download:     () => ic("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M7 10l5 5 5-5|M12 15V3"),
  TrendUp:      () => ic("M23 6l-9.5 9.5-5-5L1 18|M17 6h6v6"),
  TrendDown:    () => ic("M23 18l-9.5-9.5-5 5L1 6|M17 18h6v-6"),
  LogOut:       () => ic("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5|M21 12H9"),
  Zap:          () => ic("M13 2L3 14h9l-1 8 10-12h-9l1-8z"),
};

// ── Avatar ─────────────────────────────────────────────────────────────────
interface AvatarProps { name: string; size?: "sm" | "md" | "lg" | "xl"; }
export function Avatar({ name, size = "md" }: AvatarProps) {
  return <div className={`avatar ${size}`}>{getInitials(name)}</div>;
}

// ── Button ─────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}
export function Button({ variant = "secondary", size, icon, iconRight, children, className = "", ...rest }: ButtonProps) {
  const cls = [`btn`, `btn-${variant}`, size === "sm" ? "sm" : size === "lg" ? "lg" : "", className].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {icon} {children} {iconRight}
    </button>
  );
}

// ── Tag ────────────────────────────────────────────────────────────────────
interface TagProps { color?: "indigo" | "emerald" | "amber" | "sky" | "rose" | "slate"; dot?: boolean; children: React.ReactNode; }
export function Tag({ color, dot, children }: TagProps) {
  return <span className={`tag ${color ?? ""}`}>{dot && <span className="dot"/>}{children}</span>;
}

// ── KPI Card ───────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string; value: string | number; unit?: string;
  icon: React.ReactNode; color: "indigo" | "emerald" | "sky" | "amber" | "rose";
  trend?: { dir: "up" | "down" | "flat"; value: string };
  sub?: string;
}
export function KpiCard({ label, value, unit, icon, color, trend, sub }: KpiCardProps) {
  return (
    <div className="kpi">
      <div className={`kpi-icon ${color}`}>{icon}</div>
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}{unit && <span className="unit">{unit}</span>}</div>
        {(trend || sub) && (
          <div className="kpi-meta">
            {trend && (
              <span className={`kpi-trend ${trend.dir}`}>
                {trend.dir === "up" ? <Icons.TrendUp /> : trend.dir === "down" ? <Icons.TrendDown /> : null}
                {trend.value}
              </span>
            )}
            {sub && <span>{sub}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bar Chart ──────────────────────────────────────────────────────────────
interface BarChartProps { data: { label: string; horas: number; viajes: number }[]; }
export function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.map(d => d.horas), 1);
  return (
    <div className="bar-chart" style={{ "--cols": data.length } as React.CSSProperties}>
      {data.map((d, i) => (
        <div key={i} className="bar-col">
          <div className={`bar ${d.horas === 0 ? "muted" : ""}`} style={{ height: `${Math.max((d.horas / max) * 100, 4)}%` }}/>
          <div className="bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Conductor AutoComplete ─────────────────────────────────────────────────
interface AutoCompleteProps {
  value: Conductor | null;
  onChange: (c: Conductor | null) => void;
  placeholder?: string;
  conductores: Conductor[];
}
export function ConductorAutoComplete({ value, onChange, placeholder, conductores }: AutoCompleteProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.length > 0
    ? conductores.filter(c =>
        c.nombre.toLowerCase().includes(query.toLowerCase()) ||
        c.legajo.toLowerCase().includes(query.toLowerCase()) ||
        c.base.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (c: Conductor) => { onChange(c); setQuery(""); setOpen(false); };

  return (
    <div className="autocomplete-wrap" ref={ref}>
      <div className="input-with-icon">
        <Icons.Search />
        <input
          className="input"
          value={value ? value.nombre : query}
          placeholder={placeholder ?? "Buscar…"}
          onChange={e => { setQuery(e.target.value); onChange(null); setOpen(true); setHighlight(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (!open) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setHighlight(h => Math.min(h + 1, filtered.length - 1)); }
            if (e.key === "ArrowUp")   { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
            if (e.key === "Enter" && filtered[highlight]) select(filtered[highlight]);
            if (e.key === "Escape") setOpen(false);
          }}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="autocomplete-list">
          {filtered.map((c, i) => (
            <div key={c.id} className={`autocomplete-item ${i === highlight ? "highlight" : ""}`} onMouseDown={() => select(c)}>
              <Avatar name={c.nombre} size="sm"/>
              <div>
                <div className="name">{c.nombre}</div>
                <div className="sub">{c.legajo} · {c.base}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Date Range Picker (simple) ─────────────────────────────────────────────
interface DateRangePickerProps {
  from: Date; to: Date;
  onChange: (r: { from: Date; to: Date }) => void;
}
export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const presets = [
    { label: "Hoy",           fn: () => { const d = new Date(); return { from: d, to: d }; } },
    { label: "Últimos 7 días",fn: () => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate()-6); return { from: f, to: t }; } },
    { label: "Últimos 30 días",fn: () => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate()-29); return { from: f, to: t }; } },
    { label: "Este mes",      fn: () => { const t = new Date(); const f = new Date(t.getFullYear(), t.getMonth(), 1); return { from: f, to: t }; } },
  ];

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const fmt = (d: Date) => d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <Button variant="secondary" size="sm" icon={<Icons.Calendar />} onClick={() => setOpen(o => !o)}>
        {fmt(from)} — {fmt(to)}
      </Button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "var(--surface-0)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", padding: 12, zIndex: 50, minWidth: 200 }}>
          {presets.map(p => (
            <button key={p.label} onClick={() => { onChange(p.fn()); setOpen(false); }} style={{ display: "block", width: "100%", padding: "8px 12px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", color: "var(--text-color)" }} onMouseOver={e => (e.currentTarget.style.background = "var(--surface-100)")} onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
interface Toast { id: number; type: "success" | "error" | "info"; title: string; desc?: string; }
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = (type: Toast["type"], title: string, desc?: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, title, desc }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };
  return { toasts, add };
}
export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <div className="toast-icon">
            {t.type === "success" ? <Icons.Zap /> : t.type === "error" ? <Icons.Alert /> : <Icons.Alert />}
          </div>
          <div className="toast-body">
            <div className="title">{t.title}</div>
            {t.desc && <div className="desc">{t.desc}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
