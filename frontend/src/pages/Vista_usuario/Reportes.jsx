import { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import logo from "../../img/inicio/policia.png";
import "../../css/Vista_usuario/reportes.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const API = "http://127.0.0.1:8000/api";

const ESCALAS = [
  { id: "1", nombre: "Bajo" },
  { id: "2", nombre: "Medio" },
  { id: "3", nombre: "Alto" },
  { id: "4", nombre: "Pendiente (por asignar)" },
];

const INCIDENTES_COMUNES = [
  { nombre: "Robo", escala: "3" },
  { nombre: "Asalto", escala: "3" },
  { nombre: "Homicidio", escala: "3" },
  { nombre: "Secuestro", escala: "3" },
  { nombre: "Accidente de tránsito", escala: "2" },
  { nombre: "Incendio", escala: "2" },
  { nombre: "Pelea callejera", escala: "2" },
  { nombre: "Amenaza", escala: "2" },
  { nombre: "Daño a propiedad", escala: "1" },
  { nombre: "Vandalismo", escala: "1" },
  { nombre: "Pérdida de mascota", escala: "1" },
  { nombre: "Otro", escala: "4" },
];

export default function MisReportes({ darkMode, onReportesActualizados }) {
  const [reportes, setReportes] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  // 🔄 Ahora archivoPreview almacena { url, type } o null.
  const [archivoPreview, setArchivoPreview] = useState(null);
  // 🆕 Estado para la URL temporal del archivo local
  const [tempPreviewUrl, setTempPreviewUrl] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });

  const [nuevoReporte, setNuevoReporte] = useState({
    Ubicacion: "",
    Descripcion: "",
    NombreIncidente: "",
    escala: "",
    Latitud: "",
    Longitud: "",
    Archivo: null,
    esOtro: false,
    NombreIncidenteOtro: "",
  });

  const token = localStorage.getItem("access");

  const axiosAuth = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` },
  });

  // ---------- Cargar reportes ----------
  const cargarReportes = () => {
    if (!token) return;
    axiosAuth
      .get("/mis-reportes")
      .then((res) => {
        setReportes(res.data);
        if (onReportesActualizados) onReportesActualizados(res.data);
      })
      .catch((err) => console.error("Error cargando reportes:", err));
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  // ---------- Obtener ubicación (simplificado, sin alerts) ----------
  const obtenerUbicacionPorIP = async () => {
    try {
      const ipRes = await axios.get("https://ipapi.co/json/");
      const ipData = ipRes.data;
      const ubicacionIP = `${ipData.city || "Ciudad"}, ${ipData.region || "Región"}, ${ipData.country_name || "País"} (Aprox. por IP)`;
      setNuevoReporte((prev) => ({
        ...prev,
        Ubicacion: ubicacionIP,
        Latitud: ipData.latitude || "",
        Longitud: ipData.longitude || "",
      }));
      // alert(`Ubicación aproximada obtenida por IP: ${ubicacionIP}.`); // 🛑 Eliminado
    } catch (e) {
      console.error("Error obteniendo ubicación por IP:", e);
      // alert("No se pudo obtener la ubicación automáticamente."); // 🛑 Eliminado
    }
  };

  const obtenerUbicacionPorGPS = () => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject("Tu navegador no soporta la geolocalización.");
        return;
      }

      const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
          try {
            const res = await fetch(url);
            const data = await res.json();
            const direccion = data.display_name || `Lat: ${latitude}, Lon: ${longitude}`;
            setNuevoReporte((prev) => ({
              ...prev,
              Ubicacion: direccion,
              Latitud: latitude,
              Longitud: longitude,
            }));
            resolve(true);
          } catch {
            setNuevoReporte((prev) => ({
              ...prev,
              Ubicacion: `Lat: ${latitude}, Lon: ${longitude}`,
              Latitud: latitude,
              Longitud: longitude,
            }));
            resolve(true);
          }
        },
        (error) => {
          reject("No se pudo obtener ubicación: " + error.message);
        },
        options
      );
    });
  };

  const abrirModal = async () => {
    setMostrarModal(true);
    try {
      await obtenerUbicacionPorGPS();
    } catch {
      await obtenerUbicacionPorIP();
    }
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    // 🧹 Limpia la URL temporal al cerrar el modal
    if (tempPreviewUrl) {
      URL.revokeObjectURL(tempPreviewUrl);
    }
    setTempPreviewUrl(null);
    setArchivoPreview(null);
    setNuevoReporte({
      Ubicacion: "",
      Descripcion: "",
      NombreIncidente: "",
      escala: "",
      Latitud: "",
      Longitud: "",
      Archivo: null,
      esOtro: false,
      NombreIncidenteOtro: "",
    });
  };

  // 🔄 MODIFICADA para manejar objeto { url, type } o string (para URLs del backend)
  const abrirPreview = (data) => {
    if (typeof data === 'string') {
      // Es una URL del backend. Intentamos adivinar el tipo por la extensión.
      const url = data;
      let type = '';
      if (url.endsWith('.pdf')) type = 'application/pdf';
      else if (url.match(/\.(mp4|webm|ogg)$/i)) type = 'video';
      else if (url.match(/\.(jpg|jpeg|png|gif)$/i)) type = 'image';
      setArchivoPreview({ url, type });
    } else {
      // Es el objeto { url, type } del archivo local
      setArchivoPreview(data);
    }
  };

  const cerrarPreview = () => {
    // Si la URL es la temporal, la limpiamos al cerrar
    if (archivoPreview && archivoPreview.url === tempPreviewUrl) {
      URL.revokeObjectURL(tempPreviewUrl);
      setTempPreviewUrl(null);
    }
    setArchivoPreview(null);
  };

  // ---------- Registrar incidente ----------
  const registrarIncidente = async () => {
    if (!token) return alert("Debes iniciar sesión");
    try {
      const formData = new FormData();
      formData.append("Ubicacion", nuevoReporte.Ubicacion);

      const descripcionFinal = nuevoReporte.Descripcion.trim() || "No determinado";
      formData.append("Descripcion", descripcionFinal);

      const nombreFinal = nuevoReporte.esOtro
        ? (nuevoReporte.NombreIncidenteOtro || "").trim()
        : nuevoReporte.NombreIncidente;

      if (!nombreFinal) return alert("Debes especificar el nombre del incidente.");
      formData.append("NombreIncidente", nombreFinal);

      const escalaFinal = Number(nuevoReporte.escala) || 4;
      formData.append("escala", escalaFinal);

      formData.append("Latitud", nuevoReporte.Latitud);
      formData.append("Longitud", nuevoReporte.Longitud);
      if (nuevoReporte.Archivo) formData.append("Archivo", nuevoReporte.Archivo);

      console.log("📤 Enviando escala:", escalaFinal);
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const res = await axios.post(`${API}/registrar-incidente`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      const det = res.data.registro;

      const escalaNumero = Number(nuevoReporte.escala) || Number(det.Escala) || Number(det.escala) || 4;

      const reporteRegistrado = {
        ...det,
        Escala: escalaNumero,
        FechaHora: det.FechaHora || new Date().toISOString()
      };

      console.log("📝 Reporte registrado:", reporteRegistrado);
      console.log("📊 Escala guardada:", escalaNumero);

      const nuevosReportes = [reporteRegistrado, ...reportes];
      setReportes(nuevosReportes);
      if (onReportesActualizados) onReportesActualizados(nuevosReportes);

      //alert("¡Incidente registrado con éxito!");
      cerrarModal();
    } catch (err) {
      console.error("Error al registrar incidente:", err);
      if (err.response) {
        alert(`Error al registrar el incidente:\n${JSON.stringify(err.response.data)}`);
      } else {
        alert(`Error inesperado: ${err.message}`);
      }
    }
  };

  // -------------------EXPORTAR A PDF -------------------
  const exportarPDF = async () => {
    const doc = new jsPDF();
    try {
      const response = await fetch(logo);
      const blob = await response.blob();
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onloadend = () => resolve();
        reader.readAsDataURL(blob);
      });
      doc.addImage(reader.result, "PNG", 14, 10, 20, 20);
    } catch (e) {
      console.warn("No se pudo cargar el logo:", e);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Mis Reportes", 40, 22);

    const body = reportes.map((r) => [
      r.idTipoIncidencia,
      new Date(r.FechaHora).toLocaleString("es-PE", { timeZone: "America/Lima" }),
      r.Ubicacion,
      r.NombreIncidente,
      r.Descripcion || "No determinado",
      r.Escala === 1 ? "Bajo" : r.Escala === 2 ? "Medio" : r.Escala === 3 ? "Alto" : r.Escala === 4 ? "Pendiente (por asignar)" : "No determinado",
      r.Archivo ? "Sí" : "No",
    ]);

    autoTable(doc, {
      head: [["ID", "Fecha", "Ubicación", "Incidente", "Descripción", "Escala", "Archivo"]],
      body,
      startY: 50,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save("mis_reportes.pdf");
  };

  // -------------------EXPORTAR A EXCEL -------------------
  const exportarExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Mis Reportes");
    ws.mergeCells("B1:F2");
    const title = ws.getCell("B1");
    title.value = "Mis Reportes";
    title.font = { name: "Calibri", size: 22, bold: true };
    title.alignment = { vertical: "middle", horizontal: "left" };
    const rows = (reportes || []).map((r) => [
      r.idTipoIncidencia,
      new Date(r.FechaHora).toLocaleString("es-PE", { timeZone: "America/Lima" }),
      r.Ubicacion || "",
      r.NombreIncidente || "",
      r.Descripcion || "No determinado",
      r.Escala === 1 ? "Bajo" : r.Escala === 2 ? "Medio" : r.Escala === 3 ? "Alto" : r.Escala === 4 ? "Pendiente (por asignar)" : "No determinado",
      r.Archivo ? "Sí" : "No",
    ]);
    ws.addTable({
      name: "TablaReportes",
      ref: "A4",
      headerRow: true,
      columns: [
        { name: "ID" },
        { name: "Fecha" },
        { name: "Ubicación" },
        { name: "Incidente" },
        { name: "Descripción" },
        { name: "Escala" },
        { name: "Archivo" },
      ],
      rows,
    });
    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "mis_reportes.xlsx");
  };

  // ---------- FILTROS y ORDENAMIENTO (Sin cambios) ----------
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filtrarReportesPorFecha = (reportes, fechaFiltro) => {
    if (!fechaFiltro) return reportes;
    const fechaSeleccionada = new Date(fechaFiltro);
    return reportes.filter((r) => {
      if (!r.FechaHora) return false;
      const fechaLocal = new Date(new Date(r.FechaHora).toLocaleString("en-US", { timeZone: "America/Lima" }));
      return (
        fechaLocal.getDate() === fechaSeleccionada.getUTCDate() &&
        fechaLocal.getMonth() === fechaSeleccionada.getUTCMonth() &&
        fechaLocal.getFullYear() === fechaSeleccionada.getUTCFullYear()
      );
    });
  };

  let filteredReportes = reportes;
  if (filterDate) filteredReportes = filtrarReportesPorFecha(reportes, filterDate);
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredReportes = filteredReportes.filter(
      (r) =>
        r.idTipoIncidencia?.toString().toLowerCase().includes(term) ||
        r.Ubicacion?.toLowerCase().includes(term) ||
        r.NombreIncidente?.toLowerCase().includes(term) ||
        r.Descripcion?.toLowerCase().includes(term)
    );
  }

  const ordenarPor = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
    const sorted = [...filteredReportes].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setReportes(sorted);
  };

  const getArrow = (key) => {
    if (sortConfig.key !== key) return "↕️";
    return sortConfig.direction === "asc" ? "🔼" : "🔽";
  };

  // ---------- Render ----------
  return (
    <div className={`mis-reportes ${darkMode ? "dark" : "light"}`}>
      <h2>Mis Reportes</h2>

      <div style={{ marginBottom: "10px" }}>
        <button onClick={abrirModal} className="btn-export">➕ Nuevo</button>
        <button onClick={exportarPDF} className="btn-export">📄 PDF</button>
        <button onClick={exportarExcel} className="btn-export">📊 Excel</button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", gap: "10px" }}>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginLeft: "auto" }}
        />
      </div>

      {/* Tabla */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th onClick={() => ordenarPor("idTipoIncidencia")}>ID {getArrow("idTipoIncidencia")}</th>
              <th onClick={() => ordenarPor("FechaHora")}>Fecha {getArrow("FechaHora")}</th>
              <th onClick={() => ordenarPor("Ubicacion")}>Ubicación {getArrow("Ubicacion")}</th>
              <th onClick={() => ordenarPor("NombreIncidente")}>Incidente {getArrow("NombreIncidente")}</th>
              <th onClick={() => ordenarPor("Descripcion")}>Descripción {getArrow("Descripcion")}</th>
              <th onClick={() => ordenarPor("Escala")}>Escala {getArrow("Escala")}</th>
              <th>Archivo</th>
            </tr>
          </thead>
          <tbody>
            {filteredReportes.length > 0 ? (
              filteredReportes.map((r, i) => (
                <tr key={i}>
                  <td>{r.idTipoIncidencia || "-"}</td>
                  <td>
                    {r.FechaHora
                      ? new Date(r.FechaHora).toLocaleString("es-PE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                        timeZone: "America/Lima",
                      })
                      : "-"}
                  </td>
                  <td>{r.Ubicacion || "No determinado"}</td>
                  <td>{r.NombreIncidente || "No determinado"}</td>
                  <td>{r.Descripcion || "No determinado"}</td>
                  <td>
                    {r.Escala === 1 ? "Bajo" :
                      r.Escala === 2 ? "Medio" :
                        r.Escala === 3 ? "Alto" :
                          r.Escala === 4 ? "Pendiente (por asignar)" :
                            "No determinado"}
                  </td>

                  <td style={{ textAlign: "center" }}>
                    {r.Archivo ? (
                      <button
                        onClick={() => abrirPreview(r.Archivo)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#007BFF",
                          fontSize: "18px",
                          cursor: "pointer",
                        }}
                      >
                        📎
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No se encontraron resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal registrar */}
      {mostrarModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Registrar Incidente</h3>

            <input
              type="text"
              placeholder="Ubicación"
              value={nuevoReporte.Ubicacion}
              onChange={(e) => setNuevoReporte({ ...nuevoReporte, Ubicacion: e.target.value })}
            />

            {/* Select de incidente */}
            <select
              value={nuevoReporte.NombreIncidente}
              onChange={(e) => {
                const valor = e.target.value;
                const incidente = INCIDENTES_COMUNES.find((i) => i.nombre === valor);
                const escala = incidente ? Number(incidente.escala) : 4;
                setNuevoReporte({
                  ...nuevoReporte,
                  NombreIncidente: valor,
                  escala,
                  esOtro: valor === "Otro",
                });
              }}
            >
              <option value="">Seleccione un incidente...</option>
              {INCIDENTES_COMUNES.map((inc, i) => (
                <option key={i} value={inc.nombre}>
                  {inc.nombre}
                </option>
              ))}
            </select>

            {/* Input para "Otro" */}
            {nuevoReporte.esOtro && (
              <input
                type="text"
                placeholder="Especifique el incidente"
                value={nuevoReporte.NombreIncidenteOtro || ""}
                onChange={(e) =>
                  setNuevoReporte({ ...nuevoReporte, NombreIncidenteOtro: e.target.value })
                }
              />
            )}

            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={nuevoReporte.Descripcion}
              onChange={(e) => setNuevoReporte({ ...nuevoReporte, Descripcion: e.target.value })}
            />

            <p style={{ fontSize: "12px", color: "#666", marginTop: "-8px", marginBottom: "8px" }}>
              Si no escribes una descripción, se guardará como "No determinado"
            </p>

            <p style={{ color: "#007BFF", textAlign: "center", fontWeight: "bold" }}>
              Escala:{" "}
              {nuevoReporte.escala === 3
                ? "Alto"
                : nuevoReporte.escala === 2
                  ? "Medio"
                  : nuevoReporte.escala === 1
                    ? "Bajo"
                    : nuevoReporte.escala === 4
                      ? "Pendiente (por asignar)"
                      : "No determinado"}
            </p>

            <input
              type="file"
              accept="image/*,video/*,application/pdf" // Permitir PDF
              onChange={(e) => {
                const file = e.target.files[0];

                // Limpiar la URL anterior si existe
                if (tempPreviewUrl) {
                  URL.revokeObjectURL(tempPreviewUrl);
                }

                if (file) {
                  const newUrl = URL.createObjectURL(file);
                  setTempPreviewUrl(newUrl);
                  setNuevoReporte({ ...nuevoReporte, Archivo: file });
                } else {
                  setTempPreviewUrl(null);
                  setNuevoReporte({ ...nuevoReporte, Archivo: null });
                }
              }}
            />

            {/* Botón de Previsualización para archivos locales */}
            {nuevoReporte.Archivo && (
              <div style={{ textAlign: "center", marginTop: "15px" }}>
                <span style={{ color: "#007BFF", fontSize: "1rem", verticalAlign: "middle" }}>
                  📎 Archivo listo para subir
                </span>
                {tempPreviewUrl && nuevoReporte.Archivo.type && (
                  <button
                    onClick={() => abrirPreview({ url: tempPreviewUrl, type: nuevoReporte.Archivo.type })}
                    className="btn-preview-file"
                    style={{ marginLeft: '15px' }}
                  >
                    <span className="icon">🔍</span> Ver Contenido
                  </button>
                )}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-around", marginTop: "10px" }}>
              <button onClick={registrarIncidente} className="btn-guardar">
                Guardar
              </button>
              <button onClick={cerrarModal} className="btn-cancelar">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vista previa */}
      {archivoPreview && (
        <div className="modal-backdrop" onClick={cerrarPreview}>
          <div
            className="modal"
            style={{
              position: "relative",
              maxWidth: "600px",
              maxHeight: "500px",
              overflow: "auto",
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "10px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={cerrarPreview}
              style={{
                position: "absolute",
                top: "8px",
                right: "10px",
                background: "none",
                border: "none",
                fontSize: "22px",
                fontWeight: "bold",
                color: "#555",
              }}
            >
              ✖
            </button>

            <h3 style={{ textAlign: "center", marginBottom: "10px" }}>Vista previa del archivo</h3>

            {/* Determinar tipo de archivo (local o remoto) por el tipo MIME o extensión */}
            {
              (archivoPreview.type && archivoPreview.type.includes("pdf")) ||
                (typeof archivoPreview === 'string' && archivoPreview.endsWith(".pdf")) ? (
                <iframe src={archivoPreview.url || archivoPreview} width="100%" height="400px" title="Vista PDF" style={{ border: "1px solid #ccc", borderRadius: "6px" }} />
              ) :
                (archivoPreview.type && archivoPreview.type.includes("video")) ||
                  (typeof archivoPreview === 'string' && archivoPreview.match(/\.(mp4|webm|ogg)$/i)) ? (
                  <video src={archivoPreview.url || archivoPreview} controls width="100%" style={{ borderRadius: "8px", maxHeight: "400px" }} />
                ) :
                  (archivoPreview.type && archivoPreview.type.includes("image")) ||
                    (typeof archivoPreview === 'string') ? (
                    <img src={archivoPreview.url || archivoPreview} alt="Vista previa" width="100%" style={{ maxHeight: "400px", objectFit: "contain", borderRadius: "8px" }} />
                  ) : (
                    <p style={{ color: "#cc0000", textAlign: "center", padding: "20px" }}>
                      Formato de archivo no compatible o URL no válida.
                    </p>
                  )}
          </div>
        </div>
      )}
    </div>
  );
}