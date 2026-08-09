-- Promote an existing Supabase Auth user to Agendalo platform admin.
-- Change the email if you want a different admin account.

update public.profiles
set role = 'admin_platform',
    business_id = null
where email = 'jgutiale@gmail.com';

select id, name, email, role, business_id, is_active
from public.profiles
where email = 'jgutiale@gmail.com';
