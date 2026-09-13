import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

type AdminContext = {
  token: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || getSupabaseKey('SUPABASE_SECRET_KEYS');
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || getSupabaseKey('SUPABASE_PUBLISHABLE_KEYS');
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
const notificationFromEmail = Deno.env.get('NOTIFICATION_FROM_EMAIL') ?? '';
const configuredFrontendUrl = (Deno.env.get('FRONTEND_URL') ?? '').replace(/\/$/, '');

const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
  global: {
    fetch: supabaseFetch(serviceRoleKey),
  },
});

const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new HttpError('Metodo no permitido.', 405);
    }

    const adminContext = await requirePlatformAdmin(req);
    const body = await req.json().catch(() => ({}));
    const requestId = Number(body.request_id);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      throw new HttpError('Solicitud invalida.', 400);
    }

    const registrationRequest = await getApprovedRegistrationRequest(requestId);
    assertEmailConfig();

    const frontendUrl = getFrontendUrl(req);
    const emailId = await sendEmail({
      to: registrationRequest.profile.email,
      subject: 'Tu cuenta de Skedia ya esta activa',
      idempotencyKey: registrationRequest.activation_email_sent_at
        ? `registration-activation-${registrationRequest.id}-${Date.now()}`
        : `registration-activation-${registrationRequest.id}`,
      html: buildActivationEmailHtml(registrationRequest, frontendUrl),
      text: buildActivationEmailText(registrationRequest, frontendUrl),
    });

    const updatedRequest = await markActivationEmailSent(adminContext.token, requestId, emailId);

    return json({
      data: {
        sent: true,
        request: updatedRequest,
        email_id: emailId,
      },
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Error inesperado.';
    return json({ error: message }, status);
  }
});

async function requirePlatformAdmin(req: Request): Promise<AdminContext> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) throw new HttpError('Sesion no disponible.', 401);
  if (!supabaseUrl || !anonKey) throw new HttpError('Configuracion publica de Supabase no disponible.', 500);
  if (!serviceRoleKey) throw new HttpError('Configuracion admin de Supabase no disponible.', 500);

  const { data: userData, error: userError } = await anonClient.auth.getUser(token);
  if (userError || !userData.user) throw new HttpError('Sesion invalida.', 401);

  const userClient = createUserClient(token);
  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError) throw new HttpError(`No se pudo validar el perfil: ${profileError.message}`, 403);
  if (!profile) throw new HttpError('Perfil no disponible para esta sesion.', 403);
  if (!profile.is_active) throw new HttpError('Perfil inactivo.', 403);
  if (profile.role !== 'admin_platform') throw new HttpError('No tienes permisos para esta accion.', 403);

  return { token };
}

async function getApprovedRegistrationRequest(requestId: number): Promise<any> {
  const { data, error } = await serviceClient
    .from('registration_requests')
    .select(`
      id,
      profile_id,
      requested_plan_code,
      requested_plan_id,
      status,
      included_trial_days,
      purchased_period_days,
      activation_deadline,
      activation_email_sent_at,
      profile:profiles!registration_requests_profile_id_fkey(name, email, is_active),
      requested_plan:plans!registration_requests_requested_plan_id_fkey(code, name)
    `)
    .eq('id', requestId)
    .maybeSingle();

  if (error) throw new HttpError(`No se pudo consultar la solicitud: ${error.message}`, 500);
  if (!data) throw new HttpError('Solicitud no encontrada.', 404);
  if (data.status !== 'approved') {
    throw new HttpError('Solo se puede enviar activacion para registros aprobados.', 409);
  }

  const profile = firstRelation(data.profile);
  const requestedPlan = firstRelation(data.requested_plan);

  if (!profile?.email) throw new HttpError('La solicitud no tiene un email de destinatario valido.', 400);
  if (profile.is_active !== true) throw new HttpError('El perfil todavia no esta activo.', 409);
  if (!data.activation_deadline) throw new HttpError('La solicitud no tiene fecha limite de configuracion.', 409);

  return {
    ...data,
    profile: {
      name: profile.name ?? 'Usuario',
      email: profile.email,
      is_active: profile.is_active,
    },
    requested_plan: {
      code: requestedPlan?.code ?? data.requested_plan_code,
      name: requestedPlan?.name ?? registrationPlanLabel(data.requested_plan_code),
    },
    included_trial_days: Number(data.included_trial_days ?? 0),
    purchased_period_days: Number(data.purchased_period_days ?? 0),
  };
}

