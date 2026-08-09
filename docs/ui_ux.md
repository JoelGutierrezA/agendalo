# Agéndalo — Guía de Diseño UI/UX

## Filosofía de Diseño

Agéndalo es una herramienta para dueños de negocio ocupados. El diseño debe transmitir:

- **Confianza** — se siente profesional y estable
- **Claridad** — la información es fácil de encontrar
- **Control** — el dueño siente que domina su negocio
- **Velocidad** — las tareas se hacen rápido, sin fricción

> El usuario principal no es un técnico. Es un barbero, una esteticista, un entrenador. El diseño debe ser immediato y usar lenguaje cercano.

---

## Paleta de Colores

### Colores Primarios

| Nombre | Valor | Uso |
|---|---|---|
| Primary | `#0F6FFF` | Botones principales, links activos, sidebar highlight |
| Primary Dark | `#0A50C8` | Hover de botones, activo en navegación |
| Primary Light | `#E8F0FE` | Fondos suaves, highlights de selección |

### Colores Neutros

| Nombre | Valor | Uso |
|---|---|---|
| Background | `#F8FAFC` | Fondo general de la app |
| Surface | `#FFFFFF` | Cards, modales, formularios |
| Border | `#E2E8F0` | Separadores y bordes de componentes |
| Text Primary | `#1E293B` | Texto principal |
| Text Secondary | `#64748B` | Labels, subtítulos, metadata |
| Text Disabled | `#94A3B8` | Texto inactivo |

### Colores Semánticos

| Nombre | Valor | Uso |
|---|---|---|
| Success | `#10B981` | Balance positivo, citas completadas, activo |
| Warning | `#F59E0B` | Pendiente, atención |
| Danger | `#EF4444` | Cancelaciones, eliminar, alertas |
| Info | `#3B82F6` | Información general |

### Colores de Estado de Cita

| Estado | Color | Badge |
|---|---|---|
| Pendiente | `#F59E0B` | Amarillo |
| Confirmada | `#3B82F6` | Azul |
| Completada | `#10B981` | Verde |
| Cancelada | `#EF4444` | Rojo |
| No asistió | `#6B7280` | Gris |

---

## Tipografía

### Fuente Principal
- **Inter** (Google Fonts)
- Fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### Escala Tipográfica

| Nombre | Tamaño | Peso | Uso |
|---|---|---|---|
| Display | 30px | 700 | Títulos de página |
| H1 | 24px | 700 | Secciones principales |
| H2 | 20px | 600 | Subtítulos de sección |
| H3 | 16px | 600 | Títulos de cards |
| Body | 14px | 400 | Texto general |
| Small | 12px | 400 | Metadata, labels |
| Tiny | 11px | 500 | Badges |

---

## Componentes Base

### Sidebar (Panel Administrativo)
- Ancho: 240px (desktop) / colapsable en tablet / drawer en mobile
- Fondo: `#1E293B` (slate dark) o blanco con borde
- Logo en la parte superior
- Items de navegación con ícono + texto
- Item activo: fondo azul claro + texto azul primary
- Hover: fondo gris muy claro
- Separadores de sección
- Usuario + logout al fondo

### Topbar
- Altura: 64px
- Fondo blanco con sombra sutil
- Breadcrumb o título de sección actual
- Badge de notificaciones (futuro)
- Avatar del usuario con menú desplegable

### Cards KPI (Dashboard)
- Fondo blanco, bordes redondeados (8px)
- Sombra `shadow-sm`
- Ícono con fondo de color suave
- Número grande en `Text Primary`
- Label en `Text Secondary`
- Tendencia (flecha + porcentaje) en color semántico
- 4 cards en fila (desktop), 2 (tablet), 1 (mobile)

### Tabla de Citas
- Header: texto `Text Secondary`, fondo `#F8FAFC`
- Filas: alternadas con hover suave
- Columnas: Fecha, Hora, Cliente, Servicio, Estado, Acciones
- Estado como badge coloreado
- Acciones: ícono editar / cancelar
- Paginación al pie

### Calendario
- Vista mensual, semanal y diaria
- Día actual resaltado
- Citas como chips de color según estado
- Click en cita abre modal de detalle
- Click en día vacío abre modal de nueva cita

### Formularios
- Labels encima del input
- Border gris suave, focus azul primary
- Error en rojo con mensaje debajo
- Placeholder en gris claro
- Botón principal: azul primary
- Botón secundario / cancelar: borde + texto

### Modales
- Overlay oscuro 50% opacidad
- Card centrado, max-width 480px
- Header con título + botón cerrar (X)
- Footer con botones
- Animación de entrada suave

### Badges de Estado
```
[Pendiente]   → fondo amarillo claro, texto amarillo oscuro
[Confirmada]  → fondo azul claro, texto azul
[Completada]  → fondo verde claro, texto verde
[Cancelada]   → fondo rojo claro, texto rojo
[No asistió]  → fondo gris claro, texto gris
```

