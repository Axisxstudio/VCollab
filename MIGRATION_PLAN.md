# VCollab Incremental Migration Plan

Last updated: 2026-05-07

## Migration Principles

- Migration was completed module-by-module; the Spring Boot backend has now been removed after Next/Supabase route coverage was added.
- Preserve existing `/api/v1/...` request and response behavior where practical, including the shared response envelope:
  `{ success, message, data, timestamp }`.
- New application code must use Next.js App Router, TypeScript, route handlers, server utilities, zod validation, and environment variables.
- Supabase replaces MySQL/JPA, custom JWT auth, local file uploads, and STOMP/WebSocket behavior incrementally.
- Each phase should end with docs, tests for critical paths, verification notes, and a rollback path.

## Current Repository Snapshot

- Frontend: `vcollab-frontend`, React/Vite, JavaScript service layer under `src/services`.
- Backend: `apps/vcollab-next`, Next.js App Router route handlers backed by Supabase Auth/Postgres/Storage/Realtime.
- Legacy backend: `vcollab-backend` removed during Phase 7 cutover.
- Realtime: Supabase broadcast channels replace STOMP/SockJS.
- Uploads: Supabase Storage replaces local filesystem uploads.
- Working tree note: Phase 0 observed uncommitted changes and untracked Resources/VHub files. Treat them as active source context and avoid reverting them.

## Phase Checklist

- [x] Phase 0: Discovery and migration mapping.
- [x] Phase 1: Bootstrap `apps/vcollab-next` with Next.js, TypeScript, ESLint, Supabase clients, env template, layout, and health route.
- [x] Phase 2: Convert Flyway/MySQL schema to Supabase/Postgres migrations, policies, schema docs, and seed data.
- [x] Phase 3: Implement Supabase Auth, role mapping, server role guards, compatibility auth responses, and tests.
- [x] Phase 4.1: Migrate Users/Auth profile endpoints.
- [x] Phase 4.2: Migrate Search and Project Requests.
- [x] Phase 4.3: Migrate Messages/Chat.
- [x] Phase 4.4: Migrate Resources.
- [x] Phase 4.5: Migrate VHub.
- [x] Phase 5: Replace STOMP/local uploads with Supabase Realtime and Storage.
- [x] Phase 6: Wire React frontend service layer to Next APIs with compatibility adapters.
- [x] Phase 7: Backend cutover to Next/Supabase and Spring Boot removal.

## Controller to Next Route Handler Mapping

| Spring controller | Existing base path | Next route handler target | Migration phase | Notes |
|---|---|---|---|---|
| `AuthController` | `/api/v1/auth` | `apps/vcollab-next/app/api/v1/auth/*/route.ts` | 3, 4.1 | Register, login, me, forgot/reset password, username check. Preserve `AuthResponse` shape while moving identity to Supabase Auth. |
| `UserController` | `/api/v1/users` | `app/api/v1/users/**/route.ts` | 4.1 | Public profiles, discovery, own profile update, profile/cover uploads. Uploads should move to Supabase Storage in Phase 5. |
| `SearchController` | `/api/v1/search` | `app/api/v1/search/route.ts` | 4.2 | Aggregates users/projects/posts/blogs/resources as available. Use Postgres indexes/search first; consider full-text search after parity. |
| `ProjectRequestController` | `/api/v1/project-requests` | `app/api/v1/project-requests/**/route.ts` | 4.2 | Create, sent, received, status updates. Preserve ownership checks. |
| `ConversationController` | `/api/v1/conversations` | `app/api/v1/conversations/**/route.ts` | 4.3 | Start/list/get/mark read. Requires conversation membership RLS and service-side guards. |
| `MessageController` | `/api/v1/messages` | `app/api/v1/messages/**/route.ts` | 4.3 | List/send/update/delete. Attachments move from local URLs to Supabase Storage signed URLs. |
| `ConversationRealtimeController` | `/app/conversations/{id}/typing` | Supabase Realtime broadcast/channel helper | 5 | Replace STOMP typing events with scoped realtime channels. |
| `ResourcePublicController` | `/api/v1/resources/public` | `app/api/v1/resources/public/**/route.ts` | 4.4 | Public overview, categories, institutions, explorer, search, preview/download. Preserve public GET access. |
| `ResourceController` | `/api/v1/resources` | `app/api/v1/resources/**/route.ts` | 4.4 | My dashboard/explorer, folder CRUD, upload/update/replace/delete files. Storage migration is required for final parity. |
| `AdminResourceController` | `/api/v1/admin/resources` | `app/api/v1/admin/resources/**/route.ts` | 4.4 | Admin moderation, restore, structure and categories. Require `SUPER_ADMIN`. |
| `VHubSettingsController` | `/api/v1/v-hub/settings` | `app/api/v1/v-hub/settings/route.ts` | 4.5 | Public settings with guest access behavior. |
| `VHubThreadController` | `/api/v1/v-hub/threads` | `app/api/v1/v-hub/threads/**/route.ts` | 4.5 | Public listing/get/replies plus writes. Current Spring security permits GET and POST; re-evaluate guest posting in Phase 3/4.5. |
| `VHubAdminController` | `/api/v1/admin/v-hub` | `app/api/v1/admin/v-hub/**/route.ts` | 4.5 | Settings, summary, admin thread list, lock/hide moderation. Require `SUPER_ADMIN`. |
| Content controllers | `/api/v1/projects`, `/posts`, `/blogs`, `/comments`, `/likes`, `/saves`, `/shares`, `/follows`, `/feed` | Partial Next handlers | Phase 6 module pass | Projects, posts, and blogs are migrated. Comments, interactions, follows, feed, and side effects remain. |
| Admin controllers | `/api/v1/admin/**` | Partial Next handlers | 4.4, 4.5, Phase 6 module pass | Resources, VHub, categories, CMS blocks, and project/post/blog moderation are migrated. Users, dashboard, reports, warnings, audit logs, exports, and recycle bin remain. |
| Landing/CMS/categories/tagging/targeting/media | `/api/v1/landing`, `/admin/cms-blocks`, `/categories`, `/tags`, `/targeting`, `/media` | Partial Next handlers | Phase 6 module pass | Landing overview, CMS blocks, and categories are migrated. Tags, targeting, and generic media remain. |

