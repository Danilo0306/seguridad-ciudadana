from django.contrib import admin
from .models import (
    Usuario, RolUsuario, RolAutoridad, DetalleAutoridad, Cliente,
    EmpresaSeguridad, DetalleEmpresa, Administrador, Alerta,
    EscalaAlerta, DetalleAlerta, EstadoAtencionReporte,
    AtencionReporte, HistoriaAtencionReporte, PlanContrato,
    ContratoEmpresa
)

# Opción 1: registrar todo de forma simple
admin.site.register(Usuario)
admin.site.register(RolUsuario)
admin.site.register(RolAutoridad)
admin.site.register(DetalleAutoridad)
admin.site.register(Cliente)
admin.site.register(EmpresaSeguridad)
admin.site.register(DetalleEmpresa)
admin.site.register(Administrador)
admin.site.register(Alerta)
admin.site.register(EscalaAlerta)
admin.site.register(DetalleAlerta)
admin.site.register(EstadoAtencionReporte)
admin.site.register(AtencionReporte)
admin.site.register(HistoriaAtencionReporte)
admin.site.register(PlanContrato)
admin.site.register(ContratoEmpresa)
