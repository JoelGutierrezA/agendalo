# Skedia — Backlog MVP

## Estructura del Backlog

Organizado en **Épicas → Historias de Usuario → Tareas Técnicas**

---

## ÉPICA 1: Base del Proyecto y Arquitectura

**Prioridad:** 🔴 Alta (fundación de todo)
**Estado:** ✅ Completado (scaffold inicial)

### US-1.1: Estructura de carpetas del proyecto
**Como** desarrollador, **quiero** una estructura de carpetas clara y predecible **para** que el equipo pueda navegar y escalar el código fácilmente.

**Criterios de aceptación:**
- Carpetas `agendalo_front`, `agendalo_back` y `docs` creadas
- Estructura modular por feature en frontend
- Estructura por responsabilidad en backend
- README en cada carpeta principal

**Tareas:**
- [x] Crear estructura de carpetas raíz
- [x] Crear proyecto Angular base
- [x] Crear proyecto Laravel base
- [x] Crear documentación de arquitectura

---

### US-1.2: Configuración de variables de entorno
**Como** desarrollador, **quiero** que las credenciales y configuraciones estén en `.env` **para** no exponer datos sensibles en el código.

**Criterios:**
- `.env.example` en ambos proyectos
- Variables documentadas
- CORS configurado en Laravel

**Tareas:**
- [x] `.env.example` en Laravel con DB, APP_KEY, CORS, Google
- [x] `environment.ts` y `environment.prod.ts` en Angular
- [x] CORS configurado para dominio del frontend

---

**Prioridad:** 🔴 Alta  
**Dependencias:** Épica 1
**Estado:** ✅ Completado

### US-2.1: Registro del dueño de negocio
**Tareas:**
- [x] Migración users + modelo User
- [x] AuthController@register
- [x] StoreUserRequest (validaciones)
- [x] Página de registro Angular
- [x] Servicio AuthService Angular
- [x] Guard de redirección post-login

---

### US-2.2: Login del dueño de negocio
**Tareas:**
- [x] AuthController@login con Sanctum
- [x] AuthInterceptor Angular (header Bearer)
- [x] Página de login Angular (Incluye botón de visualizar contraseña 👁️)
- [x] LocalStorage service para token
- [x] Redirect inteligente por rol (Admin vs Owner)

---

### US-2.3: Recuperación de contraseña
**Tareas:**
- [x] PasswordResetController (Laravel)
- [x] Configurar email driver (log para dev)
- [x] Página "olvidé mi contraseña" Angular
- [x] Página "nueva contraseña" Angular

---

### US-2.4: Cerrar sesión
**Tareas:**
- [x] AuthController@logout (revoca token)
- [x] Botón logout en sidebar/topbar
- [x] Limpiar localStorage en Angular

---

**Prioridad:** 🔴 Alta  
**Dependencias:** Épica 2
**Estado:** ✅ Completado

### US-3.1: Crear perfil del negocio (Onboarding)
**Tareas:**
- [x] Migración `businesses` + modelo Business
- [x] BusinessController@store
- [x] Validación de slug único
- [x] Generación automática de slug desde nombre
- [x] Página de onboarding Angular (paso a paso)
- [x] BusinessSetupGuard (con bypass para admin global)

---

### US-3.2: Actualizar datos del negocio
**Tareas:**
- [x] BusinessController@update
- [x] Sección "Datos del negocio" en Configuración Angular

---

**Prioridad:** 🔴 Alta  
**Dependencias:** Épica 3
**Estado:** ✅ Completado

### US-4.1: Crear y editar servicios
**Tareas:**
- [x] Migración `services` + modelo Service
- [x] ServiceController (CRUD + toggle)
- [x] Página de servicios Angular (listado + formulario)
- [x] Modal crear / editar servicio

---

### US-4.2: Activar / desactivar servicio
**Tareas:**
- [x] PATCH /services/{id}/toggle-active
- [x] Toggle UI en listado de servicios

---

## ÉPICA 5: Gestión de Clientes

**Prioridad:** 🟡 Media  
**Dependencias:** Épica 3
**Estado:** ✅ Completado

### US-5.1: Registrar cliente
**Como** dueño, **quiero** registrar a mis clientes **para** llevar un historial.

**Criterios:**
- Campos: nombre, email, teléfono, notas
- Clientes únicos por negocio (no se comparten entre negocios)
- Búsqueda por nombre/email/teléfono

**Tareas:**
- [x] Migración `clients` + modelo Client
- [x] ClientController (CRUD)
- [x] Página de clientes Angular (tabla + búsqueda)
- [x] Modal crear / editar cliente

---

### US-5.2: Ver historial de citas del cliente
**Como** dueño, **quiero** ver todas las citas de un cliente **para** conocer su historial.

**Tareas:**
- [x] GET /clients/{id}/appointments
- [x] Perfil del cliente Angular con historial

---

**Prioridad:** 🔴 Alta  
**Dependencias:** Épicas 4 y 5
**Estado:** ✅ Completado

