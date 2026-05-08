-- Initial RLS scaffold. Route handlers still enforce compatibility guards in Phase 3/4.

alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.resource_categories enable row level security;
alter table public.resource_folders enable row level security;
alter table public.resource_files enable row level security;
alter table public.platform_feature_settings enable row level security;
alter table public.v_hub_threads enable row level security;
alter table public.v_hub_replies enable row level security;
alter table public.v_hub_thread_participants enable row level security;

create or replace function public.current_app_user_id()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where auth_user_id = auth.uid() and deleted_at is null limit 1;
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where auth_user_id = auth.uid() and deleted_at is null limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'SUPER_ADMIN', false);
$$;

create policy "Public profiles are readable"
on public.user_profiles for select
using (deleted_at is null);

create policy "Users can read their own account"
on public.users for select
to authenticated
using (auth_user_id = auth.uid() or public.is_super_admin());

create policy "Users can update their own profile"
on public.user_profiles for update
to authenticated
using (user_id = public.current_app_user_id() or public.is_super_admin())
with check (user_id = public.current_app_user_id() or public.is_super_admin());

create policy "Public categories are readable"
on public.categories for select
using (deleted_at is null and is_active = true);

create policy "Public projects are readable"
on public.projects for select
using (deleted_at is null and is_active = true and visibility = 'PUBLIC');

create policy "Project owners manage their projects"
on public.projects for all
to authenticated
using (owner_id = public.current_app_user_id() or public.is_super_admin())
with check (owner_id = public.current_app_user_id() or public.is_super_admin());

create policy "Project request participants can read"
on public.project_requests for select
to authenticated
using (
  requester_id = public.current_app_user_id()
  or owner_id = public.current_app_user_id()
  or public.is_super_admin()
);

create policy "Authenticated users can create project requests"
on public.project_requests for insert
to authenticated
with check (requester_id = public.current_app_user_id());

create policy "Project owners can update requests"
on public.project_requests for update
to authenticated
using (owner_id = public.current_app_user_id() or public.is_super_admin())
with check (owner_id = public.current_app_user_id() or public.is_super_admin());

create policy "Conversation members can read conversations"
on public.conversations for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = id
      and cm.user_id = public.current_app_user_id()
      and cm.deleted_at is null
  )
);

create policy "Conversation members can read memberships"
on public.conversation_members for select
to authenticated
using (user_id = public.current_app_user_id() or public.is_super_admin());

create policy "Conversation members can read messages"
on public.messages for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
      and cm.user_id = public.current_app_user_id()
      and cm.deleted_at is null
  )
);

create policy "Conversation members can send messages"
on public.messages for insert
to authenticated
with check (
  sender_id = public.current_app_user_id()
  and exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
      and cm.user_id = public.current_app_user_id()
      and cm.deleted_at is null
  )
);

create policy "Public resources are readable"
on public.resource_files for select
using (deleted_at is null and active = true and visibility = 'PUBLIC');

create policy "Public resource folders are readable"
on public.resource_folders for select
using (deleted_at is null and active = true and visibility = 'PUBLIC');

create policy "Resource owners manage files"
on public.resource_files for all
to authenticated
using (owner_id = public.current_app_user_id() or public.is_super_admin())
with check (owner_id = public.current_app_user_id() or public.is_super_admin());

create policy "VHub visible threads are readable"
on public.v_hub_threads for select
using (deleted_at is null and is_hidden = false);

create policy "VHub visible replies are readable"
on public.v_hub_replies for select
using (deleted_at is null and is_hidden = false);

create policy "Authenticated users can create VHub threads"
on public.v_hub_threads for insert
to authenticated
with check (author_id = public.current_app_user_id());

create policy "Authenticated users can create VHub replies"
on public.v_hub_replies for insert
to authenticated
with check (author_id = public.current_app_user_id());
