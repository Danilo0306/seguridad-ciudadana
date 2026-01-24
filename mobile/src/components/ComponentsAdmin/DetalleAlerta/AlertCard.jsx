// mobile/src/components/AlertCard.js
//TRABAJA CON DETALLE ALERTAS DE SCREENS/INICIO.JSX
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';

const AlertCard = ({ alerta, onPress }) => {
    const getEscalaColor = (escala) => {
        // Basado en tu modelo: 1=Bajo, 2=Medio, 3=Alto, 4=Pendiente
        switch (escala) {
            case 1: return '#4CAF50'; // Verde - Bajo
            case 2: return '#FF9800'; // Naranja - Medio
            case 3: return '#F44336'; // Rojo - Alto
            case 4: return '#9E9E9E'; // Gris - Pendiente
            default: return '#9E9E9E';
        }
    };

    const getEscalaLabel = (escala) => {
        switch (escala) {
            case 1: return 'Bajo';
            case 2: return 'Medio';
            case 3: return 'Alto';
            case 4: return 'Pendiente';
            default: return 'Desconocido';
        }
    };

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'Pendiente': return '#FF9800';
            case 'En proceso': return '#2196F3';
            case 'Resuelto': return '#4CAF50';
            default: return '#9E9E9E';
        }
    };

    const formatFecha = (fecha) => {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const { theme } = useTheme();
    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.surface, shadowColor: theme.cardShadow }]}
            onPress={() => onPress(alerta)}
            activeOpacity={0.7}
        >
            {/* Header con escala */}
            <View style={[styles.header, { backgroundColor: getEscalaColor(alerta.escala) }]}>
                <View style={styles.headerContent}>
                    <Ionicons name="warning" size={20} color="#fff" />
                    <Text style={styles.escalaText}>
                        {getEscalaLabel(alerta.escala)}
                    </Text>
                </View>
                <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(alerta.estado) }]}>
                    <Text style={styles.estadoText}>{alerta.estado}</Text>
                </View>
            </View>

            {/* Contenido */}
            <View style={styles.content}>
                <Text style={[styles.titulo, { color: theme.textPrimary }]} numberOfLines={2}>
                    {alerta.nombre_incidente}
                </Text>

                <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color={theme.textSecondary} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>
                        {alerta.ubicacion}
                    </Text>
                </View>

                {alerta.descripcion && (
                    <Text style={[styles.descripcion, { color: theme.textSecondary }]} numberOfLines={2}>
                        {alerta.descripcion}
                    </Text>
                )}

                <View style={styles.footer}>
                    <View style={styles.detailRow}>
                        <Ionicons name="time" size={14} color={theme.textMuted} />
                        <Text style={[styles.fechaText, { color: theme.textMuted }]}>
                            {formatFecha(alerta.fecha)}
                        </Text>
                    </View>

                    {(alerta.latitud && alerta.longitud) && (
                        <View style={styles.detailRow}>
                            <Ionicons name="map" size={14} color="#2196F3" />
                            <Text style={styles.coordText}>
                                {alerta.latitud.toFixed(4)}, {alerta.longitud.toFixed(4)}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    escalaText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    estadoBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    estadoText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    content: {
        padding: 16,
    },
    titulo: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailText: {
        fontSize: 14,
        marginLeft: 6,
        flex: 1,
    },
    descripcion: {
        fontSize: 13,
        marginTop: 6,
        marginBottom: 8,
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    fechaText: {
        fontSize: 12,
        marginLeft: 4,
    },
    coordText: {
        fontSize: 11,
        color: '#2196F3',
        marginLeft: 4,
    },
});

export default AlertCard;
``