-- Lets the sign-in screen show the platform's real totals.
--
-- Run once in the Supabase SQL editor, after aggregates.sql.
--
-- platform_stats() returns counts and sums only: kilograms, portions and how many accounts and
-- organisations exist. Nothing in it identifies anyone, so it is safe to show before sign-in.
-- leaderboard() stays authenticated-only because it returns display names.

grant execute on function public.platform_stats() to anon;