## Entity to Supabase/Postgres Schema Mapping

| JPA entity/table | Supabase/Postgres target | Phase | Notes |
|---|---|---|---|
| `User` / `users` | `profiles` or `app_users` linked to `auth.users(id)` | 2, 3 | Prefer UUID `auth_user_id` as primary auth link. Preserve legacy numeric `id` during migration if frontend/API compatibility requires it. |
| `UserProfile` / `user_profiles` | `user_profiles` | 2, 4.1 | Keep profile fields and counters; image fields become storage object paths/public or signed URLs. |
| `PasswordResetToken` / `password_reset_tokens` | Supabase Auth recovery flow | 3 | Avoid custom reset tokens unless compatibility endpoint must proxy to Supabase. |
| `Category` / `categories` | `categories` | 2 | Preserve slug uniqueness, type, active/default flags. |
| `Project`, `ProjectMedia` | `projects`, `project_media` | 2, later | Needed by search and project requests. |
| `ProjectRequest` | `project_requests` | 2, 4.2 | Unique `(project_id, requester_id)` and owner/requester checks. |
| `Post`, `PostMedia`, `Blog`, `BlogMedia` | `posts`, `post_media`, `blogs`, `blog_media` | 2, later | Search/feed dependencies. |
| `Comment`, `CommentLike` | `comments`, `comment_likes` | 2, later | `V7` adds image URL support. |
| `Like`, `Save`, `Share`, `Follow`, `FollowRequest` | `likes`, `saves`, `shares`, `follows`, `follow_requests` | 2, later | Composite uniqueness and counters need transaction/RPC strategy. |
| `Conversation`, `ConversationMember`, `Message` | `conversations`, `conversation_members`, `messages` | 2, 4.3 | Preserve read/delivered fields, last message metadata, reply and attachment fields. |
| `UserPresence` | `user_presence` or Supabase Realtime presence only | 5 | Keep table only if product needs historical last-seen/active conversation records. |
| `Notification` | `notifications` | 2, later | Realtime notification delivery can use Postgres changes or broadcast. |
| `AcademicResourceFolder`, `AcademicResourceFile`, `ResourceCategory` | `resource_folders`, `resource_files`, `resource_categories` | 2, 4.4 | Convert tree path logic and file metadata; storage path points to Supabase bucket object. |
| `PlatformFeatureSetting`, `VHubThread`, `VHubReply`, `VHubThreadParticipant` | `platform_feature_settings`, `v_hub_threads`, `v_hub_replies`, `v_hub_thread_participants` | 2, 4.5 | Preserve guest/public behavior, hidden/locked/solved flags, best reply, counters, participants. |
| `ContentTargeting`, `SystemTag`, `ShareableLink`, `CmsBlock`, `AuditLog`, `Report`, `Warning` | Same table names | 2, later | Preserve soft-delete columns and admin visibility. |

## Service Method to Server Function Mapping

