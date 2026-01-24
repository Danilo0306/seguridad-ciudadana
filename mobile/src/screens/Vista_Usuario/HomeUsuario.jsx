import React, { useState, useEffect, useMemo, useCallback, useContext } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Platform,
    Dimensions,
    StatusBar,
    Alert,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Image,
}
    from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// Importaciones requeridas para las nuevas funcionalidades
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

// Importaciones existentes
import MapScreen from './Mapa.jsx';
import { Ionicons } from "@expo/vector-icons";
import ExcelJS from "exceljs";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { UserContext } from "../../theme/UserContext";
import { alertasAPI } from "../../services/api";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.4;
const CHART_HEIGHT = 200;

// ===================================================================
// 💡 CONSTANTES Y OPCIONES CENTRALES
const COLORS = {
    primary: "#1a237e", // Azul Noche (Principal)
    secondary: "#ff9f43", // Naranja (para prioridad MEDIA)
    success: "#4caf50", // Verde (para estado Resuelta)
    warning: "#f0ad4e", // Amarillo/Naranja (para estado En Proceso)
    danger: "#ff6b6b", // Rojo (para estado Pendiente y prioridad ALTA)
    inactive: "#999",
    background: "#f5f5f5",
    white: "#ffffff",
    border: "#E0E0E0",
    shadow: "#00000020",
    textDark: "#333",
    textLight: "#666",
    // Nuevo color para fondo oscuro de tarjetas (Azul Noche Oscuro)
    darkPrimary: "#0d124b",
    // Nuevo color para seleccionar incidentes
    incidentHigh: "#FFEBEB", // Fondo suave para incidente Alto (Robo, Secuestro)
    incidentMedium: "#FFF7EB", // Fondo suave para incidente Medio
    incidentLow: "#EBEDFF", // Fondo suave para incidente Bajo
};

// ===== ESCALAS =====
const ESCALAS = [
    { id: "1", nombre: "Bajo" },
    { id: "2", nombre: "Medio" },
    { id: "3", nombre: "Alto" },
    { id: "4", nombre: "Pendiente (por asignar)" },
];

// ===== INCIDENTES COMUNES (con ícono) =====
const INCIDENTES_COMUNES = [
    { nombre: "Robo", escala: "3", icono: "flash" },
    { nombre: "Secuestro", escala: "3", icono: "hand-left" },
    { nombre: "Incendio", escala: "2", icono: "flame" },
    { nombre: "Pelea callejera", escala: "2", icono: "people" },
    { nombre: "Amenaza", escala: "2", icono: "warning" },
    { nombre: "Vandalismo", escala: "1", icono: "brush" },
    { nombre: "Pérdida de mascota", escala: "1", icono: "paw" },
    { nombre: "Otro", escala: "4", icono: "help-circle" },
];

// Opciones de Incidentes y su escala (Prioridad) - Compatibilidad hacia atrás
const INCIDENT_TYPES = Object.fromEntries(
    INCIDENTES_COMUNES.map(inc => [inc.nombre, inc.escala])
);
const INCIDENT_OPTIONS = Object.keys(INCIDENT_TYPES);

const TAB_ITEMS = [
    { id: "principal", icon: "home-outline", activeIcon: "home", label: "Inicio", iconType: Ionicons },
    { id: "mapa", icon: "map-outline", activeIcon: "map", label: "Mapa", iconType: Ionicons },
    { id: "crear", icon: "add-circle-outline", activeIcon: "add-circle", label: "Crear", iconType: Ionicons },
    { id: "alertas", icon: "alert-circle-outline", activeIcon: "alert-circle", label: "Alertas", iconType: Ionicons },
    { id: "perfil", icon: "person-outline", activeIcon: "person", label: "Perfil", iconType: Ionicons },
];
// ===================================================================

const ScreenPlaceholder = ({ title, children }) => (
    <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>{title}</Text>
        {children}
    </View>
);

// 💡 COMPONENTE HEADER CON BOTÓN DE CERRAR SESIÓN AÑADIDO
const Header = ({ userName, onLogout }) => (
    <View style={styles.headerContainer}>
        <View>
            <Text style={styles.greetingText}>Hola,</Text>
            <Text style={styles.userNameText}>{userName}</Text>
        </View>
        <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIconButton}>
                <Ionicons name="search-outline" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton}>
                <Ionicons name="notifications-outline" size={24} color={COLORS.textDark} />
                <View style={styles.notificationBadge} />
            </TouchableOpacity>
            {/* 👈 BOTÓN DE CERRAR SESIÓN EN LA ESQUINA */}
            <TouchableOpacity
                style={styles.headerIconButton}
                onPress={onLogout}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Cerrar sesión"
            >
                <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
            </TouchableOpacity>
        </View>
    </View>
);

