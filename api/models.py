# api/models.py
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager
)

# ========================
#  MANAGER DE USUARIO
# ========================
class UsuarioManager(BaseUserManager):
    def create_user(self, correo, contra=None, **extra_fields):
        if not correo:
            raise ValueError("El usuario debe tener un correo")
        correo = self.normalize_email(correo)
        user = self.model(correo=correo, **extra_fields)
        user.set_password(contra)  # encripta la contraseña y la guarda en `contra`
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, contra=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("El superusuario debe tener is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("El superusuario debe tener is_superuser=True")

        return self.create_user(correo, contra, **extra_fields)


# ========================
#  TABLA USUARIO
# ========================
class Usuario(AbstractBaseUser, PermissionsMixin):
    idUsuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=200, null=True, blank=True)
    correo = models.CharField(max_length=200, unique=True)
    password = models.CharField(db_column="contra", max_length=250)
    fecha_creacion = models.DateTimeField(default=timezone.now)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UsuarioManager()

    USERNAME_FIELD = "correo"
    REQUIRED_FIELDS = ["nombre"]

    class Meta:
        db_table = "Usuario"

    def __str__(self):
        return self.nombre if self.nombre else self.correo


# ========================
#  DEMÁS TABLAS
# ========================
class RolUsuario(models.Model):
    idRolUsuario = models.AutoField(primary_key=True)
    NombreRol = models.CharField(max_length=100)
    Descripcion = models.CharField(max_length=250, null=True, blank=True)
    idUsuario = models.ForeignKey(
        Usuario,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='roles',
        db_column='idUsuario'
    )

    class Meta:
        db_table = 'RolUsuario'

    def __str__(self):
        return self.NombreRol


class RolAutoridad(models.Model):
    idRolAutoridad = models.AutoField(primary_key=True)
    TipoAutoridad = models.CharField(max_length=200)
    idRolUsuario = models.ForeignKey(
        RolUsuario,
        on_delete=models.CASCADE,
        related_name='roles_autoridad',
        db_column='idRolUsuario'
    )

    class Meta:
        db_table = 'RolAutoridad'

    def __str__(self):
        return self.TipoAutoridad


class DetalleAutoridad(models.Model):
    idDetalleAutoridad = models.AutoField(primary_key=True)
    NTelefono = models.CharField(max_length=9)
    Ubicacion = models.CharField(max_length=300)
    idRolAutoridad = models.ForeignKey(
        RolAutoridad,
        on_delete=models.CASCADE,
        related_name='detalles',
        db_column='idRolAutoridad'
    )

    class Meta:
        db_table = 'DetalleAutoridad'

    def __str__(self):
        return f"{self.idRolAutoridad} - {self.NTelefono}"


class Cliente(models.Model):
    idCliente = models.AutoField(primary_key=True)
    idRolUsuario = models.ForeignKey(
        RolUsuario,
        on_delete=models.CASCADE,
        related_name='clientes',
        db_column='idRolUsuario'
    )
    Nombre = models.CharField(max_length=200)
    Apellido = models.CharField(max_length=250)
    Direccion = models.CharField(max_length=250, null=True, blank=True)
    NTelefono = models.CharField(max_length=9)

    class Meta:
        db_table = 'Cliente'

    def __str__(self):
        return f"{self.Nombre} {self.Apellido}"


class EmpresaSeguridad(models.Model):
    idEmpresaSeguridad = models.AutoField(primary_key=True)
    idRolUsuario = models.ForeignKey(
        RolUsuario,
        on_delete=models.CASCADE,
        related_name='empresas',
        db_column='idRolUsuario'
    )
    Nombre = models.CharField(max_length=250)
    Servicios = models.CharField(max_length=250)
    Estado = models.CharField(max_length=45)

    class Meta:
        db_table = 'EmpresaSeguridad'

    def __str__(self):
        return self.Nombre


class DetalleEmpresa(models.Model):
    idDetalleEmpresa = models.AutoField(primary_key=True)
    idEmpresaSeguridad = models.ForeignKey(
        EmpresaSeguridad,
        on_delete=models.CASCADE,
        related_name='detalles',
        db_column='idEmpresaSeguridad'
    )
    NTelefono = models.CharField(max_length=9, null=True, blank=True)
    Ubicacion = models.CharField(max_length=300, null=True, blank=True)
    RUC = models.CharField(max_length=11, null=True, blank=True)

    class Meta:
        db_table = 'DetalleEmpresa'

    def __str__(self):
        return f"{self.idEmpresaSeguridad} - {self.RUC or ''}"


class Administrador(models.Model):
    idAdministrador = models.AutoField(primary_key=True)
    idRolUsuario = models.ForeignKey(
        RolUsuario,
        on_delete=models.CASCADE,
        related_name='administradores',
        db_column='idRolUsuario'
    )
    Nombre = models.CharField(max_length=250)
    Apellido = models.CharField(max_length=250)

    class Meta:
        db_table = 'Administrador'

    def __str__(self):
        return f"{self.Nombre} {self.Apellido}"


class Alerta(models.Model):
    idAlerta = models.AutoField(primary_key=True)
    idCliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name='alertas',
        db_column='idCliente'
    )

    class Meta:
        db_table = 'Alerta'

    def __str__(self):
        return f"Alerta {self.idAlerta} - Cliente {self.idCliente_id}"


# --- Tabla EscalaAlerta ya NO es necesaria, la puedes dejar o borrar más adelante ---

from django.db import models
from django.utils import timezone