| Current service | Server utility target | Priority methods |
|---|---|---|
| `AuthServiceImpl` | `src/server/auth/*` | `register`, `login`, `me`, `requestPasswordReset`, `resetPassword`, `checkUsernameAvailability`. |
| `UserServiceImpl` | `src/server/users/*` | `searchPublicProfiles`, `getPublicProfile`, `getMyProfile`, `updateMyProfile`, profile/cover image updates. |
| `SearchServiceImpl` | `src/server/search/search.ts` | `search(query, size)`. |
| `ProjectRequestServiceImpl` | `src/server/project-requests/*` | `create`, `listSent`, `listReceived`, `updateStatus`. |
| `ConversationServiceImpl` | `src/server/messages/conversations.ts` | `startConversation`, `list`, `get`, `markRead`. |
| `MessageServiceImpl` | `src/server/messages/messages.ts` | `list`, `send`, `update`, `markConversationRead`, `delete`. |
| `AcademicResourceService` | `src/server/resources/*` | Public overview/explorer/search/download, my dashboard/explorer, folder/file CRUD, admin moderation/structure/categories. |
| `ResourceStorageService` | `src/server/storage/resources.ts` | `store`, `deleteQuietly`, signed URL generation. |
| `VHubService` | `src/server/vhub/*` | List/get/create threads, replies, solve/reopen/delete, admin list/summary/moderation. |
| `VHubSettingsService` | `src/server/vhub/settings.ts` | Public settings, update settings, readable/writable guards, guest access. |

## Flyway to Supabase Migration Mapping

| Flyway file | Supabase migration target | Required conversion |
|---|---|---|
| `V1__baseline_schema.sql` | `supabase/migrations/0001_baseline_schema.sql` | Convert `AUTO_INCREMENT` to identity/UUID strategy, `DATETIME(6)` to `timestamptz`, `LONGTEXT` to `text`, MySQL indexes to Postgres indexes, unique keys to constraints. |
| `V2__seed_platform_defaults.sql` | `0002_seed_platform_defaults.sql` | Convert MySQL seed syntax, preserve categories/CMS/system defaults. |
| `V3__user_profiling_and_targeting.sql` | `0003_user_profile_targeting.sql` | Convert `ALTER TABLE` comments, `FULLTEXT` to GIN/trigram or Postgres full-text index. |
| `V4__realtime_presence_and_message_receipts.sql` | `0004_realtime_presence_messages.sql` | Convert presence table and read/delivered timestamps. Decide if presence remains persisted. |
| `V5__add_project_resource_links.sql` | `0005_project_resource_links.sql` | Preserve relationship or link metadata after resources schema conversion. |
| `V6__align_conversation_and_message_schema.sql` | Fold into `0004` or `0006_messages_alignment.sql` | Replace MySQL prepared conditional DDL with explicit Postgres migration; include last message, group, type, attachment, delete and reply fields. |
| `V7__add_comment_image_support.sql` | `0007_comment_image_support.sql` | Convert image URL/path column. Storage migration determines URL strategy. |
| `V8__add_v_hub_social_messaging.sql` | `0008_v_hub.sql` | Convert VHub tables, defaults, indexes, feature setting JSON to `jsonb`. |
| `V9__make_v_hub_public_for_visitors.sql` | `0009_v_hub_public_settings.sql` | Preserve guest/public setting change. |
| `V10__add_public_resources_module.sql` | `0010_resources.sql` | Convert resource tables, seed folders/categories, tree path updates, MySQL prefix indexes. |
| `V11__expand_sri_lankan_resource_institutions.sql` | `0011_resource_institution_seed.sql` | Convert large seed expansion; make idempotent with unique slugs/paths. |

## Security and Authorization Mapping

- Existing roles: `SUPER_ADMIN`, `STUDENT`, `INDUSTRIAL_EXPERT`, `SOFTWARE_ENGINEER`.
- Current public access:
  - `/api/v1/auth/**`
  - `/api/v1/landing/**`
  - `GET /api/v1/resources/public/**`
  - `GET /api/v1/v-hub/**`
  - `POST /api/v1/v-hub/**`
  - `/ws/**`
  - `GET /api/v1/users/*`
  - `GET /api/v1/projects/**`, `/posts/**`, `/blogs/**`
  - `GET /uploads/**`
  - `/actuator/health`
- Current admin rule: `/api/v1/admin/**` requires `SUPER_ADMIN`.
- Target guard utilities:
  - `getSessionUser()`: resolves Supabase Auth user and app profile.
  - `requireUser()`: returns authenticated profile or throws 401.
  - `requireRole(...roles)`: throws 403 if missing.
  - `requireSuperAdmin()`: wrapper for admin routes.
  - `canAccessConversation`, `canModifyContent`, `canModerateContent`, `canAccessResourceFile`.
- RLS should enforce baseline ownership/member/admin rules; route handlers can use service role only where strictly needed and must still call guard utilities.

## API Compatibility Standards

