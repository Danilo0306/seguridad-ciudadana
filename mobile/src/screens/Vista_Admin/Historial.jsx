import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { alertasAPI } from '../../services/api';

const Historial = () => {
    const { theme } = useTheme();

    const [incidentes, setIncidentes] = useState([]);
    const [filtrados, setFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filtro, setFiltro] = useState('todas'); // 'todas' | 'pendientes' | 'proceso' | 'resueltas'

    useEffect(() => {
        cargarHistorial();
    }, []);

    useEffect(() => {
        aplicarFiltros();
    }, [filtro, incidentes]);

    const cargarHistorial = async () => {
        try {
            setLoading(true);
            const data = await alertasAPI.getHistorialIncidentes();

            // Normalizar a estructura usada en tarjetas
            const normalizados = (data || []).map((item) => ({
                id: item.idTipoIncidencia,
                fecha: item.FechaHora,
                usuario: item.usuario,
                ubicacion: item.Ubicacion,
                nombre_incidente: item.NombreIncidente,
                descripcion: item.Descripcion,
                escalaLabel: item.Escala, // viene como etiqueta legible del serializer
                estado: item.estado,
            }));

            setIncidentes(normalizados);
        } catch (error) {
            console.error('Error al cargar historial:', error);
            let msg = 'No se pudo cargar el historial.';
            if (error.response) {
                msg = `Error ${error.response.status}: ${error.response.data?.error || 'Error del servidor'}`;
            } else if (error.request) {
                msg = 'No se pudo conectar con el servidor. Verifica tu conexión.';
            }
            Alert.alert('Error', msg, [{ text: 'OK' }]);
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        let items = [...incidentes];

        if (filtro !== 'todas') {
            const estadoMap = {
                pendientes: 'Pendiente',
                proceso: 'En proceso',
                resueltas: 'Resuelto',
            };
            const estadoBuscado = estadoMap[filtro];
            items = items.filter((x) => x.estado === estadoBuscado);
        }

        // Ordenar por fecha descendente
        items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setFiltrados(items);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await cargarHistorial();
        setRefreshing(false);
    }, []);

    const formatFecha = (fecha) => {
        const d = new Date(fecha);
        return d.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const escalaColor = (label) => {
        const l = String(label || '').toLowerCase();
        if (l.includes('alta') || l.includes('alto')) return '#F44336';
        if (l.includes('media') || l.includes('medio')) return '#FF9800';
        if (l.includes('baja') || l.includes('bajo')) return '#4CAF50';
        return '#9E9E9E';
    };

    const estadoColor = (estado) => {
        switch (estado) {
            case 'Pendiente':
                return '#FF9800';
            case 'En proceso':
                return '#2196F3';
            case 'Resuelto':
                return '#4CAF50';
            default:
                return '#9E9E9E';
        }
    };

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Historial de Incidentes</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
                {filtrados.length} {filtrados.length === 1 ? 'incidente' : 'incidentes'}
            </Text>
        </View>
    );

    const renderFiltros = () => (
        <View style={[styles.filtrosContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity
                style={[styles.filtroBtn, { backgroundColor: theme.filtroBg }, filtro === 'todas' && { backgroundColor: theme.filtroActiveBg }]}
                onPress={() => setFiltro('todas')}
            >
                <Text style={[styles.filtroText, { color: theme.textSecondary }, filtro === 'todas' && { color: '#fff' }]}>Todas</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.filtroBtn, { backgroundColor: theme.filtroBg }, filtro === 'pendientes' && { backgroundColor: theme.filtroActiveBg }]}
                onPress={() => setFiltro('pendientes')}
            >
                <Text style={[styles.filtroText, { color: theme.textSecondary }, filtro === 'pendientes' && { color: '#fff' }]}>Pendientes</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.filtroBtn, { backgroundColor: theme.filtroBg }, filtro === 'proceso' && { backgroundColor: theme.filtroActiveBg }]}
                onPress={() => setFiltro('proceso')}
            >
                <Text style={[styles.filtroText, { color: theme.textSecondary }, filtro === 'proceso' && { color: '#fff' }]}>En Proceso</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.filtroBtn, { backgroundColor: theme.filtroBg }, filtro === 'resueltas' && { backgroundColor: theme.filtroActiveBg }]}
                onPress={() => setFiltro('resueltas')}
            >
                <Text style={[styles.filtroText, { color: theme.textSecondary }, filtro === 'resueltas' && { color: '#fff' }]}>Resueltas</Text>
            </TouchableOpacity>
        </View>
    );

    const renderItem = ({ item }) => (
        <View style={[styles.card, { backgroundColor: theme.surface, shadowColor: theme.cardShadow }]}>
            {/* Header escala + estado */}
            <View style={[styles.cardHeader, { backgroundColor: escalaColor(item.escalaLabel) }]}>
                <View style={styles.headerContent}>
                    <Ionicons name="warning" size={20} color="#fff" />
                    <Text style={styles.escalaText}>{item.escalaLabel || 'Escala'}</Text>
                </View>
                <View style={[styles.estadoBadge, { backgroundColor: estadoColor(item.estado) }]}>
                    <Text style={styles.estadoText}>{item.estado}</Text>
                </View>
            </View>

            {/* Contenido */}
            <View style={styles.cardContent}>
                <Text style={[styles.titulo, { color: theme.textPrimary }]} numberOfLines={2}>
                    {item.nombre_incidente}
                </Text>

                {item.usuario && (
                    <View style={styles.detailRow}>
                        <Ionicons name="person" size={16} color={theme.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>
                            {item.usuario}
                        </Text>
                    </View>
                )}

                <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color={theme.textSecondary} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>
                        {item.ubicacion}
                    </Text>
                </View>

                {item.descripcion && (
                    <Text style={[styles.descripcion, { color: theme.textSecondary }]} numberOfLines={3}>
                        {item.descripcion}
                    </Text>
                )}

                <View style={styles.footer}>
                    <View style={styles.detailRow}>
                        <Ionicons name="time" size={14} color={theme.textMuted} />
                        <Text style={[styles.fechaText, { color: theme.textMuted }]}>{formatFecha(item.fecha)}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="information-circle-outline" size={64} color="#ccc" />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                {filtro === 'todas'
                    ? 'No hay incidentes para mostrar'
                    : `No hay incidentes ${filtro === 'pendientes' ? 'pendientes' : filtro === 'proceso' ? 'en proceso' : 'resueltos'}`}
            </Text>
            <TouchableOpacity style={styles.recargarBtn} onPress={cargarHistorial}>
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.recargarText}>Recargar</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Cargando historial...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                data={filtrados}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                ListHeaderComponent={() => (
                    <>
                        {renderHeader()}
                        {renderFiltros()}
                    </>
                )}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2196F3']}
                        tintColor="#2196F3"
                    />
                }
                contentContainerStyle={filtrados.length === 0 && styles.emptyList}
            />
        </View>
    );
};

export default Historial;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#999',
        marginTop: 4,
    },
    filtrosContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    filtroBtn: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 4,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
    },
    filtroText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
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
    cardHeader: {
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
    cardContent: {
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyList: {
        flexGrow: 1,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    recargarBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#2196F3',
        borderRadius: 8,
    },
    recargarText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
});