class DetalleAlerta(models.Model):
    ESCALA_CHOICES = (
        (1, "Bajo"),
        (2, "Medio"),
        (3, "Alto"),
        (4, "Pendiente (por asignar)"),
    )

    idTipoIncidencia = models.AutoField(primary_key=True)
    Ubicacion = models.CharField(max_length=250)
    Descripcion = models.CharField(max_length=500, null=True, blank=True)
    FechaHora = models.DateTimeField(default=timezone.now)

    idAlerta = models.ForeignKey(
        'Alerta',
        on_delete=models.CASCADE,
        related_name='detalles',
        db_column='idAlerta',
        null=True,
        blank=True
    )
    idEscalaIncidencia = models.ForeignKey(
        'EscalaAlerta',
        on_delete=models.CASCADE,
        related_name='detalles_escala',
        db_column='idEscalaIncidencia',
        null=True,
        blank=True
    )

    Escala = models.PositiveSmallIntegerField(choices=ESCALA_CHOICES, default=1)
    NombreIncidente = models.CharField(max_length=250)
    Latitud = models.FloatField(null=True, blank=True)
    Longitud = models.FloatField(null=True, blank=True)
    idUsuario = models.ForeignKey(
        'Usuario',
        on_delete=models.CASCADE,
        related_name="alertas",
        db_column="idUsuario",
        null=True,
        blank=True
    )

    # >>> NUEVO CAMPO para foto o video
    Archivo = models.FileField(upload_to='archivos_alertas/', blank=True, null=True)

    # >>> NUEVO CAMPO EstadoIncidente (sin FK) - Pendiente, En proceso, Resuelto
    ESTADO_INCIDENTE_CHOICES = (
        ('Pendiente', 'Pendiente'),
        ('En proceso', 'En proceso'),
        ('Resuelto', 'Resuelto'),
    )
    EstadoIncidente = models.CharField(
        max_length=20,
        choices=ESTADO_INCIDENTE_CHOICES,
        default='Pendiente'
    )

    class Meta:
        db_table = 'DetalleAlerta'

    def __str__(self):
        return f"{self.Ubicacion} - {self.idTipoIncidencia}"

    def escala_label(self):
        return dict(self.ESCALA_CHOICES).get(self.Escala, "")


# --- ESCALA ALERTA ---
class EscalaAlerta(models.Model):
    idEscalaIncidencia = models.AutoField(primary_key=True)
    Descripcion = models.CharField(max_length=45)
    palabra_clave = models.CharField(max_length=100)

    class Meta:
        db_table = 'EscalaAlerta'

    def __str__(self):
        return self.Descripcion


class EstadoAtencionReporte(models.Model):
    idEstadoReporte = models.AutoField(primary_key=True)
    Tipo = models.CharField(max_length=90)

    class Meta:
        db_table = 'EstadoAtencionReporte'

    def __str__(self):
        return self.Tipo


class AtencionReporte(models.Model):
    idReporte = models.AutoField(primary_key=True)
    idTipoIncidencia = models.ForeignKey(
        DetalleAlerta,
        on_delete=models.CASCADE,
        related_name='atenciones',
        db_column='idTipoIncidencia'
    )
    idEstadoReporte = models.ForeignKey(
        EstadoAtencionReporte,
        on_delete=models.CASCADE,
        related_name='atenciones',
        db_column='idEstadoReporte'
    )
    idRolAutoridad = models.ForeignKey(
        RolAutoridad,
        on_delete=models.CASCADE,
        related_name='atenciones',
        db_column='idRolAutoridad'
    )
    idAdministrador = models.ForeignKey(
        Administrador,
        on_delete=models.CASCADE,
        related_name='atenciones',
        db_column='idAdministrador'
    )
    FechaHoraAtencion = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'AtencionReporte'

    def __str__(self):
        return f"Reporte {self.idReporte} - {self.FechaHoraAtencion}"


class HistoriaAtencionReporte(models.Model):
    idHistorialReporte = models.AutoField(primary_key=True)
    idReporte = models.ForeignKey(
        AtencionReporte,
        on_delete=models.CASCADE,
        related_name='historia',
        db_column='idReporte'
    )

    class Meta:
        db_table = 'HistoriaAtencionReporte'

    def __str__(self):
        return f"Historia {self.idHistorialReporte} - Reporte {self.idReporte_id}"


class PlanContrato(models.Model):
    idPlanContrato = models.AutoField(primary_key=True)
    TipoPlan = models.CharField(max_length=100, null=True, blank=True)
    Monto = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'PlanContrato'

    def __str__(self):
        return f"{self.TipoPlan} - {self.Monto}"


class ContratoEmpresa(models.Model):
    idContratoEmpresa = models.AutoField(primary_key=True)
    idDetalleEmpresa = models.ForeignKey(
        DetalleEmpresa,
        on_delete=models.CASCADE,
        related_name='contratos',
        db_column='idDetalleEmpresa'
    )
    idPlanContrato = models.ForeignKey(
        PlanContrato,
        on_delete=models.CASCADE,
        related_name='contratos',
        db_column='idPlanContrato'
    )
    FechaContrato = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ContratoEmpresa'

    def __str__(self):
        return f"Contrato {self.idContratoEmpresa} - Empresa {self.idDetalleEmpresa_id}"


class PerfilUsuario(models.Model):
    idPerfil = models.AutoField(primary_key=True)
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name="perfil"
    )
    telefono = models.CharField(max_length=20, null=True, blank=True)
    contacto_emergencia_nombre = models.CharField(max_length=200, null=True, blank=True)
    contacto_emergencia_telefono = models.CharField(max_length=20, null=True, blank=True)
    preferencias = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "PerfilUsuario"

    def __str__(self):
        return f"Perfil de {self.usuario.nombre or self.usuario.correo}"
