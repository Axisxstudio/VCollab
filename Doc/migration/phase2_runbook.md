# Phase 2 Runbook

Last updated: 2026-05-07

## Prerequisites

- Supabase CLI installed.
- Docker running for local Supabase.
- Project environment values available for hosted Supabase when applying remotely.

## Local Verification

From the repository root:

```powershell
supabase init
supabase start
supabase db reset
```

`supabase db reset` should apply:

1. `0001_baseline_schema.sql`
2. `0002_storage_buckets.sql`
3. `0003_initial_rls.sql`
4. `supabase/seed/seed.sql`

Then inspect:

```powershell
supabase db diff
supabase status
```

Expected smoke checks:

- `public.users` exists and has `auth_user_id`.
- `public.resource_files` and `public.v_hub_threads` exist.
- Storage buckets exist: `profile-media`, `content-media`, `message-attachments`, `academic-resources`.
- `platform_feature_settings` contains `V_HUB`.
- Default categories and resource categories are present.

## Hosted Supabase

Apply through the Supabase CLI after linking:

```powershell
supabase link --project-ref <project-ref>
supabase db push
```

Do not commit generated local `.env` files or Supabase access tokens.

## Rollback

Before production use, take a Supabase database backup. During development, rollback is:

```powershell
supabase db reset
```

For hosted environments, prefer creating a new Supabase project or restoring from backup rather than hand-dropping tables.

## Phase 2 Gaps

- SQL was converted statically from Flyway/JPA and has not been applied to a live Supabase instance in this pass.
- RLS policies are intentionally incomplete for modules not yet migrated.
- Existing MySQL data export/import scripts are not included yet.
- Existing local upload files are not copied to Supabase Storage yet.
