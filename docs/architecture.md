# Agéndalo — Arquitectura del Sistema

## Visión General

Agéndalo es una plataforma **SaaS multi-tenant** construida con una arquitectura desacoplada:

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTES FINALES                     │
│            (reservan desde UI pública)                  │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              FRONTEND — Angular SPA                     │
│         agendalo_front  (hosted: CDN / cPanel)          │
│                                                         │
│  Panel Admin (dueño)    │    Página Pública (cliente)   │
│  /dashboard, /citas...  │    /negocio/:slug             │
└─────────────────────┬───────────────────────────────────┘
                      │  HTTP/REST (CORS habilitado)
                      │  JSON + JWT/Sanctum token
┌─────────────────────▼───────────────────────────────────┐
│              BACKEND — Laravel API REST                 │
│         agendalo_back  (hosted: cPanel + PHP)           │
│                                                         │
│  Auth     Business    Appointments   Finance            │
│  Services Clients     Settings       Calendar           │
└─────────────────────┬───────────────────────────────────┘
                      │  Eloquent ORM
┌─────────────────────▼───────────────────────────────────┐
│              BASE DE DATOS — MySQL                      │
│            (hosted: cPanel MySQL)                       │
│  Multi-tenant: cada entidad ligada a business_id        │
└─────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│           SERVICIOS EXTERNOS (Fase 2+)                  │
│  Google Calendar API   │   Mailgun / SMTP               │
└─────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| Angular | 17+ | Framework SPA |
| TypeScript | 5+ | Lenguaje base |
| Tailwind CSS | 3+ | Estilos utility-first |
| Angular Router | - | Rutas y guardas |
| Angular Material | Selectivo | Componentes complejos (datepicker, etc.) |
| ApexCharts | - | Gráficos del dashboard |
| RxJS | - | Reactivo / observables |

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Laravel | 11+ | Framework PHP API |
| PHP | 8.2+ | Lenguaje backend |
| MySQL | 8+ | Base de datos relacional |
| Laravel Sanctum | - | Autenticación API (tokens) |
| Eloquent ORM | - | Mapeo objeto-relacional |

### Infraestructura
| Tecnología | Uso |
|---|---|
| cPanel | Hosting backend Laravel |
| cPanel MySQL | Base de datos |
| CDN/Static Host | Frontend Angular (build estático) |
| Variables de entorno (.env) | Configuración sensible |

---

## Arquitectura Multi-Tenant

Agéndalo usa un modelo **multi-tenant de base de datos compartida con aislamiento por columna** (`business_id`):

- Todas las tablas operativas tienen una columna `business_id`
- Cada dueño de negocio solo puede ver y modificar datos de su negocio
- Este control se implementa a nivel de:
  - **Laravel Policies / Scopes globales** en los modelos
  - **Middleware** que verifica la pertenencia al negocio
  - **Validaciones en Form Requests**

```
users → businesses → services
                   → clients
                   → appointments → income_records
                   → expense_records
                   → opening_hours
                   → business_settings
```

---

## Estructura de Módulos Backend

```
app/
├── Console/
├── Exceptions/
│   └── Handler.php
├── Http/
│   ├── Controllers/
│   │   ├── Auth/
│   │   │   ├── AuthController.php
│   │   │   └── PasswordResetController.php
│   │   ├── Business/
│   │   │   └── BusinessController.php
│   │   ├── Appointments/
│   │   │   └── AppointmentController.php
│   │   ├── Clients/
│   │   │   └── ClientController.php
│   │   ├── Services/
│   │   │   └── ServiceController.php
│   │   ├── Finance/
│   │   │   ├── IncomeController.php
│   │   │   └── ExpenseController.php
│   │   ├── Settings/
│   │   │   └── SettingsController.php
│   │   ├── PublicBooking/
│   │   │   └── PublicBookingController.php
│   │   ├── Dashboard/
│   │   │   └── DashboardController.php
│   │   └── Admin/
│   │       └── AdminController.php
│   ├── Middleware/
│   │   ├── EnsureBusinessOwner.php
│   │   └── EnsureActive.php
│   ├── Requests/
│   │   ├── Auth/
│   │   ├── Appointment/
│   │   ├── Client/
│   │   ├── Service/
│   │   └── Finance/
│   └── Resources/
│       ├── AppointmentResource.php
│       ├── ClientResource.php
│       ├── ServiceResource.php
│       └── BusinessResource.php
├── Models/
│   ├── User.php
│   ├── Business.php
│   ├── BusinessCategory.php
│   ├── Service.php
│   ├── Client.php
│   ├── Appointment.php
│   ├── IncomeRecord.php
│   ├── ExpenseRecord.php
│   ├── ExpenseCategory.php
│   ├── OpeningHour.php
│   ├── BusinessSetting.php
│   └── GoogleIntegration.php
├── Services/
│   ├── AppointmentService.php
│   ├── BusinessService.php
│   ├── DashboardService.php
│   ├── FinanceService.php
│   └── GoogleCalendarService.php   ← placeholder
└── Policies/
    ├── AppointmentPolicy.php
    ├── ClientPolicy.php
    └── ServicePolicy.php
```

