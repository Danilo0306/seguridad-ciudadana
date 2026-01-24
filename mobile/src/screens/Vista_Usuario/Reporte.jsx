import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors"; // Ajusta si tienes centralizado

const Reporte = ({ isVisible, onClose, onSave }) => {
  const [title, setTitle] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [location, setLocation] = useState("Ubicación automática activada");
  const [prioridad, setPrioridad] = useState("Alta");
  const [attachments, setAttachments] = useState([]);

  // Simular adjuntar archivo
  const handleAddAttachment = () => {
    const newAttachment = {
      id: Date.now(),
      name: "Foto/Video adjuntado",
    };
    setAttachments((prev) => [...prev, newAttachment]);
  };

  const handleSave = () => {
    if (!title || !descripcion || !location) {
      Alert.alert("Campos requeridos", "Complete todos los campos obligatorios.");
      return;
    }

    const incidenceData = {
      nombre: title,
      descripcion,
      location,
      prioridad,
      attachments,
    };

    onSave(incidenceData); // Enviar datos a HomeUsuario
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescripcion("");
    setLocation("Ubicación automática activada");
    setPrioridad("Alta");
    setAttachments([]);
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View className="flex-1 bg-black/40 justify-center p-4">
        <View className="bg-white p-5 rounded-2xl">

          {/* Título */}
          <Text className="text-xl font-bold mb-3">Reportar Nueva Incidencia</Text>

          {/* Campo Título */}
          <Text className="font-semibold">Título *</Text>
          <TextInput
            className="border p-2 mt-1 rounded-lg"
            placeholder="Escribe un título..."
            value={title}
            onChangeText={setTitle}
          />

          {/* Descripción */}
          <Text className="font-semibold mt-3">Descripción *</Text>
          <TextInput
            className="border p-2 mt-1 rounded-lg h-20"
            placeholder="Describe la incidencia..."
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
          />

          {/* Ubicación */}
          <Text className="font-semibold mt-3">Ubicación *</Text>
          <TextInput
            className="border p-2 mt-1 rounded-lg"
            value={location}
            editable={false}
          />

          {/* Prioridad */}
          <Text className="font-semibold mt-3">Prioridad</Text>
          <View className="flex-row gap-2 mt-1">
            {["Alta", "Media", "Baja"].map((p) => (
              <TouchableOpacity
                key={p}
                className={`px-3 py-1 rounded-xl border ${
                  prioridad === p ? "bg-blue-600 border-blue-600" : "border-gray-400"
                }`}
                onPress={() => setPrioridad(p)}
              >
                <Text className={`${
                  prioridad === p ? "text-white" : "text-gray-700"
                }`}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Adjuntos */}
          <View className="flex-row justify-between items-center mt-4">
            <Text className="font-semibold">Adjuntos</Text>
            <TouchableOpacity onPress={handleAddAttachment}>
              <Ionicons name="attach" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={attachments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Text className="text-gray-600 mt-1">• {item.name}</Text>
            )}
            style={{ maxHeight: 100 }}
          />

          {/* Botones */}
          <View className="flex-row justify-end mt-5 gap-3">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-red-600 font-semibold">Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSave}>
              <Text className="text-blue-600 font-semibold">Crear</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

export default CrearIncidenciaModal;