### US-6.1: Crear cita manualmente
**Tareas:**
- [x] Migración `appointments` + modelo Appointment
- [x] AppointmentController@store (Con validación de horarios reales)
- [x] Sincronización automática de clientes (`firstOrCreate`)
- [x] Formulario de cita Angular (modal con filtros dinámicos)

---

### US-6.2: Ver citas en calendario
**Tareas:**
- [x] GET /appointments/calendar
- [x] Componente de calendario Angular (FullCalendar)
- [x] Vista de lista de citas (AppointmentsListComponent)

---

### US-6.3: Cambiar estado de cita
**Tareas:**
- [x] PATCH /appointments/{id}/status
- [x] Selector de estado con badges de colores
- [x] Lógica de cancelación y completado

---

### US-6.4: Editar y reagendar cita
**Tareas:**
- [x] AppointmentController@update
- [x] Formulario de edición con validación de disponibilidad

---

### US-6.5: Cancelar cita
**Tareas:**
- [x] PATCH /appointments/{id}/status (status: cancelled)
- [x] Modal de confirmación (SweetAlert2)

---

## ÉPICA 7: Página Pública de Reservas

**Prioridad:** 🔴 Alta  
**Dependencias:** Épicas 4 y 6
**Estado:** ✅ Completado

### US-7.1: Página pública del negocio
**Como** cliente final, **quiero** acceder a la página del negocio **para** ver sus servicios y reservar.

**Criterios:**
- URL: `/negocio/:slug`
- Muestra nombre, descripción, dirección, servicios activos
- Sin necesidad de cuenta
- Diseño amigable, mobile-first

**Tareas:**
- [x] GET /public/business/{slug}
- [x] Página pública Angular (layout separado)
- [x] Header y footer público

---

### US-7.2: Seleccionar horario disponible
**Como** cliente, **quiero** ver qué horarios están disponibles para el servicio que elegí.

**Tareas:**
- [x] GET /public/business/{slug}/availability
- [x] Lógica de disponibilidad en backend (horarios - citas existentes)
- [x] Selector de fecha y hora Angular

---

### US-7.3: Reservar cita sin cuenta
**Como** cliente, **quiero** reservar completando mis datos básicos sin necesidad de crear cuenta.

**Criterios:**
- Campos: nombre, email, teléfono, observaciones
- Cita creada en estado pendiente
- Página de confirmación con resumen
- Rate limiting para evitar spam

**Tareas:**
- [x] POST /public/business/{slug}/book
- [x] Formulario de reserva Angular
- [x] Página de confirmación Angular
- [ ] Rate limiting en endpoint público (Fase 2)

---

### US-8.1: Infraestructura y Configuración
**Tareas:**
- [ ] Crear proyecto en Google Cloud Console y configurar Pantalla de Consentimiento.
- [ ] Habilitar Google Calendar API y obtener `CLIENT_ID` y `CLIENT_SECRET`.
- [ ] Configurar variables de entorno en `.env`.
- [ ] Crear tabla `google_integrations` (fields: `id`, `business_id`, `access_token`, `refresh_token`, `expires_at`).

### US-8.2: Flujo de Autorización OAuth 2.0
**Tareas:**
- [ ] Instalar SDK de Google en Laravel (`google/apiclient`).
- [ ] Implementar endpoint `GET /google/auth-url` para iniciar el flujo.
- [ ] Implementar endpoint `GET /google/callback` para canjear el código por tokens y guardarlos.
- [ ] Lógica para auto-refrescar el token cuando expire.

### US-8.3: Sincronización de Citas
**Tareas:**
- [ ] Crear `GoogleCalendarService` para abstraer la comunicación con la API.
- [ ] Sincronizar automáticamente creación de cita al servicio de Google.
- [ ] Sincronizar ediciones (reagendamientos) y cancelaciones (eliminar de Google).
- [ ] Manejo de errores (si el token es revocado, notificar al dueño).

### US-8.4: Interfaz de Configuración
**Tareas:**
- [ ] Crear sección "Integraciones" en el panel de configuración Angular.
- [ ] Botón "Conectar con Google Calendar" con manejo de estado (conectado/desconectado).
- [ ] Mostrar información del calendario sincronizado.

---

## ÉPICA 9: Finanzas — Ingresos y Egresos

**Prioridad:** 🟡 Media  
**Dependencias:** Épica 3
**Estado:** ✅ Completado

### US-9.1: Registrar ingreso
**Como** dueño, **quiero** registrar cada ingreso **para** llevar mi control financiero.

**Tareas:**
- [x] Migración `income_records` + modelo
- [x] Registro automático al completar cita
- [x] CRUD de Ingresos manuales

---

### US-9.2: Registrar egreso e Insumos
**Como** dueño, **quiero** registrar mis gastos por categoría **para** conocer mis costos.

**Tareas:**
- [x] Migración `expense_records` + `expense_categories`
- [x] Módulo de Insumos (`SuppliesComponent`) con historial
- [x] Página de finanzas con tabs (Balance general)