---

## Estructura de Módulos Frontend

```
src/app/
├── core/
│   ├── auth/           ← AuthService, guards
│   ├── interceptors/   ← AuthInterceptor, ErrorInterceptor
│   └── guards/         ← AuthGuard, BusinessSetupGuard
├── shared/
│   ├── components/     ← Componentes reutilizables
│   ├── models/         ← Interfaces TypeScript
│   ├── pipes/          ← Pipes personalizados
│   └── utils/          ← Funciones utilitarias
├── layouts/
│   ├── admin-layout/   ← Sidebar + topbar admin
│   └── public-layout/  ← Layout para páginas públicas
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── appointments/
│   ├── clients/
│   ├── services/
│   ├── finance/
│   ├── settings/
│   └── public-booking/
└── models/ (global)
```

---

## Flujo de Autenticación

```
1. Dueño → POST /api/auth/login
2. Backend valifica credenciales → retorna token (Sanctum)
3. Frontend guarda token en localStorage/memory
4. Cada request lleva: Authorization: Bearer {token}
5. AuthInterceptor Angular añade el header automáticamente
6. Backend valida el token en rutas protegidas con auth:sanctum
```

---

## Flujo de Reserva Pública

```
1. Cliente visita: /negocio/barberia-norte
2. Frontend carga datos del negocio: GET /api/public/business/barberia-norte
3. Cliente selecciona servicio y fecha/hora
4. Frontend verifica disponibilidad: GET /api/public/business/:slug/availability
5. Cliente completa formulario (nombre, correo, teléfono)
6. Frontend envía: POST /api/public/business/:slug/book
7. Backend crea la cita en estado "pendiente"
8. (Futuro) Backend envía correo de confirmación
9. (Futuro) Backend crea evento en Google Calendar del negocio
10. Frontend redirige a /negocio/:slug/confirmacion
```

---

## Decisiones de Arquitectura

| Decisión | Elección | Justificación |
|---|---|---|
| Autenticación | Laravel Sanctum | Simple, ideal para SPA + cPanel |
| Multi-tenant | Shared DB + business_id | Balance entre simplicidad y escala |
| Frontend | Angular standalone | Moderno, tree-shakeable, mejor rendimiento |
| Estilos | Tailwind CSS | Rápido desarrollo, consistente |
| ORM | Eloquent + Global Scopes | Seguridad multi-tenant automática |
| API format | JSON REST | Estándar, compatible con cualquier cliente |
| Gráficos | ApexCharts | Mejor integración con Angular que Chart.js |
| Despliegue | Backend en cPanel PHP | Requisito del cliente |

---

## Consideraciones de Seguridad

- **CORS** configurado en Laravel para permitir solo el dominio del frontend
- **Sanctum tokens** con expiración configurable
- **Global Scopes** en modelos para filtrar por `business_id` automáticamente
- **Policies** para verificar propiedad de recurso
- **Form Requests** con validación en cada endpoint
- **Sanitización** de inputs en frontend y backend
- **Rate limiting** en endpoints públicos (reservas)
- **Variables de entorno** para credenciales — nunca en código fuente