- Keep `/api/v1` route prefix in Next route handlers during migration.
- Return the Spring-compatible envelope unless a frontend adapter explicitly handles a new shape.
- Preserve pagination shapes from Spring Data `Page` where frontend depends on `content`, `pageable`, `totalElements`, `totalPages`, `size`, and `number`.
- Preserve HTTP status behavior:
  - 400 validation/illegal argument
  - 401 unauthenticated
  - 403 forbidden
  - 404 not found
  - 409 duplicate/conflict
  - 500 generic unexpected error
- Centralize errors in a TypeScript helper equivalent to `GlobalExceptionHandler`.

## Risk Register

| Area | Risk | Mitigation |
|---|---|---|
| Auth cutover | Existing JWT and numeric user IDs differ from Supabase Auth sessions/UUIDs. | Add a compatibility user profile table and auth response adapter. Keep `JWT_SECRET` only if a temporary legacy token bridge is needed. |
| Authorization | Admin and ownership checks currently live in services and Spring security. | Implement route-level guards plus Supabase RLS tests before moving writes. |
| Data model | MySQL conditional migrations and `AUTO_INCREMENT` IDs may not map directly. | Produce explicit Postgres migrations; consider keeping `legacy_id bigint unique` if numeric IDs must remain stable. |
| Realtime | STOMP destinations do not map one-to-one to Supabase channels. | Inventory frontend websocket clients and replace channel-by-channel: messages, typing, notifications, feed, presence, VHub. |
| File uploads | Public local `/uploads/**` URLs are embedded in records. | Store object path plus compatibility URL; add signed URL endpoints before switching frontend reads. |
| Counters | Like/comment/save/share/reply counters can drift under concurrent writes. | Use Postgres functions/transactions or triggers for atomic updates. Add tests for increment/decrement paths. |
| Public VHub writes | Spring currently permits `POST /api/v1/v-hub/**`; service settings may restrict writes. | Decide in Phase 3 whether anonymous writes remain allowed; document and test behavior. |
| Search parity | Existing search aggregates multiple content types. | Start with SQL `ilike`/indexed queries, then add full-text/trigram once response parity is tested. |
| Existing dirty worktree | Active uncommitted changes could be overwritten accidentally. | Keep migration edits scoped and avoid touching unrelated files. |

## Testing Strategy

- Unit tests for server utilities: response envelopes, error helpers, role guards, Supabase client wrappers.
- Route handler tests for each migrated module using mocked Supabase clients where possible.
- Integration tests against local Supabase for critical RLS and CRUD paths:
  - Auth/session/profile load.
  - Role guard access and denial.
  - Project request create/list/status with owner/requester checks.
  - Conversation membership, message send/update/delete/read.
  - Resource upload metadata, public preview/download, owner/admin moderation.
  - VHub thread/reply creation, solve/reopen, admin hide/lock.
- Frontend compatibility tests should validate service adapters receive the same practical response shape.

## Phase 1 Planned Changes

- Create `apps/vcollab-next`.
- Add Next.js App Router, TypeScript strict mode, and ESLint.
- Add Supabase browser/server/admin clients.
- Add `.env.example` for:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `JWT_SECRET`
- Add `app/api/health/route.ts` returning a small health payload.
- Add a minimal root layout/page for boot verification.

## Phase 1 Output

Files created/changed:

- `.gitignore`
- `apps/vcollab-next/package.json`
- `apps/vcollab-next/package-lock.json`
- `apps/vcollab-next/tsconfig.json`
- `apps/vcollab-next/next-env.d.ts`
- `apps/vcollab-next/next.config.ts`
- `apps/vcollab-next/eslint.config.mjs`
- `apps/vcollab-next/.env.example`
- `apps/vcollab-next/app/layout.tsx`
- `apps/vcollab-next/app/page.tsx`
- `apps/vcollab-next/app/globals.css`
- `apps/vcollab-next/app/api/health/route.ts`
- `apps/vcollab-next/src/server/api-response.ts`
- `apps/vcollab-next/src/lib/supabase/browser.ts`
- `apps/vcollab-next/src/lib/supabase/server.ts`
- `apps/vcollab-next/src/lib/supabase/admin.ts`

Commands run:

- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Verification steps:

- From `apps/vcollab-next`, run `npm run dev`.
- Open `http://localhost:3000` for the bootstrap page.
- Open `http://localhost:3000/api/health` and expect a JSON response with `success: true`, service `vcollab-next`, and status `ok`.
- Run `npm run typecheck`, `npm run lint`, and `npm run build` before adding module routes.

Known gaps:

- Supabase environment variables are intentionally blank in `.env.example`; real values must be supplied in local `.env.local` or Vercel project settings.
- No route-handler tests are added yet because Phase 1 only introduces the health endpoint and shared utilities. Test setup will be added with Phase 3/4 critical paths.
- `npm install` reported two moderate dependency audit findings in the resolved dependency tree. Do not use `npm audit fix --force` without reviewing breaking changes.

