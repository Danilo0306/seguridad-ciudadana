// mobile/src/services/api.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = "http://192.168.18.5:8000/api";

// Crear instancia de axios con configuración base
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor para agregar el token automáticamente y manejar FormData
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('access');
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // 🔧 Si es FormData, eliminar Content-Type para que Axios lo establezca automáticamente con boundary
        if (config.data instanceof FormData) {
            console.log("📦 [API] Detectado FormData - Content-Type será establecido automáticamente por Axios");
            delete config.headers['Content-Type'];
        } else {
            console.log("📋 [API] Enviando JSON - Content-Type: application/json");
            config.headers['Content-Type'] = 'application/json';
        }
        
        console.log("🔐 [API] Token:", token ? "✅ Presente" : "❌ NO presente");
        console.log("📌 [API] URL:", config.url);
        console.log("📊 [API] Método:", config.method.toUpperCase());
        
        return config;
    },
    (error) => {
        console.error("❌ [API] Error en interceptor request:", error);
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si el error es 401 y no hemos intentado refrescar el token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refresh = await AsyncStorage.getItem('refresh');
                if (refresh) {
                    const { data } = await axios.post(`${BASE_URL}/refresh`, { refresh });
                    await AsyncStorage.setItem('access', data.access);

                    // Reintentar la petición original con el nuevo token
                    originalRequest.headers.Authorization = `Bearer ${data.access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Si falla el refresh, cerrar sesión
                await AsyncStorage.multiRemove(['access', 'refresh', 'idUsuario', 'role', 'username', 'email']);
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

//=======================================FUNCIONES==================================================================

// Funciones del API para DetalleAlerta
// ==============MOSTRAR TODAS LAS ALERTAS DE LA TABLA DetalleAlerta====================
export const alertasAPI = {
    // Obtener todas las alertas desde /todas_alertas/  <===== esto está definido en urls.py
    getAlertas: async () => {
        const response = await api.get('/todas_alertas/');
        return response.data;
    },
    // Obtener historial de incidentes desde /historial/incidentes/
    getHistorialIncidentes: async () => {
        const response = await api.get('/historial/incidentes/');
        return response.data;
    },
    // Crear una nueva alerta/incidencia en DetalleAlerta
    createAlerta: async (alertData) => {
        try {
            // Si es FormData, usar fetch directamente (más confiable en React Native)
            if (alertData instanceof FormData) {
                console.log("📦 [createAlerta] FormData detectado - usando FETCH directo");
                const token = await AsyncStorage.getItem('access');
                
                const response = await fetch(BASE_URL + '/registrar-incidente/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        // ✅ NO incluir Content-Type - fetch auto-detecta multipart/form-data
                    },
                    body: alertData,
                });

                console.log("📊 [Fetch] Status:", response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("❌ Error response:", errorText);
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                console.log("✅ [Fetch] Respuesta:", data);
                return data;
            } else {
                // JSON: usar axios con interceptor normal
                console.log("📋 [createAlerta] JSON - usando axios");
                const response = await api.post('/registrar-incidente/', alertData);
                return response.data;
            }
        } catch (error) {
            console.error("❌ [createAlerta] Error:", error.message);
            throw error;
        }
    },
};

export default api;
