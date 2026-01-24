import { useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Alertas from './DetalleAlerta';
import Personal from './Personal';
import MapadeAlertas from './MapadeAlertas';
import Historial from './Historial';
import Gestion from './Gestion';

import { useTheme } from '../../theme/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { logout } from "../../services/auth";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75;

const DashboardAdmin = ({ onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Dashboard');
  const slideAnim = useState(new Animated.Value(-MENU_WIDTH))[0];
  const { theme } = useTheme();

  const toggleMenu = () => {
    const toValue = menuOpen ? -MENU_WIDTH : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setMenuOpen(!menuOpen);
  };

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
    toggleMenu();
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const menuItems = [
    { name: 'Dashboard', screen: 'Dashboard' },
    { name: 'Alertas', screen: 'Alertas' },
    { name: 'Personal', screen: 'Personal' },
    { name: 'Mapa de Alertas', screen: 'MapadeAlertas' },
    { name: 'Historial', screen: 'Historial' },
    { name: 'Gestión', screen: 'Gestion' },
  ];

  const renderContent = () => {
    switch (currentScreen) {
      case 'Dashboard': return <Text style={styles.contentText}>Bienvenido al Dashboard</Text>;
      case 'Alertas': return <Alertas />;
      case 'Personal': return <Personal />;
      case 'MapadeAlertas': return <MapadeAlertas />;
      case 'Historial': return <Historial />;
      case 'Gestion': return <Gestion />;
      default: return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* HEADER dentro del área segura */}
      <SafeAreaView
        edges={['top']}
        style={[styles.header, { backgroundColor: theme.headerBg }]}
      >
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Text style={{ color: theme.headerText, fontSize: 24 }}>☰</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.headerText }]}>
          SEGURIDAD
        </Text>

        <ThemeToggle />
      </SafeAreaView>

      {/* CONTENIDO PRINCIPAL */}
      <View style={styles.mainContent}>
        {renderContent()}
      </View>

      {/* OVERLAY */}
      {menuOpen && (
        <TouchableOpacity
          style={[styles.overlay]}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      {/* MENÚ LATERAL */}
      <Animated.View
        style={[
          styles.sideMenu,
          {
            transform: [{ translateX: slideAnim }],
            backgroundColor: theme.surface,
          },
        ]}
      >
        <View style={[styles.menuHeader, { backgroundColor: theme.headerBg }]}>
          <Text style={[styles.menuLogo, { color: theme.headerText }]}>MENÚ</Text>
        </View>

        <ScrollView>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigateTo(item.screen)}
            >
              <Text style={[styles.menuItemText, { color: theme.textPrimary }]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.menuItem, { marginTop: 20 }]}
            onPress={handleLogout}
          >
            <Text style={[styles.menuItemText, { color: 'red' }]}>
              Cerrar sesión
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },

  menuButton: { width: 40, justifyContent: 'center', alignItems: 'center' },

  headerTitle: { fontSize: 18, fontWeight: 'bold' },

  mainContent: { flex: 1, padding: 20 },

  contentText: { fontSize: 18, color: '#333' },

  overlay: {
    position: 'absolute',
    top: 60 + 40, // margen extra del notch
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  sideMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: MENU_WIDTH,
    elevation: 10,
    paddingTop: 50, // margen seguro arriba
  },

  menuHeader: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuLogo: { fontSize: 20, fontWeight: 'bold' },

  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
  },

  menuItemText: { fontSize: 16 },
});

export default DashboardAdmin;