## Phase 2 Output

Files created/changed:

- `supabase/migrations/0001_baseline_schema.sql`
- `supabase/migrations/0002_storage_buckets.sql`
- `supabase/migrations/0003_initial_rls.sql`
- `supabase/seed/seed.sql`
- `Doc/migration/supabase_schema.md`
- `Doc/migration/phase2_runbook.md`
- `MIGRATION_PLAN.md`

Commands run:

- Read remaining Flyway SQL: `V2`, `V5`, `V7`, `V9`, `V11`.
- Read key enum/base entity files for roles, content types, visibility, and audit columns.
- Created `supabase/migrations`, `supabase/seed`, and `Doc/migration`.
- Checked new Supabase SQL for MySQL-only syntax leftovers with `rg`.
- Checked for local Supabase/Postgres tooling with `supabase --version`, `psql --version`, and `docker --version`.

Verification steps:

- Static SQL sweep found no `AUTO_INCREMENT`, `DATETIME`, `LONGTEXT`, `NOW(6)`, `ENGINE=`, `MODIFY`, `AFTER`, `JSON_SET`, or MySQL backtick usage in `supabase`.
- Apply locally once the Supabase CLI and Docker are installed:
  - `supabase start`
  - `supabase db reset`
  - inspect seeded categories, resource categories, VHub setting, and storage buckets.

Known gaps:

- Live Supabase validation was not run because `supabase`, `psql`, and `docker` are not installed in this environment.
- Initial RLS is a scaffold for the requested migrated modules, not a complete final policy suite for every legacy table.
- Existing MySQL data export/import and local upload transfer scripts are not implemented yet.
- Storage bucket policies are deliberately conservative starters and must be refined during Phase 5.

## Phase 3 Output

Files created/changed:

- `apps/vcollab-next/app/api/v1/auth/register/route.ts`
- `apps/vcollab-next/app/api/v1/auth/login/route.ts`
- `apps/vcollab-next/app/api/v1/auth/me/route.ts`
- `apps/vcollab-next/app/api/v1/auth/check-username/route.ts`
- `apps/vcollab-next/app/api/v1/auth/forgot-password/route.ts`
- `apps/vcollab-next/app/api/v1/auth/reset-password/route.ts`
- `apps/vcollab-next/src/server/auth/schemas.ts`
- `apps/vcollab-next/src/server/auth/service.ts`
- `apps/vcollab-next/src/server/auth/guards.ts`
- `apps/vcollab-next/src/server/auth/mapper.ts`
- `apps/vcollab-next/src/server/auth/types.ts`
- `apps/vcollab-next/src/server/http/errors.ts`
- `apps/vcollab-next/src/server/http/route.ts`
- `apps/vcollab-next/src/server/**/__tests__/*.test.ts`
- `apps/vcollab-next/app/api/v1/auth/__tests__/routes.test.ts`
- `apps/vcollab-next/vitest.config.ts`
- `apps/vcollab-next/package.json`
- `apps/vcollab-next/package-lock.json`
- `apps/vcollab-next/.env.example`
- `Doc/migration/phase3_auth.md`
- `MIGRATION_PLAN.md`

Commands run:

- `npm install --save-dev vitest`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Verification steps:

- TypeScript passed.
- ESLint passed.
- Vitest passed: 5 test files, 10 tests.
- Production build passed and compiled all `/api/v1/auth/*` route handlers.

Known gaps:

- Live Supabase auth verification was not run because project env values and a migrated Supabase database are not available in this environment.
- Password reset uses the Supabase recovery flow rather than the old Spring `password_reset_tokens` table.
- Existing React frontend has not been rewired to these routes yet.

## Phase 4.1 Output: Users/Auth Profile

Files created/changed:

- `apps/vcollab-next/app/api/v1/users/discover/route.ts`
- `apps/vcollab-next/app/api/v1/users/[username]/route.ts`
- `apps/vcollab-next/app/api/v1/users/me/profile/route.ts`
- `apps/vcollab-next/app/api/v1/users/me/profile-image/route.ts`
- `apps/vcollab-next/app/api/v1/users/me/cover-image/route.ts`
- `apps/vcollab-next/src/server/users/schemas.ts`
- `apps/vcollab-next/src/server/users/service.ts`
- `apps/vcollab-next/src/server/users/mapper.ts`
- `apps/vcollab-next/src/server/users/types.ts`
- `apps/vcollab-next/src/server/pagination/page.ts`
- `apps/vcollab-next/src/server/users/__tests__/mapper.test.ts`
- `apps/vcollab-next/src/server/pagination/__tests__/page.test.ts`
- `apps/vcollab-next/app/api/v1/users/__tests__/routes.test.ts`
- `Doc/migration/phase4_1_users_profile.md`
- `MIGRATION_PLAN.md`

