// src/hooks/useHeatmapPolling.js
import axios from "axios";
import { useEffect, useRef, useState, useMemo } from "react";

export default function useHeatmapPolling({
    baseUrl = "http://127.0.0.1:8000/api",
    intervalMs = 10000,           // 10s
    daysWindow = 14,              // ventana de tiempo
    params = {},                  // { escala_min, escala_max, bbox, incluir_resueltos, ... }
    authToken = null,             // opcional: JWT si tu endpoint lo requiere
}) {
    const [points, setPoints] = useState([]); // cada punto: [lat, lng, intensity, estado?]
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const timerRef = useRef(null);
    const abortRef = useRef(null);

    const fetchOnce = async () => {
        try {
            setError(null);
            setLoading((prev) => (points.length ? prev : true));

            // Ventana [start, now]
            const now = new Date();
            const start = new Date(now.getTime() - daysWindow * 24 * 60 * 60 * 1000).toISOString();
            const end = now.toISOString();

            // cancela cualquier request colgando
            if (abortRef.current) abortRef.current.abort();
            abortRef.current = new AbortController();

            const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;

            const { data } = await axios.get(`${baseUrl}/alertas/heatmap/`, {
                params: { start, end, limit: 3000, ...params },
                headers,
                signal: abortRef.current.signal,
            });

            const incoming = Array.isArray(data?.points) ? data.points : [];
            setPoints(incoming);

            // Debug útil: cuántos puntos por estado (si viene el 4to campo)
            const counts = incoming.reduce(
                (acc, p) => {
                    const estado = p[3] ?? "N/A";
                    acc[estado] = (acc[estado] || 0) + 1;
                    return acc;
                },
                {}
            );
            // Muestra primeras muestras para inspección rápida
            console.debug("Heatmap points:", incoming.length, "por estado:", counts, "sample:", incoming.slice(0, 3));
        } catch (err) {
            if (axios.isCancel(err)) return;
            console.error("Polling heatmap error:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // primera carga
        fetchOnce();

        // intervalos
        timerRef.current = setInterval(fetchOnce, intervalMs);

        // pausa si la pestaña está oculta (ahorra CPU/red)
        const onVis = () => {
            if (document.hidden) {
                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = null;
            } else if (!timerRef.current) {
                fetchOnce();
                timerRef.current = setInterval(fetchOnce, intervalMs);
            }
        };
        document.addEventListener("visibilitychange", onVis);

        return () => {
            document.removeEventListener("visibilitychange", onVis);
            if (timerRef.current) clearInterval(timerRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseUrl, intervalMs, daysWindow, JSON.stringify(params), authToken]);

    // Contadores por estado (útil para UI/leyendas)
    const byStatus = useMemo(() => {
        return points.reduce(
            (acc, p) => {
                const estado = p[3] ?? "N/A";
                acc[estado] = (acc[estado] || 0) + 1;
                return acc;
            },
            {}
        );
    }, [points]);

    return { points, loading, error, reload: fetchOnce, byStatus };
}
