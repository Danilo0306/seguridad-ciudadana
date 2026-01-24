import React from "react";
import { Heatmap } from "react-native-maps";

export default function HeatmapLayerCustom({
    points = [],
    radius = 35,
    opacity = 0.7,
    color = "blue",
}) {

    // Convertir puntos al formato requerido por react-native-maps
    const heatPoints = points.map(([lat, lng, w = 1]) => ({
        latitude: lat,
        longitude: lng,
        weight: w,
    }));

    // Gradientes según color asignado
    const gradients = {
        blue: {
            colors: ["#ADD8E6", "#0000FF"],
            startPoints: [0.2, 0.8],
            colorMapSize: 256,
        },
        red: {
            colors: ["#FFB3B3", "#FF0000"],
            startPoints: [0.2, 0.8],
            colorMapSize: 256,
        },
    };

    return (
        <Heatmap
            points={heatPoints}
            radius={radius}
            opacity={opacity}
            gradient={gradients[color]}
        />
    );
}
