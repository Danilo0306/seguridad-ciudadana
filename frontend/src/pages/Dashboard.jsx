// src/pages/Dashboard.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../css/dashboard.css";
import MapCalor from "./Vista_Administrador/maps/MapaDeCalor/mapCalor";
import Historial from "./Vista_Administrador/Historial";
import Gestion from "./Vista_Administrador/Gestion";

export default function Dashboard() {
  const [user, setUser] = useState({ username: "", email: "" });
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Datos dinámicos
  const [stats, setStats] = useState({
    total_incidentes: 0,
    casos_resueltos: 0,
    alertas_activas: 0,
  });
  const [personnel, setPersonnel] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sección activa
  const [activeSection, setActiveSection] = useState("/dashboard");

  const firstSidebarLinkRef = useRef(null);
  const mainRef = useRef(null);

  // Helpers
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const openMobileMenu = () => setMobileMenuOpen(true);
  const toggleMobileMenu = () => setMobileMenuOpen((v) => !v);

  const showMap = () => {
    setActiveSection("/mapCalor");
    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchStats = async () => {
    try {
      const r = await fetch("http://127.0.0.1:8000/api/dashboard/stats/");
      const data = await r.json();
      if (data.success) setStats(data.stats);
      else setError("Error al cargar estadísticas");
    } catch {
      setError("Error de conexión con las estadísticas");
    }
  };

  const fetchPersonnel = async () => {
    try {
      const r = await fetch("http://127.0.0.1:8000/api/dashboard/personnel/");
      const data = await r.json();
      if (data.success) setPersonnel(data.personal);
      else setError("Error al cargar personal");
    } catch {
      setError("Error de conexión con el personal");
    }
  };

  const fetchActivities = async () => {
    try {
      const r = await fetch("http://127.0.0.1:8000/api/dashboard/activities/");
      const data = await r.json();
      if (data.success) setActivities(data.activities);
      else setError("Error al cargar actividades");
    } catch {
      setError("Error de conexión con las actividades");
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchStats(), fetchPersonnel(), fetchActivities()]);
      } finally {
        setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Cerrar con Esc
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeMobileMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // En móvil: bloquear scroll y manejar accesibilidad al abrir/cerrar
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    // Enfocar primer link del sidebar al abrir
    if (mobileMenuOpen) {
      setTimeout(() => firstSidebarLinkRef.current?.focus(), 50);
    }
    // Accesibilidad: ocultar el main para lectores de pantalla cuando el menú está abierto
    if (mainRef.current) {
      if (mobileMenuOpen) {
        mainRef.current.setAttribute("aria-hidden", "true");
        try {
          // inert mejora el foco (cuando está disponible)
          mainRef.current.inert = true;
        } catch {}
      } else {
        mainRef.current.removeAttribute("aria-hidden");
        try {
          mainRef.current.inert = false;
        } catch {}
      }
    }
    return () => {
      document.body.style.overflow = "";
      if (mainRef.current) {
        mainRef.current.removeAttribute("aria-hidden");
        try {
          mainRef.current.inert = false;
        } catch {}
      }
    };
  }, [mobileMenuOpen]);

  // Si pasa a desktop, cierra el menú móvil (evita estado colgado al rotar)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const toggleDarkMode = () => setDarkMode((v) => !v);
  const toggleSidebar = () => setSidebarCollapsed((v) => !v);

  return (
    <div
      className={`dashboard-container ${darkMode ? "dark-mode" : ""} ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      {/* SIDEBAR */}
      <aside
        id="app-sidebar"
        className={`sidebar ${sidebarCollapsed ? "collapsed" : ""} ${
          mobileMenuOpen ? "open" : ""
        }`}
        aria-label="Menú lateral"
      >
        <div className="sidebar-header">
          <h2
            onClick={toggleSidebar}
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <img
              src="/src/img/logo_1.png"
              alt="Logo"
              className="sidebar-logo"
              style={{ display: sidebarCollapsed ? "none" : "inline-block" }}
            />
            {sidebarCollapsed ? "🛡️" : "SEGURIDAD"}
          </h2>
        </div>

        <nav className="sidebar-nav" role="navigation">
          <ul className="nav-list">
            <li className="nav-item active">
              <Link
                to="/dashboard"
                className="nav-link"
                ref={firstSidebarLinkRef}
                onClick={() => {
                  setActiveSection("/dashboard");
                  closeMobileMenu();
                }}
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">Dashboard</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/alertas" className="nav-link" onClick={closeMobileMenu}>
                <span className="nav-icon">🚨</span>
                <span className="nav-text">Alertas</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/personal" className="nav-link" onClick={closeMobileMenu}>
                <span className="nav-icon">👥</span>
                <span className="nav-text">Personal</span>
              </Link>
            </li>

            <li className="nav-item">
              <button className="nav-link" onClick={showMap} type="button">
                <span className="nav-icon">📍</span>
                <span className="nav-text">Mapa de alertas</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                className="nav-link"
                type="button"
                onClick={() => {
                  setActiveSection("/historial");
                  closeMobileMenu();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">Historial</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                className="nav-link"
                type="button"
                onClick={() => {
                  setActiveSection("/gestion");
                  closeMobileMenu();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <span className="nav-icon">📝</span>
                <span className="nav-text">Gestion</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={logout} className="logout-btn">
            {sidebarCollapsed ? "✕" : (
              <>
                <span>🚪</span>
                <span>Cerrar sesión</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Backdrop móvil (tocar fuera para cerrar) */}
      {mobileMenuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Cerrar menú"
          onClick={closeMobileMenu}
        />
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-content" ref={mainRef}>
        {/* HEADER */}
        <div className="header">
          <div className="header-left">
            {/* Hamburguesa móvil */}
            <button
              className="mobile-hamburger"
              type="button"
              aria-label="Abrir menú"
              aria-controls="app-sidebar"
              aria-expanded={mobileMenuOpen}
              onClick={toggleMobileMenu}
            >
              ☰
            </button>

            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar incidencias..."
                className="search-input"
              />
            </div>
          </div>

          <div className="header-right">
            <div className="user-section">
              <div className="user-info">
                <p className="user-greeting">Hola,</p>
                <p className="user-name">{user.username || "Admin"}</p>
              </div>

              <div className="user-avatar">
                <img
                  src="/public/img/Usuario/default-avatar.png"
                  alt="Avatar Usuario"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextSibling.style.display = "flex";
                  }}
                />
                <div className="avatar-icon" style={{ display: "none" }}>
                  👤
                  <div className="status-indicator"></div>
                </div>
              </div>

              <button
                className="theme-toggle-btn"
                onClick={toggleDarkMode}
                title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>

              <button className="profile-btn">Perfil</button>
            </div>
          </div>
        </div>

        {/* Banner de error (oculto en vista de mapa, historial o gestion) */}
        {activeSection !== "/mapCalor" && activeSection !== "/historial" && activeSection !== "/gestion" && error && (
          <div className="error-banner">
            ⚠️ {error}
            <button onClick={() => window.location.reload()}>Reintentar</button>
          </div>
        )}

        {/* Estadísticas (ocultas en vista de mapa, historial o gestion) */}
        {activeSection !== "/mapCalor" && activeSection !== "/historial" && activeSection !== "/gestion" && (
          <div className="stats-section">
            {loading ? (
              <div className="loading">
                <div className="loading-spinner">🔄</div>
                Cargando estadísticas...
              </div>
            ) : (
              <>
                <div className="stat-card incidentes">
                  <h3>Total Incidentes</h3>
                  <div className="stat-number">
                    {stats.total_incidentes.toLocaleString()}
                  </div>
                  <div className="stat-subtitle">📈 Registrados en el sistema</div>
                </div>
                <div className="stat-card resueltos">
                  <h3>Casos Resueltos</h3>
                  <div className="stat-number">
                    {stats.casos_resueltos.toLocaleString()}
                  </div>
                  <div className="stat-subtitle">✅ Atendidos exitosamente</div>
                </div>
                <div className="stat-card alertas">
                  <h3>Alertas Activas</h3>
                  <div className="stat-number">{stats.alertas_activas}</div>
                  <div className="stat-subtitle">🚨 Requieren atención</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* MAPA */}
        {activeSection === "/mapCalor" && (
          <div className="dashboard-section full-width">
            <div className="section-header">
              <h3>
                <span className="section-icon">📍</span>
                Mapa de Calor
              </h3>
            </div>

            <div style={{ width: "100%", height: "80vh" }}>
              <MapCalor key={activeSection} />
            </div>
          </div>
        )}

        {/* HISTORIAL / REPORTES */}
        {activeSection === "/historial" && (
          <div className="dashboard-section full-width">
            <div className="section-header">
              <h3>
                <span className="section-icon">📋</span>
                Reportes / Historial
              </h3>
            </div>

            <div style={{ width: "100%" }}>
              <Historial />
            </div>
          </div>
        )}

        {/* GESTIÓN DE INCIDENTES */}
        {activeSection === "/gestion" && (
          <div className="dashboard-section full-width">
            <div className="section-header">
              <h3>
                <span className="section-icon">📝</span>
                Gestión de Incidentes
              </h3>
            </div>

            <div style={{ width: "100%" }}>
              <Gestion />
            </div>
          </div>
        )}

        {/* GRID (oculto en vista de mapa, historial o gestion) */}
        {activeSection !== "/mapCalor" && activeSection !== "/historial" && activeSection !== "/gestion" && (
          <div className="dashboard-grid">
            {/* Personal */}
            <div className="dashboard-section">
              <div className="section-header">
                <h3>
                  <span className="section-icon">👥</span>
                  Personal de Emergencia Activo
                </h3>
                <div className="personnel-summary">
                  <span className="total-count">{personnel.length} activos</span>
                </div>
              </div>

              {loading ? (
                <div className="loading">
                  <div className="loading-spinner">🔄</div>
                  Cargando personal...
                </div>
              ) : personnel.length === 0 ? (
                <div className="empty-personnel">
                  <div className="empty-icon">👥</div>
                  <p>No hay personal activo disponible</p>
                </div>
              ) : (
                <div className="personnel-container">
                  {personnel.slice(0, 4).map((person) => (
                    <div key={person.id} className="personnel-card-modern">
                      <div className="card-header">
                        <div
                          className={`personnel-avatar-modern ${person.tipo.toLowerCase()}`}
                        >
                          <img
                            src={`/src/img/inicio/${
                              person.tipo === "Policía"
                                ? "policia.png"
                                : person.tipo === "Bombero"
                                ? "policia.png"
                                : person.tipo === "Médico"
                                ? "policia.png"
                                : person.tipo === "Serenazgo"
                                ? "policia.png"
                                : "policia.png"
                            }`}
                            alt={`${person.tipo} ${person.nombre}`}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextSibling.style.display = "flex";
                            }}
                          />
                          <div className="avatar-bg" style={{ display: "none" }}>
                            {person.tipo === "Policía"
                              ? "👮‍♂️"
                              : person.tipo === "Bombero"
                              ? "🚒"
                              : person.tipo === "Médico"
                              ? "👨‍⚕️"
                              : person.tipo === "Serenazgo"
                              ? "🚔"
                              : "👤"}
                          </div>
                          <div
                            className={`status-dot ${person.estado
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          ></div>
                        </div>
                        <div className="card-actions">
                          <button className="action-btn call-btn" title="Llamar">
                            📞
                          </button>
                          <button className="action-btn message-btn" title="Mensaje">
                            💬
                          </button>
                        </div>
                      </div>

                      <div className="personnel-details">
                        <div className="personnel-name-modern">{person.nombre}</div>
                        <div className="personnel-role-modern">
                          <span className="role-badge">
                            {person.tipo === "Policía" && (
                              <span className="role-icon">🚔</span>
                            )}
                            {person.tipo === "Bombero" && (
                              <span className="role-icon">🚒</span>
                            )}
                            {person.tipo === "Médico" && (
                              <span className="role-icon">🏥</span>
                            )}
                            {person.tipo === "Serenazgo" && (
                              <span className="role-icon">🛡️</span>
                            )}
                            {person.tipo}
                          </span>
                        </div>
                      </div>

                      <div className="personnel-footer">
                        <div
                          className={`status-badge-modern ${person.estado
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          <span className="status-indicator"></span>
                          {person.estado}
                        </div>
                        <div className="last-update">Actualizado hace 2 min</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="section-footer">
                <button className="view-all-btn">
                  Ver todo el personal <span className="btn-arrow">→</span>
                </button>
              </div>
            </div>

            {/* Actividades */}
            <div className="dashboard-section">
              <h3>Actividades Recientes</h3>
              {loading ? (
                <div className="loading">
                  <div className="loading-spinner">🔄</div>
                  Cargando actividades...
                </div>
              ) : (
                <div className="inbox-container">
                  {activities.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className={`inbox-message ${activity.unread ? "unread" : ""}`}
                    >
                      <div className="activity-avatar">
                        <img
                          src="/src/img/inicio/ciudadano.png"
                          alt={activity.sender}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextSibling.style.display = "inline";
                          }}
                        />
                        <span style={{ display: "none" }}>{activity.avatar}</span>
                      </div>
                      <div className="message-content">
                        <div className="message-sender">{activity.sender}</div>
                        <div className="message-body">{activity.message}</div>
                      </div>
                      <div className="message-meta">
                        <div className="message-time">{activity.timestamp}</div>
                        {activity.unread && <div className="notification-bell">🔔</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
