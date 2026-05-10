import { useState } from "react";
import { PrimeReactProvider } from "primereact/api";
import { Icons, Avatar, Button, ToastContainer, useToast } from "./components/ui";
import { DashboardScreen } from "./pages/DashboardScreen";
import { SearchScreen } from "./pages/SearchScreen";

type Screen = "dashboard" | "search";

export default function App() {
  const [screen, setScreen] = useState<Screen>("search");
  const { toasts, add: addToast } = useToast();

  return (
    <PrimeReactProvider>
      {screen === "search" ? (
        // Minimal single-screen view (default/primary)
        <SearchScreen onAddToast={addToast} onGoTo={s => setScreen(s as Screen)}/>
      ) : (
        // Full dashboard with sidebar
        <div className="app-shell">
          <Sidebar screen={screen} onGoTo={setScreen}/>
          <main className="main">
            <Topbar screen={screen} onGoTo={setScreen}/>
            <DashboardScreen onGoTo={s => setScreen(s as Screen)} onAddToast={addToast}/>
          </main>
        </div>
      )}
      <ToastContainer toasts={toasts}/>
    </PrimeReactProvider>
  );
}

function Sidebar({ screen, onGoTo }: { screen: Screen; onGoTo: (s: Screen) => void }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L4 8v8l8 6 8-6V8l-8-6z"/><path d="M12 22V12"/><path d="M4 8l8 4 8-4"/>
          </svg>
        </div>
        <div>
          <div className="brand-name">Satelitrack</div>
          <div className="brand-tag">Ribeiro SRL</div>
        </div>
      </div>

      <div className="sidebar-section">Operación</div>
      <nav className="sidebar-nav">
        <button className={`nav-item ${screen === "dashboard" ? "active" : ""}`} onClick={() => onGoTo("dashboard")}>
          <Icons.Dashboard />
          Dashboard
        </button>
        <button className={`nav-item ${screen === "search" ? "active" : ""}`} onClick={() => onGoTo("search")}>
          <Icons.Search />
          Búsqueda rápida
          <span className="nav-badge" style={{ background: "var(--success-50)", color: "var(--success-700)", fontSize: 10 }}>simple</span>
        </button>
      </nav>

      <div className="sidebar-section">Reportes</div>
      <nav className="sidebar-nav">
        <button className="nav-item">
          <Icons.Reports />
          Horas de manejo
        </button>
        <button className="nav-item">
          <Icons.FileText />
          Exportar datos
        </button>
      </nav>

      <div className="sidebar-section">Administración</div>
      <nav className="sidebar-nav">
        <button className="nav-item">
          <Icons.Truck />
          Vehículos
          <span className="nav-badge">14</span>
        </button>
        <button className="nav-item">
          <Icons.Users />
          Conductores
          <span className="nav-badge">16</span>
        </button>
        <button className="nav-item">
          <Icons.Alert />
          Alertas
          <span className="nav-badge" style={{ background: "var(--danger-50, #fff1f2)", color: "var(--danger-600, #dc2626)" }}>3</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <Avatar name="Diego Ribeiro" size="sm"/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Diego Ribeiro</div>
          <div style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>Administrador</div>
        </div>
        <button className="btn btn-ghost icon-only sm"><Icons.Settings /></button>
      </div>
    </aside>
  );
}

function Topbar({ screen, onGoTo }: { screen: Screen; onGoTo: (s: Screen) => void }) {
  const titles: Record<Screen, string> = { dashboard: "Dashboard", search: "Búsqueda rápida" };
  return (
    <div className="topbar">
      <div className="page-title">{titles[screen]}</div>
      <div className="topbar-right">
        <div className="topbar-search">
          <Icons.Search />
          <input placeholder="Buscar conductor, patente…" />
        </div>
        {screen !== "search" && (
          <Button variant="primary" size="sm" icon={<Icons.Search />} onClick={() => onGoTo("search")}>
            Búsqueda rápida
          </Button>
        )}
        {screen === "search" && (
          <Button variant="ghost" size="sm" icon={<Icons.Dashboard />} onClick={() => onGoTo("dashboard")}>
            Ver dashboard
          </Button>
        )}
        <button className="btn btn-ghost icon-only sm topbar-icon-btn">
          <Icons.Alert />
          <span className="topbar-badge">3</span>
        </button>
        <Avatar name="Diego Ribeiro" size="sm" />
      </div>
    </div>
  );
}
