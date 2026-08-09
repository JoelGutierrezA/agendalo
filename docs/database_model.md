# Agéndalo — Modelo de Datos (MySQL)

## Principio Multi-Tenant

Todas las entidades operativas están vinculadas a un `business_id`. Ningún dato cruza entre negocios. Se utilizan **Global Scopes de Eloquent** para aplicar este filtro automáticamente.

---

## Diagrama de Entidades (ERD simplificado)

```
platform_admins
    └── (gestión de plataforma)

users (business_owners)
    └── businesses (1:1)
            ├── business_categories (N:1)
            ├── business_settings (1:1)
            ├── opening_hours (1:N)
            ├── google_integrations (1:1)
            ├── services (1:N)
            ├── clients (1:N)
            ├── appointments (1:N)
            │       ├── services (N:1)
            │       ├── clients (N:1)
            │       └── income_records (1:1 opcional)
            ├── income_records (1:N)
            ├── expense_records (1:N)
            └── expense_categories (1:N)
```

---

## Tablas

### `platform_admins`
Admin interno de la plataforma Agéndalo.

| Campo | Tipo | Descripción |
|---|---|---|
| id | BIGINT PK | |
| name | VARCHAR(100) | |
| email | VARCHAR(150) UNIQUE | |
| password | VARCHAR(255) | |
| is_active | TINYINT(1) DEFAULT 1 | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `users`
Dueños de negocio. Usuario principal del MVP.

| Campo | Tipo | Descripción |
|---|---|---|
| id | BIGINT PK | |
| name | VARCHAR(100) | Nombre del dueño |
| email | VARCHAR(150) UNIQUE | |
| email_verified_at | TIMESTAMP NULL | |
| password | VARCHAR(255) | |
| is_active | TINYINT(1) DEFAULT 1 | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP NULL | Soft delete |

**Índices:** `email` (UNIQUE)

---

### `business_categories`
Categorías/rubros de negocios.

| Campo | Tipo | Descripción |
|---|---|---|
| id | BIGINT PK | |
| name | VARCHAR(80) | ej: Barbería, Estética, Salud |
| slug | VARCHAR(80) UNIQUE | |
| icon | VARCHAR(50) NULL | ícono referencial |
| is_active | TINYINT(1) DEFAULT 1 | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `businesses`
Negocio registrado en la plataforma. Hay un negocio por usuario (MVP).

| Campo | Tipo | Descripción |
|---|---|---|
| id | BIGINT PK | |
| user_id | BIGINT FK → users.id | Dueño del negocio |
| category_id | BIGINT FK → business_categories.id NULL | |
| name | VARCHAR(120) | Nombre comercial |
| slug | VARCHAR(120) UNIQUE | URL pública del negocio |
| description | TEXT NULL | |
| phone | VARCHAR(30) NULL | |
| email | VARCHAR(150) NULL | Email del negocio |
| address | VARCHAR(255) NULL | |
| city | VARCHAR(80) NULL | |
| country | VARCHAR(80) DEFAULT 'CL' | |
| logo_url | VARCHAR(255) NULL | |
| is_active | TINYINT(1) DEFAULT 1 | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP NULL | Soft delete |

**Índices:** `user_id`, `slug` (UNIQUE), `category_id`

---

### `business_settings`
Configuración interna del negocio.

| Campo | Tipo | Descripción |
|---|---|---|
| id | BIGINT PK | |
| business_id | BIGINT FK → businesses.id UNIQUE | |
| booking_advance_days | INT DEFAULT 30 | Días disponibles para reservar |
| min_booking_notice_hours | INT DEFAULT 1 | Horas mínimas de anticipación |
| allow_public_booking | TINYINT(1) DEFAULT 1 | Habilitar página pública |
| booking_confirmation_required | TINYINT(1) DEFAULT 0 | Cita en "pendiente" hasta confirmar |
| time_zone | VARCHAR(60) DEFAULT 'America/Santiago' | |
| currency | VARCHAR(10) DEFAULT 'CLP' | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `opening_hours`
Horario de atención por día de la semana.

| Campo | Tipo | Descripción |
|---|---|---|
| id | BIGINT PK | |
| business_id | BIGINT FK → businesses.id | |
| day_of_week | TINYINT | 0=Domingo, 1=Lunes ... 6=Sábado |
| is_open | TINYINT(1) DEFAULT 1 | |
| open_time | TIME | ej: 09:00:00 |
| close_time | TIME | ej: 18:00:00 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Índices:** `business_id`, `(business_id, day_of_week)` UNIQUE

---

### `services`
Servicios ofrecidos por el negocio.

| Campo | Tipo | Descripción |
|---|---|---|
| id | BIGINT PK | |
| business_id | BIGINT FK → businesses.id | |
| name | VARCHAR(100) | ej: Corte de cabello |
| description | TEXT NULL | |
| duration_minutes | INT | Duración del servicio |
| price | DECIMAL(10,2) DEFAULT 0 | Precio referencial |
| is_active | TINYINT(1) DEFAULT 1 | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP NULL | Soft delete |

**Índices:** `business_id`

---

### `clients`
Clientes del negocio. Aislados por negocio.

| Campo | Tipo | Descripción |
|---|---|---|
| id | BIGINT PK | |
| business_id | BIGINT FK → businesses.id | |
| name | VARCHAR(100) | |
| email | VARCHAR(150) NULL | |
| phone | VARCHAR(30) NULL | |
| notes | TEXT NULL | Observaciones internas |
| last_visit_at | TIMESTAMP NULL | Actualizado automáticamente |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP NULL | Soft delete |

**Índices:** `business_id`, `(business_id, email)`

