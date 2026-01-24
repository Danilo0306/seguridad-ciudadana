# api/views.py — imports depurados y organizados

# ===== Standard library =====
from datetime import datetime, timedelta
import jwt

# ===== Django (core & utils) =====
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import User
from django.db import IntegrityError, transaction
from django.db.models import Count, Max
from django.db.models.functions import TruncDate
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.csrf import csrf_exempt

# ===== Django REST Framework & JWT =====
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
import threading
from .models import DetalleAlerta
from email.mime.image import MIMEImage
import os

# ===== App local =====
from .models import (
    Usuario, DetalleAlerta, Alerta, Administrador, RolUsuario,
    RolAutoridad, DetalleAutoridad, AtencionReporte,
    EstadoAtencionReporte, EscalaAlerta, PerfilUsuario
)
from .serializer import (
    DetalleAlertaSerializer,
    HistorialIncidenteSerializer,
    GestionIncidenteSerializer,
    IncidenteEstadoUpdateSerializer,
)


# ----------------------- LOGIN -----------------------


class MyTokenObtainPairSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        # Autenticación por NOMBRE en tu tabla Usuario
        user = Usuario.objects.filter(nombre=username).first()
        if not user or not user.check_password(password):
            raise serializers.ValidationError(
                "Usuario o contraseña incorrectos")

        # MUY IMPORTANTE: for_user -> agrega user_id al token (necesario para request.user)
        refresh = RefreshToken.for_user(user)

        # Claims extra que usa el front
        refresh["idUsuario"] = user.idUsuario
        refresh["username"] = user.nombre
        refresh["email"] = user.correo

        # Deducimos rol: si el usuario está enlazado a un Administrador
        es_admin = Administrador.objects.filter(
            idRolUsuario__idUsuario=user).exists()
        refresh["role"] = "admin" if es_admin else "user"

        return {
            "refresh": str(refresh),
            "access":  str(refresh.access_token),
            "idUsuario": user.idUsuario,
            "username":  user.nombre,
            "email":     user.correo,
            "role":      "admin" if es_admin else "user",
        }


class MyTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = MyTokenObtainPairSerializer


# --------------------- REGISTRO USUARIO ---------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def registro(request):
    try:
        nombre = (request.data.get('username') or '').strip()
        correo = (request.data.get('email') or '').strip().lower()
        contra = (request.data.get('password') or '').strip()

        if not nombre or not correo or not contra:
            return Response({"error": "username, email y password son requeridos"}, status=400)

        if Usuario.objects.filter(nombre__iexact=nombre).exists():
            return Response({"error": "El usuario ya existe"}, status=400)
        if Usuario.objects.filter(correo__iexact=correo).exists():
            return Response({"error": "El correo ya está registrado"}, status=400)

        # Tu manager create_user espera (correo, contra, **extra)
        user = Usuario.objects.create_user(
            correo=correo, contra=contra, nombre=nombre)

        # (opcional) crear rol 'Usuario'
        if not RolUsuario.objects.filter(idUsuario=user, NombreRol="Usuario").exists():
            RolUsuario.objects.create(
                idUsuario=user, NombreRol="Usuario", Descripcion="Rol por defecto")

        return Response({"message": "Usuario registrado correctamente", "idUsuario": user.idUsuario}, status=201)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# ----------------------- PERFIL / ME -----------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user  # Cargado gracias a user_id en el token
    return JsonResponse({
        "idUsuario": getattr(u, "idUsuario", None),
        "username":  getattr(u, "nombre", ""),
        "email":     getattr(u, "correo", ""),
    })


