import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

type GoogleIntegration = {
  id: number;
  business_id: number;
  google_email: string | null;
  access_token: string;
  refresh_token: string | null;
  token_type: string | null;
  scope: string | null;
  calendar_id: string | null;
  expires_at: string | null;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';
const googleRedirectUri = Deno.env.get('GOOGLE_REDIRECT_URI') ?? '';
const frontendUrl = (Deno.env.get('FRONTEND_URL') ?? 'http://localhost:4200').replace(/\/$/, '');

const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    if (req.method === 'GET' && url.pathname.endsWith('/callback')) {
      return await handleCallback(url);
    }

    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string | undefined;

    if (action === 'sync-public-appointment') {
      await syncAppointment(Number(body.appointment_id), false);
      return json({ data: true });
    }

    const context = await requireUserContext(req);

    switch (action) {
      case 'status':
        return json({ data: await getStatus(context.businessId) });
      case 'auth-url':
        return json({ data: { auth_url: await getAuthUrl(context.businessId, context.userId) } });
      case 'disconnect':
        await disconnect(context.businessId);
        return json({ data: { connected: false } });
      case 'sync-appointment':
        await syncAppointment(Number(body.appointment_id), true, context.businessId);
        return json({ data: true });
      case 'list-events':
        return json({
          data: await listGoogleEvents(
            context.businessId,
            String(body.start),
            String(body.end),
            Array.isArray(body.exclude_google_event_ids) ? body.exclude_google_event_ids : []
          ),
        });
      default:
        return json({ error: 'Unknown action' }, 400);
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});

async function requireUserContext(req: Request): Promise<{ userId: string; businessId: number }> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) throw new Error('Sesion no disponible.');

  const { data: userData, error: userError } = await anonClient.auth.getUser(token);
  if (userError || !userData.user) throw new Error('Sesion invalida.');

  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('business_id, role, is_active')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile?.is_active) throw new Error('Perfil no disponible.');
  if (!profile.business_id) throw new Error('Debes tener un negocio configurado.');

  return {
    userId: userData.user.id,
    businessId: Number(profile.business_id),
  };
}

async function getStatus(businessId: number) {
  const { data, error } = await serviceClient
    .from('google_integrations')
    .select('google_email, expires_at, calendar_id')
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return {
    connected: Boolean(data),
    google_email: data?.google_email ?? null,
    expires_at: data?.expires_at ?? null,
    is_expired: data?.expires_at ? new Date(data.expires_at).getTime() <= Date.now() : false,
    calendar_id: data?.calendar_id ?? null,
  };
}

async function getAuthUrl(businessId: number, userId: string): Promise<string> {
  assertOAuthConfig();

  const state = crypto.randomUUID() + '-' + randomString(24);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await serviceClient
    .from('google_oauth_states')
    .insert({
      state,
      business_id: businessId,
      user_id: userId,
      expires_at: expiresAt,
    });

  if (error) throw new Error(error.message);

  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: googleRedirectUri,
    response_type: 'code',
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar.events',
    ].join(' '),
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent select_account',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function handleCallback(url: URL): Promise<Response> {
  if (url.searchParams.get('error')) {
    return redirect(`${frontendUrl}/app/configuracion?tab=calendar&google=error`);
  }

  try {
    assertOAuthConfig();

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state) throw new Error('Parametros OAuth incompletos.');

    const { data: stateRow, error: stateError } = await serviceClient
      .from('google_oauth_states')
      .select('state, business_id, expires_at')
      .eq('state', state)
      .maybeSingle();

    if (stateError || !stateRow) throw new Error('Estado OAuth invalido.');
    if (new Date(stateRow.expires_at).getTime() <= Date.now()) throw new Error('Estado OAuth expirado.');

    await serviceClient.from('google_oauth_states').delete().eq('state', state);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: googleRedirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) throw new Error('No se pudo completar el intercambio de token con Google.');

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token as string | undefined;
    if (!accessToken) throw new Error('Google no devolvio access_token.');

    const { data: existing } = await serviceClient
      .from('google_integrations')
      .select('refresh_token')
      .eq('business_id', stateRow.business_id)
      .maybeSingle();

    const googleEmail = await fetchGoogleEmail(accessToken);
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
      : null;

    const { error: upsertError } = await serviceClient
      .from('google_integrations')
      .upsert({
        business_id: stateRow.business_id,
        google_email: googleEmail,
        access_token: accessToken,
        refresh_token: tokenData.refresh_token ?? existing?.refresh_token ?? null,
        token_type: tokenData.token_type ?? null,
        scope: tokenData.scope ?? null,
        calendar_id: 'primary',
        expires_at: expiresAt,
      }, { onConflict: 'business_id' });

    if (upsertError) throw new Error(upsertError.message);

    return redirect(`${frontendUrl}/app/configuracion?tab=calendar&google=connected`);
  } catch {
    return redirect(`${frontendUrl}/app/configuracion?tab=calendar&google=error`);
  }
}

async function disconnect(businessId: number): Promise<void> {
  const { error } = await serviceClient
    .from('google_integrations')
    .delete()
    .eq('business_id', businessId);

  if (error) throw new Error(error.message);
}

