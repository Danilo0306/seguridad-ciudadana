import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../css/Vista_usuario/alertas.css";

export default function MisAlertas({ darkMode }) {
  const [alertas, setAlertas] = useState([]);
  const [filtroEscala, setFiltroEscala] = useState("");

  // --- Determina la escala automáticamente según la descripción ---
  const determinarEscala = (texto) => {
    if (!texto) return "";
    const t = texto.toLowerCase();

    const reglas = [
      { palabras: ["robo", "asalto", "hurto", "homicidio", "secuestro"], escala: "3" }, // Alto
      { palabras: ["accidente", "choque", "incendio", "explosión", "pelea", "amenaza"], escala: "2" }, // Medio
      { palabras: ["daño", "vandalismo", "pérdida menor", "ruido", "luz caída", "bache", "perdida de mascota"], escala: "1" }, // Bajo
    ];

    for (const regla of reglas) {
      if (regla.palabras.some((p) => t.includes(p))) {
        return regla.escala;
      }
    }

    return "";
  };

  // --- Colores por escala (Para CSS) ---
  const getColorPorEscala = (escala) => {
    switch (escala) {
      case "3":
        return "rojo";
      case "2":
        return "naranja";
      case "1":
        return "verde";
      default:
        return "verde";
    }
  };

  // --- Cargar alertas desde el backend ---
  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        const token = localStorage.getItem("access");
        const res = await axios.get("http://127.0.0.1:8000/api/todas_alertas/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlertas(res.data);
      } catch (error) {
        console.error("Error al obtener alertas:", error);
      }
    };

    fetchAlertas();
    const interval = setInterval(fetchAlertas, 60000); // refresca cada 60s
    return () => clearInterval(interval);
  }, []);

  // CONFIGURACIÓN DE ZONA HORARIA DE PERÚ (LIMA)
  const timeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: 'America/Lima'
  };

  // --- Mapeo y Filtrado por escala ---
  const alertasConEscala = alertas.map((a) => {
      const escalaDetectada = determinarEscala(a.descripcion || a.idAlerta?.nombre_incidente || "");
      const escalaFinal = escalaDetectada === "" ? "1" : escalaDetectada;
      
      return {
          ...a,
          escala: escalaFinal,
      }
  });


  const alertasFiltradas = filtroEscala
    ? alertasConEscala.filter((a) => {
        return String(a.escala) === filtroEscala;
      })
    : alertasConEscala;

  // NUEVA FUNCIÓN PARA PROCESAR LA CADENA DE FECHA
  const formatTimeInPeru = (dateString) => {
    if (!dateString) return "—";
    
    // Si la cadena de fecha NO termina en 'Z', la forzamos a ser interpretada
    // como UTC, lo cual casi siempre resuelve el problema de la zona horaria del servidor.
    const standardDateString = dateString.endsWith('Z') || dateString.includes('+')
        ? dateString
        : dateString.replace(' ', 'T') + 'Z'; 

    try {
        const date = new Date(standardDateString);
        return date.toLocaleString("es-PE", timeFormatOptions);
    } catch (e) {
        console.error("Error al formatear fecha:", e, dateString);
        return "Error de Fecha"; 
    }
  }

  return (
    <div className={`mis-alertas ${darkMode ? "dark" : "light"}`}>
      <h3>📢 Alertas Registradas</h3>

      {/* --- Filtro de nivel --- */}
      <div className="filtros-alerta">
        <label>Filtrar por escala:</label>
        <select
          value={filtroEscala}
          onChange={(e) => setFiltroEscala(e.target.value)}
        >
          <option value="">Todas</option>
          <option value="3">Alto</option>
          <option value="2">Medio</option>
          <option value="1">Bajo</option>
        </select>
      </div>

      {/* --- Tabla de alertas --- */}
      {alertasFiltradas.length === 0 ? (
        <p>No hay alertas disponibles</p>
      ) : (
        <div className="table-wrapper">
          <table className="tabla-alertas">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Incidente</th>
                <th>Descripción</th>
                <th>Ubicación</th>
                <th>Escala</th>
              </tr>
            </thead>
            <tbody>
              {alertasFiltradas.map((a) => {
                const color = getColorPorEscala(a.escala);
                const rawDate = a.fecha_hora || a.fecha;
                
                return (
                  <tr key={a.id} className={color}>
                    <td>
                      {/* LLAMADA A LA NUEVA FUNCIÓN PARA CORREGIR LA HORA */}
                      {formatTimeInPeru(rawDate)}
                    </td>
                    <td>{a.idAlerta?.nombre_incidente || a.nombre_incidente || "—"}</td>
                    <td>{a.descripcion || "—"}</td>
                    <td>{a.ubicacion || "—"}</td>
                    <td>
                      {a.escala === "3"
                        ? "Alto"
                        : a.escala === "2"
                        ? "Medio"
                        : "Bajo"} 
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}