async function markActivationEmailSent(token: string, requestId: number, emailId: string | null): Promise<any> {
  const userClient = createUserClient(token);
  const { data, error } = await userClient.rpc('mark_registration_activation_email_sent', {
    target_request_id: requestId,
    target_provider_message_id: emailId ?? '',
  });

  if (error) throw new HttpError(`El correo fue enviado, pero no se pudo registrar el envio: ${error.message}`, 500);
  return data;
}

async function sendEmail(payload: {
  to: string;
  subject: string;
  idempotencyKey: string;
  html: string;
  text: string;
}): Promise<string | null> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': payload.idempotencyKey,
      'User-Agent': 'skedia-supabase-edge-functions',
    },
    body: JSON.stringify({
      from: notificationFromEmail,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  const rawBody = await response.text();

  if (!response.ok) {
    throw new HttpError(`No se pudo enviar el correo: ${rawBody}`, 502);
  }

  try {
    const parsed = JSON.parse(rawBody);
    return typeof parsed?.id === 'string' ? parsed.id : null;
  } catch {
    return null;
  }
}

function buildActivationEmailHtml(request: any, frontendUrl: string): string {
  const totalDays = request.requested_plan_code === 'trial'
    ? request.included_trial_days
    : request.included_trial_days + request.purchased_period_days;
  const loginUrl = frontendUrl ? `${frontendUrl}/login` : '';

  return `
    <div style="font-family:Arial,sans-serif;color:#172033;line-height:1.5">
      <div style="max-width:620px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:#1473ff;color:#fff;padding:20px 24px">
          <h1 style="font-size:22px;line-height:1.25;margin:0">Skedia</h1>
          <p style="margin:6px 0 0;color:#dbeafe">Cuenta activa</p>
        </div>
        <div style="padding:24px">
          <p>Hola ${escapeHtml(request.profile.name)},</p>
          <p>Tu cuenta de Skedia ya fue activada.</p>
          <p>Ya puedes ingresar y comenzar a configurar tu negocio.</p>
          <table style="border-collapse:collapse;margin:18px 0;width:100%">
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Plan</td><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(registrationPlanLabel(request.requested_plan_code))}</strong></td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Periodo</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(daysLabel(totalDays))}</td></tr>
            <tr><td style="padding:8px;color:#64748b">Fecha limite de configuracion</td><td style="padding:8px">${escapeHtml(formatDate(request.activation_deadline))}</td></tr>
          </table>
          <p>Tu periodo comenzara cuando termines de configurar tu negocio o, como maximo, al cumplirse ese plazo.</p>
          ${loginUrl ? `<p style="margin-top:24px"><a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#1473ff;color:#fff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700">Ingresar a Skedia</a></p>` : ''}
        </div>
      </div>
    </div>
  `;
}

function buildActivationEmailText(request: any, frontendUrl: string): string {
  const totalDays = request.requested_plan_code === 'trial'
    ? request.included_trial_days
    : request.included_trial_days + request.purchased_period_days;
  const loginUrl = frontendUrl ? `${frontendUrl}/login` : '';
  const lines = [
    `Hola ${request.profile.name},`,
    '',
    'Tu cuenta de Skedia ya fue activada.',
    'Ya puedes ingresar y comenzar a configurar tu negocio.',
    '',
    `Plan: ${registrationPlanLabel(request.requested_plan_code)}`,
    `Periodo: ${daysLabel(totalDays)}`,
    `Fecha limite de configuracion: ${formatDate(request.activation_deadline)}`,
    '',
    'Tu periodo comenzara cuando termines de configurar tu negocio o, como maximo, al cumplirse ese plazo.',
  ];

  if (loginUrl) {
    lines.push('', `Ingresar a Skedia: ${loginUrl}`);
  }

  return lines.join('\n');
}

function assertEmailConfig(): void {
  if (!resendApiKey || !notificationFromEmail) {
    throw new HttpError('Faltan RESEND_API_KEY o NOTIFICATION_FROM_EMAIL.', 500);
  }
}

function getFrontendUrl(req: Request): string {
  if (configuredFrontendUrl) return configuredFrontendUrl;
  return (req.headers.get('Origin') ?? '').replace(/\/$/, '');
}

function createUserClient(token: string) {
  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: { persistSession: false },
  });
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

function firstRelation(value: any): any {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function registrationPlanLabel(planCode: string): string {
  const labels: Record<string, string> = {
    trial: 'Prueba gratis',
    agenda: 'Agenda',
    premium: 'Premium',
  };

  return labels[planCode] ?? 'Plan';
}

function daysLabel(days: number): string {
  return days === 1 ? '1 dia' : `${days} dias`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
  }).format(date);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}