async function syncAppointment(appointmentId: number, requireExistingBusiness: boolean, expectedBusinessId?: number): Promise<void> {
  if (!Number.isFinite(appointmentId)) throw new Error('appointment_id invalido.');

  const { data: appointment, error } = await serviceClient
    .from('appointments')
    .select(`
      *,
      business:businesses(
        id,
        name,
        settings:business_settings(time_zone, send_client_calendar_invite)
      ),
      service:services(name)
    `)
    .eq('id', appointmentId)
    .single();

  if (error || !appointment) throw new Error(error?.message ?? 'Cita no encontrada.');
  if (requireExistingBusiness && Number(appointment.business_id) !== expectedBusinessId) {
    throw new Error('No tienes acceso a esta cita.');
  }

  const integration = await getIntegration(Number(appointment.business_id));
  if (!integration) return;

  if (appointment.status === 'cancelled') {
    await deleteGoogleEvent(appointment, integration);
    return;
  }

  const accessToken = await getValidAccessToken(integration);
  if (!accessToken) return;

  const business = Array.isArray(appointment.business) ? appointment.business[0] : appointment.business;
  const settings = Array.isArray(business?.settings) ? business.settings[0] : business?.settings;
  const service = Array.isArray(appointment.service) ? appointment.service[0] : appointment.service;
  const timezone = settings?.time_zone ?? 'America/Santiago';
  const start = new Date(appointment.scheduled_at);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + Number(appointment.duration_minutes ?? 0));

  const payload: Record<string, unknown> = {
    summary: `${service?.name ? `${service.name} - ` : ''}${appointment.client_name}`,
    description: buildDescription(appointment),
    start: { dateTime: start.toISOString(), timeZone: timezone },
    end: { dateTime: end.toISOString(), timeZone: timezone },
    extendedProperties: {
      private: {
        skedia_appointment_id: String(appointment.id),
        skedia_business_id: String(appointment.business_id),
      },
    },
  };

  if (settings?.send_client_calendar_invite !== false && appointment.client_email) {
    payload.attendees = [{ email: appointment.client_email }];
  }

  const calendarId = integration.calendar_id || 'primary';
  let googleEventId = appointment.google_event_id as string | null;

  if (googleEventId) {
    const update = await googleFetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
      accessToken,
      { method: 'PATCH', body: JSON.stringify(payload) }
    );

    if (update.ok) return;
    if (update.status !== 404) return;

    googleEventId = null;
  }

  const create = await googleFetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    accessToken,
    { method: 'POST', body: JSON.stringify(payload) }
  );

  if (!create.ok) return;

  const created = await create.json();
  if (created.id) {
    await serviceClient
      .from('appointments')
      .update({ google_event_id: created.id })
      .eq('id', appointment.id);
  }
}

async function listGoogleEvents(
  businessId: number,
  start: string,
  end: string,
  excludeGoogleEventIds: string[]
) {
  const integration = await getIntegration(businessId);
  if (!integration) return [];

  const accessToken = await getValidAccessToken(integration);
  if (!accessToken) return [];

  const calendarId = integration.calendar_id || 'primary';
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: new Date(start).toISOString(),
    timeMax: new Date(end).toISOString(),
    maxResults: '250',
  });

  const response = await googleFetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    accessToken
  );

  if (!response.ok) return [];

  const payload = await response.json();
  return (payload.items ?? [])
    .filter((item: any) => item.id && !excludeGoogleEventIds.includes(item.id))
    .filter((item: any) => !item.extendedProperties?.private?.skedia_appointment_id)
    .map((item: any) => {
      const startAt = item.start?.dateTime ?? item.start?.date;
      const endAt = item.end?.dateTime ?? item.end?.date;
      const summary = item.summary ?? 'Evento Google';

      return {
        id: `google_${item.id}`,
        title: summary,
        start: startAt,
        end: endAt,
        backgroundColor: '#3B82F6',
        extendedProps: {
          status: 'google',
          client_name: summary,
          service_name: 'Google Calendar',
          source: 'google',
          read_only: true,
          google_event_id: item.id,
        },
      };
    });
}

async function deleteGoogleEvent(appointment: any, integration: GoogleIntegration): Promise<void> {
  if (!appointment.google_event_id) return;

  const accessToken = await getValidAccessToken(integration);
  if (!accessToken) return;

  const calendarId = integration.calendar_id || 'primary';
  const response = await googleFetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(appointment.google_event_id)}`,
    accessToken,
    { method: 'DELETE' }
  );

  if (response.ok || response.status === 404) {
    await serviceClient
      .from('appointments')
      .update({ google_event_id: null })
      .eq('id', appointment.id);
  }
}

async function getIntegration(businessId: number): Promise<GoogleIntegration | null> {
  const { data, error } = await serviceClient
    .from('google_integrations')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function getValidAccessToken(integration: GoogleIntegration): Promise<string | null> {
  if (!integration.expires_at || new Date(integration.expires_at).getTime() > Date.now() + 60_000) {
    return integration.access_token;
  }

  if (!integration.refresh_token) return null;
  assertOAuthConfig();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const accessToken = data.access_token ?? integration.access_token;
  const expiresAt = data.expires_in
    ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString()
    : integration.expires_at;

  await serviceClient
    .from('google_integrations')
    .update({
      access_token: accessToken,
      token_type: data.token_type ?? integration.token_type,
      scope: data.scope ?? integration.scope,
      expires_at: expiresAt,
    })
    .eq('id', integration.id);

  return accessToken;
}

async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.email ?? null;
}

function googleFetch(url: string, accessToken: string, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

function buildDescription(appointment: any): string {
  const lines = [
    'Cita creada desde Skedia',
    `Cliente: ${appointment.client_name}`,
  ];

  if (appointment.client_phone) lines.push(`Telefono: ${appointment.client_phone}`);
  if (appointment.notes) lines.push(`Notas: ${appointment.notes}`);

  return lines.join('\n');
}

function assertOAuthConfig(): void {
  if (!googleClientId || !googleClientSecret || !googleRedirectUri) {
    throw new Error('Faltan GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REDIRECT_URI.');
  }
}

function randomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
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

function redirect(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      ...corsHeaders,
    },
  });
}
