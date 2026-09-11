-- Public-safe subscription access checks.

begin;

create or replace function public.is_business_subscription_active(target_business_id bigint)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.business_subscriptions bs
    where bs.business_id = target_business_id
      and bs.status in ('trialing', 'active')
      and bs.ends_at > now()
  );
$$;

grant execute on function public.is_business_subscription_active(bigint) to anon, authenticated;

commit;
