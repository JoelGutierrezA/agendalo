import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.109.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const adminKey = getKey('SUPABASE_SECRET_KEYS', [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_KEY',
]);
const publishableKey = getKey('SUPABASE_PUBLISHABLE_KEYS', [
  'SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
]);

const serviceClient = createClient(supabaseUrl, adminKey, {
  auth: { persistSession: false },
});

const anonClient = createClient(supabaseUrl, publishableKey, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new HttpError('Metodo no permitido.', 405);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');

    if (action !== 'delete-user') {
      throw new HttpError('Accion no soportada.', 400);
    }

    const targetUserId = String(body.user_id ?? '');
    if (!isUuid(targetUserId)) {
      throw new HttpError('Usuario invalido.', 400);
    }

    const adminContext = await requirePlatformAdmin(req);
    if (adminContext.userId === targetUserId) {
      throw new HttpError('No puedes eliminar tu propia cuenta desde esta accion.', 400);
    }

    const { data: targetUser, error: targetError } = await serviceClient
      .from('profiles')
      .select('id, name, email, role')
      .eq('id', targetUserId)
      .maybeSingle();

    if (targetError) throw new Error(targetError.message);
    if (!targetUser) throw new HttpError('Usuario no encontrado.', 404);
    if (targetUser.role === 'admin_platform') {
      throw new HttpError('No se puede eliminar un administrador de plataforma.', 403);
    }

    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(targetUserId);
    if (deleteError) throw new Error(deleteError.message);

    return json({
      data: {
        id: targetUserId,
        email: targetUser.email,
      },
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Error inesperado.';
    return json({ error: message }, status);
  }
});

async function requirePlatformAdmin(req: Request): Promise<{ userId: string }> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) throw new HttpError('Sesion no disponible.', 401);
  if (!supabaseUrl || !publishableKey) throw new HttpError('Configuracion publica de Supabase no disponible.', 500);
  if (!adminKey) throw new HttpError('Configuracion admin de Supabase no disponible.', 500);

  const { data: userData, error: userError } = await anonClient.auth.getUser(token);
  if (userError || !userData.user) throw new HttpError('Sesion invalida.', 401);

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: { persistSession: false },
  });

  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError) throw new HttpError(`No se pudo validar el perfil: ${profileError.message}`, 403);
  if (!profile) throw new HttpError('Perfil no disponible para esta sesion.', 403);
  if (!profile.is_active) throw new HttpError('Perfil inactivo.', 403);
  if (profile.role !== 'admin_platform') throw new HttpError('No tienes permisos para esta accion.', 403);

  return { userId: userData.user.id };
}

function getKey(jsonEnvName: string, fallbackNames: string[]): string {
  for (const name of fallbackNames) {
    const value = Deno.env.get(name);
    if (value) return value;
  }

  const rawJson = Deno.env.get(jsonEnvName);
  if (!rawJson) return '';

  try {
    const parsed = JSON.parse(rawJson) as Record<string, string>;
    return parsed.default ?? Object.values(parsed)[0] ?? '';
  } catch {
    return '';
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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
