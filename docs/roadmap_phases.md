# Agéndalo — Roadmap por Fases

## Visión General

```
Fase 0 (Actual) → Fundación y scaffold
Fase 1           → MVP Funcional
Fase 2           → Automatización y Google Calendar
Fase 3           → Monetización y escala
Fase 4           → Marketplace y expansión
```

---

## FASE 0 — Fundación del Proyecto
**Estado:** ✅ En progreso
**Objetivo:** Dejar el proyecto bien estructurado, documentado y listo para desarrollar módulo por módulo.

### Entregables de Fase 0
- [x] Estructura de carpetas del proyecto
- [x] Documentación completa (visión, arquitectura, BD, API, UI/UX)
- [x] Backlog detallado
- [x] Scaffold Angular (rutas, layouts, páginas placeholder)
- [x] Scaffold Laravel (modelos, migraciones, controladores, rutas base)
- [x] Diseño visual base y design system
- [x] Modelo de datos definido

---

## FASE 1 — MVP Funcional
**Duración estimada:** 6-10 semanas (solo)
**Objetivo:** Plataforma funcional que un dueño de negocio real pueda usar.

### Módulos a desarrollar en Fase 1

| Módulo | Descripción | Semana est. |
|---|---|---|
| Auth completa | Registro, login, recuperación | 1 |
| Onboarding negocio | Crear perfil del negocio | 1-2 |
| Servicios | CRUD de servicios | 2 |
| Horarios | Configurar disponibilidad | 2 |
| Clientes | CRUD de clientes | 3 |
| Citas (básico) | Crear, listar, cambiar estado | 3-4 |
| Calendario de citas | Vista visual | 4 |
| Página pública | `/negocio/:slug` + reserva | 5-6 |
| Finanzas básica | Ingresos y egresos | 6-7 |
| Dashboard básico | KPIs y resumen | 7 |
| Configuración | Datos negocio + horarios | 7-8 |
| UX states | Empty states, loaders, toasts | 8 |
| Testing básico | Pruebas principales | 9 |
| Deploy inicial | Subir a hosting cPanel | 10 |

### Criterio de éxito Fase 1
> Un dueño de negocio puede registrarse, configurar su negocio, crear citas manualmente, compartir su página pública con sus clientes, y controlar sus ingresos y egresos del mes.

---

## FASE 2 — Automatización y Notificaciones
**Duración estimada:** 4-6 semanas
**Objetivo:** La plataforma hace el trabajo repetitivo por el dueño.

### Funcionalidades

| Feature | Descripción |
|---|---|
| Google Calendar | Integración OAuth real, sincronización automática |
| Notificaciones por email | Confirmación de cita al cliente, recordatorio |
| Portal del cliente | Cuenta opcional para ver su historial |
| Reagendar desde email | Link para cambiar la cita desde el correo |
| Recordatorios automáticos | 24h y 1h antes de la cita |
| Historial mejorado | Estadísticas de cliente a lo largo del tiempo |
| Admin de plataforma | Panel completo de gestión de negocios |

---

## FASE 3 — Monetización y Escala
**Duración estimada:** 4-6 semanas
**Objetivo:** Convertir Agéndalo en un negocio SaaS rentable.

### Funcionalidades

| Feature | Descripción |
|---|---|
| Planes de suscripción | Free / Pro / Business |
| Integración Stripe | Cobro recurrente mensual |
| Límites por plan | Cantidad de citas, clientes, servicios |
| Analytics avanzados | Métricas de retención, días más concurridos |
| Multi-empleado | Varios profesionales por negocio |
| Múltiples sucursales | Un negocio puede tener varias sedes |
| Reportes exportables | PDF y Excel de finanzas y citas |

---

## FASE 4 — Marketplace y Expansión
**Duración estimada:** 6-8 semanas
**Objetivo:** Ampliar la audiencia con presencia de descubrimiento.

### Funcionalidades

| Feature | Descripción |
|---|---|
| Directorio de negocios | Página principal con búsqueda pública |
| Reseñas y valoraciones | Clientes pueden dejar opiniones |
| Perfil público enriquecido | Fotos, galería, testimonios |
| SEO por negocio | Páginas indexables por Google |
| App móvil (PWA primero) | Acceso móvil mejorado |
| Widget embebible | El negocio puede poner su reserva en su web propia |
| API pública | Para integraciones de terceros |

---

## Deuda técnica a gestionar entre fases

| Item | Acción sugerida |
|---|---|
| Tests automatizados | Añadir en Fase 1 final / Fase 2 |
| CI/CD | Pipeline simple en Fase 2 |
| Optimización de consultas BD | Revisar índices en Fase 2 |
| Cache de disponibilidad | Redis en Fase 3 |
| Monitoreo de errores | Sentry o similar en Fase 2 |
| Accesibilidad | WCAG básico en Fase 2 |