// --- Componente de Tarjeta de Incidencia Pendiente (Usado en Home) ---
const PendingIncidenceCard = ({ item }) => {
    // ... (código de PendingIncidenceCard sin cambios)
    const iconName = item.icono || "alert-circle";
    const title = item.nombre;
    const priority = item.prioridad; // Puede ser string "Alta" o número "3"
    const daysLeft = Math.floor(Math.random() * 5 + 1);

    // Mapear prioridad a color (soporta tanto string como número)
    let priorityColor = COLORS.primary;
    let priorityText = priority;

    if (priority === '3' || priority === 'Alta') {
        priorityColor = COLORS.danger;
        priorityText = 'Alta';
    } else if (priority === '2' || priority === 'Media') {
        priorityColor = COLORS.secondary;
        priorityText = 'Media';
    } else if (priority === '1' || priority === 'Bajo') {
        priorityColor = COLORS.primary;
        priorityText = 'Bajo';
    }

    return (
        <View style={[styles.pendingCard, { backgroundColor: COLORS.darkPrimary }]}>
            <View style={styles.pendingIconBg}>
                <Ionicons name={iconName} size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.pendingTitle} numberOfLines={1}>{title}</Text>
            <Text style={[styles.pendingPriority, { color: priorityColor }]}>
                {priorityText} • {daysLeft} días activo
            </Text>
            <TouchableOpacity style={styles.pendingOptions}>
                <Ionicons name="ellipsis-vertical" size={18} color={COLORS.white} />
            </TouchableOpacity>
        </View>
    );
};// --- Componente de Transacción Reciente (Incidencia Resuelta/En Proceso - Usado en Home) ---
const ResolvedIncidenceCard = ({ item }) => {
    // ... (código de ResolvedIncidenceCard sin cambios)
    const iconName = item.icono || "checkmark-circle";
    const date = item.fecha;
    const time = item.hora;
    const userInitials = item.usuario.initials;
    const status = item.estado === 'Resuelta' ? 'Finalizada' : 'En Proceso';
    const isResolved = item.estado === 'Resuelta';
    const impactColor = isResolved ? COLORS.success : COLORS.warning;

    return (
        <View style={styles.resolvedCard}>
            <View style={[styles.resolvedIconBg, { backgroundColor: isResolved ? '#e8f5e9' : '#fffde7' }]}>
                <Ionicons name={iconName} size={22} color={COLORS.primary} />
            </View>

            <View style={styles.resolvedDetails}>
                <Text style={styles.resolvedTitle}>{item.nombre}</Text>
                <Text style={styles.resolvedDate}>{date}, {time}</Text>
            </View>

            <View style={styles.resolvedValueContainer}>
                <Text style={[styles.resolvedValue, { color: impactColor }]}>{status}</Text>
                <Text style={styles.resolvedUser}>{userInitials}</Text>
            </View>
        </View>
    );
};

// --- Componente StatCard (Usado en Home y Mapa) ---
const StatCard = ({ title, value, icon, color }) => (
    // ... (código de StatCard sin cambios)
    <View style={[styles.statCard, { borderLeftColor: color }]}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
    </View>
);

// --- NUEVO Componente para las opciones del Selector de Incidente (SIMPLIFICADO) ---
const IncidentPickerOption = ({ incident, isSelected, onPress }) => {
    // Hemos eliminado la lógica de colores, iconos y escala.

    // Color de fondo y borde simple.
    const bgColor = COLORS.white;
    // Borde azul si está seleccionado, gris claro si no lo está.
    const borderColor = isSelected ? COLORS.primary : COLORS.border;

    return (
        <TouchableOpacity
            style={[
                styles.simplifiedIncidentOption,
                { backgroundColor: bgColor, borderColor: borderColor },
            ]}
            onPress={() => onPress(incident)}
        >
            {/* Solo mostramos el nombre del incidente */}
            <Text style={styles.incidentOptionTitleSimplified}>
                {incident}
            </Text>

            {/* Marcador de selección, útil para el usuario */}
            {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />}
        </TouchableOpacity>
    );
};


