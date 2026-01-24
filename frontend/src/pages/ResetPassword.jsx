import React, { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function ResetPassword() {
  const { token } = useParams(); // capturamos el token de la URL
  const [password, setPassword] = useState("");

  const handleChangePassword = async () => {
  try {
    await axios.post(`http://localhost:8000/api/cambio-contrasena/${token}`, {
      password,
    });
    alert("Contraseña cambiada con éxito ✅");
  } catch (error) {
    console.error(error); // 🔹 muestra detalles en consola
    alert(
      "Error al cambiar contraseña ❌ " +
        (error.response?.data?.error || error.message)
    );
  }
};



  return (
    <div style={{ width: "300px", margin: "50px auto", textAlign: "center" }}>
      <h2>Cambiar Contraseña</h2>
      <input
        type="password"
        placeholder="Nueva contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleChangePassword}>Actualizar</button>
    </div>
  );
}
