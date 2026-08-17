import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

type AppointmentRow = {
  id: number;
  business_id: number;
  service_id: number | null;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  is_from_public: boolean;
  created_at: string;
};

type BusinessRow = {
  id: number;
  owner_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || getSupabaseKey('SUPABASE_SECRET_KEYS');
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
const notificationFromEmail = Deno.env.get('NOTIFICATION_FROM_EMAIL') ?? '';
const frontendUrl = (Deno.env.get('FRONTEND_URL') ?? '').replace(/\/$/, '');

const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
  global: {
    fetch: supabaseFetch(serviceRoleKey),
  },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    assertEmailConfig();

    const body = await req.json().catch(() => ({}));
    const appointmentId = Number(body.appointment_id);
    if (!Number.isFinite(appointmentId)) throw new Error('appointment_id invalido.');

    const appointment = await getRecentPublicAppointment(appointmentId);
    const [business, serviceName] = await Promise.all([
      getBusiness(appointment.business_id),
      getServiceName(appointment.service_id),
    ]);

    const recipientEmail = await getBusinessNotificationEmail(business);
    if (!recipientEmail) {
      return json({ data: { sent: false, reason: 'business_email_missing' } });
    }

    await sendEmail({
      to: recipientEmail,
      replyTo: appointment.client_email,
      subject: `Nueva cita agendada - ${serviceName}`,
      html: buildEmailHtml(appointment, business, serviceName),
      text: buildEmailText(appointment, business, serviceName),
    });

    return json({ data: { sent: true } });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});

async function getRecentPublicAppointment(appointmentId: number): Promise<AppointmentRow> {
  const { data, error } = await serviceClient
    .from('appointments')
    .select('id, business_id, service_id, client_name, client_email, client_phone, scheduled_at, duration_minutes, status, notes, is_from_public, created_at')
    .eq('id', appointmentId)
    .eq('is_from_public', true)
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Cita no encontrada.');

  const createdAt = new Date(data.created_at).getTime();
  const maxAgeMs = 30 * 60 * 1000;
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > maxAgeMs) {
    throw new Error('La cita ya no puede disparar una notificacion publica.');
  }

  return data;
}

async function getBusiness(businessId: number): Promise<BusinessRow> {
  const { data, error } = await serviceClient
    .from('businesses')
    .select('id, owner_id, name, email, phone')
    .eq('id', businessId)
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Negocio no encontrado.');
  return data;
}

async function getServiceName(serviceId: number | null): Promise<string> {
  if (!serviceId) return 'Servicio';

  const { data, error } = await serviceClient
    .from('services')
    .select('name')
    .eq('id', serviceId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.name ?? 'Servicio';
}

async function getBusinessNotificationEmail(business: BusinessRow): Promise<string | null> {
  if (business.email) return business.email;
  if (!business.owner_id) return null;

  const { data, error } = await serviceClient
    .from('profiles')
    .select('email')
    .eq('id', business.owner_id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.email ?? null;
}

async function sendEmail(payload: {
  to: string;
  replyTo: string | null;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: notificationFromEmail,
      to: [payload.to],
      reply_to: payload.replyTo ? [payload.replyTo] : undefined,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`No se pudo enviar el correo: ${errorBody}`);
  }
}

function buildEmailHtml(appointment: AppointmentRow, business: BusinessRow, serviceName: string): string {
  const when = formatDateTime(appointment.scheduled_at);
  const dashboardUrl = frontendUrl ? `${frontendUrl}/app/dashboard` : '';

  return `
    <div style="font-family:Arial,sans-serif;color:#172033;line-height:1.5">
      <h2 style="margin:0 0 12px">Nueva cita agendada</h2>
      <p>Se agendo una nueva cita para <strong>${escapeHtml(business.name)}</strong>.</p>
      <table style="border-collapse:collapse;margin:18px 0;width:100%;max-width:560px">
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Servicio</td><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(serviceName)}</strong></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Fecha y hora</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(when)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Cliente</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(appointment.client_name)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Email</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(appointment.client_email ?? '-')}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Telefono</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(appointment.client_phone ?? '-')}</td></tr>
        <tr><td style="padding:8px;color:#64748b">Notas</td><td style="padding:8px">${escapeHtml(appointment.notes ?? '-')}</td></tr>
      </table>
      ${dashboardUrl ? `<p><a href="${dashboardUrl}" style="display:inline-block;background:#1473ff;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px">Ver en Skedia</a></p>` : ''}
    </div>
  `;
}

function buildEmailText(appointment: AppointmentRow, business: BusinessRow, serviceName: string): string {
  return [
    `Nueva cita agendada para ${business.name}`,
    '',
    `Servicio: ${serviceName}`,
    `Fecha y hora: ${formatDateTime(appointment.scheduled_at)}`,
    `Cliente: ${appointment.client_name}`,
    `Email: ${appointment.client_email ?? '-'}`,
    `Telefono: ${appointment.client_phone ?? '-'}`,
    `Notas: ${appointment.notes ?? '-'}`,
    frontendUrl ? `Ver en Skedia: ${frontendUrl}/app/dashboard` : '',
  ].filter(Boolean).join('\n');
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(value));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function assertEmailConfig(): void {
  if (!resendApiKey || !notificationFromEmail) {
    throw new Error('Faltan RESEND_API_KEY o NOTIFICATION_FROM_EMAIL.');
  }
}

function getSupabaseKey(envName: string): string {
  const raw = Deno.env.get(envName);
  if (!raw) return '';

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed;
    if (typeof parsed.default === 'string') return parsed.default;

    const firstKey = Object.values(parsed).find((value) => typeof value === 'string');
    return typeof firstKey === 'string' ? firstKey : '';
  } catch {
    return raw;
  }
}

function supabaseFetch(supabaseKey: string) {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (supabaseKey.startsWith('sb_secret_') && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    return fetch(input, { ...init, headers });
  };
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