# ----------------------- RESUMEN -----------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def resumen(request):
    u = request.user
    if not getattr(u, "idUsuario", None):
        return Response({"niveles_incidencia": [], "evolucion_reportes": []})

    # --- Fecha de "hoy" según TZ del proyecto
    hoy = timezone.localdate()  # respeta TIME_ZONE/USE_TZ

    # --- Última fecha de reporte del usuario (fecha, sin hora)
    ultimo = (
        DetalleAlerta.objects
        .filter(idUsuario_id=u.idUsuario)
        .annotate(d=TruncDate("FechaHora"))
        .aggregate(max_d=Max("d"))
        .get("max_d")
    )

    # --- Usar el mayor entre hoy y la última fecha con datos
    fin = max([d for d in (hoy, ultimo) if d is not None])
    inicio = fin - timedelta(days=6)

    # --- Pie: niveles por descripción (contar por pk, no por idAlerta)
    niveles_incidencia = (
        DetalleAlerta.objects
        .filter(idUsuario_id=u.idUsuario, FechaHora__date__gte=inicio, FechaHora__date__lte=fin)
        .values("idEscalaIncidencia__Descripcion")
        .annotate(total=Count("pk"))
    )

    # --- Serie diaria (contar por pk)
    por_dia = (
        DetalleAlerta.objects
        .filter(idUsuario_id=u.idUsuario, FechaHora__date__gte=inicio, FechaHora__date__lte=fin)
        .annotate(d=TruncDate("FechaHora"))
        .values("d")
        .annotate(cantidad=Count("pk"))
    )
    mapa = {r["d"]: r["cantidad"] for r in por_dia}

    dias = [inicio + timedelta(days=i) for i in range(7)]
    evolucion_reportes = [
        {"fecha": d.isoformat(), "cantidad": int(mapa.get(d, 0))}
        for d in dias
    ]

    return Response({
        "niveles_incidencia": list(niveles_incidencia),
        "evolucion_reportes": evolucion_reportes,
    })

# ========================
# NUEVAS FUNCIONES PARA DASHBOARD DINÁMICO
# ========================

# 🔹 API para estadísticas del dashboard


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats(request):
    try:
        print("🔄 Iniciando cálculo de estadísticas del dashboard...")

        # Estadísticas basadas en la tabla DetalleAlerta que tiene los datos reales
        total_incidentes = DetalleAlerta.objects.count()
        print(f"📊 Total incidentes encontrados: {total_incidentes}")

        # Como no tenemos estados directos, vamos a simular basándonos en reportes de atención
        # Casos que tienen reportes de atención los consideramos "resueltos"
        casos_resueltos = DetalleAlerta.objects.filter(
            atenciones__isnull=False
        ).distinct().count()

        # Si no hay reportes de atención, simulamos datos para demostración
        if casos_resueltos == 0 and total_incidentes > 0:
            # 60% simulado como resuelto
            casos_resueltos = max(1, int(total_incidentes * 0.6))

        print(f"✅ Casos resueltos: {casos_resueltos}")

        # Alertas activas: incidentes de los últimos 7 días
        fecha_limite = timezone.now() - timedelta(days=7)
        alertas_activas = DetalleAlerta.objects.filter(
            FechaHora__gte=fecha_limite
        ).count()

        # Si no hay alertas recientes, tomamos una parte del total
        if alertas_activas == 0 and total_incidentes > 0:
            alertas_activas = max(
                1, int(total_incidentes * 0.3))  # 30% como activas

        print(f"🚨 Alertas activas: {alertas_activas}")

        # Estadísticas por escala (reemplazamos los estados por escalas)
        alertas_alta_escala = DetalleAlerta.objects.filter(Escala=3).count()
        alertas_media_escala = DetalleAlerta.objects.filter(Escala=2).count()
        alertas_baja_escala = DetalleAlerta.objects.filter(Escala=1).count()

        # Incidentes por día (últimos 7 días) basado en DetalleAlerta
        today = timezone.now().date()
        week_data = []

        for i in range(7):
            date = today - timedelta(days=6-i)
            count = DetalleAlerta.objects.filter(
                FechaHora__date=date
            ).count()

            # Contar por escala para ese día
            alta_dia = DetalleAlerta.objects.filter(
                FechaHora__date=date,
                Escala=3
            ).count()
            media_dia = DetalleAlerta.objects.filter(
                FechaHora__date=date,
                Escala=2
            ).count()
            baja_dia = DetalleAlerta.objects.filter(
                FechaHora__date=date,
                Escala=1
            ).count()

            week_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'day': date.strftime('%a'),
                'total': count,
                'alta': alta_dia,
                'media': media_dia,
                'baja': baja_dia
            })

        # Calcular porcentajes
        porcentaje_resolucion = 0
        porcentaje_activos = 0
        porcentaje_alta_escala = 0

        if total_incidentes > 0:
            porcentaje_resolucion = round(
                (casos_resueltos / total_incidentes) * 100, 1)
            porcentaje_activos = round(
                (alertas_activas / total_incidentes) * 100, 1)
            porcentaje_alta_escala = round(
                (alertas_alta_escala / total_incidentes) * 100, 1)

        # Calcular alertas resueltas hoy
        alertas_resueltas_hoy = DetalleAlerta.objects.filter(
            FechaHora__date=today,
            atenciones__isnull=False
        ).distinct().count()

        # Si no hay datos, simulamos
        if alertas_resueltas_hoy == 0 and total_incidentes > 0:
            alertas_hoy = DetalleAlerta.objects.filter(
                FechaHora__date=today).count()
            alertas_resueltas_hoy = max(0, int(alertas_hoy * 0.5))

        stats_response = {
            'total_incidentes': total_incidentes,
            'casos_resueltos': casos_resueltos,
            'alertas_activas': alertas_activas,
            'alertas_alta_escala': alertas_alta_escala,
            'alertas_media_escala': alertas_media_escala,
            'alertas_baja_escala': alertas_baja_escala,
            'porcentaje_resolucion': porcentaje_resolucion,
            'porcentaje_activos': porcentaje_activos,
            'porcentaje_alta_escala': porcentaje_alta_escala,
            'resueltas_hoy': alertas_resueltas_hoy
        }

        print(f"✅ Estadísticas calculadas: {stats_response}")

        return JsonResponse({
            'success': True,
            'stats': stats_response,
            'week_data': week_data,
            'last_updated': timezone.now().isoformat()
        })

    except Exception as e:
        print(f"❌ Error en dashboard_stats: {str(e)}")
        import traceback
        print(f"📍 Traceback completo: {traceback.format_exc()}")

        return JsonResponse({
            'success': False,
            'error': str(e),
            'message': 'Error al obtener estadísticas del dashboard',
            'traceback': traceback.format_exc()
        }, status=500)


