// VERSIÓN SIN WARNINGS DE ESLINT
import { useEffect, useState } from "react";
import "../../css/Vista_usuario/Graficoresumen.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  Activity,
  CheckCircle,
  AlertTriangle,
  MapPin,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
} from "lucide-react";

const API = "http://127.0.0.1:8000/api";

const LEVELS = {
  1: { name: "Bajo", color: "#10b981", gradient: ["#10b981", "#34d399"] },
  2: { name: "Medio", color: "#f59e0b", gradient: ["#f59e0b", "#fbbf24"] },
  3: { name: "Alto", color: "#ef4444", gradient: ["#ef4444", "#f87171"] },
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
  const total = counts[1] + counts[2] + counts[3];
  
  const pieData = Object.entries(counts)
    .map(([k, v]) => ({
      name: LEVELS[k].name,
      value: v,
      color: LEVELS[k].color,
      percentage: total > 0 ? ((v / total) * 100).toFixed(1) : 0,
    }))
    .filter((d) => d.value > 0);

  return pieData.length > 0
    ? pieData
    : [{ name: "Sin datos", value: 1, color: "#cbd5e1", percentage: 0 }];
};

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

const rollupTopZonas = (reportes = []) => {
  const byLocation = new Map();

  for (const r of reportes) {
    const ubicacion = String(r.Ubicacion || "").trim();
    const nivel = resolveLevel(r);

    if (
      !ubicacion ||
      !nivel ||
      ubicacion.includes("Lat:") ||
      ubicacion.includes("Aprox. por IP")
    )
      continue;

    if (!byLocation.has(ubicacion)) {
      byLocation.set(ubicacion, {
        ubicacion: ubicacion,
        total: 0,
        alto: 0,
        medio: 0,
        bajo: 0,
      });
    }

    const data = byLocation.get(ubicacion);
    data.total += 1;
    if (nivel === 3) data.alto += 1;
    else if (nivel === 2) data.medio += 1;
    else if (nivel === 1) data.bajo += 1;
  }

  return Array.from(byLocation.values()).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return b.alto - a.alto;
  });
};

const calcularEstadisticas = (reportes = []) => {
  const total = reportes.length;
  const activos = reportes.filter(
    (r) => r.Estado?.toLowerCase() === "pendiente" || !r.Estado
  ).length;
  const resueltos = reportes.filter(
    (r) => r.Estado?.toLowerCase() === "resuelto"
  ).length;

  const niveles = { alto: 0, medio: 0, bajo: 0 };
  reportes.forEach((r) => {
    const nivel = resolveLevel(r);
    if (nivel === 3) niveles.alto++;
    else if (nivel === 2) niveles.medio++;
    else if (nivel === 1) niveles.bajo++;
  });

  return { total, activos, resueltos, ...niveles };
};

