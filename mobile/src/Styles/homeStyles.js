// HomeStyles.js
import { Dimensions, StyleSheet, Platform, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Exporta esta constante para usarla en el componente Home
export const CARD_WIDTH = width * 0.45;

// ===================================================================
// 💡 CONSTANTES DE COLOR
export const COLORS = {
  primary: "#1a237e", 
  secondary: "#ff9f43",
  success: "#4caf50",
  warning: "#f0ad4e",
  danger: "#ff6b6b",
  inactive: "#999",
  background: "#f5f5f5",
  white: "#ffffff",
  border: "#E0E0E0",
  shadow: "#00000020",
  textDark: "#333",
  textLight: "#666",
  darkPrimary: "#0d124b",
};

// Opciones de Incidentes y su escala (Prioridad)
export const INCIDENT_TYPES = {
  'Selecciona el Tipo de Alerta': 'No determinado',
  'Robo en tienda': 'Alta',
  'Asalto a persona': 'Alta',
  'Vandalismo': 'Media',
  'Fuga de agua': 'Baja',
  'Incendio': 'Alta',
};
export const INCIDENT_OPTIONS = Object.keys(INCIDENT_TYPES);

// Tabs
export const TAB_ITEMS = [
  { id: "principal", icon: "home-outline", activeIcon: "home", label: "Inicio", iconType: Ionicons },
  { id: "mapa", icon: "map-outline", activeIcon: "map", label: "Mapa", iconType: Ionicons },
  { id: "crear", icon: "add-circle-outline", activeIcon: "add-circle", label: "Crear", iconType: Ionicons },
  { id: "alertas", icon: "alert-circle-outline", activeIcon: "alert-circle", label: "Alertas", iconType: Ionicons },
  { id: "perfil", icon: "person-outline", activeIcon: "person", label: "Perfil", iconType: Ionicons },
];

// ===================================================================
// STYLESHEET ARREGLADO
export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contentContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },

  // Placeholder
  placeholder: {
    flex: 1, justifyContent: "center", alignItems: "center", borderRadius: 20,
    backgroundColor: COLORS.white, padding: 20,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  placeholderTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.primary, marginBottom: 15 },

  // Botones
  button: {
    padding: 15, borderRadius: 12, marginTop: 20,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  buttonText: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },

  // PERFIL
  profileContainer: {
    backgroundColor: COLORS.white, padding: 20,
    borderRadius: 15, marginBottom: 20, marginTop: 5,
    shadowColor: COLORS.shadow, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3,
  },
  profileTitle: {
    fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginBottom: 15,
  },
  profileText: {
    fontSize: 16, color: COLORS.textDark, marginBottom: 5,
  },
  logoutButton: { backgroundColor: COLORS.danger },
  exportButton: { backgroundColor: COLORS.warning },

  // HEADER
  headerContainer: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 15, backgroundColor: COLORS.white,
  },
  greetingText: { fontSize: 20, color: COLORS.textDark },
  userNameText: { fontSize: 26, fontWeight: "bold", color: COLORS.textDark, marginTop: 2 },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  headerIconButton: {
    width: 45, height: 45, borderRadius: 22.5, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center', marginLeft: 10,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  notificationBadge: {
    position: 'absolute', top: 5, right: 5, width: 8, height: 8,
    borderRadius: 4, backgroundColor: COLORS.danger,
    borderWidth: 1.5, borderColor: COLORS.white,
  },

  // RESUMEN
  summaryCard: {
    backgroundColor: COLORS.primary, padding: 25,
    borderRadius: 20, marginBottom: 20, marginTop: 5,
    shadowColor: COLORS.primary, shadowOpacity: 0.3,
    shadowRadius: 15, elevation: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  summaryTitle: { fontSize: 16, color: COLORS.white, opacity: 0.8 },
  summaryValue: { fontSize: 40, fontWeight: 'bold', color: COLORS.white, marginTop: 5 },
  summaryAddButton: {
    width: 45, height: 45, borderRadius: 22.5,
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
    position: 'absolute', right: 20, top: 20,
  },

  // LISTA PENDIENTES
  pendingCard: {
    width: CARD_WIDTH, height: 140, padding: 15, borderRadius: 15,
    marginRight: 15, justifyContent: 'space-between',
  },
  pendingIconBg: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
  },
  pendingTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.white, marginTop: 10 },
  pendingPriority: { fontSize: 12, fontWeight: '600', color: COLORS.white },

  // ALERTAS RESUELTAS
  resolvedCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    paddingVertical: 15, paddingHorizontal: 10,
    borderRadius: 12, marginBottom: 8,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  resolvedIconBg: {
    width: 45, height: 45, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  resolvedDetails: { flex: 1 },
  resolvedTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  resolvedDate: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  resolvedValueContainer: { alignItems: 'flex-end' },
  resolvedValue: { fontSize: 15, fontWeight: 'bold' },
  resolvedUser: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  // ----------------------------
  // TAB BAR NUEVO
  tabBarContainerNew: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 75,
  },
  tabRowNew: {
    flexDirection: "row", justifyContent: "space-around", alignItems: 'flex-start',
    height: 75, backgroundColor: COLORS.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 5, paddingTop: 10,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 10,
  },
  tabButtonNew: {
    flex: 1, alignItems: "center", paddingVertical: 5, justifyContent: 'flex-start',
    minWidth: 50,
  },
  centerButtonWrapperNew: {
    width: 70, height: 75, justifyContent: 'center', alignItems: 'center',
  },
  centerButtonNew: {
    width: 65, height: 65, borderRadius: 32.5,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 40, shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5,
    shadowRadius: 10, elevation: 15,
    borderWidth: 4, borderColor: COLORS.background,
  },
  tabLabelNew: {
    fontSize: 11, fontWeight: '600', marginTop: 4,
  },

  // ----------------------------
  // MODAL (Diseño Moderno y Limpio - Única Versión)
  // ----------------------------
  modalOverlay: {
    // Ocupa toda la pantalla para el fondo sombreado
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', // Oscurece más el fondo
    justifyContent: 'center', 
    alignItems: 'center',
  },
  modalContainer: {
    // Contenedor principal con estética mejorada
    width: '85%', 
    maxHeight: '95%', // Deja espacio arriba y abajo
    backgroundColor: COLORS.white, 
    borderRadius: 20, // Más redondeado
    padding: 25, // Mayor padding interno
    
    // Sombra más elegante y profunda
    shadowColor: COLORS.shadow, 
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35, 
    shadowRadius: 20, 
    elevation: 15,
    
    alignItems: 'center',
  },
  modalHeaderSimplified: {
    width: '100%', 
    alignItems: 'center', 
    marginBottom: 20,
    borderBottomWidth: 1, // Separador sutil
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  modalTitleSimplified: {
    fontSize: 22, 
    fontWeight: '800', // Más negrita
    color: COLORS.primary, // Usar color primario
  },

  modalBody: {
    width: '100%', 
    flexGrow: 0, 
    marginBottom: 10,
  },

  // --- INPUTS & CAMPOS ---

  // Input de Ubicación (Ligeramente diferente)
  locationInput: {
    fontSize: 15, 
    color: COLORS.textDark,
    paddingVertical: 12, 
    backgroundColor: COLORS.background, // Usa el color de fondo general
    borderWidth: 0, // Remover bordes, usar el fondo como contraste
    borderRadius: 10, 
    paddingHorizontal: 15,
    fontWeight: '600',
    marginBottom: 15,
  },

  // Input de Texto (Descripción)
  textInput: {
    width: '100%', 
    backgroundColor: COLORS.background, // Fondo ligero
    padding: 12,
    borderRadius: 10, // Más redondeado
    fontSize: 15, 
    color: COLORS.textDark,
    borderWidth: 1, 
    borderColor: COLORS.border, // Borde sutil
    marginTop: 5,
  },

  descriptionHint: {
    fontSize: 12, 
    color: COLORS.textLight, 
    marginTop: 5, 
    marginBottom: 15, 
    textAlign: 'left', 
    width: '100%',
  },

  // Escala/Prioridad
  scaleText: {
    fontSize: 18, 
    fontWeight: '800', 
    marginTop: 15,
    marginBottom: 20, 
    textAlign: 'center', 
    width: '100%',
  },

  // --- DROPDOWN (Selector de Incidente) ---
  dropdownInput: {
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 10, // Más redondeado
    marginTop: 15, 
    backgroundColor: COLORS.white, 
    justifyContent: 'space-between',
    paddingRight: 15,
  },
  dropdownText: {
    flex: 1, 
    fontSize: 15, 
    padding: 12, 
    color: COLORS.textDark,
    fontWeight: '600', // Texto del selector más visible
  },
  dropdownIcon: { 
    paddingRight: 0, 
    color: COLORS.primary, // Ícono de flecha con color de acento
  },

  pickerOptionsContainer: {
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 10,
    width: '100%', 
    maxHeight: 180, 
    overflow: 'hidden',
    marginTop: -10, // Ajustar para que se vea conectado al dropdown
    marginBottom: 15,
    shadowColor: COLORS.shadow, // Sombra para opciones abiertas
    shadowOpacity: 0.1, 
    shadowRadius: 5, 
    elevation: 3,
  },
  pickerOption: { 
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background, // Separador de opciones
  },
  pickerOptionSelected: { 
    backgroundColor: COLORS.background, 
  },
  pickerOptionText: { 
    color: COLORS.textDark, 
    fontSize: 15,
  },


  // --- ADJUNTOS (EVIDENCIA) ---
  fileSelectorContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    width: '100%',
    justifyContent: 'space-between',
  },
  fileSelectButton: {
    backgroundColor: COLORS.secondary, // Color de acento para la acción
    paddingHorizontal: 15, 
    paddingVertical: 10,
    borderRadius: 10, 
    flexDirection: 'row', 
    alignItems: 'center',
    flexShrink: 0, // No se encoge
    shadowColor: COLORS.shadow, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3,
  },
  fileSelectButtonText: {
    color: COLORS.white, // Texto en blanco sobre fondo secundario
    fontSize: 14, 
    fontWeight: '700',
  },
  fileStatusText: {
    marginLeft: 15, 
    fontSize: 13, 
    color: COLORS.textLight,
    flexShrink: 1,
    textAlign: 'right',
  },

  attachmentsList: {
    width: '100%', 
    marginTop: 15, 
    padding: 15,
    backgroundColor: COLORS.background, // Fondo diferente para la previsualización
    borderRadius: 10,
    borderWidth: 1, 
    borderColor: COLORS.border,
  },
  attachmentItem: {
    fontSize: 14, color: COLORS.textLight, marginTop: 5,
    flexDirection: 'row', alignItems: 'center',
  },

  // --- FOOTER MODAL & BOTONES ---
  modalFooterButtons: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%', 
    paddingTop: 20,
  },

  // El estilo 'button' base ya está definido arriba. Aquí se usan para el modal.
  saveButton: {
    backgroundColor: COLORS.primary, 
    marginLeft: 10,
    flex: 1, // Asegura que los botones ocupen el mismo espacio
    marginHorizontal: 5,
  },
  saveButtonText: {
    color: COLORS.white, 
    fontWeight: '800', // Más énfasis
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: COLORS.background, 
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1, // Asegura que los botones ocupen el mismo espacio
    marginHorizontal: 5,
  },
  cancelButtonText: {
    color: COLORS.textDark, // Texto oscuro para el botón secundario
    fontWeight: '700',
    fontSize: 16,
  },
}); // ¡Cierre correcto del StyleSheet.create!