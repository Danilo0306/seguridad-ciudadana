// mobile/src/screens/DetalleAlerta.jsx
//MUESTRA DE DETALLE ALERTAS
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { alertasAPI } from '../../services/api';
import AlertCard from '../../components/ComponentsAdmin/DetalleAlerta/AlertCard';
import { useTheme } from '../../theme/ThemeContext';

const Inicio = ({ navigation }) => {
    const [alertas, setAlertas] = useState([]);
    const [alertasFiltradas, setAlertasFiltradas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filtro, setFiltro] = useState('todas'); // 'todas', 'pendientes', 'proceso', 'resueltas'
    const { theme } = useTheme();

    // Cargar alertas al montar el componente
    useEffect(() => {
        cargarAlertas();
    }, []);

    // Aplicar filtros cuando cambie el filtro o las alertas
    useEffect(() => {
        aplicarFiltros();
    }, [filtro, alertas]);

    const cargarAlertas = async () => {
        try {
            setLoading(true);

            // Llamar al endpoint /todas_alertas/
            const data = await alertasAPI.getAlertas();

            console.log('✅ Alertas cargadas:', data.length);

            // Las alertas vienen en el formato de tu vista todas_alertas
            setAlertas(data);
        } catch (error) {
            console.error('❌ Error al cargar alertas:', error);

            // Mostrar mensaje de error más específico
            let errorMsg = 'No se pudieron cargar las alertas.';
            if (error.response) {
                errorMsg = `Error ${error.response.status}: ${error.response.data?.error || 'Error del servidor'}`;
            } else if (error.request) {
                errorMsg = 'No se pudo conectar con el servidor. Verifica tu conexión.';
            }

            Alert.alert('Error', errorMsg, [{ text: 'OK' }]);
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        let filtradas = [...alertas];

        if (filtro !== 'todas') {
            const estadoMap = {
                'pendientes': 'Pendiente',
                'proceso': 'En proceso',
                'resueltas': 'Resuelto'
            };

            const estadoBuscado = estadoMap[filtro];
            filtradas = filtradas.filter(a => a.estado === estadoBuscado);
        }

        // Ordenar por fecha más reciente
        filtradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        setAlertasFiltradas(filtradas);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await cargarAlertas();
        setRefreshing(false);
    }, []);

    const handleAlertaPress = (alerta) => {
        // Navegar a pantalla de detalle
        // navigation.navigate('DetalleAlerta', { alerta });

        // Por ahora mostramos un alert con los detalles
        Alert.alert(
            alerta.nombre_incidente,
            `Ubicación: ${alerta.ubicacion}\n` +
            `Descripción: ${alerta.descripcion || 'Sin descripción'}\n` +
            `Estado: ${alerta.estado}\n` +
            `Fecha: ${new Date(alerta.fecha).toLocaleString('es-PE')}`,
            [{ text: 'OK' }]
        );
    };

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Alertas Activas</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
                {alertasFiltradas.length} {alertasFiltradas.length === 1 ? 'alerta' : 'alertas'}
            </Text>
        </View>
    );

    const renderFiltros = () => (
        <View style={[styles.filtrosContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity
                style={[styles.filtroBtn, { backgroundColor: theme.filtroBg }, filtro === 'todas' && { backgroundColor: theme.filtroActiveBg } ]}
                onPress={() => setFiltro('todas')}
            >
                <Text style={[styles.filtroText, { color: theme.textSecondary }, filtro === 'todas' && { color: '#fff' }]}>
                    Todas
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.filtroBtn, { backgroundColor: theme.filtroBg }, filtro === 'pendientes' && { backgroundColor: theme.filtroActiveBg } ]}
                onPress={() => setFiltro('pendientes')}
            >
                <Text style={[styles.filtroText, { color: theme.textSecondary }, filtro === 'pendientes' && { color: '#fff' }]}>
                    Pendientes
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.filtroBtn, { backgroundColor: theme.filtroBg }, filtro === 'proceso' && { backgroundColor: theme.filtroActiveBg } ]}
                onPress={() => setFiltro('proceso')}
            >
                <Text style={[styles.filtroText, { color: theme.textSecondary }, filtro === 'proceso' && { color: '#fff' }]}>
                    En Proceso
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.filtroBtn, { backgroundColor: theme.filtroBg }, filtro === 'resueltas' && { backgroundColor: theme.filtroActiveBg } ]}
                onPress={() => setFiltro('resueltas')}
            >
                <Text style={[styles.filtroText, { color: theme.textSecondary }, filtro === 'resueltas' && { color: '#fff' }]}>
                    Resueltas
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="information-circle-outline" size={64} color="#ccc" />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                {filtro === 'todas'
                    ? 'No hay alertas para mostrar'
                    : `No hay alertas ${filtro === 'pendientes' ? 'pendientes' : filtro === 'proceso' ? 'en proceso' : 'resueltas'}`
                }
            </Text>
            <TouchableOpacity style={styles.recargarBtn} onPress={cargarAlertas}>
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.recargarText}>Recargar</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Cargando alertas...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }] }>
            <FlatList
                data={alertasFiltradas}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <AlertCard alerta={item} onPress={handleAlertaPress} />
                )}
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
                contentContainerStyle={alertasFiltradas.length === 0 && styles.emptyList}
            />
        </View>
    );
};

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
    filtroActivo: {
        backgroundColor: '#2196F3',
    },
    filtroText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    filtroTextoActivo: {
        color: '#fff',
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

export default Inicio;