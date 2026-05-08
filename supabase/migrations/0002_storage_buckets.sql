-- Supabase Storage buckets used by migrated modules.
-- Policies are intentionally conservative and will be tightened per module in Phase 5.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-media', 'profile-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('content-media', 'content-media', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
  ('message-attachments', 'message-attachments', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
  ('academic-resources', 'academic-resources', false, 104857600, null)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public profile media is readable" on storage.objects;
create policy "Public profile media is readable"
on storage.objects for select
using (bucket_id = 'profile-media');

drop policy if exists "Public content media is readable" on storage.objects;
create policy "Public content media is readable"
on storage.objects for select
using (bucket_id = 'content-media');

drop policy if exists "Authenticated users can upload owned profile media" on storage.objects;
create policy "Authenticated users can upload owned profile media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-media'
  and owner = auth.uid()
);

drop policy if exists "Authenticated users can upload content media" on storage.objects;
create policy "Authenticated users can upload content media"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('content-media', 'message-attachments', 'academic-resources')
  and owner = auth.uid()
);

drop policy if exists "Owners can update their objects" on storage.objects;
create policy "Owners can update their objects"
on storage.objects for update
to authenticated
using (owner = auth.uid())
with check (owner = auth.uid());

drop policy if exists "Owners can delete their objects" on storage.objects;
create policy "Owners can delete their objects"
on storage.objects for delete
to authenticated
using (owner = auth.uid());
