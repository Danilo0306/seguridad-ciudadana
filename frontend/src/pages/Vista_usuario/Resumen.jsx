import { useEffect, useState } from "react";
import "../../css/Vista_usuario/Graficoresumen.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const API = "http://127.0.0.1:8000/api";

const LEVELS = {
  1: { name: "Bajo", color: "#4caf50" },
  2: { name: "Medio", color: "#ff9800" },
  3: { name: "Alto", color: "#f44336" },
};

const resolveLevel = (r) => {
  const escalaValue =
    r.Escala ?? r.escala ?? r.idEscala ?? r.idEscalaIncidencia ?? r.IdEscala;
  const nivel = Number(escalaValue);
  if (nivel >= 1 && nivel <= 3) return nivel;
  if (typeof escalaValue === "string") {
    const s = escalaValue.toLowerCase().trim();
    if (s.includes("bajo")) return 1;
    if (s.includes("medio")) return 2;
    if (s.includes("alto")) return 3;
  }
  return null;
};

const rollupFromReportes = (reportes = []) => {
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const r of reportes) {
    const lvl = resolveLevel(r);
    if (lvl) counts[lvl] += 1;
  }
  const pieData = Object.entries(counts)
    .map(([k, v]) => ({
      name: LEVELS[k].name,
      value: v,
      color: LEVELS[k].color,
    }))
    .filter((d) => d.value > 0);

  return pieData.length > 0
    ? pieData
    : [{ name: "Sin datos", value: 1, color: "#ccc" }];
};

const fmtTick = (ts) =>
  new Date(ts).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });

const rollupLineFromReportes = (reportes = []) => {
  const byDay = new Map();
  for (const r of reportes) {
    const d = new Date(r.FechaHora);
    if (Number.isNaN(d.getTime())) continue;
    const fecha = d.toISOString().slice(0, 10);
    byDay.set(fecha, (byDay.get(fecha) || 0) + 1);
  }
  return [...byDay.entries()]
    .map(([fecha, cantidad]) => ({ fecha, cantidad }))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
};

// 🚀 NUEVA FUNCIÓN: Agrupa por Ubicación y cuenta los niveles
const rollupTopZonas = (reportes = []) => {
    const byLocation = new Map();

    for (const r of reportes) {
        const ubicacion = String(r.Ubicacion || "").trim();
        const nivel = resolveLevel(r);
        
        // Ignorar reportes sin ubicación o con ubicaciones genéricas/de IP
        if (!ubicacion || !nivel || ubicacion.includes("Lat:") || ubicacion.includes("Aprox. por IP")) continue;

        if (!byLocation.has(ubicacion)) {
            byLocation.set(ubicacion, {
                ubicacion: ubicacion,
                total: 0,
                alto: 0,
                medio: 0,
            });
        }

        const data = byLocation.get(ubicacion);
        data.total += 1;
        if (nivel === 3) {
            data.alto += 1;
        } else if (nivel === 2) {
            data.medio += 1;
        }
    }

    // Ordenar: 1. Total (desc), 2. Alto (desc)
    return Array.from(byLocation.values())
        .sort((a, b) => {
            if (b.total !== a.total) {
                return b.total - a.total;
            }
            return b.alto - a.alto;
        });
};


