import React, { useState, useEffect } from 'react';
import '../../css/Vista_Administrador/Historial.css';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API = "http://127.0.0.1:8000/api";

const Historial = () => {
  const [incidentes, setIncidentes] = useState([]);

  useEffect(() => {
    // Datos de ejemplo fallback
    const datosEjemplo = [
      { id: "INC-001", fecha: "2024-01-15", usuario: "Carlos Mendoza", ubicacion: "Av. Universitaria 123", incidente: "Robo", descripcion: "Robo de celular a transeúnte", escala: "Alta", estado: "Resuelto" },
      { id: "INC-002", fecha: "2024-01-14", usuario: "Ana Vargas", ubicacion: "Jr. Los Olivos 456", incidente: "Accidente", descripcion: "Choque menor entre vehículos", escala: "Alta", estado: "En proceso" }
    ];

    const token = localStorage.getItem("access");
    if (!token) {
      setIncidentes(datosEjemplo);
      return;
    }

    fetch(`${API}/historial/incidentes/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar historial");
        return res.json();
      })
      .then((data) => {
        // normalizar formato para la tabla
        const mapped = (data || []).map((d) => ({
          id: d.idTipoIncidencia,
          fecha: d.FechaHora ? new Date(d.FechaHora).toLocaleString() : "",
          usuario: d.usuario || "-",
          ubicacion: d.Ubicacion,
          incidente: d.NombreIncidente,
          descripcion: d.Descripcion,
          // Escala ya puede venir como etiqueta desde el serializer (escala_label)
          escala: d.Escala ?? "",
          // Estado ahora viene desde EstadoIncidente (serializer lo entrega en d.estado)
          estado: d.estado ?? "Pendiente",
        }));
        setIncidentes(mapped.length ? mapped : datosEjemplo);
      })
      .catch((err) => {
        console.error("Historial fetch error:", err);
        setIncidentes(datosEjemplo);
      });
  }, []);

  const getEstadoClass = (estado) => {
    switch(estado) {
      case 'Resuelto': return 'estado-resuelto';
      case 'En proceso': return 'estado-proceso';
      case 'Pendiente': return 'estado-pendiente';
      default: return '';
    }
  };

  // Nuevo: exportar a Excel usando ExcelJS + file-saver
  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Historial');

      sheet.columns = [
        { header: 'ID', key: 'id', width: 20 },
        { header: 'Fecha', key: 'fecha', width: 25 },
        { header: 'Usuario', key: 'usuario', width: 25 },
        { header: 'Ubicación', key: 'ubicacion', width: 30 },
        { header: 'Incidente', key: 'incidente', width: 25 },
        { header: 'Descripción', key: 'descripcion', width: 50 },
        { header: 'Escala', key: 'escala', width: 15 },
        { header: 'Estado', key: 'estado', width: 20 },
      ];

      // Agregar filas
      (incidentes || []).forEach(item => {
        sheet.addRow({
          id: item.id,
          fecha: item.fecha,
          usuario: item.usuario,
          ubicacion: item.ubicacion,
          incidente: item.incidente,
          descripcion: item.descripcion,
          escala: item.escala,
          estado: item.estado,
        });
      });

      const buf = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'historial_incidentes.xlsx');
    } catch (error) {
      console.error('Error exportando a Excel:', error);
    }
  };

  // Nuevo: exportar a PDF usando jsPDF + autoTable
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const title = "Historial de Incidentes";
      doc.setFontSize(16);
      doc.text(title, 14, 18);

      const headers = [['ID','Fecha','Usuario','Ubicación','Incidente','Descripción','Escala','Estado']];
      const rows = (incidentes || []).map(item => [
        item.id,
        item.fecha,
        item.usuario,
        item.ubicacion,
        item.incidente,
        item.descripcion,
        item.escala,
        item.estado,
      ]);

      autoTable(doc, {
        startY: 24,
        head: headers,
        body: rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [47,168,79] },
        theme: 'striped',
        margin: { left: 8, right: 8 }
      });

      doc.save('historial_incidentes.pdf');
    } catch (error) {
      console.error('Error exportando a PDF:', error);
    }
  };

  return (
    <div className="historial-container">
      <div className="historial-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2>📋 Historial de Incidentes</h2>
          <p>Registro completo de incidencias</p>
        </div>

        {/* Botones: PDF (izquierda) y Excel (derecha) */}
        <div style={{ display: 'inline-flex', gap: 8 }}>
          <button
            onClick={handleExportPDF}
            style={{
              background: '#fff',
              color: '#0B6623',
              border: 'none',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 1px 0 rgba(0,0,0,0.06)'
            }}
            title="Exportar a PDF"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="2" y="3" width="20" height="18" rx="2" fill="#fff" stroke="#2FA84F" />
              <path d="M7 7h10v3H7z" fill="#2FA84F" />
              <path d="M7 12h10v4H7z" fill="#0F5132" />
            </svg>
            <span style={{ fontWeight: 600, color: '#0B6623' }}>PDF</span>
          </button>

          {/* Botón Excel existente */}
          <button
            onClick={handleExportExcel}
            style={{
              background: '#2FA84F',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 1px 0 rgba(0,0,0,0.1)'
            }}
            title="Exportar a Excel"
          >
            {/* icono simple inline */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="2" y="3" width="20" height="18" rx="2" fill="#fff" />
              <path d="M3 7h18" stroke="#2FA84F" strokeWidth="1.2" />
              <path d="M7 17V7l5 5-5 5z" fill="#0F5132" />
            </svg>
            <span style={{ fontWeight: 600 }}>Excel</span>
          </button>
        </div>
      </div>
      
      <div className="historial-table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table className="historial-table">
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
            {incidentes.map((incidente, index) => (
              <tr key={index}>
                <td>{incidente.id}</td>
                <td>{incidente.fecha}</td>
                <td>{incidente.usuario}</td>
                <td>{incidente.ubicacion}</td>
                <td>{incidente.incidente}</td>
                <td>{incidente.descripcion}</td>
                <td>{incidente.escala}</td>
                <td>
                  <span className={`estado-badge ${getEstadoClass(incidente.estado)}`}>
                    {incidente.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Historial;