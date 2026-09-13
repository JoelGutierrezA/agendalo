import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

type AdminContext = {
  userId: string;
  token: string;
};

type TransferConfig = {
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  accountId: string;
  paymentEmail: string;
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

    const subscriptionRequest = await getPendingSubscriptionRequest(requestId);
    const transferConfig = getTransferConfig();
    assertEmailConfig();

    const emailId = await sendEmail({
      to: subscriptionRequest.profile.email,
      replyTo: transferConfig.paymentEmail,
      subject: 'Pasos para continuar con tu suscripcion en Skedia',
      idempotencyKey: `subscription-request-${subscriptionRequest.id}`,
      html: buildEmailHtml(subscriptionRequest, transferConfig),
      text: buildEmailText(subscriptionRequest, transferConfig),
    });

    const updatedRequest = await markInstructionsSent(adminContext.token, requestId, emailId);

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

  return { userId: userData.user.id, token };
}

async function getPendingSubscriptionRequest(requestId: number): Promise<any> {
  const { data, error } = await serviceClient
    .from('subscription_requests')
    .select(`
      id,
      request_type,
      status,
      remaining_days_snapshot,
      requested_period_days,
      profile:profiles!subscription_requests_profile_id_fkey(name, email),
      business:businesses!subscription_requests_business_id_fkey(name, slug),
      requested_plan:plans!subscription_requests_requested_plan_id_fkey(code, name, price_clp, billing_period_days)
    `)
    .eq('id', requestId)
    .maybeSingle();

  if (error) throw new HttpError(`No se pudo consultar la solicitud: ${error.message}`, 500);
  if (!data) throw new HttpError('Solicitud no encontrada.', 404);
  if (data.status !== 'pending') {
    throw new HttpError('Solo se pueden enviar instrucciones a solicitudes pendientes.', 409);
  }

  const profile = firstRelation(data.profile);
  const business = firstRelation(data.business);
  const requestedPlan = firstRelation(data.requested_plan);

  if (!profile?.email) throw new HttpError('La solicitud no tiene un email de destinatario valido.', 400);
  if (!requestedPlan) throw new HttpError('La solicitud no tiene un plan solicitado valido.', 400);

  return {
    ...data,
    profile: {
      name: profile.name ?? 'Usuario',
      email: profile.email,
    },
    business: {
      name: business?.name ?? 'Negocio',
      slug: business?.slug ?? null,
    },
    requested_plan: {
      code: requestedPlan.code ?? '',
      name: requestedPlan.name ?? 'Plan',
      price_clp: Number(requestedPlan.price_clp ?? 0),
      billing_period_days: Number(requestedPlan.billing_period_days ?? data.requested_period_days ?? 0),
    },
  };
}

async function markInstructionsSent(token: string, requestId: number, emailId: string | null): Promise<any> {
  const userClient = createUserClient(token);
  const { data, error } = await userClient.rpc('mark_subscription_request_instructions_sent', {
    target_request_id: requestId,
    target_provider_message_id: emailId,
  });

  if (error) throw new HttpError(`El correo fue enviado, pero no se pudo actualizar la solicitud: ${error.message}`, 500);
  return data;
}

