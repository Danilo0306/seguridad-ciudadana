import React, { useState, useEffect, useRef } from 'react';
import '../../css/Vista_Administrador/Gestion.css';

const GESTION_API = "http://127.0.0.1:8000/api";

const Gestion = () => {
  const [gestionIncidentes, setGestionIncidentes] = useState([]);
  const [gestionOpenIndex, setGestionOpenIndex] = useState(null);
  const gestionWrapperRef = useRef(null);

  useEffect(() => {
    const datosEjemploGestion = [
      { id: "INC-101", fecha: "2024-02-10", usuario: "Luis Torres", ubicacion: "Av. La Marina 500", incidente: "Robo", descripcion: "Hurto de mochila en la vía pública", escala: "Alta", estado: "Pendiente" },
      { id: "INC-102", fecha: "2024-02-09", usuario: "María Pérez", ubicacion: "Jr. Las Palmeras 321", incidente: "Accidente", descripcion: "Caída de peatón", escala: "Media", estado: "En proceso" }
    ];

    const token = localStorage.getItem("access");
    if (!token) {
      setGestionIncidentes(datosEjemploGestion);
      return;
    }

    // Cambia a endpoint dedicado de Gestión
    fetch(`${GESTION_API}/gestion/incidentes/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar gestión de incidentes");
        return res.json();
      })
      .then((data) => {
        const listaAdaptada = (data || []).map((d) => ({
          id: d.idTipoIncidencia,
          fecha: d.FechaHora ? new Date(d.FechaHora).toLocaleString() : "",
          usuario: d.usuario || "-",
          ubicacion: d.Ubicacion,
          incidente: d.NombreIncidente,
          descripcion: d.Descripcion,
          escala: d.Escala || "-",
          estado: d.estado, // ← viene de EstadoIncidente
        }));
        setGestionIncidentes(listaAdaptada.length ? listaAdaptada : datosEjemploGestion);
      })
      .catch((err) => {
        console.error("Gestion fetch error:", err);
        setGestionIncidentes(datosEjemploGestion);
      });
  }, []);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (gestionWrapperRef.current && !gestionWrapperRef.current.contains(e.target)) {
        setGestionOpenIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const opcionesEstado = ['Pendiente', 'En proceso', 'Resuelto'];

  const actualizarEstadoGestion = (rowIndex, nuevoEstado) => {
    const incidente = gestionIncidentes[rowIndex];
    if (!incidente) return;

    // Optimista en UI
    setGestionIncidentes(prev => {
      const copia = [...prev];
      copia[rowIndex] = { ...copia[rowIndex], estado: nuevoEstado };
      return copia;
    });
    setGestionOpenIndex(null);

    // PATCH al backend (endpoint nuevo de Gestión)
    const token = localStorage.getItem("access");
    if (!token) return;

    fetch(`${GESTION_API}/gestion/incidentes/${incidente.id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ estado: nuevoEstado })
    })
      .then(res => {
        if (!res.ok) throw new Error('No se pudo actualizar estado');
        return res.json();
      })
      .then(() => {
        // OK: ya actualizamos optimistamente
      })
      .catch(err => {
        console.error('Error actualizando estado:', err);
        // Opcional: revertir cambio si falla
      });
  };

  const claseEstadoGestion = (estado) => {
    switch (estado) {
      case 'Resuelto':   return 'gestion-estado-resuelto';
      case 'En proceso': return 'gestion-estado-proceso';
      case 'Pendiente':  return 'gestion-estado-pendiente';
      default:           return '';
    }
  };

  return (
    <div className="gestion-container" ref={gestionWrapperRef}>
      <div className="gestion-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2>🛠️ Gestión de Incidentes</h2>
          <p>Actualiza y monitorea el estado de las incidencias</p>
        </div>
      </div>

      <div className="gestion-table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table className="gestion-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Ubicación</th>
              <th>Incidente</th>
              <th>Descripción</th>
              <th>Escala</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {gestionIncidentes.map((item, idx) => (
              <tr key={idx}>
                <td>{item.id}</td>
                <td>{item.fecha}</td>
                <td>{item.usuario}</td>
                <td>{item.ubicacion}</td>
                <td>{item.incidente}</td>
                <td>{item.descripcion}</td>
                <td>{item.escala}</td>
                <td className="gestion-estado-cell">
                  <button
                    type="button"
                    onClick={() => setGestionOpenIndex(gestionOpenIndex === idx ? null : idx)}
                    className={`gestion-estado-badge ${claseEstadoGestion(item.estado)} gestion-estado-button`}
                    aria-expanded={gestionOpenIndex === idx}
                  >
                    <span>{item.estado}</span>
                    <span className="gestion-chevron">{gestionOpenIndex === idx ? '▴' : '▾'}</span>
                  </button>

                  {gestionOpenIndex === idx && (
                    <div className="gestion-dropdown-menu" role="menu">
                      {opcionesEstado.map((est) => (
                        <div
                          key={est}
                          className={`gestion-dropdown-item ${item.estado === est ? 'selected' : ''}`}
                          onClick={() => actualizarEstadoGestion(idx, est)}
                        >
                          <span>{est}</span>
                          {item.estado === est && <span className="gestion-check">✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Gestion;
