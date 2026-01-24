from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password
from .models import Usuario, DetalleAlerta, AtencionReporte


# 🔹 Registro de usuario (se guarda en la tabla Usuario)
class RegistroSerializer(serializers.ModelSerializer):
    contra = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ('idUsuario', 'nombre', 'correo', 'contra')

    def create(self, validated_data):
        validated_data['contra'] = make_password(validated_data['contra'])  # 🔐 Encriptar contraseña
        user = Usuario.objects.create(**validated_data)
        return user


# 🔹 Login (valida usuario con nombre y contra)
class LoginSerializer(serializers.Serializer):
    nombre = serializers.CharField()
    contra = serializers.CharField(write_only=True)

    def validate(self, data):
        nombre = data.get("nombre")
        contra = data.get("contra")

        try:
            usuario = Usuario.objects.get(nombre=nombre)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError("Usuario no encontrado")

        if not check_password(contra, usuario.contra):
            raise serializers.ValidationError("Contraseña incorrecta")

        # Retorna datos útiles del usuario
        return {
            "idUsuario": usuario.idUsuario,
            "nombre": usuario.nombre,
            "correo": usuario.correo,
        }


# 🔹 Serializador para DetalleAlerta
class DetalleAlertaSerializer(serializers.ModelSerializer):
    Archivo = serializers.SerializerMethodField()

    class Meta:
        model = DetalleAlerta
        fields = '__all__'

    def get_Archivo(self, obj):
        request = self.context.get('request')
        if obj.Archivo and hasattr(obj.Archivo, 'url'):
            # Devuelve la URL completa del archivo
            return request.build_absolute_uri(obj.Archivo.url)
        return None
    
    def validate_Escala(self, value):
        if value not in [1, 2, 3, 4]:
            raise serializers.ValidationError("Escala inválida. Debe ser 1, 2, 3 o 4")
        return value

# Inicio Serializador para Historial de Incidentes
class HistorialIncidenteSerializer(serializers.ModelSerializer):
    usuario = serializers.SerializerMethodField()
    estado = serializers.SerializerMethodField()
    Escala = serializers.SerializerMethodField()

    class Meta:
        model = DetalleAlerta
        fields = (
            "idTipoIncidencia",
            "FechaHora",
            "usuario",
            "Ubicacion",
            "NombreIncidente",
            "Descripcion",
            "Escala",
            "estado",
        )

    def get_usuario(self, obj):
        # idUsuario es FK a Usuario (puede ser null)
        return obj.idUsuario.nombre if getattr(obj, "idUsuario", None) else None

    def get_estado(self, obj):
        # 1) Priorizar el estado persistido en DetalleAlerta (usado por Gestión)
        estado_directo = getattr(obj, "EstadoIncidente", None)
        if estado_directo:
            return estado_directo

        # 2) Fallback legacy: última atención (si existe)
        ar = (
            AtencionReporte.objects
            .filter(idTipoIncidencia=obj)
            .select_related("idEstadoReporte")
            .order_by("-FechaHoraAtencion")
            .first()
        )
        if ar and getattr(ar, "idEstadoReporte", None):
            return ar.idEstadoReporte.Tipo
        return "Pendiente"

    def get_Escala(self, obj):
        # usa helper del modelo si existe
        try:
            return obj.escala_label()
        except Exception:
            # fallback: devolver el número
            return getattr(obj, "Escala", None)

# Fin Serializador para Historial de Incidentes

# ---------------- NUEVOS SERIALIZERS PARA GESTIÓN ----------------

class GestionIncidenteSerializer(serializers.ModelSerializer):
    usuario = serializers.SerializerMethodField()
    estado = serializers.CharField(source='EstadoIncidente')
    Escala = serializers.SerializerMethodField()  # devolver etiqueta legible

    class Meta:
        model = DetalleAlerta
        fields = (
            "idTipoIncidencia",
            "FechaHora",
            "Ubicacion",
            "NombreIncidente",
            "Descripcion",
            "Escala",   # ahora es etiqueta
            "usuario",
            "estado",
        )

    def get_usuario(self, obj):
        return getattr(getattr(obj, "idUsuario", None), "nombre", None)

    def get_Escala(self, obj):
        # Si Escala tiene choices, usa el display de Django
        try:
            label = obj.get_Escala_display()
            if label:
                return label
        except Exception:
            pass
        # Fallback: mapear códigos comunes a etiquetas
        value = getattr(obj, "Escala", None)
        mapping = {
            1: "Baja", 2: "Media", 3: "Alta",
            "1": "Baja", "2": "Media", "3": "Alta",
            0: "Baja", "0": "Baja",
        }
        return mapping.get(value, value)

class IncidenteEstadoUpdateSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(
        choices=[c[0] for c in DetalleAlerta.ESTADO_INCIDENTE_CHOICES]
    )

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'archivos_alertas')