async function sendEmail(payload: {
  to: string;
  replyTo: string;
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
      reply_to: [payload.replyTo],
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

function buildEmailHtml(request: any, transfer: TransferConfig): string {
  const preservedDaysMessage = Number(request.remaining_days_snapshot) > 0
    ? '<p>Los dias que aun tienes disponibles se conservaran al momento de confirmar tu pago.</p>'
    : '';

  return `
    <div style="font-family:Arial,sans-serif;color:#172033;line-height:1.5">
      <div style="max-width:620px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:#1473ff;color:#fff;padding:20px 24px">
          <h1 style="font-size:22px;line-height:1.25;margin:0">Skedia</h1>
          <p style="margin:6px 0 0;color:#dbeafe">Instrucciones de transferencia</p>
        </div>
        <div style="padding:24px">
          <p>Hola ${escapeHtml(request.profile.name)},</p>
          <p>Recibimos tu solicitud para:</p>
          <p style="font-size:18px"><strong>${escapeHtml(requestTypeLabel(request.request_type))}: ${escapeHtml(request.requested_plan.name)}</strong></p>
          <table style="border-collapse:collapse;margin:18px 0;width:100%">
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Negocio</td><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(request.business.name)}</strong></td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Plan solicitado</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(request.requested_plan.name)}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Valor</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(formatCurrency(request.requested_plan.price_clp))} CLP</td></tr>
            <tr><td style="padding:8px;color:#64748b">Periodo</td><td style="padding:8px">${escapeHtml(daysLabel(request.requested_period_days))}</td></tr>
          </table>
          ${preservedDaysMessage}
          <h2 style="font-size:16px;margin:24px 0 10px">Datos para transferencia</h2>
          <table style="border-collapse:collapse;margin:0 0 18px;width:100%">
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Titular</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(transfer.accountHolder)}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Banco</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(transfer.bankName)}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Tipo de cuenta</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(transfer.accountType)}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Numero de cuenta</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(transfer.accountNumber)}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">RUT / Identificador</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(transfer.accountId)}</td></tr>
            <tr><td style="padding:8px;color:#64748b">Correo</td><td style="padding:8px">${escapeHtml(transfer.paymentEmail)}</td></tr>
          </table>
          <p>Una vez realizada la transferencia, responde este correo o comunicate con nosotros para que podamos verificar el pago.</p>
          <p><strong>Tu plan se actualizara una vez que el pago sea confirmado.</strong></p>
        </div>
      </div>
    </div>
  `;
}

function buildEmailText(request: any, transfer: TransferConfig): string {
  const lines = [
    `Hola ${request.profile.name},`,
    '',
    'Recibimos tu solicitud para:',
    `${requestTypeLabel(request.request_type)}: ${request.requested_plan.name}`,
    '',
    `Negocio: ${request.business.name}`,
    `Plan solicitado: ${request.requested_plan.name}`,
    `Valor: ${formatCurrency(request.requested_plan.price_clp)} CLP`,
    `Periodo: ${daysLabel(request.requested_period_days)}`,
    '',
  ];

  if (Number(request.remaining_days_snapshot) > 0) {
    lines.push('Los dias que aun tienes disponibles se conservaran al momento de confirmar tu pago.', '');
  }

  lines.push(
    'DATOS PARA TRANSFERENCIA',
    '',
    `Titular: ${transfer.accountHolder}`,
    `Banco: ${transfer.bankName}`,
    `Tipo de cuenta: ${transfer.accountType}`,
    `Numero de cuenta: ${transfer.accountNumber}`,
    `RUT / Identificador: ${transfer.accountId}`,
    `Correo: ${transfer.paymentEmail}`,
    '',
    'Una vez realizada la transferencia, responde este correo o comunicate con nosotros para que podamos verificar el pago.',
    'Tu plan se actualizara una vez que el pago sea confirmado.',
  );

  return lines.join('\n');
}

function getTransferConfig(): TransferConfig {
  const config = {
    bankName: Deno.env.get('SUBSCRIPTION_BANK_NAME') ?? '',
    accountType: Deno.env.get('SUBSCRIPTION_ACCOUNT_TYPE') ?? '',
    accountNumber: Deno.env.get('SUBSCRIPTION_ACCOUNT_NUMBER') ?? '',
    accountHolder: Deno.env.get('SUBSCRIPTION_ACCOUNT_HOLDER') ?? '',
    accountId: Deno.env.get('SUBSCRIPTION_ACCOUNT_ID') ?? '',
    paymentEmail: Deno.env.get('SUBSCRIPTION_PAYMENT_EMAIL') ?? '',
  };

  const missing = [
    ['SUBSCRIPTION_BANK_NAME', config.bankName],
    ['SUBSCRIPTION_ACCOUNT_TYPE', config.accountType],
    ['SUBSCRIPTION_ACCOUNT_NUMBER', config.accountNumber],
    ['SUBSCRIPTION_ACCOUNT_HOLDER', config.accountHolder],
    ['SUBSCRIPTION_ACCOUNT_ID', config.accountId],
    ['SUBSCRIPTION_PAYMENT_EMAIL', config.paymentEmail],
  ]
    .filter(([, value]) => !String(value).trim())
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new HttpError(`Faltan secrets de transferencia: ${missing.join(', ')}.`, 500);
  }

  return config;
}

function assertEmailConfig(): void {
  if (!resendApiKey || !notificationFromEmail) {
    throw new HttpError('Faltan RESEND_API_KEY o NOTIFICATION_FROM_EMAIL.', 500);
  }
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

function requestTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    subscription_activation: 'Activacion de plan',
    subscription_renewal: 'Renovacion de plan',
    subscription_change: 'Cambio de plan',
  };

  return labels[type] ?? 'Solicitud de suscripcion';
}

function daysLabel(days: number): string {
  return days === 1 ? '1 dia' : `${days} dias`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
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
