-- Pickup windows: expiring listings and the cancellation cut-off.
--
-- Run once in the Supabase SQL editor, after data-schema.sql and reservation-stock.sql.
--
-- Pickup times are 'HH:MM' text with no date; a listing is for the day it was posted. In
-- the browser the same rules live in src/utils/pickupWindow.js, so keep the two in step.
--
--   1. A listing whose pickup end time has passed is archived and can no longer be reserved.
--   2. A buyer may cancel until 30 minutes before the pickup window opens.
--
-- Supabase has no scheduler on the free tier unless pg_cron is enabled, so archiving is lazy:
-- the app calls archive_expired_listings() each time it loads data, and the insert guard
-- below refuses a reservation on an expired listing even if nobody has archived it yet.

-- 'HH:MM' on the Turkish calendar day the row was created, as a real instant. Null when the
-- text is missing or not a valid time, so a bad value never archives or blocks anything.
create or replace function public.pickup_instant(created timestamptz, hhmm text)
returns timestamptz
language sql
stable
as $$
  select case
    when hhmm ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    then ((created at time zone 'Europe/Istanbul')::date + hhmm::time) at time zone 'Europe/Istanbul'
  end
$$;

-- ---------------------------------------------------------------------------
-- 1. Expiring listings
-- ---------------------------------------------------------------------------

create or replace function public.archive_expired_listings()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  archived int;
begin
  update public.listings
     set status = 'archived'
   where status = 'active'
     and public.pickup_instant(created_at, pickup_end_time) < now();
  get diagnostics archived = row_count;
  return archived;
end;
$$;

revoke all on function public.archive_expired_listings() from public;
revoke all on function public.archive_expired_listings() from anon;
grant execute on function public.archive_expired_listings() to authenticated;

-- Named so it sorts before reservations_stock_insert: reject first, then touch the stock.
create or replace function public.reject_expired_reservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.listings%rowtype;
begin
  select * into target from public.listings where id = new.listing_id;
  if target.id is not null and (
       target.status <> 'active'
       or public.pickup_instant(target.created_at, target.pickup_end_time) < now()
     ) then
    raise exception 'Bu ilanın teslim süresi doldu.';
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_expired_guard on public.reservations;
create trigger reservations_expired_guard
  before insert on public.reservations
  for each row execute function public.reject_expired_reservation();

-- ---------------------------------------------------------------------------
-- 2. Cancellation cut-off
-- ---------------------------------------------------------------------------

-- Replaces the version in data-schema.sql with one that also enforces the cut-off.
create or replace function public.check_reservation_transition()
returns trigger language plpgsql as $$
declare
  cancel_deadline timestamptz;
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'cancelled' and old.user_id = auth.uid() then
    cancel_deadline := public.pickup_instant(old.created_at, old.pickup_start_time)
                       - interval '30 minutes';
    if cancel_deadline is not null and now() > cancel_deadline then
      raise exception 'Teslim saatine 30 dakikadan az kaldığı için iptal edilemez.';
    end if;
    return new;
  end if;

  if new.status = 'completed' and old.organisation_id = public.auth_org() then
    return new;
  end if;

  raise exception 'Bu durum değişikliği için yetkiniz yok: % -> %', old.status, new.status;
end;
$$;
