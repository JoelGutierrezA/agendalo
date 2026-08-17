grant usage on schema public to service_role;

grant select on table public.profiles to service_role;
grant select on table public.businesses to service_role;
grant select on table public.business_settings to service_role;
grant select on table public.services to service_role;

grant select, insert, delete on table public.google_oauth_states to service_role;
grant select, insert, update, delete on table public.google_integrations to service_role;
grant select, update on table public.appointments to service_role;

grant usage, select on sequence public.google_integrations_id_seq to service_role;
