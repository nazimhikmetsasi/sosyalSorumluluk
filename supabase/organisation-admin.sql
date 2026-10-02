-- Lists the accounts bound to one organisation, for the admin panel's "Yetkilendir" dialog.
--
-- Run once in the Supabase SQL editor. The binding lives in auth.users.raw_app_meta_data,
-- which the client cannot read, so this runs as the definer and re-checks the caller's own
-- admin claim first. Anyone else gets an error, not an empty list, so a probe cannot tell
-- which organisations have members.

create or replace function public.organisation_members(target_organisation_id text)
returns table (email text, role text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.auth_role() <> 'admin' then
    raise exception 'Yalnızca yönetici yetkilileri görebilir.';
  end if;

  return query
    select u.email::text, (u.raw_app_meta_data ->> 'role')::text
      from auth.users u
     where u.raw_app_meta_data ->> 'organisation_id' = target_organisation_id
     order by u.email;
end;
$$;

revoke all on function public.organisation_members(text) from public;
revoke all on function public.organisation_members(text) from anon;
grant execute on function public.organisation_members(text) to authenticated;