# 🔹 API para personal de emergencia
@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def emergency_personnel(request):
    try:
        personal = []

        # Intentar obtener datos de autoridades si existen
        try:
            if RolAutoridad.objects.exists():
                autoridades = RolAutoridad.objects.select_related(
                    'idRolUsuario'
                )[:10]

                for autoridad in autoridades:
                    try:
                        # Intentar obtener información del usuario
                        nombre = f'Autoridad {autoridad.idRolAutoridad}'
                        if hasattr(autoridad, 'idRolUsuario') and autoridad.idRolUsuario:
                            # Aquí puedes ajustar según tu modelo de relaciones
                            nombre = f'Autoridad {autoridad.idRolAutoridad}'

                        tipo_autoridad = 'Autoridad'
                        if hasattr(autoridad, 'TipoAutoridad'):
                            tipo_autoridad = autoridad.TipoAutoridad

                        personal.append({
                            'id': autoridad.idRolAutoridad,
                            'nombre': nombre,
                            'tipo': tipo_autoridad,
                            'telefono': 'N/A',
                            'ubicacion': 'Los Olivos',
                            'estado': 'ACTIVO'
                        })
                    except Exception as e:
                        continue
        except:
            pass

        # Si no hay autoridades o hay error, usar datos de ejemplo
        if not personal:
            personal = [
                {
                    'id': 1,
                    'nombre': 'Carlos Mendoza',
                    'tipo': 'Policía',
                    'telefono': '999-123-456',
                    'ubicacion': 'Comisaría Los Olivos',
                    'estado': 'ACTIVO'
                },
                {
                    'id': 2,
                    'nombre': 'Ana Vargas',
                    'tipo': 'Serenazgo',
                    'telefono': '999-789-123',
                    'ubicacion': 'Serenazgo Municipal',
                    'estado': 'EN PATRULLA'
                },
                {
                    'id': 3,
                    'nombre': 'Dr. Luis Torres',
                    'tipo': 'Médico',
                    'telefono': '999-456-789',
                    'ubicacion': 'Emergencias Médicas',
                    'estado': 'DISPONIBLE'
                },
                {
                    'id': 4,
                    'nombre': 'Bomberos Los Olivos',
                    'tipo': 'Bombero',
                    'telefono': '999-321-654',
                    'ubicacion': 'Estación Central',
                    'estado': 'EN SERVICIO'
                }
            ]

        return JsonResponse({
            'success': True,
            'personal': personal
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# 🔹 API para actividades recientes
@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def recent_activities(request):
    try:
        activities = []

        # Intentar obtener alertas reales primero
        try:
            if Alerta.objects.exists():
                alertas = Alerta.objects.select_related(
                    'idCliente').order_by('-FechaHora')[:10]

                for alerta in alertas:
                    try:
                        time_diff = timezone.now() - alerta.FechaHora
                        if time_diff.days > 0:
                            time_ago = f"{time_diff.days} día{'s' if time_diff.days > 1 else ''} ago"
                        elif time_diff.seconds > 3600:
                            hours = time_diff.seconds // 3600
                            time_ago = f"{hours} hora{'s' if hours > 1 else ''} ago"
                        else:
                            minutes = max(1, time_diff.seconds // 60)
                            time_ago = f"{minutes} min ago"

                        sender_name = 'Usuario Desconocido'
                        if alerta.idCliente:
                            sender_name = f"{alerta.idCliente.Nombre} {alerta.idCliente.Apellido}"

                        activities.append({
                            'id': alerta.idAlerta,
                            'sender': sender_name,
                            'message': alerta.Informacion or f"Nueva alerta - Estado: {alerta.Estado}",
                            'timestamp': time_ago,
                            'unread': alerta.Estado == 'Activa',
                            'avatar': '🚨' if alerta.Estado == 'Activa' else '✅'
                        })
                    except Exception as e:
                        continue
        except:
            pass

        # Si no hay alertas o hay error, usar actividades de ejemplo basadas en DetalleAlerta
        if not activities:
            try:
                # Intentar con DetalleAlerta
                incidentes = DetalleAlerta.objects.order_by('-FechaHora')[:5]
                for incidente in incidentes:
                    try:
                        time_diff = timezone.now() - incidente.FechaHora
                        if time_diff.days > 0:
                            time_ago = f"{time_diff.days} día{'s' if time_diff.days > 1 else ''} ago"
                        elif time_diff.seconds > 3600:
                            hours = time_diff.seconds // 3600
                            time_ago = f"{hours} hora{'s' if hours > 1 else ''} ago"
                        else:
                            minutes = max(1, time_diff.seconds // 60)
                            time_ago = f"{minutes} min ago"

                        usuario_nombre = 'Usuario Sistema'
                        if incidente.idUsuario:
                            usuario_nombre = incidente.idUsuario.nombre

                        activities.append({
                            'id': incidente.idTipoIncidencia,
                            'sender': usuario_nombre,
                            'message': incidente.Descripcion or incidente.NombreIncidente,
                            'timestamp': time_ago,
                            'unread': True,
                            'avatar': '📋'
                        })
                    except Exception as e:
                        continue
            except:
                pass

        # Si aún no hay actividades, usar datos de ejemplo
        if not activities:
            activities = [
                {
                    'id': 1,
                    'sender': 'Carlos Mendoza',
                    'message': 'Reporte de incidente resuelto en Av. Universitaria. Situación bajo control.',
                    'timestamp': '2 min ago',
                    'unread': True,
                    'avatar': '👮'
                },
                {
                    'id': 2,
                    'sender': 'Ana Rodriguez',
                    'message': 'Reunión de seguridad diaria programada para las 15:00 horas.',
                    'timestamp': '15 min ago',
                    'unread': False,
                    'avatar': '📅'
                },
                {
                    'id': 3,
                    'sender': 'Sistema Alerta',
                    'message': 'Nueva alerta de seguridad activada en sector norte de la ciudad.',
                    'timestamp': '1 hora ago',
                    'unread': True,
                    'avatar': '🚨'
                },
                {
                    'id': 4,
                    'sender': 'William Johnson',
                    'message': 'Patrullaje nocturno completado sin incidentes en zona comercial.',
                    'timestamp': '2 horas ago',
                    'unread': False,
                    'avatar': '🚔'
                },
                {
                    'id': 5,
                    'sender': 'Sistema',
                    'message': 'Backup de datos completado exitosamente.',
                    'timestamp': '3 horas ago',
                    'unread': False,
                    'avatar': '💾'
                }
            ]

        return JsonResponse({
            'success': True,
            'activities': activities
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ---------- LISTAR MIS REPORTES ----------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_reportes(request):
    """
    Devuelve los reportes del usuario autenticado con la URL completa del archivo (si existe).
    """
    u = request.user

    # Recupera los reportes del usuario
    reportes = (
        DetalleAlerta.objects
        .filter(idUsuario_id=u.idUsuario)
        .order_by('-FechaHora')
    )

    # Usa el serializer para incluir Archivo correctamente (con contexto request)
    serializer = DetalleAlertaSerializer(
        reportes, many=True, context={'request': request})

    return Response(serializer.data)


ESCALAS = {1: "Bajo", 2: "Medio", 3: "Alto", 4: "Pendiente (por asignar)"}

def enviar_correo_reporte(asunto, mensaje, destinatario):
    """Envía el correo en segundo plano (sin demorar la respuesta del servidor)."""
    try:
        send_mail(asunto, mensaje, settings.DEFAULT_FROM_EMAIL, [destinatario], fail_silently=False)
    except Exception as e:
        print(f"⚠️ Error al enviar correo: {e}")



from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
import threading

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def registrar_incidente(request):
    """
    Crea un DetalleAlerta para el usuario autenticado y envía una notificación al correo del usuario.
    """
    u = request.user
    Ubicacion = (request.data.get("Ubicacion") or "").strip()
    Descripcion = (request.data.get("Descripcion") or "").strip()
    NombreIncidente = (request.data.get("NombreIncidente") or "").strip()
    escala = request.data.get("escala")
    lat = request.data.get("Latitud")
    lon = request.data.get("Longitud")
    archivo = request.FILES.get("Archivo")

    faltantes = []
    if not Ubicacion:
        faltantes.append("Ubicacion")
    if not NombreIncidente:
        faltantes.append("NombreIncidente")
    if not escala:
        faltantes.append("escala")

    if faltantes:
        return Response({"error": f"Faltan campos: {', '.join(faltantes)}"}, status=400)

    try:
        escala = int(escala)
        lat = float(lat) if lat else None
        lon = float(lon) if lon else None
    except ValueError:
        return Response({"error": "escala debe ser 1, 2 o 3 y lat/lon deben ser números"}, status=400)

    if escala not in ESCALAS:
        return Response({"error": "escala debe ser 1(Bajo), 2(Medio) o 3(Alto)"}, status=400)

    try:
        # Crear el reporte
        det = DetalleAlerta.objects.create(
            Ubicacion=Ubicacion,
            Descripcion=Descripcion,
            NombreIncidente=NombreIncidente,
            Escala=escala,
            idUsuario=u,
            Latitud=lat,
            Longitud=lon,
            Archivo=archivo,
            FechaHora=timezone.now(),
        )

        # 📩 Armar el mensaje HTML con imagen embebida
        asunto = "Confirmación de Reporte - Sistema de Seguridad Ciudadana"

        mensaje_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Hola <b>{u.nombre}</b>,</p>
            <p>Tu reporte ha sido registrado exitosamente.</p>

            <h3>📝 Detalles del Incidente:</h3>
            <ul style="list-style-type: none; padding: 0;">
              <li><b>Nombre del Incidente:</b> {det.NombreIncidente}</li>
              <li><b>Descripción:</b> {det.Descripcion}</li>
              <li><b>Escala:</b> {ESCALAS.get(det.Escala, '')}</li>
              <li><b>Ubicación:</b> {det.Ubicacion}</li>
              <li><b>Fecha:</b> {det.FechaHora.strftime('%d/%m/%Y %H:%M')}</li>
            </ul>
        """

        # 📷 Si hay archivo, incrustarlo en el correo
        mensaje_html += "<p><b>📷 Imagen del incidente:</b></p>"
        if det.Archivo:
            mensaje_html += '<img src="cid:imagen_reporte" style="max-width: 100%; border-radius: 8px; border: 1px solid #ccc; margin-top: 10px;" />'
        else:
            mensaje_html += "<p>No se adjuntó ninguna imagen.</p>"

        mensaje_html += """
            <br>
            <p>Gracias por contribuir con la seguridad ciudadana.</p>
            <p>Atentamente,<br>👮 <b>Equipo de Seguridad Ciudadana</b></p>
          </body>
        </html>
        """

        mensaje_texto = strip_tags(mensaje_html)

        def enviar_correo_html():
            email = EmailMultiAlternatives(
                asunto,
                mensaje_texto,
                settings.DEFAULT_FROM_EMAIL,
                [u.correo],
            )
            email.attach_alternative(mensaje_html, "text/html")

            # Adjuntar imagen embebida (CID)
            if det.Archivo:
                ruta_imagen = det.Archivo.path
                if os.path.exists(ruta_imagen):
                    with open(ruta_imagen, 'rb') as f:
                        imagen = MIMEImage(f.read())
                        imagen.add_header('Content-ID', '<imagen_reporte>')
                        imagen.add_header('Content-Disposition', 'inline', filename=os.path.basename(ruta_imagen))
                        email.attach(imagen)

            email.send()

        threading.Thread(target=enviar_correo_html).start()

        # Retornar respuesta normal
        archivo_url = f"{settings.MEDIA_URL}{det.Archivo}" if det.Archivo else ""
        return Response({
            "message": "Incidente registrado correctamente",
            "registro": {
                "idTipoIncidencia": det.idTipoIncidencia,
                "FechaHora": det.FechaHora,
                "Ubicacion": det.Ubicacion,
                "NombreIncidente": det.NombreIncidente,
                "Descripcion": det.Descripcion,
                "Escala": ESCALAS.get(det.Escala, ""),
                "Latitud": det.Latitud,
                "Longitud": det.Longitud,
                "Archivo": archivo_url or ""
            }
        }, status=201)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
# ------------------ ALERTAS  -------------
def todas_alertas(request):
    try:
        # Obtenemos todos los registros de DetalleAlerta
        alertas = DetalleAlerta.objects.all().order_by('-FechaHora')

        # Convertimos los objetos en diccionarios (JSON serializable)
        data = [
            {
                "id": a.idTipoIncidencia,
                "idTipoIncidencia": a.idTipoIncidencia,
                "ubicacion": a.Ubicacion,
                "descripcion": a.Descripcion,
                "fecha": a.FechaHora.strftime("%Y-%m-%d %H:%M:%S"),
                "nombre_incidente": a.NombreIncidente,
                "escala": a.Escala,  # Devolver el escala directo (1, 2, 3, 4)
                "estado": getattr(a, "EstadoIncidente", None) or "Pendiente",
                "latitud": a.Latitud,
                "longitud": a.Longitud,
                "usuario": a.idUsuario_id if a.idUsuario_id else None,
                "usuario_nombre": a.idUsuario.nombre if a.idUsuario else "Sistema",
            }
            for a in alertas
        ]

        return JsonResponse(data, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
# ---------- Determinar escala automáticamente ----------
def determinar_escala(descripcion):
    texto = descripcion.lower()
    if any(palabra in texto for palabra in ["robo", "asalto", "hurto", "intento de asesinato", "asesinato", "homicidio"]):
        return 3  # Alto
    elif any(palabra in texto for palabra in ["accidente", "choque", "incendio", "explosión"]):
        return 2  # Medio
    elif any(palabra in texto for palabra in ["daño", "vandalismo", "desperfecto", "mascota perdida", "robo de mascota"]):
        return 1  # Bajo
    else:
        return 4  # Pendiente (por asignar)

# ------------------ RESET PASSWORD (opcional) -------------
@api_view(['POST'])
@permission_classes([AllowAny])
def enviar_correo(request):
    try:
        email = (request.data.get('email') or '').strip().lower()
        usuario = Usuario.objects.filter(correo__iexact=email).first()
        if not usuario:
            return JsonResponse({"error": "El correo no está registrado"}, status=400)

        token = jwt.encode({"idUsuario": usuario.idUsuario},
                           settings.SECRET_KEY, algorithm="HS256")
        reset_url = f"http://localhost:5173/reset-password/{token}"

        send_mail(
            'Restablecer contraseña',
            f'Haz clic en el siguiente enlace para restablecer tu contraseña:\n{reset_url}',
            getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@tuapp.com"),
            [email],
            fail_silently=False,
        )
        return JsonResponse({"message": "Correo enviado"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def Cambio_Contrasena(request, token):
    try:
        data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        id_usuario = data.get("idUsuario")
        usuario = Usuario.objects.get(idUsuario=id_usuario)
        new_password = (request.data.get("password") or "").strip()
        if not new_password:
            return JsonResponse({"error": "Nueva contraseña requerida"}, status=400)
        usuario.set_password(new_password)
        usuario.save()
        return JsonResponse({"message": "Contraseña cambiada con éxito"})
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# --- PERFIL: GET y PATCH (actualizar nombre/telefono/contacto) ---


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])  # <- importante
def perfil_usuario(request):
    u = request.user
    perfil, _ = PerfilUsuario.objects.get_or_create(usuario=u)

    if request.method == 'GET':
        return Response({
            "idUsuario": getattr(u, "idUsuario", None),
            "nombre": u.nombre,
            "email": u.correo,
            "telefono": perfil.telefono,
            "activo": u.is_active,
            "ultimo_acceso": getattr(u, "last_login", None),
            "contacto_emergencia": {
                "nombre": perfil.contacto_emergencia_nombre,
                "telefono": perfil.contacto_emergencia_telefono
            },
            "preferencias": perfil.preferencias or {},
        })

    # PATCH
    data = request.data
    nombre = data.get("nombre")
    telefono = data.get("telefono")
    ce_nom = data.get("contacto_emergencia_nombre")
    ce_tel = data.get("contacto_emergencia_telefono")

    with transaction.atomic():
        if nombre is not None:
            u.nombre = str(nombre).strip()
            u.save(update_fields=["nombre"])
        if telefono is not None:
            perfil.telefono = str(telefono).strip()
        if ce_nom is not None:
            perfil.contacto_emergencia_nombre = str(ce_nom).strip()
        if ce_tel is not None:
            perfil.contacto_emergencia_telefono = str(ce_tel).strip()
        perfil.save()

    # Devuelve el perfil actualizado completo para que el front cierre spinner
    return Response({
        "idUsuario": getattr(u, "idUsuario", None),
        "nombre": u.nombre,
        "email": u.correo,
        "telefono": perfil.telefono,
        "activo": u.is_active,
        "ultimo_acceso": getattr(u, "last_login", None),
        "contacto_emergencia": {
            "nombre": perfil.contacto_emergencia_nombre,
            "telefono": perfil.contacto_emergencia_telefono
        },
        "preferencias": perfil.preferencias or {},
        "message": "Perfil actualizado correctamente"
    })


# --- CAMBIAR CONTRASEÑA del usuario autenticado ---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cambiar_password(request):
    u = request.user
    nueva = (request.data.get("nueva") or "").strip()

    if len(nueva) < 6:
        return Response(
            {"error": "La nueva contraseña debe tener al menos 6 caracteres"},
            status=400
        )

    # Cambiar la contraseña directamente
    u.set_password(nueva)
    u.save()

    return Response({"message": "Contraseña actualizada correctamente"})

# --- Historial vista administrador ---


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_incidentes(request):
    """
    Devuelve todos los DetalleAlerta con su estado actual (última AtencionReporte).
    Ruta nueva y separada: /api/historial/incidentes/
    """
    qs = DetalleAlerta.objects.select_related(
        "idUsuario").order_by("-FechaHora")
    serializer = HistorialIncidenteSerializer(qs, many=True)
    return Response(serializer.data)


# ==================================== VIEWS PARA EL MAPA DE CALOR EN TIEMPO REAL ==================================== #

def _parse_iso(dt_str):
    if not dt_str:
        return None
    dt = parse_datetime(dt_str) or datetime.fromisoformat(dt_str)
    # Normaliza a aware si viene naive
    if dt and timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone.get_current_timezone())
    return dt

def _escala_to_intensity(escala: int | None) -> float:
    return {1: 0.33, 2: 0.66, 3: 1.0}.get(int(escala or 1), 0.33)

class HeatmapAlertView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, *args, **kwargs):
        qs = DetalleAlerta.objects.filter(
            Latitud__isnull=False,
            Longitud__isnull=False
        )

        # --- filtros de estado ---
        incluir_resueltos = str(request.query_params.get("incluir_resueltos", "")).lower() in {"1","true","t","yes","y"}
        if not incluir_resueltos:
            qs = qs.exclude(EstadoIncidente="Resuelto")

        estados_csv = request.query_params.get("estado")  # p.ej. "Pendiente,En proceso"
        if estados_csv:
            estados = [s.strip() for s in estados_csv.split(",") if s.strip()]
            if estados:
                qs = qs.filter(EstadoIncidente__in=estados)

        # --- fechas ---
        dt_start = _parse_iso(request.query_params.get("start"))
        dt_end = _parse_iso(request.query_params.get("end"))
        if dt_start:
            qs = qs.filter(FechaHora__gte=dt_start)
        if dt_end:
            qs = qs.filter(FechaHora__lte=dt_end)

        # --- escala ---
        escala_min = request.query_params.get("escala_min")
        escala_max = request.query_params.get("escala_max")
        if escala_min:
            qs = qs.filter(Escala__gte=int(escala_min))
        if escala_max:
            qs = qs.filter(Escala__lte=int(escala_max))

        # --- bbox ---
        bbox = request.query_params.get("bbox")  # "south,west,north,east"
        if bbox:
            try:
                s, w, n, e = map(float, bbox.split(","))
                qs = qs.filter(
                    Latitud__gte=s, Latitud__lte=n,
                    Longitud__gte=w, Longitud__lte=e
                )
            except Exception:
                pass

        # --- límite ---
        try:
            limit = int(request.query_params.get("limit") or 2000)
        except Exception:
            limit = 2000

        # --- consulta principal ---
        rows = qs.order_by("-FechaHora").values_list(
            "Latitud", "Longitud", "Escala", "EstadoIncidente"
        )[:limit]

        points = [[lat, lng, _escala_to_intensity(esc), estado]
                  for (lat, lng, esc, estado) in rows]

        # --- metadatos útiles para el front ---
        # (si quieres ahorrar una query, puedes contarlo en python con 'rows')
        by_status = {}
        for _, _, _, est in rows:
            by_status[est] = by_status.get(est, 0) + 1

        return Response({
            "points": points,
            "meta": {
                "count": len(points),
                "by_status": by_status,
            }
        })


# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gestion_list_incidentes(request):
    """
    Nuevo endpoint: lista incidencias con su EstadoIncidente para Gestión.
    Ruta: /api/gestion/incidentes/
    """
    qs = DetalleAlerta.objects.select_related(
        "idUsuario").order_by("-FechaHora")
    data = GestionIncidenteSerializer(qs, many=True).data
    return Response(data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def gestion_update_incidente(request, id):
    """
    Nuevo endpoint: actualiza EstadoIncidente de DetalleAlerta.
    Ruta: /api/gestion/incidentes/<int:id>/
    Body: { "estado": "Pendiente" | "En proceso" | "Resuelto" }
    """
    obj = get_object_or_404(DetalleAlerta, pk=id)
    ser = IncidenteEstadoUpdateSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=400)

    obj.EstadoIncidente = ser.validated_data["estado"]
    obj.save(update_fields=["EstadoIncidente"])

    # Devolver el registro formateado para la tabla de gestión
    return Response(GestionIncidenteSerializer(obj).data)
