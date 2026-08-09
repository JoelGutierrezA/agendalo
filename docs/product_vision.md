# Agéndalo — Visión del Producto

## ¿Qué es Agéndalo?

**Agéndalo** es una plataforma web SaaS multi-tenant (multiempresa) para negocios que trabajen con citas y reservas. Cada dueño de negocio tiene su propio espacio de gestión y una página pública de reservas para sus clientes.

La plataforma está pensada para pequeños y medianos negocios que necesitan ordenar su agenda, gestionar sus clientes y tener visibilidad financiera básica desde un solo lugar, sin necesidad de herramientas complejas ni costosas.

---

## Diferenciador Principal

Agéndalo **no es solo una agenda de citas**. Integra en una misma plataforma:

- 📅 **Gestión completa de citas y reservas**
- 💰 **Módulo financiero simple** (ingresos y egresos)
- 📊 **Dashboard con estadísticas** del negocio
- 🌐 **Página pública personalizada** por negocio para reservas sin cuenta

---

## Casos de Uso

| Tipo de negocio | ¿Por qué Agéndalo? |
|---|---|
| Barberías | Gestión de turnos, control de ingresos diarios |
| Peluquerías y centros estéticos | Agenda de servicios, clientes recurrentes |
| Podólogos / fisioterapeutas | Historial del cliente, disponibilidad |
| Entrenadores personales | Sesiones, pagos, control de asistencia |
| Consultas por hora | Reserva en línea, confirmación automática |
| Otros servicios por turno | Cualquier negocio que trabaje con citas |

---

## Modelo de Negocio (SaaS Multi-tenant)

- Un dueño de negocio se **registra en la plataforma** y crea su espacio.
- Cada negocio tiene un **slug único** (ej: `/negocio/barberia-norte`) que actúa como su URL pública.
- Los **clientes finales** no necesitan cuenta: reservan directamente desde la página pública del negocio.
- La plataforma cobra al dueño del negocio (modelo freemium / suscripción — a definir en fases futuras).

---

## Alcance del MVP

### ✅ Incluido en el MVP

| Módulo | Descripción |
|---|---|
| Autenticación | Registro, login, recuperación de contraseña del dueño |
| Perfil del negocio | Datos del negocio, configuración básica, slug |
| Servicios | CRUD de servicios con duración y precio |
| Horarios | Configuración de días y horas disponibles |
| Citas | Crear, editar, cancelar, reagendar, ver en calendario |
| Clientes | CRUD de clientes con historial de citas |
| Página pública | Reserva sin cuenta desde URL pública del negocio |
| Ingresos | Registro de ingresos del negocio |
| Egresos | Registro de gastos del negocio |
| Dashboard | KPIs básicos, estadísticas simples |
| Configuración | Datos del negocio y preferencias |
| Google Calendar | Estructura preparada (no implementada en MVP) |

### ❌ Fuera del MVP (Fases Futuras)

- Marketplace global o directorio de negocios
- Pagos online integrados (Stripe, PayPal, etc.)
- Facturación tributaria o electrónica
- App móvil nativa (iOS/Android)
- Inventario de productos
- Reseñas y valoraciones públicas
- Múltiples sucursales por negocio
- White-label por negocio
- Roles avanzados (recepcionista, empleado, etc.)
- Portal del cliente con cuenta propia
- Notificaciones push
- SMS automáticos

---

## Roles del Sistema

### 1. Admin de Plataforma
- Rol interno — gestión de la plataforma como negocio
- Puede ver todos los negocios registrados
- Puede activar o desactivar negocios
- Puede ver métricas generales de uso
- **Estado en MVP:** Estructura base preparada, funcionalidad completa en Fase 2

### 2. Dueño del Negocio (Business Owner)
- Usuario principal del MVP
- Se registra, crea su negocio y gestiona toda su operación
- Accede al panel administrativo completo
- **Estado en MVP:** Completamente implementado

### 3. Cliente Final
- No tiene cuenta en la plataforma
- Reserva desde la página pública del negocio
- Puede recibir confirmación por correo (a futuro)
- **Estado en MVP:** Solo la página pública y el formulario de reserva

---

## Propuesta de Valor

```
"Agéndalo te permite gestionar tu agenda, clientes e ingresos desde 
un solo lugar — y tus clientes pueden reservar contigo sin llamarte."
```

---

## Visión a Largo Plazo

1. **MVP (Fase 1):** Plataforma funcional para dueños de negocio
2. **Fase 2:** Notificaciones automáticas, Google Calendar integrado, portal del cliente
3. **Fase 3:** Plan de suscripción, analytics avanzados, multi-sucursal
4. **Fase 4:** Marketplace / directorio, integración de pagos, app móvil

---

## Principios de Diseño del Producto

- **Simplicidad antes que funcionalidad:** Hacer pocas cosas, pero bien
- **Para dueños ocupados:** La UI debe ser rápida de entender y usar
- **Multi-tenant seguro:** Los datos de un negocio nunca se mezclan con otro
- **Preparado para crecer:** Arquitectura escalable sin sobre-ingeniería
- **Mobile-first:** Muchos dueños acceden desde el celular