// Custom label para el pie chart
const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="14"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(17, 24, 39, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          padding: "12px 16px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
        }}
      >
        <p style={{ color: "#fff", margin: 0, fontWeight: "600", fontSize: "14px" }}>
          {payload[0].name}
        </p>
        <p style={{ color: payload[0].color || "#3b82f6", margin: "4px 0 0 0", fontSize: "16px", fontWeight: "700" }}>
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function Resumen() {
  const [pieData, setPieData] = useState(null);
  const [lineData, setLineData] = useState(null);
  const [topZonas, setTopZonas] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchResumen = async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      setError("No hay token. Inicia sesión.");
      setLoading(false);
      return;
    }

    setLoading(true);
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

      const estadisticas = calcularEstadisticas(reportes);
      setStats(estadisticas);

      const pie = rollupFromReportes(filteredReportes);
      setPieData(pie);

      let line = rollupLineFromReportes(filteredReportes);
      const today = new Date();
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
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

      setTopZonas(rollupTopZonas(reportes));

      setLastUpdate(new Date());
      setError("");
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("No se pudo cargar el resumen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumen();
  }, []);

  if (loading) {
    return (
      <section className="resumen-section">
        <div className="resumen-message loading">
          <div className="spinner"></div>
          <span>Cargando estadísticas...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="resumen-section">
        <div className="resumen-message error">{error}</div>
      </section>
    );
  }

  if (!pieData || !lineData || !topZonas || !stats) {
    return (
      <section className="resumen-section">
        <div className="resumen-message error">No hay datos disponibles</div>
      </section>
    );
  }

  return (
    <section className="resumen-section">
      {/* Header */}
      <div className="resumen-header">
        <div>
          <h2 className="resumen-title">
            <BarChart3 size={24} />
            Dashboard de Incidencias
          </h2>
          <p className="resumen-subtitle">
            Última actualización:{" "}
            {lastUpdate.toLocaleString("es-PE", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        </div>
        <button onClick={fetchResumen} className="action-button">
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Activity size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Reportes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon cyan">
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.activos}</div>
            <div className="stat-label">En Proceso</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.resueltos}</div>
            <div className="stat-label">Resueltos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <AlertTriangle size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.alto}</div>
            <div className="stat-label">Prioridad Alta</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="resumen-cards">
        {/* Distribución por Nivel - MEJORADO */}
        <div className="resumen-card">
          <div className="card-header">
            <h3>
              <PieChartIcon size={18} className="card-icon" />
              Distribución por Nivel
            </h3>
          </div>
          <div className="responsive-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                    <feOffset dx="0" dy="2" result="offsetblur" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.3" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  label={CustomPieLabel}
                  labelLine={false}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                  filter="url(#shadow)"
                >
                  {pieData.map((entry, idx) => (
                    <Cell 
                      key={`cell-${idx}`} 
                      fill={entry.color}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => (
                    <span style={{ color: 'var(--text)', fontSize: '14px' }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tendencia Semanal - MEJORADO */}
        <div className="resumen-card">
          <div className="card-header">
            <h3>
              <TrendingUp size={18} className="card-icon" />
              Tendencia Últimos 7 Días
            </h3>
          </div>
          <div className="responsive-container">
            {Array.isArray(lineData) && lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={lineData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="rgba(148, 163, 184, 0.1)" 
                    vertical={false}
                  />
                  <XAxis
                    dataKey="fecha"
                    tickFormatter={(d) =>
                      new Date(d).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                      })
                    }
                    stroke="var(--text-muted)"
                    style={{ fontSize: "12px" }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="var(--text-muted)"
                    style={{ fontSize: "12px" }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cantidad"
                    stroke="url(#colorGradient)"
                    strokeWidth={3}
                    fill="url(#colorGradient)"
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                    dot={{ 
                      fill: '#3b82f6', 
                      strokeWidth: 2, 
                      r: 4,
                      stroke: '#fff'
                    }}
                    activeDot={{ 
                      r: 6, 
                      fill: '#3b82f6',
                      stroke: '#fff',
                      strokeWidth: 2
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="resumen-message">
                <p>No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Zonas - MEJORADO */}
      <div className="resumen-card resumen-full-card">
        <div className="card-header">
          <h3>
            <MapPin size={18} className="card-icon" />
            Zonas Críticas
          </h3>
        </div>

        {Array.isArray(topZonas) && topZonas.length > 0 ? (
          <>
            <div className="responsive-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topZonas.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.1)"
                    horizontal={false}
                  />
                  <XAxis 
                    type="number" 
                    stroke="var(--text-muted)"
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                    tickLine={false}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    dataKey="ubicacion"
                    type="category"
                    width={140}
                    stroke="var(--text-muted)"
                    style={{ fontSize: "12px" }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                    tickLine={false}
                    tickFormatter={(value) =>
                      value.length > 20 ? value.substring(0, 20) + "..." : value
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="total" 
                    fill="url(#barGradient)" 
                    radius={[0, 8, 8, 0]}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <table className="top-zones-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ubicación</th>
                  <th style={{ textAlign: "center" }}>Alto</th>
                  <th style={{ textAlign: "center" }}>Medio</th>
                  <th style={{ textAlign: "center" }}>Bajo</th>
                  <th style={{ textAlign: "center" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {topZonas.slice(0, 5).map((zona, zoneIndex) => (
                  <tr key={zoneIndex}>
                    <td>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        {zoneIndex + 1}
                      </div>
                    </td>
                    <td style={{ fontWeight: '500' }}>{zona.ubicacion || "Sin especificar"}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        color: '#ef4444',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontWeight: '600'
                      }}>
                        {zona.alto || 0}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ 
                        background: 'rgba(245, 158, 11, 0.1)', 
                        color: '#f59e0b',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontWeight: '600'
                      }}>
                        {zona.medio || 0}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        color: '#10b981',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontWeight: '600'
                      }}>
                        {zona.bajo || 0}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ 
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                        color: '#3b82f6',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '15px'
                      }}>
                        {zona.total || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <div className="resumen-message">
            <p>No hay datos de zonas disponibles</p>
          </div>
        )}
      </div>
    </section>
  );
}