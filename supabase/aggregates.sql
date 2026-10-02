-- GıdaKöprüsü — leaderboard and platform totals.
--
-- Run after impact-columns.sql.
--
-- Both of these need to read across every user, which row level security correctly
-- forbids. They run as the definer to get past that, and in exchange they return only
-- aggregates and the display name a user chose for themselves: no e-mail addresses, no
-- order contents, no row the caller could not otherwise justify seeing.

-- Points are portions x 50 here and in src/utils/impact.js. If one changes the other must.
create or replace function public.leaderboard(row_limit int default 10)
returns table (
  rank int,
  name text,
  avatar text,
  kg numeric,
  points int,
  is_current_user boolean
)
language sql
security definer
set search_path = public
as $$
  with totals as (
    select
      r.user_id,
      round(sum(r.saved_kg), 1) as kg,
      (sum(r.portion_count) * 50)::int as points
    from public.reservations r
    where r.status = 'completed'
    group by r.user_id
    having sum(r.portion_count) > 0
  )
  select
    row_number() over (order by t.points desc, t.kg desc)::int as rank,
    coalesce(p.display_name, 'Gıda Kurtarıcısı') as name,
    p.avatar_url as avatar,
    t.kg,
    t.points,
    t.user_id = auth.uid() as is_current_user
  from totals t
  left join public.profiles p on p.id = t.user_id
  order by t.points desc, t.kg desc
  limit row_limit;
$$;

-- Revoking from PUBLIC is not enough: Supabase grants execute on public-schema functions
-- to the anon role explicitly, and that grant survives. Without the second revoke, anyone
-- holding the publishable key — which ships in the client bundle — could enumerate every
-- user's display name without signing in.
revoke all on function public.leaderboard(int) from public;
revoke all on function public.leaderboard(int) from anon;
grant execute on function public.leaderboard(int) to authenticated;


-- Platform-wide counters for the explore banner and the admin dashboard. Counts only, so
-- there is nothing here that identifies anyone.
create or replace function public.platform_stats()
returns table (
  total_food_saved_kg numeric,
  total_co2_saved_kg numeric,
  total_portions bigint,
  active_businesses bigint,
  active_ngos bigint,
  total_users bigint,
  today_active_listings bigint
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(round(sum(r.saved_kg), 1), 0),
    coalesce(round(sum(r.co2_kg), 1), 0),
    coalesce(sum(r.portion_count), 0)::bigint,
    (select count(*) from public.organisations where kind = 'business' and status = 'active'),
    (select count(*) from public.organisations where kind = 'ngo' and status = 'active'),
    (select count(*) from auth.users),
    (select count(*) from public.listings
      where status = 'active' and portions_available > 0)
  from public.reservations r
  where r.status = 'completed';
$$;

revoke all on function public.platform_stats() from public;
revoke all on function public.platform_stats() from anon;
grant execute on function public.platform_stats() to authenticated;