Commands run:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Verification steps:

- TypeScript passed.
- ESLint passed.
- Vitest passed: 8 test files, 16 tests.
- Production build passed and compiled all `/api/v1/users/*` route handlers.

Known gaps:

- Live Supabase profile CRUD/upload verification was not run because the database and storage buckets are not available in this environment.
- Joined profile discovery search may need Supabase query tuning with real data.
- Existing React frontend has not been rewired to these routes yet.

## Phase 4.2 Output: Search and Project Requests

Files created/changed:

- `apps/vcollab-next/app/api/v1/search/route.ts`
- `apps/vcollab-next/app/api/v1/project-requests/route.ts`
- `apps/vcollab-next/app/api/v1/project-requests/sent/route.ts`
- `apps/vcollab-next/app/api/v1/project-requests/received/route.ts`
- `apps/vcollab-next/app/api/v1/project-requests/[id]/status/route.ts`
- `apps/vcollab-next/src/server/search/schemas.ts`
- `apps/vcollab-next/src/server/search/service.ts`
- `apps/vcollab-next/src/server/project-requests/schemas.ts`
- `apps/vcollab-next/src/server/project-requests/service.ts`
- `apps/vcollab-next/src/server/project-requests/mapper.ts`
- `apps/vcollab-next/src/server/project-requests/types.ts`
- `apps/vcollab-next/src/server/search/__tests__/schemas.test.ts`
- `apps/vcollab-next/src/server/project-requests/__tests__/*.test.ts`
- `apps/vcollab-next/app/api/v1/project-requests/__tests__/routes.test.ts`
- `Doc/migration/phase4_2_search_project_requests.md`
- `MIGRATION_PLAN.md`

Commands run:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Verification steps:

- TypeScript passed.
- ESLint passed.
- Vitest passed: 12 test files, 21 tests.
- Production build passed and compiled `/api/v1/search` and `/api/v1/project-requests/*`.

Known gaps:

- Live Supabase query verification was not run in this environment.
- Search uses first-pass `ilike` filters; ranking/full-text tuning remains.
- Project request feed and notification side effects are deferred until those modules are migrated.

## Phase 4.3 Output: Messages and Chat

Files created/changed:

- `apps/vcollab-next/app/api/v1/conversations/route.ts`
- `apps/vcollab-next/app/api/v1/conversations/[id]/route.ts`
- `apps/vcollab-next/app/api/v1/conversations/[id]/read/route.ts`
- `apps/vcollab-next/app/api/v1/messages/route.ts`
- `apps/vcollab-next/app/api/v1/messages/[id]/route.ts`
- `apps/vcollab-next/app/api/v1/messages/conversations/[conversationId]/route.ts`
- `apps/vcollab-next/src/server/messages/schemas.ts`
- `apps/vcollab-next/src/server/messages/service.ts`
- `apps/vcollab-next/src/server/messages/mapper.ts`
- `apps/vcollab-next/src/server/messages/types.ts`
- `apps/vcollab-next/src/server/messages/__tests__/*.test.ts`
- `apps/vcollab-next/app/api/v1/messages/__tests__/routes.test.ts`
- `apps/vcollab-next/app/api/v1/conversations/__tests__/routes.test.ts`
- `Doc/migration/phase4_3_messages_chat.md`
- `MIGRATION_PLAN.md`

Commands run:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Verification steps:

- TypeScript passed.
- ESLint passed.
- Vitest passed: 16 test files, 28 tests.
- Production build passed and compiled `/api/v1/conversations/*` and `/api/v1/messages/*`.

Known gaps:

- Live Supabase chat verification was not run in this environment.
- Participant presence is stubbed as offline/null until Phase 5 realtime presence.
- STOMP message/status publishing and message notifications are deferred until Supabase Realtime and notifications are migrated.

## Phase 4.4 Output: Resources

Files created/changed:

- `apps/vcollab-next/app/api/v1/resources/**/route.ts`
- `apps/vcollab-next/app/api/v1/admin/resources/**/route.ts`
- `apps/vcollab-next/src/server/resources/schemas.ts`
- `apps/vcollab-next/src/server/resources/service.ts`
- `apps/vcollab-next/src/server/resources/mapper.ts`
- `apps/vcollab-next/src/server/resources/types.ts`
- `apps/vcollab-next/src/server/resources/route-helpers.ts`
- `apps/vcollab-next/src/server/resources/__tests__/*.test.ts`
- `apps/vcollab-next/app/api/v1/resources/__tests__/routes.test.ts`
- `Doc/migration/phase4_4_resources.md`
- `MIGRATION_PLAN.md`

Commands run:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Verification steps:

- TypeScript passed.
- ESLint passed.
- Vitest passed: 19 test files, 35 tests.
- Production build passed and compiled public, owner, and admin resource routes.

