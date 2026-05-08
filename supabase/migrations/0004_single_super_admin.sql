-- Enforce a single active SUPER_ADMIN account in the platform.
-- "Active" means not soft-deleted (deleted_at is null).

create unique index if not exists uq_users_single_super_admin_live
on public.users ((role))
where role = 'SUPER_ADMIN' and deleted_at is null;
