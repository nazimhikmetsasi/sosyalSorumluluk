-- GıdaKöprüsü — reservation stock and pricing, enforced in the database.
--
-- Run after data-schema.sql.
--
-- Three things were wrong with doing this in the browser:
--
--   1. A buyer cannot write to listings at all, because that table's policy only lets the
--      owning business change it. So the stock decrement silently did nothing.
--   2. Even with permission it would race: two buyers both read 4 remaining, both write 3,
--      and one portion is sold twice.
--   3. paid_amount and organisation_id arrived from the client, so a buyer could reserve
--      at a price of their choosing, or file the order against someone else's queue.
--
-- Running it in a trigger fixes all three: the update is atomic, the price is read from
-- the listing, and the row is tied to the listing's real owner.

create or replace function public.apply_reservation_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.listings%rowtype;
begin
  if TG_OP = 'INSERT' then
    select * into target from public.listings where id = new.listing_id;
    if target.id is null then
      raise exception 'İlan bulunamadı.';
    end if;

    -- Never trust the client for the owner or the amount.
    new.organisation_id := target.organisation_id;
    new.paid_amount := target.price_discounted * new.portion_count;
    new.listing_title := target.title;
    new.image := target.image;

    -- The WHERE clause is the lock: if another transaction took the last portions first,
    -- no row matches and we reject instead of overselling.
    update public.listings
       set portions_available = portions_available - new.portion_count
     where id = new.listing_id
       and portions_available >= new.portion_count;

    if not found then
      raise exception 'Yeterli porsiyon kalmadı.';
    end if;

    return new;
  end if;

  -- Cancelling puts the portions back exactly once, no matter how often the update runs.
  if TG_OP = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.listings
       set portions_available = portions_available + old.portion_count
     where id = old.listing_id;
  end if;

  return new;
end;
$$;

drop trigger if exists reservations_stock_insert on public.reservations;
create trigger reservations_stock_insert
  before insert on public.reservations
  for each row execute function public.apply_reservation_stock();

drop trigger if exists reservations_stock_cancel on public.reservations;
create trigger reservations_stock_cancel
  after update on public.reservations
  for each row execute function public.apply_reservation_stock();
