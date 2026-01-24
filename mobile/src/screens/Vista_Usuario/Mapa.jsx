import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// ⚠️ IMPORTANTE: Necesitas haber instalado esta librería con: npx expo install react-native-maps
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; 
import { Ionicons } from "@expo/vector-icons";

// Define los colores y constantes necesarios (puedes importarlos si los separaste en styles.js)
const COLORS = {
  primary: "#1a237e", 
  danger: "#ff6b6b", 
  secondary: "#ff9f43",
  background: "#f5f5f5", 
  textDark: "#333",
  white: "#ffffff",
};

// Ubicación central predeterminada (Ejemplo: Centro de Lima, Perú)
const INITIAL_REGION = {
  latitude: -12.04639,  
  longitude: -77.04278, 
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Función auxiliar para obtener el color del pin según la prioridad
const getPinColor = (prioridad) => {
    switch (prioridad) {
        case 'Alta':
            return 'red';
        case 'Media':
            return 'orange';
        case 'Baja':
        case 'Resuelta':
            return 'green';
        default:
            return COLORS.primary; 
    }
};

const MapScreen = ({ data }) => {
    
    // Filtramos las incidencias que tienen coordenadas válidas
    const markers = data.filter(item => item.coords && item.coords.lat && item.coords.lon);

    return (
        <View style={mapStyles.container}>
            <MapView
                // Usar PROVIDER_GOOGLE garantiza usar Google Maps (si está configurado)
                provider={PROVIDER_GOOGLE} 
                style={mapStyles.map}
                initialRegion={INITIAL_REGION}
                showsUserLocation={true}
                showsMyLocationButton={true}
                // Si quieres centrar el mapa en la primera incidencia o en la zona de incidencias, 
                // necesitarías lógica adicional (ej: fitToCoordinates)
            >
                {markers.map((item) => (
                    <Marker
                        key={item.id}
                        coordinate={{ 
                            latitude: item.coords.lat, 
                            longitude: item.coords.lon 
                        }}
                        title={item.nombre}
                        description={`${item.estado} (${item.prioridad})`}
                        pinColor={getPinColor(item.prioridad)} // Colorea el pin
                    />
                ))}
            </MapView>
            
            <View style={mapStyles.legendContainer}>
                <Text style={mapStyles.legendText}>
                    🔴 **Alta** | 🟠 **Media** | 🟢 **Resuelta/Baja**
                </Text>
            </View>
        </View>
    );
};

const mapStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        // Usa este estilo para que el mapa ocupe todo el espacio disponible
        ...StyleSheet.absoluteFillObject,
    },
    legendContainer: {
        position: 'absolute',
        bottom: 5,
        alignSelf: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 8,
        borderRadius: 10,
        marginHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textDark,
    }
});

export default MapScreen;