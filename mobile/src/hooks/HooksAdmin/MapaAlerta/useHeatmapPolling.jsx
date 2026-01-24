import axios from "axios";
import { useEffect, useState, useMemo, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function useHeatmapPolling({
    baseUrl,
    intervalMs = 10000,
    daysWindow = 14,
    params = {},
}) {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const intervalRef = useRef(null);

    const fetchOnce = async () => {
        try {
            const token = await AsyncStorage.getItem("access");

            if (!token) return;

            const now = new Date();
            const start = new Date(now.getTime() - daysWindow * 86400000).toISOString();
            const end = now.toISOString();

            const res = await axios.get(`${baseUrl}/alertas/heatmap/`, {
                params: { start, end, limit: 3000, ...params },
                headers: { Authorization: `Bearer ${token}` },
            });

            setPoints(res.data.points || []);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOnce();
        intervalRef.current = setInterval(fetchOnce, intervalMs);
        return () => clearInterval(intervalRef.current);
    }, []);

    const byStatus = useMemo(() => {
        return points.reduce((acc, p) => {
            const estado = p[3] ?? "N/A";
            acc[estado] = (acc[estado] || 0) + 1;
            return acc;
        }, {});
    }, [points]);

    return { points, loading, error, byStatus, reload: fetchOnce };
}