// --- COMPONENTE MODAL PARA CREAR INCIDENCIA ---
const CreateIncidenceModal = ({ isVisible, onClose, onSave }) => {
    // ⚠️ ATENCIÓN: TODOS LOS HOOKS DEBEN ESTAR AL INICIO E INCONDICIONALMENTE
    const [currentLocation, setCurrentLocation] = useState('Obteniendo ubicación...');
    const [coords, setCoords] = useState(null);
    const [selectedIncident, setSelectedIncident] = useState("");
    const [description, setDescription] = useState('');
    // Guardaremos objetos de adjuntos { uri, name, type } para el FormData
    const [attachments, setAttachments] = useState([]);
    const [scale, setScale] = useState(INCIDENT_TYPES[INCIDENT_OPTIONS[0]]);
    // Para manejar cuando el usuario elige "Otro"
    const [esOtro, setEsOtro] = useState(false);
    const [nombreIncidenteOtro, setNombreIncidenteOtro] = useState("");
    const [isPickerVisible, setIsPickerVisible] = useState(false);

    // 💡 EFECTO: Obtener ubicación al abrir el modal (Mejorado para precisión)
    useEffect(() => {
        // Ejecutamos la lógica SÓLO si el modal está visible.
        if (!isVisible) return;

        (async () => {
            try {
                // Primero solicitar permiso de ubicación
                let { status } = await Location.requestForegroundPermissionsAsync();
                console.log("📍 Estado de permiso de ubicación:", status);

                if (status !== 'granted') {
                    // Pedir al usuario que habilite permisos
                    Alert.alert(
                        "Permiso requerido",
                        "Para obtener la ubicación exacta, necesitamos acceso a tu GPS. ¿Deseas habilitar los permisos?",
                        [
                            {
                                text: "Ahora no", onPress: () => {
                                    setCoords({ lat: -12.0464, lon: -77.0428 });
                                    setCurrentLocation('Lima, Perú (ubicación por defecto)');
                                }
                            },
                            {
                                text: "Ir a Configuración", onPress: () => {
                                    Location.openSettings?.();
                                    setCoords({ lat: -12.0464, lon: -77.0428 });
                                    setCurrentLocation('Lima, Perú (ubicación por defecto)');
                                }
                            }
                        ]
                    );
                    return;
                }

                // Si tenemos permiso, obtener ubicación con máxima precisión
                try {
                    console.log("🔍 Buscando ubicación con alta precisión...");

                    let location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.BestForNavigation, // Máxima precisión
                        timeout: 15000, // Esperar hasta 15 segundos
                        maximumAge: 0, // No usar ubicación en caché
                    });

                    const lat = location.coords.latitude;
                    const lon = location.coords.longitude;
                    setCoords({ lat, lon });

                    // 🔄 Obtener dirección de calle usando reverse geocoding
                    try {
                        const geocodeResult = await Location.reverseGeocodeAsync({
                            latitude: lat,
                            longitude: lon,
                        });

                        if (geocodeResult && geocodeResult.length > 0) {
                            const { street, name, city, region, country, postalCode } = geocodeResult[0];

                            // Construir dirección legible
                            const addressParts = [
                                street || name,
                                city,
                                region,
                                country,
                                postalCode
                            ].filter(Boolean);

                            const fullAddress = addressParts.join(', ');
                            setCurrentLocation(fullAddress);
                        } else {
                            const address = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
                            setCurrentLocation(address);
                        }
                    } catch (geocodeError) {
                        const address = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
                        setCurrentLocation(address);
                    }

                } catch (locationError) {
                    console.warn("⚠️ No se pudo obtener ubicación precisa:", locationError.message);
                    // Fallback a coordenadas si falla geocoding
                    setCoords({ lat: -12.0464, lon: -77.0428 });
                    setCurrentLocation('Lima, Perú (ubicación por defecto)');
                }
            } catch (error) {
                console.error("❌ Error general:", error);
                setCoords({ lat: -12.0464, lon: -77.0428 });
                setCurrentLocation('Lima, Perú (ubicación por defecto)');
            }
        })();
    }, [isVisible]); // El efecto se dispara cuando isVisible cambia.


    // 💡 FUNCIÓN: Abrir cámara y guardar foto/video
    const handleCaptureMedia = async () => {
        // 1. Pedir permisos
        let cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraPermission.status !== 'granted') {
            Alert.alert('Error', 'Necesitas otorgar permiso de cámara para capturar evidencia.');
            return;
        }

        // 2. Pedir al usuario que elija
        Alert.alert(
            "Capturar Evidencia",
            "¿Deseas capturar una foto o un video?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Tomar Foto",
                    onPress: async () => {
                        let pickerResult = await ImagePicker.launchCameraAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: false,
                            quality: 0.7,
                        });
                        if (!pickerResult.canceled && pickerResult.assets.length > 0) {
                            await saveAttachment(pickerResult.assets[0].uri, 'image/jpeg');
                        }
                    }
                },
                {
                    text: "Grabar Video",
                    onPress: async () => {
                        let pickerResult = await ImagePicker.launchCameraAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                            allowsEditing: false,
                            quality: 0.7,
                            maxDuration: 15,
                        });
                        if (!pickerResult.canceled && pickerResult.assets.length > 0) {
                            await saveAttachment(pickerResult.assets[0].uri, 'video/mp4');
                        }
                    }
                },
            ],
            { cancelable: true }
        );
    };

    // 💡 FUNCIÓN: Guardar el archivo en la carpeta local y actualizar estado
    const saveAttachment = async (tempUri, mimeType) => {
        // Crear el directorio de archivos si no existe
        const dirUri = FileSystem.cacheDirectory + 'archivo_mobile/';
        const fileInfo = await FileSystem.getInfoAsync(dirUri);
        if (!fileInfo.exists) {
            await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
        }

        // Crear nombre de archivo único
        const filename = `${new Date().toISOString().replace(/[:.]/g, '-')}.${mimeType.split('/')[1]}`;
        const newUri = dirUri + filename;

        try {
            // Mover/Copiar el archivo temporal a la ubicación deseada
            await FileSystem.moveAsync({
                from: tempUri,
                to: newUri,
            });

            // Agregar a la lista de adjuntos
            const newAttachment = {
                uri: newUri,
                name: filename,
                type: mimeType,
            };

            setAttachments(prev => [...prev, newAttachment]);
            Alert.alert("Éxito", `${mimeType.includes('image') ? 'Foto' : 'Video'} adjuntado y guardado localmente en 'archivo_mobile'.`);

        } catch (error) {
            console.error("❌ Error al guardar el archivo:", error);
            Alert.alert("Error de Archivo", "No se pudo guardar la evidencia localmente.");
        }
    };


    // 💡 FUNCIÓN: Guardar la incidencia
    const handleSave = () => {
        if (!coords) {
            Alert.alert("Campos Requeridos", "Por favor, asegúrese de tener la ubicación GPS.");
            return;
        }

        const nombreFinal = esOtro ? nombreIncidenteOtro : selectedIncident;
        if (!nombreFinal || nombreFinal.trim() === "" || selectedIncident === "") {
            Alert.alert("Campos Requeridos", "Seleccione o especifique el incidente.");
            return;
        }

        const newIncidence = {
            nombre: nombreFinal, // Usar el nombre especificado si es "Otro"
            descripcion: description || "No determinado",
            prioridad: scale,
            location: currentLocation,
            coords: coords,
            attachments: attachments, // Ahora contiene la lista de objetos { uri, name, type }
        };

        onSave(newIncidence);
        // Reset
        setNombreIncidenteOtro("");
        setEsOtro(false);
        setAttachments([]); // Limpiar adjuntos después de guardar
        onClose(); // Cerrar el modal
    };

    // 💡 Lógica para manejar la selección del incidente y la escala
    const handleIncidentChange = (incident) => {
        setSelectedIncident(incident);
        // Buscar la escala para el incidente seleccionado, por defecto "4" (Pendiente) si no se encuentra
        const foundScale = INCIDENT_TYPES[incident] || '4';
        setScale(foundScale);
        setEsOtro(incident === "Otro");
        setIsPickerVisible(false); // Cerrar picker al seleccionar
    };


    const getScaleName = (escalaId) => {
        const escala = ESCALAS.find(e => e.id === String(escalaId));
        return escala ? escala.nombre : 'Desconocido';
    };

    const getScaleColor = (currentScale) => {
        const scaleNum = String(currentScale);
        if (scaleNum === '3') return COLORS.danger;      // Alto - Rojo
        if (scaleNum === '2') return COLORS.secondary;   // Medio - Naranja
        if (scaleNum === '1') return COLORS.primary;     // Bajo - Azul
        return COLORS.primary;                          // Pendiente - Azul
    }


    // ⚠️ Cierre Condicional SEGURO después de todos los Hooks
    if (!isVisible) return null;

    // --- Renderizado del Modal ---
    return (
        <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={styles.modalContainer}>
                {/* Título en el centro */}
                <View style={styles.modalHeaderSimplified}>
                    <Text style={styles.modalTitleSimplified}>Registrar Incidente</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close-circle-outline" size={28} color={COLORS.inactive} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>

                    {/* 1. Ubicación (Output de GPS) */}
                    <Text style={styles.inputLabel}>Ubicación GPS Actual</Text>
                    <TextInput
                        style={[styles.textInput, styles.locationInput, { fontWeight: '600' }]}
                        value={currentLocation}
                        editable={false}
                        placeholderTextColor={COLORS.textDark}
                        multiline
                        numberOfLines={2}
                    />

                    {/* 2. Selector de Incidente */}
                    <Text style={styles.inputLabel}>Tipo de Incidente</Text>
                    <TouchableOpacity
                        style={styles.dropdownInput}
                        onPress={() => setIsPickerVisible(!isPickerVisible)}
                    >
                        <Text style={styles.dropdownText}>
                            {selectedIncident || "Seleccionar incidente"}
                        </Text>
                        <Ionicons
                            name={isPickerVisible ? "chevron-up" : "chevron-down"}
                            size={20}
                            color={COLORS.textDark}
                            style={styles.dropdownIcon}
                        />
                    </TouchableOpacity>

                    {isPickerVisible && (
                        <View style={styles.pickerOptionsContainer}>
                            <ScrollView nestedScrollEnabled={true}>
                                {INCIDENTES_COMUNES.map((incidente) => (
                                    <IncidentPickerOption
                                        key={incidente.nombre}
                                        incident={incidente.nombre}
                                        isSelected={selectedIncident === incidente.nombre}
                                        onPress={handleIncidentChange}
                                    />
                                ))}
                            </ScrollView>
                        </View>
                    )}


                    {/* INPUT para “Otro” */}
                    {esOtro && (
                        <TextInput
                            style={styles.textInput}
                            placeholder="Especifique el incidente (si eligió 'Otro')"
                            placeholderTextColor={COLORS.textLight}
                            value={nombreIncidenteOtro}
                            onChangeText={setNombreIncidenteOtro}
                        />
                    )}


                    {/* 3. Descripción (Opcional) */}
                    <Text style={[styles.inputLabel, { marginTop: esOtro ? 15 : 10 }]}>Descripción (Opcional)</Text>
                    <TextInput
                        style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Detalles adicionales del incidente"
                        placeholderTextColor={COLORS.textLight}
                        autoCapitalize="none"
                        multiline
                    />
                    <Text style={styles.descriptionHint}>
                        Prioridad estimada: **{getScaleName(scale)}**
                    </Text>

                    {/* 4. Selector de Archivo (Botón para abrir Cámara) */}
                    <View style={styles.fileSelectorContainer}>
                        {/* Botón principal para abrir cámara y capturar */}
                        <TouchableOpacity
                            style={styles.fileSelectButton}
                            onPress={handleCaptureMedia}
                        >
                            <Ionicons name="camera-outline" size={20} color={COLORS.primary} style={{ marginRight: 5 }} />
                            <Text style={styles.fileSelectButtonText}>Capturar Evidencia</Text>
                        </TouchableOpacity>
                        <Text style={styles.fileStatusText}>
                            {attachments.length > 0 ? `${attachments.length} archivo(s) adjuntado(s)` : "Sin archivos seleccionados"}
                        </Text>
                    </View>

                    {/* Lista de Adjuntos (Opcional) */}
                    {attachments.length > 0 && (
                        <View style={styles.attachmentsList}>
                            {attachments.map((att, index) => (
                                <View key={index} style={styles.attachmentItem} numberOfLines={1}>
                                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} style={{ marginRight: 5 }} />
                                    <Text style={{ fontSize: 14, color: COLORS.textDark }}>{att.name}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                </ScrollView>

                {/* 5. Botones Guardar y Cancelar */}
                <View style={styles.modalFooterButtons}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={onClose}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.saveButton]}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>Guardar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};


export default function UserHome({ onLogout: onLogoutFromApp }) {
    const { userData } = useContext(UserContext);
    const [activeTab, setActiveTab] = useState("principal"); // Cambiado a 'principal' para iniciar en Home
    const [data, setData] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [activeFilter, setActiveFilter] = useState("Todos");
    const [userName, setUserName] = useState("");
    // --- Estado para la visibilidad del Modal ---
    const [isModalVisible, setIsModalVisible] = useState(false);

    // 💡 FUNCIÓN PARA CARGAR EL NOMBRE DEL USUARIO LOGUEADO
    useEffect(() => {
        const loadUserName = async () => {
            try {
                // Intenta obtener el nombre desde AsyncStorage (guardado en login)
                const storedNombre = await AsyncStorage.getItem('nombre');
                console.log("🔍 Nombre guardado en AsyncStorage:", storedNombre);

                if (storedNombre && storedNombre.trim() !== '') {
                    setUserName(storedNombre);
                    console.log("✅ Nombre cargado desde AsyncStorage:", storedNombre);
                } else if (userData?.nombre && userData.nombre.trim() !== '') {
                    // Si no está en AsyncStorage, intenta desde el contexto
                    setUserName(userData.nombre);
                    console.log("✅ Nombre cargado desde contexto:", userData.nombre);
                } else {
                    // Si no encuentra nada, establece un valor por defecto
                    setUserName("Usuario");
                    console.log("⚠️ No se encontró nombre, usando valor por defecto");
                }
            } catch (error) {
                console.error("❌ Error al cargar el nombre del usuario:", error);
                setUserName("Usuario");
            }
        };
        loadUserName();
    }, [userData]);
    

    // 💡 FUNCIÓN CERRAR SESIÓN
    const navigation = useNavigation();
    const handleLogout = useCallback(() => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás segura de que quieres cerrar tu sesión actual?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Sí, Cerrar Sesión",
                    onPress: async () => {
                        try {
                            // Limpiar datos sensibles de AsyncStorage
                            await AsyncStorage.multiRemove(['access', 'refresh', 'idUsuario', 'role', 'username', 'email', 'nombre']);
                            console.log('🔐 Tokens y datos de sesión eliminados');

                            // Notificar al contenedor (App.js) que cierre sesión
                            // App.js controla qué stack se renderiza mediante `userType`.
                            if (typeof onLogoutFromApp === 'function') {
                                onLogoutFromApp();
                                console.log('🔁 onLogoutFromApp invoked to reset navigation at root');
                            } else {
                                console.warn('⚠️ onLogoutFromApp no está disponible. Si persiste el problema, reinicia la app.');
                            }
                        } catch (e) {
                            console.error('❌ Error al limpiar sesión:', e);
                            Alert.alert('Error', 'No se pudo cerrar sesión correctamente. Intente de nuevo.');
                        }
                    },
                    style: 'destructive',
                }
            ]
        );
    }, [navigation, onLogoutFromApp]);

    useFocusEffect(
        useCallback(() => {
            const loadIncidencias = async () => {
                try {
                    // Obtener el ID del usuario logueado
                    const idUsuario = await AsyncStorage.getItem('idUsuario');
                    console.log("👤 ID del usuario logueado:", idUsuario);

                    // Cargar incidencias desde el backend usando el servicio API
                    const incidencias = await alertasAPI.getAlertas();
                    console.log("📦 Datos crudos del backend:", incidencias);

                    // Filtrar solo las incidencias del usuario logueado
                    // El backend devuelve "usuario" con el ID del usuario
                    const incidenciasDelUsuario = Array.isArray(incidencias)
                        ? incidencias.filter(inc => String(inc.usuario) === String(idUsuario))
                        : [];

                    console.log("🔍 Incidencias filtradas para este usuario:", incidenciasDelUsuario.length);

                    // Mapear los datos del backend al formato esperado por la app
                    const mappedData = incidenciasDelUsuario.map(inc => ({
                        id: inc.id || inc.idTipoIncidencia,
                        nombre: inc.nombre_incidente || inc.nombreIncidente || 'Incidente',
                        fecha: inc.fecha?.split(' ')[0] || new Date().toISOString().split('T')[0],
                        hora: inc.fecha?.split(' ')[1]?.substring(0, 5) || '00:00',
                        estado: inc.estado || 'Pendiente',
                        prioridad: inc.escala === 3 ? 'Alta' : inc.escala === 2 ? 'Media' : 'Baja',
                        usuario: {
                            name: inc.usuario_nombre || 'Usuario',
                            initials: (inc.usuario_nombre || 'U').substring(0, 1)
                        },
                        icono: 'alert-circle-outline',
                        location: inc.ubicacion || 'No especificada',
                        coords: { lat: inc.latitud || 0, lon: inc.longitud || 0 }
                    }));

                    setData(mappedData);
                    console.log("✅ Incidencias del usuario cargadas:", mappedData.length);
                } catch (error) {
                    console.error("❌ Error al cargar incidencias:", error);
                    console.warn("⚠️ Usando datos por defecto");
                    // Datos por defecto en caso de error
                    setData([]);
                }
            };
            loadIncidencias();

            // Cleanup function (optional)
            return () => {
                // Aquí puedes hacer limpieza si es necesario
            };
        }, [])
    );

    // --- Función de Guardado de Incidencia (Estabilizada con useCallback) ---
    const handleSaveIncidence = useCallback(async (newIncidence) => {
        try {
            const currentDate = new Date();

            let requestData;
            let hasAttachments = newIncidence.attachments && newIncidence.attachments.length > 0;

            if (hasAttachments) {
                // Usar FormData para enviar archivos
                requestData = new FormData();
                requestData.append('NombreIncidente', String(newIncidence.nombre));
                requestData.append('Descripcion', String(newIncidence.descripcion || ''));
                requestData.append('Ubicacion', String(newIncidence.location || 'No especificada'));
                requestData.append('escala', String(parseInt(newIncidence.prioridad) || 2));
                requestData.append('Latitud', String(newIncidence.coords?.lat || -12.049));
                requestData.append('Longitud', String(newIncidence.coords?.lon || -77.045));

                // **ADVERTENCIA:** FormData en React Native necesita la propiedad 'uri'
                newIncidence.attachments.forEach((attachment, index) => {
                    // El URI local guardado en saveAttachment
                    let fileUri = attachment.uri;
                    const fileName = attachment.name;
                    const fileType = attachment.type;

                    // ✅ Asegurar que URI tiene el protocolo file://
                    if (!fileUri.startsWith('file://')) {
                        fileUri = 'file://' + fileUri;
                    }

                    if (fileUri) {
                        requestData.append('Archivo', {
                            uri: fileUri,
                            type: fileType,
                            name: fileName,
                        });
                        console.log(`📤 [Archivo ${index}] URI: ${fileUri}`);
                        console.log(`📤 [Archivo ${index}] Nombre: ${fileName}`);
                        console.log(`📤 [Archivo ${index}] Tipo: ${fileType}`);
                    }
                });

                console.log("📤 [FormData] Enviando incidencia con archivos. Datos:", requestData._parts);
            } else {
                // Enviar JSON simple sin archivos
                requestData = {
                    NombreIncidente: newIncidence.nombre,
                    Descripcion: newIncidence.descripcion || '',
                    Ubicacion: newIncidence.location || 'No especificada',
                    escala: parseInt(newIncidence.prioridad) || 2,
                    Latitud: newIncidence.coords?.lat || -12.049,
                    Longitud: newIncidence.coords?.lon || -77.045,
                };
                console.log("📤 [JSON] Enviando incidencia:", JSON.stringify(requestData, null, 2));
            }

            // Enviar al backend
            const response = await alertasAPI.createAlerta(requestData);
            console.log("✅ Incidencia guardada en backend:", response);

            // Crear objeto local para mostrar inmediatamente
            const incidenceWithMetadata = {
                id: response.idTipoIncidencia || Date.now(),
                nombre: newIncidence.nombre,
                fecha: currentDate.toISOString().split('T')[0],
                hora: currentDate.toTimeString().split(' ')[0].substring(0, 5),
                estado: "Pendiente",
                prioridad: newIncidence.prioridad,
                usuario: { name: userName, initials: userName.charAt(0) },
                icono: "alert-circle-outline",
                location: newIncidence.location,
                descripcion: newIncidence.descripcion,
                coords: newIncidence.coords || { lat: -12.049, lon: -77.045 },
            };

            setData(prevData => [incidenceWithMetadata, ...prevData]);
            setIsModalVisible(false);
            Alert.alert("Éxito", `Incidencia "${newIncidence.nombre}" guardada correctamente.`);
            setActiveTab("principal");
        } catch (error) {
            console.error("❌ Error al guardar incidencia:", error);
            console.error("📋 Error config:", error.config);
            console.error("📋 Error response:", error.response?.data);
            console.error("📋 Error status:", error.response?.status);

            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message;
            Alert.alert("Error", `No se pudo guardar la incidencia:\n${errorMsg}`);
        }
    }, [userName]);


    const filteredData = useMemo(() => {
        let result = data;
        if (activeFilter !== "Todos") {
            result = result.filter((item) => item.estado === activeFilter);
        }
        if (searchText) {
            const lowerCaseSearch = searchText.toLowerCase();
            result = result.filter((item) => item.nombre.toLowerCase().includes(lowerCaseSearch));
        }
        return result;
    }, [data, activeFilter, searchText]);

    const exportToExcel = async () => {
        // Lógica de exportación de Excel
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Reporte");
            worksheet.columns = [
                { header: "ID", key: "id", width: 10 }, { header: "Nombre", key: "nombre", width: 25 },
                { header: "Fecha", key: "fecha", width: 20 }, { header: "Estado", key: "estado", width: 15 },
                { header: "Prioridad", key: "prioridad", width: 12 },
            ];
            data.forEach((item) => worksheet.addRow(item));
            // Usar la carpeta 'archivo_mobile' dentro de cacheDirectory
            const dirUri = FileSystem.cacheDirectory + 'archivo_mobile/';
            const fileInfo = await FileSystem.getInfoAsync(dirUri);
            if (!fileInfo.exists) {
                await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
            }
            const fileUri = dirUri + "reporte.xlsx";
            const buffer = await workbook.xlsx.writeBuffer();
            await FileSystem.writeAsStringAsync(fileUri, buffer.toString("base64"), { encoding: FileSystem.EncodingType.Base64 });
            if (!(await Sharing.isAvailableAsync())) {
                Alert.alert("Error", "No se puede compartir este archivo en tu dispositivo");
                return;
            }
            await Sharing.shareAsync(fileUri);
            Alert.alert("Éxito", "Archivo Excel generado correctamente");
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Hubo un problema al generar el Excel");
        }
    };

    const renderActiveScreen = useCallback(() => {
        const totalIncidencias = data.length;
        const pendientes = data.filter(i => i.estado === 'Pendiente');

        switch (activeTab) {
            case "principal":
                return (
                    <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>

                        {/* 1. Resumen de Incidencias */}
                        <View style={styles.summaryCard}>
                            <View>
                                <Text style={styles.summaryTitle}>Incidencias Totales</Text>
                                <Text style={styles.summaryValue}>{totalIncidencias}</Text>
                            </View>
                            {/* BOTÓN PARA ABRIR MODAL DESDE EL RESUMEN */}
                            <TouchableOpacity
                                style={styles.summaryAddButton}
                                onPress={() => setIsModalVisible(true)} // Abrir modal
                            >
                                <Ionicons name="add" size={24} color={COLORS.darkPrimary} />
                            </TouchableOpacity>
                        </View>

                        {/* Pendientes */}
                        <Text className="text-xl font-bold mt-6">Incidencias Pendientes</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                            {data
                                .filter((i) => i.estado === "Pendiente")
                                .map((item) => (
                                    <PendingIncidenceCard key={item.id} item={item} />
                                ))}
                        </ScrollView>

                        {/* 3. Incidencias Recientes (Resueltas/Proceso) */}
                        <View style={[styles.sectionContainer, { marginTop: 25 }]}>
                            <Text style={styles.sectionTitle}>Incidencias Recientes</Text>
                            <TouchableOpacity onPress={() => setActiveTab('mapa')}>
                                <Text style={styles.seeAllText}>Ver todas</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ marginBottom: 10 }}>
                            {data.slice(0, 3).map((inc) => (
                                <ResolvedIncidenceCard key={inc.id} item={inc} />
                            ))}
                        </View>
                    </ScrollView>
                );
            case "mapa":
                return <MapScreen data={data} />;
            case "crear":
                return <ScreenPlaceholder title="➕ Modal Activado" />;
            case "alertas":
                return <ScreenPlaceholder title="⚠️ Alertas y Notificaciones" />;
            case "perfil":
    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            
            {/* Contenedor del perfil */}
            <View style={styles.profileContainer}>
                <Text style={styles.profileTitle}>👤 Perfil de Usuario</Text>
                <Text style={styles.profileText}>Nombre: {userName}</Text>
            </View>

            {/* BOTÓN PARA EDITAR PERFIL */}
            <TouchableOpacity
                style={[styles.button, { backgroundColor: COLORS.primary, marginTop: 10 }]}
                onPress={() => navigation.navigate("EditarPerfil")}
            >
                <Ionicons name="person-circle-outline" size={20} color="#fff" />
                <Text style={[styles.buttonText, { marginLeft: 10, color: "#fff" }]}>
                    Editar Perfil
                </Text>
            </TouchableOpacity>

            {/* BOTÓN PARA EXPORTAR EXCEL */}
            <TouchableOpacity
                style={[styles.button, styles.exportButton]}
                onPress={exportToExcel}
            >
                <Ionicons name="download-outline" size={20} color={COLORS.textDark} />
                <Text style={[styles.buttonText, { marginLeft: 10, color: COLORS.textDark }]}>
                    Exportar Reporte (Excel)
                </Text>
            </TouchableOpacity>

        </ScrollView>
    );
            default:
                return null;
        }
    }, [activeTab, data]);

    // --- FUNCIÓN DE MANEJO DE TABS (ABRE EL MODAL O CAMBIA LA PESTAÑA) ---
    const handleTabPress = (tabId) => {
        if (tabId === 'crear') {
            setIsModalVisible(true);
        } else {
            setActiveTab(tabId);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <Header userName={userName} onLogout={handleLogout} />

            {/* CONTENIDO PRINCIPAL - con padding bottom para la barra */}
            <View style={{ flex: 1, paddingBottom: 85, paddingHorizontal: 12 }}>
                {renderActiveScreen()}
            </View>
            <CurvedBottomBar activeTab={activeTab} onTabPress={handleTabPress} />

            {/* RENDERIZADO DEL MODAL */}
            <CreateIncidenceModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSave={handleSaveIncidence}
            />
        </SafeAreaView>
    );
}

