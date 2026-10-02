-- GıdaKöprüsü — impact figures recorded on the reservation.
--
-- Run after reservation-stock.sql.
--
-- The profile's "kg rescued" and "CO2 avoided" numbers were invented constants. Deriving
-- them by joining back to the listing would be wrong twice over: a business editing or
-- archiving a listing would silently rewrite someone's past impact, and an archived
-- listing would erase it. So the figures are snapshotted onto the reservation when it is
-- made, by the same trigger that already sets the price.

alter table public.reservations add column if not exists saved_kg numeric not null default 0;
alter table public.reservations add column if not exists co2_kg numeric not null default 0;
alter table public.reservations add column if not exists saved_amount numeric not null default 0;
alter table public.reservations add column if not exists listing_created_at timestamptz;

create or replace function public.apply_reservation_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.listings%rowtype;
  per_portion_kg numeric;
begin
  if TG_OP = 'INSERT' then
    select * into target from public.listings where id = new.listing_id;
    if target.id is null then
      raise exception 'İlan bulunamadı.';
    end if;

    -- Never trust the client for the owner, the amount or the impact figures.
    new.organisation_id := target.organisation_id;
    new.paid_amount := target.price_discounted * new.portion_count;
    new.listing_title := target.title;
    new.image := target.image;
    new.listing_created_at := target.created_at;

    per_portion_kg := target.weight_kg / greatest(target.portions_total, 1);
    new.saved_kg := round(per_portion_kg * new.portion_count, 2);
    new.co2_kg := round(per_portion_kg * new.portion_count * 2.5, 2);
    new.saved_amount := greatest(target.price_original - target.price_discounted, 0) * new.portion_count;

    update public.listings
       set portions_available = portions_available - new.portion_count
     where id = new.listing_id
       and portions_available >= new.portion_count;

    if not found then
      raise exception 'Yeterli porsiyon kalmadı.';
    end if;

    return new;
  end if;

  if TG_OP = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.listings
       set portions_available = portions_available + old.portion_count
     where id = old.listing_id;
  end if;

  return new;
end;
$$;

-- Backfill rows created before these columns existed, where the listing is still around.
update public.reservations r
   set saved_kg = round(l.weight_kg / greatest(l.portions_total, 1) * r.portion_count, 2),
       co2_kg = round(l.weight_kg / greatest(l.portions_total, 1) * r.portion_count * 2.5, 2),
       saved_amount = greatest(l.price_original - l.price_discounted, 0) * r.portion_count,
       listing_created_at = coalesce(r.listing_created_at, l.created_at)
  from public.listings l
 where r.listing_id = l.id
   and r.saved_kg = 0;
