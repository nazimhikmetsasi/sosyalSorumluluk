-- GıdaKöprüsü — auth schema (phase 1).
--
-- Run this once in the Supabase SQL editor.
--
-- Privilege-bearing fields (role, organisation_id) live in auth.users.raw_app_meta_data,
-- which the client SDK cannot write under any circumstances: only a service-role key or
-- SQL run here can change it. They ride inside the signed JWT, so the app reads them from
-- a verified session rather than from anything the browser stores.
--
-- Everything a user may edit about themselves lives in public.profiles instead, and the
-- update policy below deliberately does not expose any privilege column.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A signed-in user sees and edits only their own row.
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Every new account starts as a plain buyer with no organisation. Becoming a business or
-- NGO is an explicit grant an admin makes below, never something signup can ask for.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'buyer')
   where id = new.id
     and coalesce(raw_app_meta_data ->> 'role', '') = '';

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------------
-- Granting privileges. Run these by hand; there is deliberately no UI for it.
-- ---------------------------------------------------------------------------

-- Make someone an admin:
--   update auth.users
--      set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
--    where email = 'you@example.com';

-- Approve a business or NGO account and bind it to its organisation:
--   update auth.users
--      set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
--          || '{"role":"business","organisation_id":"biz_01"}'::jsonb
--    where email = 'bakery@example.com';

-- Revoke back to a plain buyer:
--   update auth.users
--      set raw_app_meta_data = (coalesce(raw_app_meta_data, '{}'::jsonb) - 'organisation_id')
--          || '{"role":"buyer"}'::jsonb
--    where email = 'bakery@example.com';

-- Inspect who holds what:
--   select email, raw_app_meta_data ->> 'role' as role,
--          raw_app_meta_data ->> 'organisation_id' as organisation_id
--     from auth.users order by created_at desc;