Known gaps:

- Live Supabase storage/query verification was not run in this environment.
- Some resource overview/admin aggregation behavior needs tuning against real data.
- Signed URL and storage policy strategy remains part of Phase 5 hardening.

## Phase 4.5 Output: VHub

Files created/changed:

- `apps/vcollab-next/app/api/v1/v-hub/**/route.ts`
- `apps/vcollab-next/app/api/v1/admin/v-hub/**/route.ts`
- `apps/vcollab-next/src/server/vhub/schemas.ts`
- `apps/vcollab-next/src/server/vhub/service.ts`
- `apps/vcollab-next/src/server/vhub/mapper.ts`
- `apps/vcollab-next/src/server/vhub/route-helpers.ts`
- `apps/vcollab-next/src/server/vhub/__tests__/*.test.ts`
- `apps/vcollab-next/app/api/v1/v-hub/__tests__/routes.test.ts`
- `Doc/migration/phase4_5_vhub.md`
- `MIGRATION_PLAN.md`

Commands run:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Verification steps:

- TypeScript passed.
- ESLint passed.
- Vitest passed: 22 test files, 42 tests.
- Production build passed and compiled public/user/admin VHub routes.

Known gaps:

- Live Supabase verification was not run in this environment.
- VHub rate limiting is not enforced yet.
- VHub Supabase Realtime publishing is deferred to Phase 5.

## Phase 5 Output: Realtime and Storage

Files created/changed:

- `apps/vcollab-next/src/server/realtime/channels.ts`
- `apps/vcollab-next/src/server/realtime/publisher.ts`
- `apps/vcollab-next/src/server/realtime/client-contract.md`
- `apps/vcollab-next/src/server/storage/schemas.ts`
- `apps/vcollab-next/src/server/storage/signed-url.ts`
- `apps/vcollab-next/app/api/v1/storage/signed-url/route.ts`
- `apps/vcollab-next/src/server/messages/service.ts`
- `apps/vcollab-next/src/server/vhub/service.ts`
- `apps/vcollab-next/src/server/resources/service.ts`
- `apps/vcollab-next/src/server/realtime/__tests__/channels.test.ts`
- `apps/vcollab-next/src/server/storage/__tests__/schemas.test.ts`
- `apps/vcollab-next/app/api/v1/storage/__tests__/routes.test.ts`
- `Doc/migration/phase5_realtime_storage.md`
- `MIGRATION_PLAN.md`

Commands run:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Verification steps:

- TypeScript passed.
- ESLint passed.
- Vitest passed: 25 test files, 46 tests.
- Production build passed and compiled `POST /api/v1/storage/signed-url`.

Known gaps:

- Supabase Realtime and Storage signed URLs were not tested against a live Supabase project in this environment.
- Frontend websocket clients still use STOMP and need Phase 6 rewiring.
- Presence lifecycle and complete notifications/feed side effects remain to be completed with frontend integration and remaining module migrations.

## Phase 6 Progress: Frontend Cutover

Files created/changed:

- `vcollab-frontend/src/config/constants.js`
- `vcollab-frontend/.env.example`
- `Doc/migration/phase6_frontend_cutover.md`
- `MIGRATION_PLAN.md`

Commands run:

- `npm run typecheck`
- `npm run lint`
- `npm test`

Verification steps:

- Next TypeScript passed.
- Next ESLint passed.
- Next Vitest passed: 25 test files, 46 tests.
- Verified migrated React services already call Next-compatible `/api/v1` paths through the shared Axios client.

Known gaps:

- Vite frontend build and browser smoke tests still need to be run after the full service cutover.
- Remaining Spring-only services still exist for content/admin/landing/social modules.
- STOMP hooks are still present for some frontend realtime flows and need complete Supabase Realtime replacement.

## Phase 6 Progress: Landing, CMS, and Categories

Files created/changed:

- `apps/vcollab-next/app/api/v1/landing/overview/route.ts`
- `apps/vcollab-next/app/api/v1/categories/route.ts`
- `apps/vcollab-next/app/api/v1/admin/categories/**/route.ts`
- `apps/vcollab-next/app/api/v1/admin/cms-blocks/**/route.ts`
- `apps/vcollab-next/src/server/categories/*`
- `apps/vcollab-next/src/server/cms/*`
- `apps/vcollab-next/src/server/landing/*`
- `apps/vcollab-next/src/server/**/__tests__/*.test.ts`
- `apps/vcollab-next/app/api/v1/admin/cms-blocks/__tests__/routes.test.ts`
- `Doc/migration/phase6_landing_cms_categories.md`
- `MIGRATION_PLAN.md`

Commands run:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Verification steps:

