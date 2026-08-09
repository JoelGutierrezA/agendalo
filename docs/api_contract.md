# Agéndalo — Contrato de API REST

## Convenciones Generales

- **Base URL:** `https://api.agendalo.app/api/v1`
- **Formato:** JSON
- **Autenticación:** Bearer Token (Laravel Sanctum) en rutas protegidas
- **Headers requeridos (rutas privadas):**
  ```
  Authorization: Bearer {token}
  Accept: application/json
  Content-Type: application/json
  ```

### Formato de Respuesta Exitosa

```json
{
  "success": true,
  "data": { ... },
  "message": "Operación completada exitosamente"
}
```

### Formato de Error

```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": {
    "campo": ["El campo es requerido."]
  }
}
```

### Códigos HTTP utilizados

| Código | Uso |
|---|---|
| 200 | Éxito con datos |
| 201 | Recurso creado |
| 204 | Éxito sin contenido |
| 400 | Bad request / error de validación |
| 401 | No autenticado |
| 403 | No autorizado (recurso de otro negocio) |
| 404 | Recurso no encontrado |
| 422 | Errores de validación |
| 500 | Error interno del servidor |

---

## Módulo: Auth

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me
```

### POST /auth/register
```json
// Request
{
  "name": "Juan García",
  "email": "juan@gmail.com",
  "password": "password123",
  "password_confirmation": "password123"
}

// Response 201
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "Juan García", "email": "juan@gmail.com" },
    "token": "2|abc123..."
  }
}
```

### POST /auth/login
```json
// Request
{ "email": "juan@gmail.com", "password": "password123" }

// Response 200
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "Juan García", "email": "juan@gmail.com" },
    "business": { "id": 1, "name": "Barbería Norte", "slug": "barberia-norte" } | null,
    "token": "2|abc123..."
  }
}
```

---

## Módulo: Business

```
GET    /api/v1/business          ← Datos del negocio del usuario autenticado
POST   /api/v1/business          ← Crear negocio (onboarding)
PUT    /api/v1/business          ← Actualizar negocio
GET    /api/v1/business/categories  ← Listar categorías
```

### GET /business
```json
// Response 200
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Barbería Norte",
    "slug": "barberia-norte",
    "description": "Barbería de confianza",
    "phone": "+56912345678",
    "email": "barberia@norte.com",
    "address": "Av. Principal 123",
    "is_active": true,
    "category": { "id": 1, "name": "Barbería" },
    "settings": { ... },
    "opening_hours": [ ... ]
  }
}
```

### POST /business (Onboarding)
```json
// Request
{
  "name": "Barbería Norte",
  "slug": "barberia-norte",
  "category_id": 1,
  "phone": "+56912345678",
  "email": "barberia@norte.com",
  "description": "...",
  "address": "..."
}
```

---

## Módulo: Services

```
GET    /api/v1/services
POST   /api/v1/services
GET    /api/v1/services/{id}
PUT    /api/v1/services/{id}
DELETE /api/v1/services/{id}
PATCH  /api/v1/services/{id}/toggle-active
```

### POST /services
```json
// Request
{
  "name": "Corte de cabello",
  "description": "Corte clásico con lavado",
  "duration_minutes": 30,
  "price": 8000,
  "is_active": true
}

