import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import LottieView from 'lottie-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { login } from "../services/auth";
import { UserContext } from "../theme/UserContext";
import { Ionicons } from '@expo/vector-icons';

export default function Login({ navigation, onLogin }) {
  const { setUserData } = useContext(UserContext);

  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLogin = async () => {
    const newErrors = {};
    if (!correo.trim()) newErrors.correo = "Correo/Usuario obligatorio";
    if (!contraseña.trim()) newErrors.contraseña = "Contraseña obligatoria";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const data = await login(correo, contraseña);

      // Guardar datos en contexto - asegurar que tenga nombre
      const dataWithName = {
        ...data,
        nombre: data.nombre || data.username || correo.split("@")[0] || "Usuario"
      };
      setUserData(dataWithName);

      // ===============================
      // 🚀 CONDICIÓN @admin.com
      // ===============================
      const email = (data.email || "").toLowerCase();
      const role = email.endsWith("@admin.com") ? "admin" : "user";

      // Enviar el rol correcto a la app
      onLogin(role);

    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFingerprint = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) return setErrors({ general: "Biometría no disponible" });
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) return setErrors({ general: "No hay huellas registradas" });
    } catch (error) {
      setErrors({ general: "Problema con la autenticación biométrica" });
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <LottieView
          style={{ width: 220, height: 220 }}
          source={require('../../assets/data_security.json')}
          autoPlay
          loop
        />
      </View>

      <Text style={styles.title}>Iniciar Sesión</Text>

      <TextInput
        style={[styles.input, errors.correo && styles.inputError]}
        placeholder="Correo electrónico/Usuario"
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
        onFocus={() => setErrors(prev => ({ ...prev, correo: null }))}
      />
      {errors.correo && <Text style={styles.errorText}>{errors.correo}</Text>}

      <View style={styles.passwordWrapper}>
        <TextInput
          style={[styles.inputPassword, errors.contraseña && styles.inputError]}
          placeholder="Contraseña"
          value={contraseña}
          onChangeText={setContraseña}
          secureTextEntry={!showPassword}
          onFocus={() => setErrors(prev => ({ ...prev, contraseña: null }))}
        />
        <TouchableOpacity 
          style={styles.eyeButton} 
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons name={showPassword ? "eye" : "eye-off"} size={24} color="gray" />
        </TouchableOpacity>
      </View>
      {errors.contraseña && <Text style={styles.errorText}>{errors.contraseña}</Text>}

      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Ingresar</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: "#444", marginTop: 10 }]}
        onPress={handleFingerprint}
      >
        <Text style={styles.btnText}>Iniciar con Huella</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 30 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 25, textAlign: "center" },
  input: { borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 5 },
  inputPassword: { borderWidth: 1, padding: 12, borderRadius: 8, paddingRight: 45 },
  passwordWrapper: { position: 'relative', marginBottom: 15 },
  eyeButton: { position: 'absolute', right: 10, top: 12 },
  inputError: { borderColor: 'red', borderWidth: 2 },
  errorText: { color: 'red', fontSize: 13, marginBottom: 10, marginLeft: 5 },
  btn: { backgroundColor: "#1E90FF", padding: 14, borderRadius: 8, marginTop: 10 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  link: { marginTop: 20, textAlign: "center", color: "#1E90FF", fontWeight: "500" },
});
