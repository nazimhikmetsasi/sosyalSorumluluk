-- Reviews, and a trust score the database works out by itself.
--
-- Run once in the Supabase SQL editor, after data-schema.sql and impact-columns.sql.
--
-- A review belongs to exactly one completed order and can be written only by the buyer of
-- that order, so ratings cannot be farmed without actually collecting food. Reviews are
-- immutable: there is no update or delete policy.
--
-- organisations.trust_score, rating and review_count are derived here and nowhere else.
-- Trust score (0-100):
--   rating part  = (sum of ratings + 4 * 3) / (review count + 3) / 5     weight 0.8
--   volume part  = min(completed orders, 20) / 20                         weight 0.2
-- The "+ 4 * 3" is a prior of three imaginary 4-star reviews, so one early 1-star or 5-star
-- review cannot swing a new organisation to either extreme. With no data the score is 64.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  organisation_id text not null references public.organisations (id) on delete cascade,
  author_name text not null default 'Gıda Kurtarıcısı',
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 500),
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists reviews_organisation_idx on public.reviews (organisation_id, created_at desc);

alter table public.reviews enable row level security;

-- Reviews are public by nature: they are shown on the organisation's page.
drop policy if exists "reviews: read" on public.reviews;
create policy "reviews: read"
  on public.reviews for select
  to authenticated
  using (true);

-- Only the buyer of a completed order, and only for the organisation that order was with.
drop policy if exists "reviews: buyer of completed order" on public.reviews;
create policy "reviews: buyer of completed order"
  on public.reviews for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.reservations r
       where r.id = reservation_id
         and r.user_id = auth.uid()
         and r.status = 'completed'
         and r.organisation_id = reviews.organisation_id
    )
  );

-- The shown name comes from the profile, not from the client, so nobody can sign a review
-- with someone else's name.
create or replace function public.stamp_review_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.author_name := coalesce(
    (select display_name from public.profiles where id = auth.uid()),
    'Gıda Kurtarıcısı'
  );
  return new;
end;
$$;

drop trigger if exists reviews_stamp_author on public.reviews;
create trigger reviews_stamp_author
  before insert on public.reviews
  for each row execute function public.stamp_review_author();

-- ---------------------------------------------------------------------------
-- Trust score
-- ---------------------------------------------------------------------------

create or replace function public.recompute_organisation_trust(target_organisation_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  review_total int;
  rating_sum numeric;
  completed_total int;
begin
  select count(*), coalesce(sum(rating), 0)
    into review_total, rating_sum
    from public.reviews where organisation_id = target_organisation_id;

  select count(*) into completed_total
    from public.reservations
   where organisation_id = target_organisation_id and status = 'completed';

  update public.organisations
     set trust_score = round(100 * (
           0.8 * ((rating_sum + 12.0) / (review_total + 3) / 5.0)
         + 0.2 * least(completed_total, 20) / 20.0
         ))::int,
         rating = case when review_total = 0 then null else round(rating_sum / review_total, 1) end,
         review_count = review_total
   where id = target_organisation_id;
end;
$$;

-- Not callable from the client: it is only ever run by the triggers below.
revoke all on function public.recompute_organisation_trust(text) from public;
revoke all on function public.recompute_organisation_trust(text) from anon;
revoke all on function public.recompute_organisation_trust(text) from authenticated;

create or replace function public.trust_after_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_organisation_trust(new.organisation_id);
  return new;
end;
$$;

drop trigger if exists reviews_recompute_trust on public.reviews;
create trigger reviews_recompute_trust
  after insert on public.reviews
  for each row execute function public.trust_after_review();

create or replace function public.trust_after_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    perform public.recompute_organisation_trust(new.organisation_id);
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_recompute_trust on public.reservations;
create trigger reservations_recompute_trust
  after update of status on public.reservations
  for each row execute function public.trust_after_completion();

-- One-off: replace the hand-typed seed scores with computed ones.
select public.recompute_organisation_trust(id) from public.organisations;