// --- COMPONENTE DE BARRA DE NAVEGACIÓN INFERIOR (Estilo mejorado) ---
const CurvedBottomBar = ({ activeTab, onTabPress }) => {
    return (
        // tabBarContainerNew es el contenedor principal, le ponemos el color de fondo y sombra
        <View style={styles.tabBarContainerNew}>
            <View style={styles.tabRowNew}>
                {TAB_ITEMS.map((tab) => {
                    const Icon = tab.iconType;
                    const isActive = tab.id === activeTab;
                    const isCenter = tab.id === 'crear';

                    // Si es el botón central 'Crear', usamos el estilo flotante
                    if (isCenter) {
                        return (
                            <View key={tab.id} style={styles.centerButtonWrapperNew}>
                                <TouchableOpacity
                                    onPress={() => onTabPress(tab.id)}
                                    style={styles.centerButtonNew}
                                >
                                    <Ionicons name={"add-sharp"} size={32} color={COLORS.white} />
                                </TouchableOpacity>
                            </View>
                        );
                    }

                    // Botones laterales
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => onTabPress(tab.id)}
                            style={styles.tabButtonNew} // Estilo más simple para el botón
                        >
                            <Icon
                                name={isActive ? tab.activeIcon : tab.icon}
                                size={24}
                                color={isActive ? COLORS.primary : COLORS.inactive}
                            />
                            <Text
                                style={[
                                    styles.tabLabelNew,
                                    isActive ? { color: COLORS.primary } : { color: COLORS.inactive }
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};
// ----------------------------------------------------------------------

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    contentContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
    placeholder: {
        flex: 1, justifyContent: "center", alignItems: "center", borderRadius: 20,
        backgroundColor: COLORS.white, padding: 20, shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    },
    placeholderTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.primary, marginBottom: 15 },
    button: {
        // Estilo base para botones grandes
        padding: 15, borderRadius: 12, marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
    // 💡 NUEVOS ESTILOS PARA PERFIL
    profileContainer: {
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
        marginTop: 5,
        shadowColor: COLORS.shadow,
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    profileTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 15,
    },
    profileText: {
        fontSize: 16,
        color: COLORS.textDark,
        marginBottom: 5,
    },
    logoutButton: {
        backgroundColor: COLORS.danger, // Rojo para la acción de logout
    },
    exportButton: {
        backgroundColor: COLORS.warning, // Amarillo/Naranja para exportar
    },
    noResultsText: { textAlign: 'center', color: COLORS.textLight, marginTop: 20 },
    noDataText: { color: COLORS.textLight, marginTop: 5, marginLeft: 5 },

    // ▫ Header
    headerContainer: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 10 : 10,
        paddingBottom: 15, backgroundColor: COLORS.white,
    },
    greetingText: { fontSize: 20, color: COLORS.textDark, fontWeight: 'normal' },
    userNameText: { fontSize: 26, fontWeight: "bold", color: COLORS.textDark, marginTop: 2 },
    headerIcons: { flexDirection: "row", alignItems: "center" },
    headerIconButton: {
        width: 45, height: 45, borderRadius: 22.5, backgroundColor: COLORS.white,
        justifyContent: 'center', alignItems: 'center', marginLeft: 10,
        shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },
    notificationBadge: {
        position: 'absolute', top: 5, right: 5, width: 8, height: 8,
        borderRadius: 4, backgroundColor: COLORS.danger, borderWidth: 1.5, borderColor: COLORS.white,
    },

    // --- ESTILOS PANTALLA PRINCIPAL ---
    summaryCard: {
        backgroundColor: COLORS.primary,
        padding: 25,
        borderRadius: 20,
        marginBottom: 20,
        marginTop: 5,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Alinear al inicio para que el botón + esté arriba
    },
    summaryTitle: { fontSize: 16, color: COLORS.white, opacity: 0.8 },
    summaryValue: { fontSize: 40, fontWeight: 'bold', color: COLORS.white, marginTop: 5 },
    summaryAddButton: {
        // Botón de acción rápida
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute', // Permite que se posicione sobre el fondo azul
        right: 20,
        top: 20,
    },
    sectionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
    seeAllText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
    pendingScroll: { paddingVertical: 5 },
    pendingCard: {
        width: width * 0.45,
        height: 140,
        padding: 15,
        borderRadius: 15,
        marginRight: 15,
        justifyContent: 'space-between',
    },
    pendingIconBg: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pendingTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.white, marginTop: 10 },
    pendingPriority: { fontSize: 12, fontWeight: '600' },
    pendingOptions: { position: 'absolute', top: 15, right: 15 },
    resolvedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    resolvedIconBg: {
        width: 45,
        height: 45,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    resolvedDetails: { flex: 1 },
    resolvedTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
    resolvedDate: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
    resolvedValueContainer: { alignItems: 'flex-end' },
    resolvedValue: { fontSize: 15, fontWeight: 'bold' },
    resolvedUser: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

    // --- Estilos de Historial/Mapa (Solo contenedores genéricos) ---
    containerHistorial: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
    pageTitle: { fontSize: 24, fontWeight: "bold", color: COLORS.textDark, marginBottom: 15 },
    sectionHeader: { fontSize: 18, fontWeight: "600", color: COLORS.textDark, marginTop: 15, marginBottom: 5 },
    textLight: { fontSize: 14, color: COLORS.textLight, marginBottom: 15 },

    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statCard: {
        width: CARD_WIDTH, backgroundColor: COLORS.white, padding: 15, borderRadius: 12, borderLeftWidth: 5,
        shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },
    statTitle: { fontSize: 12, color: COLORS.textLight, marginTop: 5 },
    statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 5 },

    // ----------------------------------------------------------------------
    // ▫ Tab Bar MEJORADOS
    tabBarContainerNew: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 75,
        zIndex: 1000,
    },
    tabRowNew: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: 'flex-start',
        height: 75,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 5,
        paddingTop: 10,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
    },
    tabButtonNew: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 5,
        justifyContent: 'flex-start',
        minWidth: 50,
    },
    centerButtonWrapperNew: {
        width: 70,
        height: 75,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerButtonNew: {
        width: 65,
        height: 65,
        borderRadius: 32.5,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 15,
        borderWidth: 4,
        borderColor: COLORS.background,
    },
    tabLabelNew: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4
    },
    // ----------------------------------------------------------------------


    // --- ESTILOS DEL MODAL (ACTUALIZADO) ---
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '95%', // Aumentado para más espacio
        maxHeight: '95%',
        backgroundColor: COLORS.white,
        borderRadius: 12, // Más redondeado
        padding: 20,
        alignItems: 'center',
    },
    modalHeaderSimplified: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 10,
    },
    closeButton: {
        padding: 5,
    },
    modalTitleSimplified: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    modalBody: {
        width: '100%',
        flexGrow: 0,
        marginBottom: 10,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginTop: 15,
        marginBottom: 5,
    },
    locationInput: {
        fontSize: 14,
        color: COLORS.textDark,
        paddingVertical: 10,
        backgroundColor: COLORS.background, // Fondo diferente para indicar que es solo lectura
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 10,
    },
    // Selector de Incidente (Simulación de Dropdown)
    dropdownInput: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        backgroundColor: COLORS.white,
        justifyContent: 'space-between',
        paddingRight: 10,
    },
    dropdownText: {
        fontSize: 16,
        padding: 12,
        color: COLORS.textDark,
    },
    dropdownIcon: {
        paddingRight: 5,
    },
    // Opciones del Picker
    pickerOptionsContainer: {
        position: "relative", // Cambiado a relative para que fluya en el ScrollView
        marginTop: 10,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        maxHeight: 250, // Altura limitada para scroll
        overflow: "hidden",
        zIndex: 10, // Asegurar que esté sobre otros elementos
    },
    // --- ESTILOS DE OPCIONES TIPO TARJETA (DESACTIVADO/ELIMINADO) ---
    // NO SE USAN MÁS: incidentOptionCard, incidentOptionCardSelected, incidentOptionIcon, incidentOptionDetails, incidentOptionScale

    // --- NUEVOS ESTILOS PARA LAS OPCIONES SIMPLIFICADAS ---
    simplifiedIncidentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginHorizontal: 0,
        marginVertical: 0,
        borderRadius: 0,
        borderWidth: 0,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'space-between',
        backgroundColor: COLORS.white, // Asegurar fondo blanco
    },
    incidentOptionTitleSimplified: {
        fontSize: 16,
        fontWeight: '400',
        color: COLORS.textDark,
        flex: 1,
    },
    // Fin Selector
    textInput: {
        width: '100%',
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        color: COLORS.textDark,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginTop: 5,
    },
    descriptionHint: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 8,
        textAlign: 'left',
        width: '100%',
        fontWeight: '600',
    },
    scaleText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
        textAlign: 'center',
        width: '100%',
    },

    // Contenedor de Archivos
    fileSelectorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        width: '100%',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    fileSelectButton: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: COLORS.shadow,
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 1,
    },
    fileSelectButtonText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    fileStatusText: {
        marginLeft: 15,
        fontSize: 14,
        color: COLORS.textLight,
    },

    // Footer con botones Guardar/Cancelar
    modalFooterButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '100%',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginLeft: 10,
        marginTop: 0,
        width: 110,
    },
    saveButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        backgroundColor: COLORS.inactive, // Gris para cancelar
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 0,
        width: 110,
    },
    cancelButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },

    attachmentsList: {
        width: '100%',
        marginTop: 10,
        padding: 10,
        backgroundColor: COLORS.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    attachmentItem: {
        fontSize: 14,
        color: COLORS.textLight,
        marginTop: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
});