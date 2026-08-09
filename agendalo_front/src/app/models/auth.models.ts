// ============================================================
// Modelos de Autenticación y Usuario
// ============================================================

export interface User {
  id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  is_active: boolean;
  role: 'admin_platform' | 'owner' | 'staff';
  business_id?: number | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    business: Business | null;
    token: string;
  };
}

// ============================================================
// Modelo de Negocio
// ============================================================

export interface Business {
  id: number;
  user_id: number;
  category_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string;
  logo_url: string | null;
  is_active: boolean;
  category?: BusinessCategory;
  settings?: BusinessSettings;
}

export interface BusinessCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

export interface BusinessSettings {
  booking_advance_days: number;
  min_booking_notice_hours: number;
  allow_public_booking: boolean;
  booking_confirmation_required: boolean;
  send_client_calendar_invite: boolean;
  time_zone: string;
  currency: string;
}

export interface OpeningHour {
  id?: number;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Dom, 6=Sáb
  is_open: boolean;
  open_time: string;
  close_time: string;
}

// ============================================================
// Modelos de Servicio
// ============================================================

export interface Service {
  id: number;
  business_id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

// ============================================================
// Modelo de Cliente
// ============================================================

export interface Client {
  id: number;
  business_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  last_visit_at: string | null;
  created_at: string;
}

// ============================================================
// Modelo de Cita
// ============================================================

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: number;
  business_id: number;
  client_id: number | null;
  service_id: number | null;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  scheduled_at: string; // ISO 8601
  duration_minutes: number;
  status: AppointmentStatus;
  notes: string | null;
  is_from_public: boolean;
  google_event_id: string | null;
  cancelled_at: string | null;
  client?: Client;
  service?: Service;
}

// ============================================================
// Modelos Financieros
// ============================================================

export interface IncomeRecord {
  id: number;
  business_id: number;
  appointment_id: number | null;
  description: string;
  amount: number;
  recorded_at: string; // YYYY-MM-DD
  notes: string | null;
}

export interface ExpenseRecord {
  id: number;
  business_id: number;
  category_id: number | null;
  description: string;
  amount: number;
  recorded_at: string;
  notes: string | null;
  category?: ExpenseCategory;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  is_active: boolean;
}

// ============================================================
// Dashboard
// ============================================================

export interface DashboardSummary {
  total_appointments: number;
  appointments_by_status: Record<AppointmentStatus, number>;
  total_income: number;
  total_expenses: number;
  balance: number;
  top_services: Array<{ name: string; count: number }>;
  busiest_days: string[];
}

// ============================================================
// Respuestas API
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}
