-- Logo and cover images for organisations.
--
-- Run once in the Supabase SQL editor, after data-schema.sql.
--
-- Who may change them: the admin for any organisation, and a business or NGO account for
-- its own. The organisations table itself stays admin-write-only (a business must not be
-- able to edit its own trust score or status), so images go through a definer function
-- that touches nothing but the two image columns.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'organisation-images', 'organisation-images', true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Files live under <organisation id>/. The folder name is compared with the organisation id
-- carried in the caller's token, so one organisation cannot overwrite another's image.
drop policy if exists "organisation-images: public read" on storage.objects;
create policy "organisation-images: public read"
  on storage.objects for select
  using (bucket_id = 'organisation-images');

drop policy if exists "organisation-images: owner or admin upload" on storage.objects;
create policy "organisation-images: owner or admin upload"
  on storage.objects for insert
  with check (
    bucket_id = 'organisation-images'
    and (
      public.auth_role() = 'admin'
      or (public.auth_role() in ('business', 'ngo')
          and (storage.foldername(name))[1] = public.auth_org())
    )
  );

drop policy if exists "organisation-images: owner or admin update" on storage.objects;
create policy "organisation-images: owner or admin update"
  on storage.objects for update
  using (
    bucket_id = 'organisation-images'
    and (
      public.auth_role() = 'admin'
      or (public.auth_role() in ('business', 'ngo')
          and (storage.foldername(name))[1] = public.auth_org())
    )
  );

create or replace function public.set_organisation_image(
  target_organisation_id text,
  image_kind text,
  image_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    public.auth_role() = 'admin'
    or (public.auth_role() in ('business', 'ngo')
        and public.auth_org() = target_organisation_id)
  ) then
    raise exception 'Bu kurumun görselini değiştirme yetkiniz yok.';
  end if;

  if image_kind = 'avatar' then
    update public.organisations set avatar = image_url where id = target_organisation_id;
  elsif image_kind = 'cover' then
    update public.organisations set cover = image_url where id = target_organisation_id;
  else
    raise exception 'Geçersiz görsel türü: %', image_kind;
  end if;
end;
$$;

revoke all on function public.set_organisation_image(text, text, text) from public;
revoke all on function public.set_organisation_image(text, text, text) from anon;
grant execute on function public.set_organisation_image(text, text, text) to authenticated;
