# Skedia — Guía de Setup del Workspace

## Requisitos Previos

### Software necesario
| Herramienta | Versión mínima | Instalación |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | (incluido con Node.js) |
| Angular CLI | 17+ | `npm install -g @angular/cli` |
| PHP | 8.2+ | https://php.net |
| Composer | 2+ | https://getcomposer.org |
| MySQL | 8+ | https://mysql.com |

---

## Estructura del Proyecto

```
Skedia/
├── agendalo_front/   ← Proyecto Angular
├── agendalo_back/    ← Proyecto Laravel
└── docs/             ← Documentación
```

---

## Setup del Frontend (Angular)

### 1. Instalar dependencias
```bash
cd agendalo_front
npm install
```

### 2. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp src/environments/environment.example.ts src/environments/environment.ts

# Editar con tu URL de API local
```

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1'
};
```

### 3. Levantar servidor de desarrollo
```bash
npm start
# o
ng serve
```

El frontend estará disponible en: **http://localhost:4200**

---

## Setup del Backend (Laravel)

### 1. Instalar dependencias
```bash
cd agendalo_back
composer install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
php artisan key:generate
```

### 3. Editar `.env`
```env
APP_NAME=Skedia
APP_ENV=local
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=skedia_dev
DB_USERNAME=root
DB_PASSWORD=tu_password

FRONTEND_URL=http://localhost:4200

MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@skedia.app
MAIL_FROM_NAME=Skedia
```

### 4. Crear base de datos y ejecutar migraciones
```bash
# Crear la base de datos en MySQL primero
mysql -u root -p -e "CREATE DATABASE skedia_dev;"

# Ejecutar migraciones
php artisan migrate

# Ejecutar seeders iniciales
php artisan db:seed
```

### 5. Levantar servidor de desarrollo
```bash
php artisan serve
```

La API estará disponible en: **http://localhost:8000**

---

## Verificar que todo funciona

### Backend
```bash
# Verificar que la API responde
curl http://localhost:8000/api/v1/public/health
# Respuesta esperada: {"status":"ok"}
```

### Frontend
Abre **http://localhost:4200** en el navegador. Deberías ver la pantalla de login de Skedia.

### Probar login con seeder
```
Email:    admin@skedia.app
Password: password
```

---

## Comandos útiles

### Frontend
```bash
# Generar componente
ng generate component features/example/pages/example

# Generar servicio
ng generate service core/services/example

# Build producción
ng build --configuration production
```

### Backend
```bash
# Crear migración
php artisan make:migration create_example_table

# Crear modelo con migración y controlador
php artisan make:model Example -mc

# Crear Form Request
php artisan make:request StoreExampleRequest

# Crear API Resource
php artisan make:resource ExampleResource

# Revertir y re-ejecutar migraciones (resetea BD)
php artisan migrate:fresh --seed
```

---

## Estructura de Rutas de la App

| URL | Descripción |
|---|---|
| `/login` | Login del dueño de negocio |
| `/registro` | Registro de nuevo usuario |
| `/onboarding` | Crear negocio (primer login) |
| `/dashboard` | Panel principal |
| `/agenda` | Calendario de citas |
| `/citas` | Listado de citas |
| `/clientes` | Gestión de clientes |
| `/servicios` | Gestión de servicios |
| `/finanzas` | Ingresos y egresos |
| `/configuracion` | Configuración del negocio |
| `/negocio/:slug` | Página pública del negocio |
| `/negocio/:slug/confirmacion` | Confirmación de reserva |

---

## Despliegue en cPanel (Producción)

### Backend (Laravel)
1. Subir archivos del proyecto al directorio del dominio
2. Apuntar el DocumentRoot a `/public`
3. Crear base de datos MySQL en cPanel
4. Configurar `.env` con datos de producción
5. Ejecutar `php artisan migrate --force`
6. Ejecutar `php artisan db:seed --force`
7. Configurar `APP_ENV=production` y `APP_DEBUG=false`

### Frontend (Angular)
1. Ejecutar `ng build --configuration production`
2. Subir el contenido de `dist/agendalo-front/` a la carpeta pública del frontend
3. Configurar el servidor web para que todas las rutas sirvan `index.html` (para Angular Router)

---

## Notas importantes

- El backend y frontend son completamente **desacoplados** — pueden estar en dominios diferentes
- Configurar `FRONTEND_URL` en `.env` de Laravel para el CORS
- En producción, deshabilitar siempre `APP_DEBUG=false`
- Los tokens de Google Calendar se guardan **cifrados** — asegurarse de que `APP_KEY` estté configurado antes
