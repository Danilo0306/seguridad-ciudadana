import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
// auth.js
const BASE_URL = "http://192.168.18.5:8000/api";

// ======================================================
// 🔹 LOGIN
// ======================================================
export async function login(correo, contraseña) {
  try {
    // ⚡ Ajusta según tu backend: username o email
    const { data } = await axios.post(`${BASE_URL}/login`, {
      username: correo.trim(), // si tu backend acepta email, usa email: correo.trim()
      password: contraseña.trim()
    }, {
      headers: { "Content-Type": "application/json" }
    });

    // Guardamos solo tokens y datos de usuario, NO la contraseña
    await AsyncStorage.multiSet([
      ["access", data.access],
      ["refresh", data.refresh],
      ["idUsuario", String(data.idUsuario)],
      ["role", data.role || "user"],
      ["nombre", data.nombre || data.username || data.first_name || data.email || ""],
      ["correo", correo],
    ]);

    return { ...data, role: data.role || "user" };

  } catch (error) {
    console.log("AXIOS LOGIN ERROR:", error.response?.data);
    throw new Error(
      error.response?.data?.non_field_errors
        ? error.response?.data?.non_field_errors[0]
        : "Error de conexión al iniciar sesión"
    );
  }
}

// ======================================================
// 🔹 REGISTRO
// ======================================================
export async function register(nombre, correo, contraseña) {
  try {
    const { data } = await axios.post(`${BASE_URL}/registro`, {
      username: nombre.trim(), 
      email: correo.trim(),
      password: contraseña.trim()
    }, {
      headers: { "Content-Type": "application/json" }
    });

    return data;

  } catch (error) {
    throw new Error(error.response?.data?.error || "Error de conexión al registrar");
  }
}

// ======================================================
// 🔹 LOGOUT
// ======================================================
export async function logout() {
  await AsyncStorage.multiRemove([
    "access",
    "refresh",
    "idUsuario",
    "role",
    "nombre",
    "correo",
  ]);
}

// ======================================================
// 🔹 CHECK LOGIN
// ======================================================
export async function isLoggedIn() {
  const access = await AsyncStorage.getItem("access");
  return !!access;
}

// ======================================================
// 🔹 GET ROLE
// ======================================================
export async function getRole() {
  const role = await AsyncStorage.getItem("role");
  return role || "user";
}
