-- Runtime schema alignment for the Next/Supabase VCollab backend.
--
-- Safe to run more than once.
-- Purpose:
-- 1. Keep the users -> user_profiles relationship unambiguous for PostgREST embeds.
-- 2. Preserve the single live SUPER_ADMIN rule.
-- 3. Add small indexes used by current API query paths.
-- 4. Ensure required storage buckets exist in already-created Supabase projects.

-- If older/manual schema edits created duplicate foreign keys from
-- public.user_profiles(user_id) to public.users(id), PostgREST can raise:
-- "Could not embed because more than one relationship was found".
-- Keep only the canonical FK name used by the backend selects.
do $$
declare
  duplicate_fk record;
begin
  for duplicate_fk in
    select con.conname
    from pg_constraint con
    join pg_attribute att
      on att.attrelid = con.conrelid
     and att.attnum = con.conkey[1]
    where con.conrelid = 'public.user_profiles'::regclass
      and con.confrelid = 'public.users'::regclass
      and con.contype = 'f'
      and att.attname = 'user_id'
      and con.conname <> 'user_profiles_user_id_fkey'
  loop
    execute format(
      'alter table public.user_profiles drop constraint if exists %I',
      duplicate_fk.conname
    );
  end loop;
end $$;

alter table public.user_profiles
  drop constraint if exists user_profiles_user_id_fkey;

alter table public.user_profiles
  add constraint user_profiles_user_id_fkey
  foreign key (user_id)
  references public.users(id)
  on delete cascade;

create unique index if not exists uq_users_single_super_admin_live
on public.users ((role))
where role = 'SUPER_ADMIN' and deleted_at is null;

create index if not exists idx_project_requests_requester
on public.project_requests(requester_id, status, created_at desc)
where deleted_at is null;

create index if not exists idx_follows_follower_live
on public.follows(follower_id, deleted_at);

create index if not exists idx_saves_user_live
on public.saves(user_id, deleted_at, created_at desc);

create index if not exists idx_resource_files_public_search
on public.resource_files(visibility, active, deleted_at, created_at desc);

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

-- Ask PostgREST/Supabase API to refresh its relationship cache after FK repair.
notify pgrst, 'reload schema';
