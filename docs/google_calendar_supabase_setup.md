# Google Calendar con Supabase Edge Functions

## 1. Ejecutar SQL

Ejecuta en Supabase SQL Editor:

```sql
-- docs/supabase_google_calendar_security.sql
```

Esto crea `google_oauth_states` y evita que los tokens de Google queden legibles desde el navegador.

## 2. Crear credenciales en Google Cloud

En Google Cloud Console crea un OAuth Client tipo Web Application.

Authorized redirect URI local/prod:

```txt
https://<project-ref>.functions.supabase.co/google-calendar/callback
```

Para tu proyecto actual el `<project-ref>` es el prefijo del URL de Supabase:

```txt
ikbhwlikbjlunxainawj
```

Entonces el redirect URI queda:

```txt
https://ikbhwlikbjlunxainawj.functions.supabase.co/google-calendar/callback
```

## 3. Configurar secrets de Supabase

En Supabase CLI:

```bash
supabase secrets set GOOGLE_CLIENT_ID="..."
supabase secrets set GOOGLE_CLIENT_SECRET="..."
supabase secrets set GOOGLE_REDIRECT_URI="https://ikbhwlikbjlunxainawj.functions.supabase.co/google-calendar/callback"
supabase secrets set FRONTEND_URL="http://localhost:4200"
```

En produccion cambia `FRONTEND_URL` por el dominio de Vercel.

## 4. Desplegar la funcion

```bash
supabase functions deploy google-calendar --no-verify-jwt
```

## 5. Probar

1. Entra a `Configuracion > Google Calendar`.
2. Presiona `Conectar con Google Calendar`.
3. Acepta permisos.
4. Crea o edita una cita.
5. Revisa que aparezca en Google Calendar.

Nota: los eventos externos de Google se muestran en la agenda semanal como solo lectura.