export default function Resumen() {
  const [pieData, setPieData] = useState(null);
  const [lineData, setLineData] = useState(null);
  const [topZonas, setTopZonas] = useState(null); // 🆕 ESTADO PARA TOP ZONAS
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setError("No hay token. Inicia sesión.");
      setLoading(false);
      return;
    }

    const fetchResumen = async () => {
      try {
        const mrRes = await fetch(`${API}/mis-reportes/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!mrRes.ok) throw new Error("No se pudo cargar reportes");

        const reportes = await mrRes.json();
        const filteredReportes = reportes.filter((r) => {
          const lvl = resolveLevel(r);
          return lvl >= 1 && lvl <= 3;
        });

        // 1. Datos para la Gráfica de Pastel (PIE)
        const pie = rollupFromReportes(filteredReportes);
        setPieData(pie);

        // 2. Datos para la Gráfica de Línea (Evolución)
        let line = rollupLineFromReportes(filteredReportes);
        
        // Lógica para asegurar los últimos 7 días
        const today = new Date();
        const last7Days = [];
        for (let i = 5; i >= 0; i--) { // Muestra 6 días + hoy
            const d = new Date();
            d.setDate(today.getDate() - i);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            last7Days.push(`${year}-${month}-${day}`);
        }

        const completeLineData = last7Days.map((day) => {
            const found = line.find((r) => r.fecha === day);
            return { fecha: day, cantidad: found ? found.cantidad : 0 };
        });
        setLineData(completeLineData);
        
        // 3. Datos para la Tabla de Top Zonas (🚨 NUEVO)
        setTopZonas(rollupTopZonas(reportes));

      } catch (err) {
        console.error("❌ Error cargando datos:", err);
        setError("No se pudo cargar el resumen");
      } finally {
        setLoading(false);
      }
    };

    fetchResumen();
  }, []);

  if (error) return <p style={{ color: "red" }}>⚠️ {error}</p>;
  if (loading) return <p>Cargando resumen...</p>;
  if (!pieData || !lineData || !topZonas) return <p>No hay datos disponibles</p>;

  const legendPayload = pieData
    .filter((d) => d.name !== "Sin datos")
    .map((d, i) => ({
      id: i,
      type: "square",
      value: d.name,
      color: d.color,
    }));

  return (
    <section className="resumen-section">
      <div className="resumen-cards">
        {/* PIE CHART */}
        <div className="resumen-card">
          <h3>🚨 Incidentes por nivel</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ payload, percent }) => {
                  if (payload.name === "Sin datos") return "Sin datos";
                  return `${payload.name}: ${payload.value} (${(
                    percent * 100
                  ).toFixed(0)}%)`;
                }}
              >
                {pieData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, _n, { payload }) => [val, payload?.name]}
              />
              {legendPayload.length > 0 && (
                <Legend payload={legendPayload} verticalAlign="bottom" />
              )}
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* LINE CHART */}
        <div className="resumen-card">
          <h3>📈 Evolución de reportes</h3>
          {Array.isArray(lineData) && lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={lineData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="fecha"
                  type="category"
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "short",
                    })
                  }
                />
                <YAxis allowDecimals={false} domain={[0, "dataMax + 1"]} />
                <Tooltip
                  labelFormatter={(ts) => `Fecha: ${fmtTick(ts)}`}
                  formatter={(v) => [v, "Reportes"]}
                />
                <defs>
                  <linearGradient id="colorLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2196f3" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2196f3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke="#2196f3"
                  strokeWidth={3}
                  dot={{ r: 5, stroke: "#2196f3", strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 7, fill: "#2196f3" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: "#999", margin: "12px 0 0 8px" }}>
              No hay evolución de reportes
            </p>
          )}
        </div>
      </div>
    
    {/* --- SECCIÓN TOP ZONAS --- */}
    <div className="resumen-card full-width" style={{ marginTop: '30px' }}>
        <h3>📍 Top 3 Zonas con Mayor Incidencia</h3>
        {Array.isArray(topZonas) && topZonas.length > 0 ? (
            <div className="table-wrapper-small">
                <table className="tabla-top-zonas">
                    <thead>
                        <tr>
                            <th>Puesto</th>
                            <th>Ubicación</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Mostrar solo el Top 3 */}
                        {topZonas.slice(0, 3).map((zona, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{zona.ubicacion || 'Sin Especificar'}</td>
                                 <td><b>{zona.total || 0}</b></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <p style={{ color: "#999", margin: "12px 0 0 8px" }}>
                No hay suficientes datos de reportes para clasificar las zonas.
            </p>
        )}
    </div>
    </section>
  );
}