- TypeScript passed.
- ESLint passed.
- Vitest passed: 29 test files, 52 tests.
- Production build passed and compiled the new landing, category, and CMS block routes.

Known gaps:

- Live Supabase verification was not run in this environment.
- Project/post/blog CRUD and admin moderation are still pending, so landing cards use read-only table data and empty media arrays for now.
- CMS/category admin audit log side effects are not restored yet.

## Phase 6 Progress: Projects, Posts, and Blogs

Files created/changed:

- `apps/vcollab-next/app/api/v1/projects/**/route.ts`
- `apps/vcollab-next/app/api/v1/posts/**/route.ts`
- `apps/vcollab-next/app/api/v1/blogs/**/route.ts`
- `apps/vcollab-next/app/api/v1/admin/projects/**/route.ts`
- `apps/vcollab-next/app/api/v1/admin/posts/**/route.ts`
- `apps/vcollab-next/app/api/v1/admin/blogs/**/route.ts`
- `apps/vcollab-next/src/server/content/*`
- `apps/vcollab-next/src/server/content/__tests__/mapper.test.ts`
- `apps/vcollab-next/app/api/v1/admin/projects/__tests__/routes.test.ts`
- `Doc/migration/phase6_content_projects_posts_blogs.md`
- `MIGRATION_PLAN.md`

Commands run:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Verification steps:

- TypeScript passed.
- ESLint passed.
- Vitest passed: 31 test files, 57 tests.
- Production build passed and compiled public/user/admin project, post, and blog routes.

Known gaps:

- Live Supabase verification was not run in this environment.
- Media arrays are placeholders until media relationship handling is moved over.
- Feed, notifications, audit logs, comments, targeting, and interaction side effects remain pending.

## Phase 7 Output: Backend Cutover and Spring Removal

Files created/changed/deleted:

- `apps/vcollab-next/src/server/social-admin/service.ts`
- `apps/vcollab-next/app/api/v1/comments/**/route.ts`
- `apps/vcollab-next/app/api/v1/likes/**/route.ts`
- `apps/vcollab-next/app/api/v1/saves/**/route.ts`
- `apps/vcollab-next/app/api/v1/shares/route.ts`
- `apps/vcollab-next/app/api/v1/follows/**/route.ts`
- `apps/vcollab-next/app/api/v1/feed/route.ts`
- `apps/vcollab-next/app/api/v1/notifications/**/route.ts`
- `apps/vcollab-next/app/api/v1/reports/**/route.ts`
- `apps/vcollab-next/app/api/v1/warnings/**/route.ts`
- `apps/vcollab-next/app/api/v1/admin/**/route.ts`
- `apps/vcollab-next/app/api/v1/tags/suggest/route.ts`
- `apps/vcollab-next/app/api/v1/targeting/route.ts`
- `apps/vcollab-next/app/api/v1/media/upload/route.ts`
- `apps/vcollab-next/Dockerfile`
- `docker-compose.yml`
- `vcollab-frontend/nginx.conf`
- `vcollab-frontend/vite.config.js`
- `.env.example`
- `vcollab-frontend/.env.example`
- `codex-run-backend.ps1` deleted
- `vcollab-backend/` deleted
- `Doc/migration/phase7_backend_cutover.md`
- `MIGRATION_PLAN.md`

Commands run:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- Stopped the old Java Spring Boot process on port `8080`.
- Removed `vcollab-backend`.

Verification steps:

- Next TypeScript passed.
- Next ESLint passed.
- Next Vitest passed: 33 test files, 59 tests.
- Next production build passed and compiled the full `/api/v1` route surface.

Known gaps:

- Live Supabase verification requires real Supabase credentials and migrated data.
- Several legacy side effects are pragmatic compatibility implementations: PDF exports, audit fan-out, notification fan-out, feed ranking, and media relationship hydration should be hardened after live QA.

## Phase 0 Output

Files created/changed:

- `MIGRATION_PLAN.md`

Commands run:

- `Get-ChildItem -Force`
- `rg --files`
- `git status --short`
- `rg` scans for Spring controllers, entities, services, security rules, and Flyway migrations.
- `Get-Content` on security, auth/user controllers, WebSocket/media config, and representative Flyway migrations.

Verification steps:

- Review this plan against the Next route surface in `apps/vcollab-next/app/api/v1`.
- Confirm Phase 4 module order matches product priorities.
- Confirm whether legacy numeric IDs must be preserved externally or can be translated behind compatibility responses.

Known gaps:

- DTO-by-DTO request/response field mapping is not yet exhaustive; it should be produced per module before implementation.
- Full Postgres SQL has not been generated yet; that belongs to Phase 2.
- Supabase RLS policy details are not written yet; they depend on the final auth/profile ID strategy from Phase 3.
- Frontend service-by-service compatibility mapping remains for Phase 6.
