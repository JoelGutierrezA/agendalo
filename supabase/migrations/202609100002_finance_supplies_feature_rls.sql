-- Enforce plan features and subscription operation state for finance and supplies.

begin;

create or replace function public.business_has_feature(
  target_business_id bigint,
  target_feature_name text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from (
      select plan_id
      from public.business_subscriptions
      where business_id = target_business_id
        and status in ('trialing', 'active', 'past_due')
      order by starts_at desc, created_at desc
      limit 1
    ) sub
    join public.plans plan on plan.id = sub.plan_id
    where plan.is_active = true
      and plan.features @> jsonb_build_object(target_feature_name, true)
  );
$$;

drop policy if exists "tenant_crud_income_records" on public.income_records;
drop policy if exists "tenant_select_income_records" on public.income_records;
drop policy if exists "tenant_insert_income_records" on public.income_records;
drop policy if exists "tenant_update_income_records" on public.income_records;
drop policy if exists "tenant_delete_income_records" on public.income_records;

create policy "tenant_select_income_records"
on public.income_records for select
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and (
      (
        appointment_id is not null
        and exists (
          select 1
          from public.appointments appointment
          where appointment.id = appointment_id
            and appointment.business_id = income_records.business_id
        )
      )
      or public.business_has_feature(business_id, 'manual_income')
    )
  )
);

create policy "tenant_insert_income_records"
on public.income_records for insert
to authenticated
with check (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and (
      (
        appointment_id is not null
        and exists (
          select 1
          from public.appointments appointment
          where appointment.id = appointment_id
            and appointment.business_id = income_records.business_id
        )
      )
      or (
        appointment_id is null
        and public.business_has_feature(business_id, 'manual_income')
      )
    )
  )
);

create policy "tenant_update_income_records"
on public.income_records for update
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'manual_income')
  )
)
with check (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'manual_income')
    and (
      appointment_id is null
      or exists (
        select 1
        from public.appointments appointment
        where appointment.id = appointment_id
          and appointment.business_id = income_records.business_id
      )
    )
  )
);

create policy "tenant_delete_income_records"
on public.income_records for delete
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'manual_income')
  )
);

drop policy if exists "tenant_crud_expense_records" on public.expense_records;
drop policy if exists "tenant_select_expense_records" on public.expense_records;
drop policy if exists "tenant_insert_expense_records" on public.expense_records;
drop policy if exists "tenant_update_expense_records" on public.expense_records;
drop policy if exists "tenant_delete_expense_records" on public.expense_records;

create policy "tenant_select_expense_records"
on public.expense_records for select
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.business_has_feature(business_id, 'expenses')
  )
);

create policy "tenant_insert_expense_records"
on public.expense_records for insert
to authenticated
with check (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'expenses')
  )
);

create policy "tenant_update_expense_records"
on public.expense_records for update
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'expenses')
  )
)
with check (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'expenses')
  )
);

create policy "tenant_delete_expense_records"
on public.expense_records for delete
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'expenses')
  )
);

drop policy if exists "tenant_crud_expense_categories" on public.expense_categories;
drop policy if exists "tenant_select_expense_categories" on public.expense_categories;
drop policy if exists "tenant_insert_expense_categories" on public.expense_categories;
drop policy if exists "tenant_update_expense_categories" on public.expense_categories;
drop policy if exists "tenant_delete_expense_categories" on public.expense_categories;

create policy "tenant_select_expense_categories"
on public.expense_categories for select
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.business_has_feature(business_id, 'expenses')
  )
);

create policy "tenant_insert_expense_categories"
on public.expense_categories for insert
to authenticated
with check (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'expenses')
  )
);

create policy "tenant_update_expense_categories"
on public.expense_categories for update
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'expenses')
  )
)
with check (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'expenses')
  )
);

create policy "tenant_delete_expense_categories"
on public.expense_categories for delete
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'expenses')
  )
);

drop policy if exists "tenant_crud_supplies" on public.supplies;
drop policy if exists "tenant_select_supplies" on public.supplies;
drop policy if exists "tenant_insert_supplies" on public.supplies;
drop policy if exists "tenant_update_supplies" on public.supplies;
drop policy if exists "tenant_delete_supplies" on public.supplies;

create policy "tenant_select_supplies"
on public.supplies for select
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.business_has_feature(business_id, 'supplies')
  )
);

create policy "tenant_insert_supplies"
on public.supplies for insert
to authenticated
with check (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'supplies')
  )
);

create policy "tenant_update_supplies"
on public.supplies for update
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'supplies')
  )
)
with check (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'supplies')
  )
);

create policy "tenant_delete_supplies"
on public.supplies for delete
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'supplies')
  )
);

drop policy if exists "tenant_crud_supply_transactions" on public.supply_transactions;
drop policy if exists "tenant_select_supply_transactions" on public.supply_transactions;
drop policy if exists "tenant_insert_supply_transactions" on public.supply_transactions;
drop policy if exists "tenant_update_supply_transactions" on public.supply_transactions;
drop policy if exists "admin_update_supply_transactions" on public.supply_transactions;
drop policy if exists "tenant_delete_supply_transactions" on public.supply_transactions;

create policy "tenant_select_supply_transactions"
on public.supply_transactions for select
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.business_has_feature(business_id, 'supplies')
  )
);

create policy "tenant_insert_supply_transactions"
on public.supply_transactions for insert
to authenticated
with check (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'supplies')
    and exists (
      select 1
      from public.supplies supply
      where supply.id = supply_id
        and supply.business_id = supply_transactions.business_id
    )
    and (
      expense_record_id is null
      or exists (
        select 1
        from public.expense_records expense
        where expense.id = expense_record_id
          and expense.business_id = supply_transactions.business_id
      )
    )
  )
);

create policy "admin_update_supply_transactions"
on public.supply_transactions for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "tenant_delete_supply_transactions"
on public.supply_transactions for delete
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
    and public.business_has_feature(business_id, 'supplies')
  )
);

revoke all on function public.business_has_feature(bigint, text) from public;
grant execute on function public.business_has_feature(bigint, text) to authenticated;

commit;
