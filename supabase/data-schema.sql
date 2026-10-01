-- GıdaKöprüsü — application data (phase 2).
--
-- Run after schema.sql and profile-storage.sql.
--
-- The ownership rules the client already enforces are restated here as row level security
-- policies. That is the point of this migration: until now a determined user could edit
-- their own browser state and bypass every check, because the checks lived in the browser.
-- These policies run in Postgres, where the session's role and organisation come from the
-- signed JWT and cannot be forged.

-- ---------------------------------------------------------------------------
-- Claim helpers
-- ---------------------------------------------------------------------------

-- Reading claims through these keeps every policy consistent and makes it obvious that
-- privilege comes from the token, not from a column a user could write.
create or replace function public.auth_role()
returns text language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'buyer')
$$;

create or replace function public.auth_org()
returns text language sql stable as $$
  select auth.jwt() -> 'app_metadata' ->> 'organisation_id'
$$;

-- ---------------------------------------------------------------------------
-- Organisations (businesses and NGOs)
-- ---------------------------------------------------------------------------

create table if not exists public.organisations (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('business', 'ngo')),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  type text,
  avatar text,
  cover text,
  address text,
  lat double precision,
  lng double precision,
  trust_score int not null default 50 check (trust_score between 0 and 100),
  total_donated_kg numeric not null default 0,
  rating numeric,
  review_count int not null default 0,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.organisations enable row level security;

-- Everyone browsing sees active organisations; only admins see the pending queue.
drop policy if exists "organisations: read" on public.organisations;
create policy "organisations: read"
  on public.organisations for select
  using (status = 'active' or public.auth_role() = 'admin');

-- Approving, suspending and scoring are admin acts. No self-service.
drop policy if exists "organisations: admin writes" on public.organisations;
create policy "organisations: admin writes"
  on public.organisations for all
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  organisation_id text not null references public.organisations (id) on delete cascade,
  title text not null,
  description text,
  category text,
  type text not null default 'discounted' check (type in ('free', 'discounted', 'bulk')),
  price_original numeric not null default 0,
  price_discounted numeric not null default 0,
  portions_total int not null default 1 check (portions_total > 0),
  portions_available int not null default 0 check (portions_available >= 0),
  pickup_start_time text,
  pickup_end_time text,
  image text,
  allergens text[] not null default '{}',
  lat double precision,
  lng double precision,
  weight_kg numeric not null default 0,
  co2_reduction_kg numeric not null default 0,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists listings_organisation_idx on public.listings (organisation_id);

alter table public.listings enable row level security;

-- Browsing is the whole product, so any signed-in account reads active listings from
-- approved organisations. An organisation always sees its own, including archived ones.
drop policy if exists "listings: read" on public.listings;
create policy "listings: read"
  on public.listings for select
  using (
    organisation_id = public.auth_org()
    or public.auth_role() = 'admin'
    or (
      status = 'active'
      and exists (
        select 1 from public.organisations o
        where o.id = listings.organisation_id and o.status = 'active'
      )
    )
  );

-- Only the owning organisation may publish or change a listing. This is the server-side
-- twin of ownsListing() in the client.
drop policy if exists "listings: owner writes" on public.listings;
create policy "listings: owner writes"
  on public.listings for all
  using (organisation_id = public.auth_org() and public.auth_role() = 'business')
  with check (organisation_id = public.auth_org() and public.auth_role() = 'business');

-- ---------------------------------------------------------------------------
-- Reservations
-- ---------------------------------------------------------------------------

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  organisation_id text not null references public.organisations (id) on delete cascade,
  listing_title text not null,
  image text,
  portion_count int not null default 1 check (portion_count > 0),
  paid_amount numeric not null default 0,
  status text not null default 'confirmed' check (status in ('confirmed', 'completed', 'cancelled')),
  pickup_start_time text,
  pickup_end_time text,
  pickup_code text not null,
  qr_token text not null,
  created_at timestamptz not null default now()
);

create index if not exists reservations_user_idx on public.reservations (user_id);
create index if not exists reservations_organisation_idx on public.reservations (organisation_id);

-- A code only has to be unique within the business that will scan it.
create unique index if not exists reservations_code_per_org_idx
  on public.reservations (organisation_id, pickup_code);

alter table public.reservations enable row level security;

-- Two parties can see an order: the buyer who placed it and the business fulfilling it.
-- Nobody else, which is what stops one business reading another's queue.
drop policy if exists "reservations: read own side" on public.reservations;
create policy "reservations: read own side"
  on public.reservations for select
  using (user_id = auth.uid() or organisation_id = public.auth_org());

-- Buyers create their own orders only; user_id defaults to auth.uid() and the check
-- rejects any attempt to file one under someone else.
drop policy if exists "reservations: buyer creates own" on public.reservations;
create policy "reservations: buyer creates own"
  on public.reservations for insert
  with check (user_id = auth.uid());

-- The buyer cancels, the business completes. Both are updates, so both sides are allowed
-- here and the status transition itself is checked by the trigger below.
drop policy if exists "reservations: either side updates" on public.reservations;
create policy "reservations: either side updates"
  on public.reservations for update
  using (user_id = auth.uid() or organisation_id = public.auth_org())
  with check (user_id = auth.uid() or organisation_id = public.auth_org());

-- Who may move an order to which state. Without this, the read policy alone would let a
-- buyer mark their own order "completed" and walk off with the food unscanned.
create or replace function public.check_reservation_transition()
returns trigger language plpgsql as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'cancelled' and old.user_id = auth.uid() then
    return new;
  end if;

  if new.status = 'completed' and old.organisation_id = public.auth_org() then
    return new;
  end if;

  raise exception 'Bu durum değişikliği için yetkiniz yok: % -> %', old.status, new.status;
end;
$$;

drop trigger if exists reservations_transition_guard on public.reservations;
create trigger reservations_transition_guard
  before update on public.reservations
  for each row execute function public.check_reservation_transition();

-- ---------------------------------------------------------------------------
-- Granting an organisation role
-- ---------------------------------------------------------------------------

-- Admins approve organisations from the panel, but the role itself lives in app_metadata,
-- which no client key can write. This runs as the definer so it can, after checking that
-- the caller really is an admin according to their own token.
create or replace function public.grant_organisation_access(
  target_email text,
  target_organisation_id text,
  target_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if public.auth_role() <> 'admin' then
    raise exception 'Yalnızca yönetici yetki verebilir.';
  end if;

  if target_role not in ('buyer', 'business', 'ngo') then
    raise exception 'Geçersiz rol: %', target_role;
  end if;

  select id into target_id from auth.users where email = lower(target_email);
  if target_id is null then
    raise exception 'Kullanıcı bulunamadı: %', target_email;
  end if;

  if target_role = 'buyer' then
    update auth.users
       set raw_app_meta_data = (coalesce(raw_app_meta_data, '{}'::jsonb) - 'organisation_id')
           || '{"role":"buyer"}'::jsonb
     where id = target_id;
  else
    if not exists (select 1 from public.organisations where id = target_organisation_id) then
      raise exception 'Kurum bulunamadı: %', target_organisation_id;
    end if;

    update auth.users
       set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
           || jsonb_build_object('role', target_role, 'organisation_id', target_organisation_id)
     where id = target_id;
  end if;
end;
$$;

revoke all on function public.grant_organisation_access(text, text, text) from public;
grant execute on function public.grant_organisation_access(text, text, text) to authenticated;
