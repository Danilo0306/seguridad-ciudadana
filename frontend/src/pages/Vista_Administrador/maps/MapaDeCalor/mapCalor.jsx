// src/pages/Vista_Administrador/maps/mapCalor.jsx
// src/pages/Vista_Administrador/maps/mapCalor.jsx
import { useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import HeatmapLayerCustom from "./components/HeatmapLayerCustom";
import useHeatmapPolling from "./hooks/useHeatmapPolling";

const BASE_URL = "http://127.0.0.1:8000/api";
const centerLosOlivos = [-11.9577, -77.0622];

export default function MapCalor() {
    // Opcional: limitar por zona (south,west,north,east)
    const bbox = "-12.1,-77.2,-11.8,-76.9";

    const { points, loading, byStatus } = useHeatmapPolling({
        baseUrl: BASE_URL,
        intervalMs: 10000, // refresca cada 10s
        daysWindow: 14,
        params: { escala_min: 1, escala_max: 3, bbox },
    });

    // Leyenda simple (opcional)
    const legend = useMemo(
        () => [
            { label: "Pendiente", color: "#ff4d4f" },
            { label: "En proceso", color: "#3d7eff" },
        ],
        []
    );

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            {/* Leyenda */}
            <div
                style={{
                    position: "absolute",
                    zIndex: 1000,
                    right: 12,
                    top: 12,
                    background: "rgba(255,255,255,0.9)",
                    borderRadius: 8,
                    padding: "8px 10px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    fontSize: 13,
                }}
            >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Estados</div>
                {legend.map((i) => (
                    <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span
                            style={{
                                display: "inline-block",
                                width: 12,
                                height: 12,
                                borderRadius: 2,
                                background: i.color,
                            }}
                        />
                        <span>{i.label}</span>
                        <span style={{ marginLeft: "auto", opacity: 0.7 }}>
                            {byStatus?.[i.label] ?? 0}
                        </span>
                    </div>
                ))}
            </div>

            <MapContainer
                center={centerLosOlivos}
                zoom={13}
                scrollWheelZoom
                preferCanvas
                style={{ width: "100%", height: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {!loading && (
                    <HeatmapLayerCustom
                        points={points}   // ahora es [[lat,lng,intensity,estado]]
                        radius={25}
                        blur={20}
                        minOpacity={0.5}
                        amplify={1}
                        fitBounds
                    />
                )}
            </MapContainer>
        </div>
    );
}
