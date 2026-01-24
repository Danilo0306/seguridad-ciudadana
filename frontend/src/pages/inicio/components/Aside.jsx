import { useState } from 'react';
import '../../../css/inicio/styleAside.css';

export default function Aside() {
  const [reportes, setReportes] = useState([
    { id: 1, tipo: 'Robo', ubicacion: 'Av. Principal', tiempo: '5 min', activo: true },
    { id: 2, tipo: 'Aglomeración', ubicacion: 'Plaza Central', tiempo: '12 min', activo: true }
  ]);

  const [leyenda, setLeyenda] = useState([
    { tipo: 'Incidente Activo', color: '#ef4444', icono: '🔴' },
    { tipo: 'Alerta', color: '#f59e0b', icono: '🟠' },
    { tipo: 'Patrulla', color: '#3b82f6', icono: '🔵' },
    { tipo: 'Zona Segura', color: '#10b981', icono: '🟢' }
  ]);

  return (
    <div className="aside-container">
      {/* Encabezado */}
      <div className="map-header">
        <h2>Mapa de Seguridad - Centro</h2>
        <div className="live-badge">🟢 En Vivo</div>
      </div>

      {/* Mapa */}
      <div className="aside-map">
        {/* Puntos de alerta palpitantes */}
        <div className="map-point incidente-activo" style={{ left: "25%", top: "40%" }}>
          <div className="pulse-effect"></div>
          <div className="point-icon">🔴</div>
        </div>
        <div className="map-point alerta" style={{ left: "60%", top: "30%" }}>
          <div className="pulse-effect"></div>
          <div className="point-icon">🟠</div>
        </div>
        <div className="map-point patrulla" style={{ left: "45%", top: "65%" }}>
          <div className="pulse-effect"></div>
          <div className="point-icon">🔵</div>
        </div>
        <div className="map-point zona-segura" style={{ left: "75%", top: "55%" }}>
          <div className="pulse-effect"></div>
          <div className="point-icon">🟢</div>
        </div>

        {/* Calles */}
        <div className="street horizontal" style={{ top: "30%", width: "80%", left: "10%" }}></div>
        <div className="street horizontal" style={{ top: "60%", width: "70%", left: "15%" }}></div>
        <div className="street vertical" style={{ left: "25%", height: "70%", top: "15%" }}></div>
        <div className="street vertical" style={{ left: "60%", height: "60%", top: "20%" }}></div>

        {/* Plaza Central */}
        <div className="plaza-central" style={{ left: "55%", top: "35%" }}>
          <span>Plaza Central</span>
        </div>

        {/* Avenida Principal */}
        <div className="avenida-principal" style={{ left: "30%", top: "65%" }}>
          <span>Av. Principal</span>
        </div>
      </div>

      {/* Leyenda */}
      <div className="leyenda-container">
        <h3>Leyenda</h3>
        <div className="leyenda-items">
          {leyenda.map((item, index) => (
            <div key={index} className="leyenda-item">
              <span className="leyenda-color" style={{ color: item.color }}>{item.icono}</span>
              <span>{item.tipo}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reportes en tiempo real */}
      <div className="reportes-container">
        <h3>Reportes Recientes</h3>
        {reportes.map(reporte => (
          <div key={reporte.id} className={`reporte-item ${reporte.activo ? 'activo' : ''}`}>
            <div className="reporte-content">
              <span className="reporte-tipo">{reporte.tipo} reportado</span>
              <span className="reporte-ubicacion">- {reporte.ubicacion}</span>
            </div>
            <div className="reporte-tiempo">{reporte.tiempo}</div>
          </div>
        ))}
      </div>
    </div>
  );
}