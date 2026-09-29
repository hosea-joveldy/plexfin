-- Create the app's public account rows when Supabase Auth creates a user.
-- Does not modify Supabase-managed auth configuration.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do update set email = excluded.email;

  insert into public.profiles (id, username, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'username', ''), coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;

  insert into public.settings (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill app profiles for accounts that existed before this setup was applied.
insert into public.users (id, email, display_name)
select id, email, coalesce(raw_user_meta_data ->> 'display_name', raw_user_meta_data ->> 'name')
from auth.users
where email is not null
on conflict (id) do update set email = excluded.email;

insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name')
from auth.users
where email is not null
on conflict (id) do nothing;

insert into public.settings (user_id)
select id from public.users
on conflict (user_id) do nothing;