---

### `appointments`
Citas del negocio. Entidad central del sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| id | BIGINT PK | |
| business_id | BIGINT FK → businesses.id | |
| client_id | BIGINT FK → clients.id NULL | Puede ser cliente ad-hoc |
| service_id | BIGINT FK → services.id NULL | |
| client_name | VARCHAR(100) | Nombre (aunque no exista cliente) |
| client_email | VARCHAR(150) NULL | |
| client_phone | VARCHAR(30) NULL | |
| scheduled_at | DATETIME | Fecha y hora de la cita |
| duration_minutes | INT | Copia de la duración al momento de crear |
| status | ENUM('pending','confirmed','completed','cancelled','no_show') DEFAULT 'pending' | |
| notes | TEXT NULL | Observaciones |
| is_from_public | TINYINT(1) DEFAULT 0 | Si vino de la página pública |
| google_event_id | VARCHAR(255) NULL | ID del evento en Google Calendar |
| cancelled_at | TIMESTAMP NULL | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP NULL | Soft delete |

**Índices:** `business_id`, `client_id`, `service_id`, `scheduled_at`, `status`

---

### `income_records`
Registros de ingresos del negocio.

| Campo | Tipo | Descripción |
|---|---|---|
| id | BIGINT PK | |
| business_id | BIGINT FK → businesses.id | |
| appointment_id | BIGINT FK → appointments.id NULL | Relación opcional |
| description | VARCHAR(255) | |
| amount | DECIMAL(10,2) | |
| recorded_at | DATE | Fecha del ingreso |
| notes | TEXT NULL | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP NULL | |

**Índices:** `business_id`, `appointment_id`, `recorded_at`

---

### `expense_categories`
Categorías de egresos.

| Campo | Tipo | Descripción |
|---|---|---|
| id | BIGINT PK | |
| business_id | BIGINT FK → businesses.id | |
| name | VARCHAR(80) | ej: Arriendo, Insumos, Sueldos |
| is_active | TINYINT(1) DEFAULT 1 | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `expense_records`
Registros de egresos del negocio.

| Campo | Tipo | Descripción |
|---|---|---|
| id | BIGINT PK | |
| business_id | BIGINT FK → businesses.id | |
| category_id | BIGINT FK → expense_categories.id NULL | |
| description | VARCHAR(255) | |
| amount | DECIMAL(10,2) | |
| recorded_at | DATE | |
| notes | TEXT NULL | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP NULL | |

**Índices:** `business_id`, `category_id`, `recorded_at`

---

### `google_integrations`
Almacena la integración OAuth del negocio con Google Calendar.

| Campo | Tipo | Descripción |
|---|---|---|
| id | BIGINT PK | |
| business_id | BIGINT FK → businesses.id UNIQUE | |
| google_account_email | VARCHAR(150) NULL | Email de la cuenta Google conectada |
| calendar_id | VARCHAR(255) NULL | ID del calendario de Google |
| access_token | TEXT NULL | Token cifrado |
| refresh_token | TEXT NULL | Token de refresco cifrado |
| token_expires_at | TIMESTAMP NULL | |
| is_active | TINYINT(1) DEFAULT 0 | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

> ⚠️ Los tokens deben almacenarse **cifrados** (usando `encrypted:text` en Laravel).

---

### `password_reset_tokens`
Tokens para recuperación de contraseña (Laravel nativo).

| Campo | Tipo | Descripción |
|---|---|---|
| email | VARCHAR(150) PK | |
| token | VARCHAR(255) | Hash del token |
| created_at | TIMESTAMP NULL | |

---

## Relaciones Eloquent Principales

```
User          hasOne    Business
Business      belongsTo User
Business      hasMany   Service
Business      hasMany   Client
Business      hasMany   Appointment
Business      hasMany   IncomeRecord
Business      hasMany   ExpenseRecord
Business      hasMany   ExpenseCategory
Business      hasOne    BusinessSetting
Business      hasMany   OpeningHour
Business      hasOne    GoogleIntegration

Appointment   belongsTo Business
Appointment   belongsTo Client (nullable)
Appointment   belongsTo Service (nullable)
Appointment   hasOne    IncomeRecord (opcional)

Client        hasMany   Appointment

IncomeRecord  belongsTo Business
IncomeRecord  belongsTo Appointment (nullable)
ExpenseRecord belongsTo Business
ExpenseRecord belongsTo ExpenseCategory (nullable)
```

---

## Propuesta de Índices Compuestos

```sql
-- Citas: búsqueda por negocio y fecha (más común)
INDEX idx_appointments_business_date (business_id, scheduled_at)

-- Citas: búsqueda por estado
INDEX idx_appointments_status (business_id, status)

-- Finanzas: filtro por período
INDEX idx_income_date (business_id, recorded_at)
INDEX idx_expense_date (business_id, recorded_at)

-- Clientes: búsqueda por email dentro del negocio
UNIQUE INDEX idx_client_email (business_id, email)
```

---

## Soft Deletes

Se aplica soft delete (`deleted_at`) en las siguientes tablas:

- `users`
- `businesses`
- `services`
- `clients`
- `appointments`
- `income_records`
- `expense_records`

Las tablas de configuración y categorías no requieren soft delete.

---

## Seeders Iniciales

| Seeder | Datos |
|---|---|
| `BusinessCategorySeeder` | Barbería, Peluquería, Estética, Podología, Salud, Entrenamiento, Otro |
| `ExpenseCategorySeeder` | Arriendo, Insumos, Servicios, Sueldos, Marketing, Otros |
| `PlatformAdminSeeder` | Admin inicial de prueba |
