import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import LottieView from 'lottie-react-native';
import { register } from "../services/auth";
import { Ionicons } from '@expo/vector-icons';

export default function Register({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleRegister = async () => {
    const newErrors = {};
    if (!nombre.trim()) newErrors.nombre = "Nombre obligatorio";
    if (!correo.trim()) newErrors.correo = "Correo obligatorio";
    else if (!correo.includes("@")) newErrors.correo = "Correo inválido";
    if (!contraseña.trim()) newErrors.contraseña = "Contraseña obligatoria";
    else if (contraseña.length < 6) newErrors.contraseña = "Mínimo 6 caracteres";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const data = await register(nombre, correo, contraseña);
      if (data.success || data.message === "Usuario creado") {
        navigation.navigate("Login"); // 🔹 redirige directo al login
      } else {
        setErrors({ general: data.message || "No se pudo registrar" });
      }
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <LottieView 
          style={{ width: 300, height: 300 }} 
          source={require('../../assets/Secure.json')}
          autoPlay
          loop
        />
      </View>

      <Text style={styles.title}>Crear Cuenta</Text>

      <TextInput
        style={[styles.input, errors.nombre && styles.inputError]}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
        onFocus={() => setErrors(prev => ({ ...prev, nombre: null }))}
      />
      {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}

      <TextInput
        style={[styles.input, errors.correo && styles.inputError]}
        placeholder="Correo electrónico"
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

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Registrar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
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
