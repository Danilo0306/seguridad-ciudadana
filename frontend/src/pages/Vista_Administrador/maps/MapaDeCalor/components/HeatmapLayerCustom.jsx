// src/pages/Vista_Administrador/maps/components/HeatmapLayerCustom.jsx
import L from "leaflet";
import "leaflet.heat";
import { useEffect, useMemo, useRef } from "react";
import { useMap } from "react-leaflet";

/**
 * props:
 * - points: [[lat, lng, intensity?, estado?]]  // estado: 'Pendiente' | 'En proceso'
 * - radius, blur, minOpacity
 * - amplify: multiplica intensidad (default 1)
 * - fitBounds: ajusta vista al primer set de puntos
 *
 * Crea dos capas:
 *  - Roja: Pendiente
 *  - Azul: En proceso
 */
export default function HeatmapLayerCustom({
    points = [],
    radius = 50,
    blur = 50,
    minOpacity = 0.6,
    amplify = 1,
    fitBounds = true,
}) {
    const map = useMap();
    const redRef = useRef(null);   // capa para 'Pendiente'
    const blueRef = useRef(null);  // capa para 'En proceso'
    const hasFitted = useRef(false);

    // Normaliza puntos y satura intensidad a [0,1]
    const normalized = useMemo(() => {
        return points.map(([lat, lng, w = 1, estado = "Pendiente"]) => [
            lat,
            lng,
            Math.min(1, Number(w) * amplify || 0),
            estado,
        ]);
    }, [points, amplify]);

    const pendientes = useMemo(
        () => normalized.filter((p) => (p[3] || "").toLowerCase() === "pendiente"),
        [normalized]
    );
    const enProceso = useMemo(
        () => normalized.filter((p) => (p[3] || "").toLowerCase() === "en proceso"),
        [normalized]
    );

    // Crear capas una sola vez
    useEffect(() => {
        if (!map) return;
        if (!redRef.current) {
            redRef.current = L.heatLayer([], {
                radius,
                blur,
                minOpacity,
                // gradiente ROJO
                gradient: { 0.3: "#ff0008ff", 0.6: "#ff0004ff", 1: "#ff0019ff" },
            }).addTo(map);
        }
        if (!blueRef.current) {
            blueRef.current = L.heatLayer([], {
                radius,
                blur,
                minOpacity,
                // gradiente AZUL
                gradient: { 0.3: "#005effff", 0.6: "#0055ffff", 1: "#003cffff" },
            }).addTo(map);
        }

        return () => {
            if (redRef.current) {
                map.removeLayer(redRef.current);
                redRef.current = null;
            }
            if (blueRef.current) {
                map.removeLayer(blueRef.current);
                blueRef.current = null;
            }
        };
    }, [map, radius, blur, minOpacity]);

    // Actualizar puntos de cada capa
    useEffect(() => {
        if (redRef.current) {
            const data = pendientes.map(([lat, lng, w]) => [lat, lng, w]);
            redRef.current.setLatLngs(data);
        }
        if (blueRef.current) {
            const data = enProceso.map(([lat, lng, w]) => [lat, lng, w]);
            blueRef.current.setLatLngs(data);
        }

        // Fit bounds una sola vez cuando haya puntos
        if (
            fitBounds &&
            !hasFitted.current &&
            (pendientes.length > 0 || enProceso.length > 0)
        ) {
            const latlngs = [...pendientes, ...enProceso].map(([lat, lng]) =>
                L.latLng(lat, lng)
            );
            const bounds = L.latLngBounds(latlngs);
            map.fitBounds(bounds, { padding: [30, 30] });
            hasFitted.current = true;
        }
    }, [pendientes, enProceso, fitBounds, map]);

    return null;
}
