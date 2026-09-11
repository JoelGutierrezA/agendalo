-- Formalize Google Calendar token/state isolation behind the Edge Function.

begin;

do $$
declare
  policy_record record;
begin
  if to_regclass('public.google_integrations') is not null then
    execute 'alter table public.google_integrations enable row level security';
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = 'google_integrations'
    loop
      execute format('drop policy if exists %I on public.google_integrations', policy_record.policyname);
    end loop;

    execute 'revoke all on table public.google_integrations from anon, authenticated';
    execute 'grant select, insert, update, delete on table public.google_integrations to service_role';
  end if;

  if to_regclass('public.google_oauth_states') is not null then
    execute 'alter table public.google_oauth_states enable row level security';
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = 'google_oauth_states'
    loop
      execute format('drop policy if exists %I on public.google_oauth_states', policy_record.policyname);
    end loop;

    execute 'revoke all on table public.google_oauth_states from anon, authenticated';
    execute 'grant select, insert, delete on table public.google_oauth_states to service_role';
  end if;

  if to_regclass('public.google_integrations_id_seq') is not null then
    execute 'revoke all on sequence public.google_integrations_id_seq from anon, authenticated';
    execute 'grant usage, select on sequence public.google_integrations_id_seq to service_role';
  end if;
end;
$$;

commit;