---

### US-9.3: Ver resumen financiero por período
**Como** dueño, **quiero** ver totales de ingresos, egresos y balance por mes.

**Tareas:**
- [ ] GET /dashboard/summary con cálculos financieros
- [ ] KPIs financieros en dashboard
- [ ] Gráfico mensual en módulo de finanzas

---

## ÉPICA 10: Dashboard y Estadísticas

**Prioridad:** 🟡 Media  
**Dependencias:** Épicas 6 y 9

### US-10.1: Dashboard con KPIs del negocio
**Como** dueño, **quiero** ver un resumen del estado de mi negocio al entrar al panel.

**Criterios:**
- KPIs: citas del período, ingresos, egresos, balance
- Lista de citas del día
- Gráfico de citas por semana
- Servicios más reservados

**Tareas:**
- [ ] DashboardController + DashboardService
- [ ] GET /dashboard/summary
- [ ] Página dashboard Angular con cards y gráficos
- [ ] Integración ApexCharts

---

**Prioridad:** 🟡 Media  
**Estado:** ✅ Completado

### US-11.1: Configurar horarios de atención
**Tareas:**
- [x] Migración `opening_hours` + modelo
- [x] Editor visual de semana en Angular (`SettingsComponent`)
- [x] Disponibilidad real en Página Pública

---

### ÉPICA 12: Admin de Plataforma (Global)
**Prioridad:** ✅ Completado

### US-12.1: Panel de administración global
**Tareas:**
- [x] Registro de usuario admin (`admin@agendalo.com`)
- [x] Panel de negocios (Activar/Suspender)
- [x] Gestión de usuarios global
- [x] Dashboard de estadísticas de plataforma

---

## ÉPICA 13: Hardening, UX States y Calidad

**Prioridad:** 🟡 Media (al final del MVP)

### US-13.1: Estados de carga y vacíos
- [ ] Skeleton loaders en listas
- [ ] Empty states en todas las páginas
- [ ] Toast notifications para éxito/error
- [ ] Manejo de errores HTTP en interceptor Angular

### US-13.2: Validaciones completas
- [ ] Form Requests en todos los endpoints Laravel
- [ ] Validaciones reactivas en formularios Angular
- [ ] Mensajes de error claros en español

### US-13.3: Seguridad básica
- [ ] Rate limiting en endpoints públicos
- [ ] CORS configurado correctamente
- [ ] Global Scope por business_id en modelos
- [ ] Policies para proteger recursos entre negocios

---

## ÉPICA 14: Deploy y Preparación para Producción

**Prioridad:** 🟢 Baja (Fase 1 fin / Fase 2)

- [ ] Configurar build de producción Angular
- [ ] Configurar Laravel en hosting cPanel
- [ ] Configurar base de datos MySQL producción
- [ ] Variables de entorno producción
- [ ] Documentar proceso de deploy

---

## ÉPICA 15: Multi-Rubro Modular (Visión de Crecimiento)

**Prioridad:** 🟢 Baja (Fase 2)
**Objetivo:** Adaptar Skedia a diversos sectores mediante módulos activables.

### US-15.1: Plantillas de Rubro Inteligentes
- [ ] Definir catálogo de rubros (Peluquería, Salud, Hotelería, Mecánica, etc.).
- [ ] Sistema de "Feature Toggles" para activar/desactivar módulos por negocio.
- [ ] Onboarding dinámico: Configuración automática según rubro elegido.

### US-15.2: Motor de Agendamiento Híbrido
- [ ] Soporte para reservas por bloques de tiempo (Servicios).
- [ ] Soporte para reservas por rangos de días (Alojamiento/Arriendo).

---

## ÉPICA 16: Monetización y Suscripciones

**Prioridad:** 🟢 Baja (Fase 2)
**Objetivo:** Convertir Skedia en un negocio SaaS escalable.

### US-16.1: Modelo Freemium y Viralidad
- [ ] **Lógica de Trial**: 3 meses gratis de agendamiento básico para todo usuario nuevo.
- [ ] **Sistema de Referidos (Bono Único)**:
  - Si un usuario en Trial refiere a un amigo: El tiempo restante del Trial se convierte en **Premium Gratis** (solo 1 vez).
  - Si un usuario Premium refiere a un amigo: Obtiene **1 mes extra de Premium** gratis.
- [ ] **Feature Gating**: Restringir acceso a Finanzas, Insumos e Inventario a usuarios Premium.

### US-16.2: Gestión de Planes y Pagos
- [ ] Crear tabla `subscriptions` y `plans`.
- [ ] Integración con pasarela de pagos (Stripe / Transbank).
- [ ] Panel de facturación para el cliente.

---

## Prioridades Resumidas (Actualizada)

| Prioridad | Épicas |
|---|---|
| 🔴 Crítica | 1, 2, 3, 4, 6, 7 |
| 🟡 Alta | 5, 9, 10, 11, 13 |
| 🟢 Futuro | 8, 12, 14, 15, 16 |
