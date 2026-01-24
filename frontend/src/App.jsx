
// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import DashUsuario from "./pages/Vista_usuario/DashUsuario";
import Inicio from "./pages/inicio/inicio";
import Login from "./pages/LoginPage";
import ResetPassword from "./pages/ResetPassword";
import MapCalor from "./pages/Vista_Administrador/maps/MapaDeCalor/mapCalor";

const isAuthenticated = () => !!localStorage.getItem("access");

const ProtectedRoute = ({ children }) =>
  isAuthenticated() ? children : <Navigate to="/login" replace />;

const AdminRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return localStorage.getItem("role") === "admin"
    ? children
    : <Navigate to="/no-autorizado" replace />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/mapCalor" element={<MapCalor />} />
        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/dashUsuario"
          element={
            <ProtectedRoute>
              <DashUsuario />
            </ProtectedRoute>
          }
        />
        




        {/* Redirigir por defecto */}

        {/* Redirigir por defecto a la página principal */}

        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </Router>
  );
}
