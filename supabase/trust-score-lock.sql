-- Locks the derived organisation columns against writes from the API.
--
-- Run once in the Supabase SQL editor, after reviews.sql.
--
-- trust_score, rating and review_count are worked out by recompute_organisation_trust()
-- from orders and reviews. The admin write policy on organisations is "for all", so without
-- this an admin token could still PATCH them through the REST API and bypass the formula.
--
-- Requests from the API run as the `authenticated` or `anon` role; the recompute function is
-- a definer owned by postgres, and the SQL editor also runs as postgres, so both keep working.

create or replace function public.protect_derived_organisation_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.trust_score := 50;
      new.rating := null;
      new.review_count := 0;
    elsif new.trust_score is distinct from old.trust_score
       or new.rating is distinct from old.rating
       or new.review_count is distinct from old.review_count then
      raise exception 'Güven skoru, puan ve değerlendirme sayısı hesaplanır, elle değiştirilemez.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists organisations_protect_derived on public.organisations;
create trigger organisations_protect_derived
  before insert or update on public.organisations
  for each row execute function public.protect_derived_organisation_columns();
