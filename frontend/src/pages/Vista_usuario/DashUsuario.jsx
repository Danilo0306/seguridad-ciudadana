import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../../css/Vista_usuario/dashUsuario.css";
import Resumen from "./Resumen";
import Mapa from "./Mapa";
import Alertas from "./Alertas";
import Perfil from "./perfil";
import Prevencion from "./prevencion";
import MisReportes from "./Reportes";
import { FaMoon, FaSun } from "react-icons/fa";
import usuarioImg from "../../img/usuario/img.png";
import {
  FaChartBar,
  FaMapMarkedAlt,
  FaFileAlt,
  FaBell,
  FaBook,
  FaUser,
  FaDoorOpen,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const API = "http://127.0.0.1:8000/api";

export default function DashUsuario() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("resumen");
  const [darkMode, setDarkMode] = useState(false);
  const [isSlim, setIsSlim] = useState(false);
  const [isMobileMenuUsuarioOpen, setIsMobileMenuUsuarioOpen] = useState(false);
  const [usuario, setUsuario] = useState({ nombre: "Usuario" });
  const [incidentesMapa, setIncidentesMapa] = useState([]);

  // ✅ Inicializamos fotoPerfil desde localStorage para persistencia
  const [fotoPerfil, setFotoPerfil] = useState(localStorage.getItem("fotoPerfil") || usuarioImg);

  // Callback para recibir reportes desde MisReportes
  const recibirReportesParaMapa = (reportes) => {
    setIncidentesMapa(reportes);
  };

  // Cargar datos del usuario
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;

    fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status} - ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        setUsuario((prev) => ({
          ...prev,
          nombre: data?.nombre || data?.username || prev.nombre,
          foto_url: data?.foto_url || prev.foto_url,
        }));

        // ✅ Guardar foto de perfil en localStorage
        if (data?.foto_url) {
          setFotoPerfil(data.foto_url);
          localStorage.setItem("fotoPerfil", data.foto_url);
        }
      })
      .catch((err) => console.error("Error /api/me:", err.message));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    localStorage.removeItem("fotoPerfil"); // Limpiar foto al cerrar sesión
    navigate("/login");
  };

  const handleNavClick = (section) => {
    setActiveSection(section);
    setIsMobileMenuUsuarioOpen(false); // Cerrar menú en móvil
  };

  return (
    <div className={`dashboard ${darkMode ? "dark" : "light"}`}>
      {isMobileMenuUsuarioOpen && (
        <div
          className="sidebar-backdrop-usuario"
          onClick={() => setIsMobileMenuUsuarioOpen(false)}
        ></div>
      )}

      <aside
        className={`sidebar ${isSlim ? "slim" : "wide"} ${
          isMobileMenuUsuarioOpen ? "mobile-open-usuario" : ""
        }`}
      >
        <div className="user-profile" onClick={() => setIsSlim(!isSlim)}>
          <img src={fotoPerfil} alt="Usuario" className="sidebar-avatar" />
          {!isSlim && (
            <>
              <h3>{usuario.nombre}</h3>
              <p>Los Olivos</p>
            </>
          )}
        </div>

        <ul className="nav-dashusuario">
          <li onClick={() => handleNavClick("resumen")}>
            <FaChartBar size={25} /> {!isSlim && <span>Resumen</span>}
          </li>
          <li onClick={() => handleNavClick("mapa")}>
            <FaMapMarkedAlt size={25} /> {!isSlim && <span>Mapa</span>}
          </li>
          <li onClick={() => handleNavClick("reportes")}>
            <FaFileAlt size={25} /> {!isSlim && <span>Mis Reportes</span>}
          </li>
          <li onClick={() => handleNavClick("alertas")}>
            <FaBell size={25} /> {!isSlim && <span>Alertas</span>}
          </li>
          <li onClick={() => handleNavClick("prevencion")}>
            <FaBook size={25} /> {!isSlim && <span>Prevención</span>}
          </li>
          <li onClick={() => handleNavClick("perfil")}>
            <FaUser size={25} /> {!isSlim && <span>Mi Perfil</span>}
          </li>
          <li className="logout-item" onClick={handleLogout}>
            <FaDoorOpen size={25} /> {!isSlim && <span>Cerrar Sesión</span>}
          </li>
        </ul>

        <div className="mode-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <FaSun /> : <FaMoon />}
          {!isSlim && <span>{darkMode ? "Modo Claro" : "Modo Oscuro"}</span>}
        </div>
      </aside>

      <main className="main-panel">
        <header className="header">
          <button
            className="mobile-hamburger-usuario"
            onClick={() => setIsMobileMenuUsuarioOpen(!isMobileMenuUsuarioOpen)}
          >
            {isMobileMenuUsuarioOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
          <h1 className="header-title">🛡️ Seguridad Ciudadana – Los Olivos</h1>
        </header>

        {activeSection === "resumen" && <Resumen />}
        {activeSection === "mapa" && <Mapa incidentes={incidentesMapa} />}
        {activeSection === "prevencion" && <Prevencion />}
        {activeSection === "alertas" && <Alertas />}
        {activeSection === "reportes" && (
          <MisReportes darkMode={darkMode} onReportesActualizados={recibirReportesParaMapa} />
        )}
        {activeSection === "perfil" && (
          <Perfil darkMode={darkMode} setDarkMode={setDarkMode} setFotoPerfil={setFotoPerfil} />
        )}
      </main>
    </div>
  );
}