### Empty States
- Ícono en gris claro (grande, centrado)
- Título en `Text Primary`
- Descripción en `Text Secondary`
- Botón de acción (cuando aplica)
- Ej: "No hay citas hoy — ¡Crea tu primera cita!"

### Loading States
- Skeleton loader (no spinner genérico) para listas y tarjetas
- Spinner pequeño en botones durante acción
- Overlay con spinner en modales al guardar

---

## Pantallas Principales

### 1. Login
- Fondo suave (degradé sutil o imagen de fondo)
- Card centrado con logo, título, form
- Email + password + button
- Link "¿Olvidaste tu contraseña?"
- Link para registro

### 2. Registro
- Similar al login
- Nombre, email, contraseña, confirmación
- Checkbox aceptar términos (futuro)

### 3. Recuperar Contraseña
- Solo campo de email
- Mensaje de confirmación de envío

### 4. Dashboard
- Topbar + sidebar
- Saludo: "Buenos días, Juan ☀️"
- 4 cards KPI: Citas hoy, Ingresos del mes, Egresos del mes, Balance
- Gráfico de citas por semana (ApexCharts — línea o barras)
- Lista de próximas citas del día
- Estado de citas (dona / pie chart pequeño)

### 5. Agenda / Calendario
- Vista calendario full (FullCalendar o implementación propia)
- Botones: Mes / Semana / Día
- Botón "Nueva cita" prominente
- Click en cita → modal o panel lateral de detalle

### 6. Listado de Citas
- Tabla con filtros: fecha, estado, servicio, cliente
- Búsqueda por nombre de cliente
- Acciones por fila: ver, editar, cambiar estado, cancelar

### 7. Formulario de Cita (crear / editar)
- Modal o página dedicada
- Campos: cliente, servicio, fecha, hora, observaciones
- Autocompletado de cliente si ya existe
- Selector de hora disponible según configuración

### 8. Clientes
- Tabla con búsqueda
- Columnas: nombre, teléfono, email, última visita, total de citas
- Click en cliente → perfil con historial
- Botón nueva cita desde el perfil del cliente

### 9. Servicios
- Cards o tabla de servicios
- Nombre, duración, precio, estado (activo/inactivo)
- Toggle rápido de activo
- Formulario inline o modal

### 10. Finanzas
- Tabs: Ingresos / Egresos / Resumen
- KPIs del período: Total ingresos, Total egresos, Balance
- Tabla de registros
- Filtros por período (mes actual, mes anterior, rango)
- Gráfico mensual (barras)

### 11. Configuración
- Tabs: Datos del negocio / Horarios / Reservas / Google Calendar
- Formulario de datos del negocio
- Editor de horarios semana a semana
- Estado de integración con Google Calendar

### 12. Página Pública de Reservas (`/negocio/:slug`)
- Layout completamente diferente al panel admin
- Header con logo/nombre del negocio
- Hero con nombre y descripción del negocio
- Pasos de reserva:
  1. Seleccionar servicio
  2. Seleccionar fecha y hora disponible
  3. Completar datos personales
  4. Confirmar reserva
- Diseño amigable, limpio, mobile-first
- Colores más suaves, menos estructura de app

### 13. Confirmación de Reserva
- Pantalla de éxito
- Resumen: nombre, servicio, fecha y hora, negocio
- "Agregar a Google Calendar" (futuro)
- Icono de check verde grande

### 14. Admin Plataforma (Base)
- Layout diferente (más simple)
- Lista de negocios registrados
- Estado activo / inactivo con toggle
- Estadísticas básicas de la plataforma

---

## Principios de UX

1. **Menos es más:** No mostrar información que no sea útil ahora mismo
2. **Acciones claras:** Siempre debe haber un botón obvio de qué hacer
3. **Feedback inmediato:** Toasts de éxito/error en cada acción
4. **Estados vacíos bien diseñados:** No dejar pantallas en blanco
5. **Mobile-first:** Sidebar colapsa, tablas hacen scroll horizontal
6. **Consistencia:** Mismos colores, mismos patrones en toda la app
7. **No modales innecesarios:** Preferir páginas dedicadas para formularios complejos

---

## Iconografía

- Librería: **Heroicons** (integrada con Tailwind) o **Lucide Icons**
- Línea delgada (outline) como estilo base
- Filled solo para estados activos o destacados

---

## Responsive Breakpoints (Tailwind)

| Nombre | Tamaño |
|---|---|
| mobile | < 640px |
| sm | 640px+ |
| md | 768px+ |
| lg | 1024px+ |
| xl | 1280px+ |

- Sidebar: visible en `lg+`, drawer menu en `< lg`
- Tablas: scroll horizontal en `< md`
- Cards KPI: 1 columna mobile → 2 tablet → 4 desktop
