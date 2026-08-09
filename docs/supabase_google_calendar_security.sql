-- Agendalo Google Calendar security hardening + OAuth state storage.
-- Run this before deploying the google-calendar Edge Function.
--
-- Important: Google tokens must not be readable from the browser. The Edge
-- Function uses the Supabase service role key server-side and bypasses RLS.

begin;

create table if not exists public.google_oauth_states (
  state text primary key,
  business_id bigint not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.google_oauth_states enable row level security;

drop policy if exists "tenant_crud_google_integrations" on public.google_integrations;
drop policy if exists "tenant_crud_google_oauth_states" on public.google_oauth_states;

revoke all on public.google_integrations from anon, authenticated;
revoke all on public.google_oauth_states from anon, authenticated;

-- Service role keeps full access automatically. The app must interact with
-- google_integrations only through the Supabase Edge Function.

commit;
