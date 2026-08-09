-- Agendalo Supabase API grants
-- Run this after docs/supabase_initial_schema.sql if table access fails with
-- "permission denied for table ...".

grant usage on schema public to anon, authenticated;

grant select on public.categories to anon, authenticated;
grant select on public.businesses to anon, authenticated;
grant select on public.business_settings to anon, authenticated;
grant select on public.opening_hours to anon, authenticated;
grant select on public.services to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant insert, select, update, delete on public.businesses to authenticated;
grant insert, select, update, delete on public.business_settings to authenticated;
grant insert, select, update, delete on public.opening_hours to authenticated;
grant insert, select, update, delete on public.services to authenticated;
grant insert, select, update, delete on public.clients to authenticated;
grant insert, select, update, delete on public.appointments to authenticated;
grant insert, select, update, delete on public.income_records to authenticated;
grant insert, select, update, delete on public.expense_categories to authenticated;
grant insert, select, update, delete on public.expense_records to authenticated;
grant insert, select, update, delete on public.supplies to authenticated;
grant insert, select, update, delete on public.supply_transactions to authenticated;
grant insert, select, update, delete on public.google_integrations to authenticated;

grant usage, select on all sequences in schema public to authenticated;
