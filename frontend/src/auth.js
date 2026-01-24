import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api";

export async function login(username, password) {
  const { data } = await axios.post(`${BASE_URL}/login`, { username, password });

  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  localStorage.setItem("idUsuario", data.idUsuario);
  localStorage.setItem("role", data.role);                // 👈 del backend
  localStorage.setItem("username", data.username || "");
  localStorage.setItem("email", data.email || "");
}

export async function refreshToken() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return null;
  const { data } = await axios.post(`${BASE_URL}/refresh`, { refresh });
  localStorage.setItem("access", data.access);
  return data.access;
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("idUsuario");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
  localStorage.removeItem("email");
}

export function isLoggedIn() {
  return !!localStorage.getItem("access");
}

export function getRole() {
  return localStorage.getItem("role") || "user";
}
