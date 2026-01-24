import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { UserContext } from "../../theme/UserContext";
import * as ImagePicker from "expo-image-picker";

const BASE_URL = "http://192.168.1.9:8000/api";

export default function EditarPerfil({ navigation }) {
  const { userData, setUserData } = useContext(UserContext);

  const [username, setUsername] = useState(userData?.nombre || "");
  const [correo, setCorreo] = useState(userData?.correo || userData?.email || "");
  const [imagen, setImagen] = useState(userData?.imagen || null);
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const token = userData?.access;

  const cambiarImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setImagen(result.assets[0].uri);
    }
  };

  const guardarCambios = async () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Nombre obligatorio";
    if (!correo.trim()) newErrors.correo = "Correo obligatorio";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      // ---------- 🔥 FORM DATA (obligatorio para imagen) ----------
      const formData = new FormData();
      formData.append("nombre", username);
      formData.append("correo", correo);

      // Si seleccionó imagen nueva → se adjunta
      if (imagen && imagen.startsWith("file")) {
        formData.append("imagen", {
          uri: imagen,
          name: "perfil.jpg",
          type: "image/jpeg",
        });
      }

      console.log("DEBUG: Enviando FormData...");

      await axios.patch(`${BASE_URL}/perfil-usuario/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // ---------- CAMBIO DE PASSWORD ----------
      if (newPassword.length >= 6) {
        await axios.post(
          `${BASE_URL}/cambiar-password/`,
          { nueva: newPassword },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // ---------- ACTUALIZAR CONTEXTO ----------
      const actualizado = { ...userData, nombre: username, correo, email: correo, imagen };
      setUserData(actualizado);
      await AsyncStorage.setItem("user", JSON.stringify(actualizado));

      navigation.replace("HomeUsuario");
    } catch (error) {
      console.log("ERROR EN PATCH:", error.response?.data || error.message);
      setErrors({ general: "No se pudo actualizar el perfil" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={cambiarImagen}>
        <Image
          source={{ uri: imagen || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
          style={styles.avatar}
        />
      </TouchableOpacity>

      <TextInput
        style={[styles.input, errors.username && styles.inputError]}
        placeholder="Nombre"
        value={username}
        onChangeText={setUsername}
      />
      {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

      <TextInput
        style={[styles.input, errors.correo && styles.inputError]}
        placeholder="Correo"
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
      />
      {errors.correo && <Text style={styles.errorText}>{errors.correo}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Nueva contraseña"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

      <TouchableOpacity style={styles.btn} onPress={guardarCambios} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "Guardando..." : "Guardar Cambios"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  backText: { fontSize: 18, color: "#1E90FF", marginBottom: 20 },
  avatar: { width: 140, height: 140, borderRadius: 80, alignSelf: "center", marginBottom: 10 },
  input: { borderWidth: 1, padding: 10, marginBottom: 15, borderRadius: 5 },
  inputError: { borderColor: "red", borderWidth: 2 },
  errorText: { color: "red", fontSize: 13, marginBottom: 10, marginLeft: 5 },
  btn: { backgroundColor: "#007bff", padding: 15, borderRadius: 5, marginTop: 10 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