// Response 201
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Corte de cabello",
    "duration_minutes": 30,
    "price": "8000.00",
    "is_active": true
  }
}
```

---

## Módulo: Clients

```
GET    /api/v1/clients
POST   /api/v1/clients
GET    /api/v1/clients/{id}
PUT    /api/v1/clients/{id}
DELETE /api/v1/clients/{id}
GET    /api/v1/clients/{id}/appointments
```

### GET /clients (con filtros)
```
?search=juan       ← búsqueda por nombre, email o teléfono
?page=1
?per_page=20
```

### POST /clients
```json
{
  "name": "María López",
  "email": "maria@gmail.com",
  "phone": "+56987654321",
  "notes": "Cliente preferencial"
}
```

---

## Módulo: Appointments

```
GET    /api/v1/appointments
POST   /api/v1/appointments
GET    /api/v1/appointments/{id}
PUT    /api/v1/appointments/{id}
DELETE /api/v1/appointments/{id}
PATCH  /api/v1/appointments/{id}/status
GET    /api/v1/appointments/calendar?date=2025-03&view=month
```

### GET /appointments (filtros)
```
?date_from=2025-01-01
?date_to=2025-01-31
?status=pending,confirmed
?client_id=5
?service_id=2
?page=1
```

### POST /appointments
```json
{
  "client_id": 5,           // opcional si se ingresan datos manualmente
  "service_id": 2,
  "client_name": "María López",
  "client_email": "maria@gmail.com",
  "client_phone": "+56987654321",
  "scheduled_at": "2025-02-15T10:30:00",
  "notes": "Primera vez"
}
```

### PATCH /appointments/{id}/status
```json
{ "status": "confirmed" }   // pending | confirmed | completed | cancelled | no_show
```

---

## Módulo: Finance — Ingresos

```
GET    /api/v1/finance/income
POST   /api/v1/finance/income
GET    /api/v1/finance/income/{id}
PUT    /api/v1/finance/income/{id}
DELETE /api/v1/finance/income/{id}
```

### GET /finance/income (filtros)
```
?date_from=2025-01-01
?date_to=2025-01-31
?page=1
```

### POST /finance/income
```json
{
  "description": "Corte + barba",
  "amount": 12000,
  "recorded_at": "2025-01-15",
  "appointment_id": 10,    // opcional
  "notes": ""
}
```

---

## Módulo: Finance — Egresos

```
GET    /api/v1/finance/expenses
POST   /api/v1/finance/expenses
GET    /api/v1/finance/expenses/{id}
PUT    /api/v1/finance/expenses/{id}
DELETE /api/v1/finance/expenses/{id}
GET    /api/v1/finance/expense-categories
POST   /api/v1/finance/expense-categories
```

### POST /finance/expenses
```json
{
  "category_id": 2,
  "description": "Insumos del mes",
  "amount": 35000,
  "recorded_at": "2025-01-10",
  "notes": ""
}
```

---

## Módulo: Dashboard

```
GET    /api/v1/dashboard/summary
GET    /api/v1/dashboard/appointments-chart
GET    /api/v1/dashboard/finance-chart
```

### GET /dashboard/summary (query params)
```
?period=month      // week | month | year
?date=2025-01      // mes de referencia
```

### Response /dashboard/summary
```json
{
  "success": true,
  "data": {
    "total_appointments": 48,
    "appointments_by_status": {
      "confirmed": 20,
      "completed": 18,
      "cancelled": 5,
      "no_show": 3,
      "pending": 2
    },
    "total_income": 450000,
    "total_expenses": 85000,
    "balance": 365000,
    "top_services": [
      { "name": "Corte", "count": 22 }
    ],
    "busiest_days": ["Viernes", "Sábado"]
  }
}
```

---

## Módulo: Settings

```
GET    /api/v1/settings
PUT    /api/v1/settings
GET    /api/v1/settings/opening-hours
PUT    /api/v1/settings/opening-hours
```

### PUT /settings/opening-hours
```json
{
  "opening_hours": [
    { "day_of_week": 1, "is_open": true, "open_time": "09:00", "close_time": "18:00" },
    { "day_of_week": 2, "is_open": true, "open_time": "09:00", "close_time": "18:00" },
    { "day_of_week": 0, "is_open": false }
  ]
}
```

---

## Módulo: Public Booking (sin autenticación)

```
GET    /api/v1/public/business/{slug}
GET    /api/v1/public/business/{slug}/services
GET    /api/v1/public/business/{slug}/availability?service_id=1&date=2025-02-15
POST   /api/v1/public/business/{slug}/book
GET    /api/v1/public/appointments/{id}/confirmation
```

### GET /public/business/{slug}
```json
{
  "success": true,
  "data": {
    "name": "Barbería Norte",
    "description": "...",
    "phone": "+56912345678",
    "address": "...",
    "opening_hours": [ ... ],
    "services": [ ... ]
  }
}
```

### GET /public/business/{slug}/availability
```
?service_id=1
?date=2025-02-15
```

```json
{
  "success": true,
  "data": {
    "available_slots": [
      "09:00", "09:30", "10:00", "11:00", "14:00", "15:30"
    ]
  }
}
```

### POST /public/business/{slug}/book
```json
// Request
{
  "service_id": 1,
  "scheduled_at": "2025-02-15T10:00:00",
  "client_name": "Pedro Soto",
  "client_email": "pedro@gmail.com",
  "client_phone": "+56911111111",
  "notes": "Primera vez"
}

// Response 201
{
  "success": true,
  "data": {
    "appointment_id": 45,
    "confirmation_code": "AGD-2025-4500",
    "scheduled_at": "2025-02-15T10:00:00",
    "service": "Corte de cabello",
    "business": "Barbería Norte"
  },
  "message": "Reserva realizada exitosamente"
}
```

---

## Módulo: Admin Plataforma (Fase 2)

```
GET    /api/v1/admin/businesses         ← Lista todos los negocios
GET    /api/v1/admin/businesses/{id}
PATCH  /api/v1/admin/businesses/{id}/toggle-active
GET    /api/v1/admin/stats
```

---

## Módulo: Google Calendar (Placeholder — Fase 2)

```
GET    /api/v1/google/auth-url          ← URL de autorización OAuth
GET    /api/v1/google/callback          ← Callback OAuth (redirect)
DELETE /api/v1/google/disconnect        ← Desconectar integración
GET    /api/v1/google/status            ← Estado de la integración
```

---

## Paginación

Todos los endpoints de listado siguen el estándar de paginación de Laravel:

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "current_page": 1,
      "last_page": 5,
      "per_page": 20,
      "total": 94
    }
  }
}
```
