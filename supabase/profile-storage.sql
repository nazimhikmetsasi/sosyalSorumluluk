-- GıdaKöprüsü — editable profiles and avatar storage.
--
-- Run this in the Supabase SQL editor after schema.sql.
--
-- Everything here is user-editable presentation data. Nothing that decides privilege
-- lives in this table: role and organisation_id stay in auth.users.raw_app_meta_data,
-- which the client cannot write. Keep it that way when adding columns.

alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists district text;
alter table public.profiles add column if not exists bio text;

-- ---------------------------------------------------------------------------
-- Avatar storage
-- ---------------------------------------------------------------------------

-- Public bucket: avatars are shown next to listings and on leaderboards, so the files
-- are world-readable. Writes are still restricted to the owner by the policies below.
--
-- The size and type limits are set on the bucket rather than only in the client, because
-- the client check is trivially bypassed. SVG is excluded on purpose: it can carry script,
-- and these files are served back to browsers.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Each user owns a folder named after their uid: avatars/<uid>/<file>. The policies
-- compare that first path segment to auth.uid(), so one account cannot overwrite
-- another's picture by guessing a filename.
drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars: owner upload" on storage.objects;
create policy "avatars: owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars: owner update" on storage.objects;
create policy "avatars: owner update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars: owner delete" on storage.objects;
create policy "avatars: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
