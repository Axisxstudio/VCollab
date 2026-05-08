# Phase 4.5 VHub Notes

Last updated: 2026-05-07

## Implemented Routes

Public/user:

- `GET /api/v1/v-hub/settings`
- `GET /api/v1/v-hub/threads`
- `POST /api/v1/v-hub/threads`
- `GET /api/v1/v-hub/threads/{id}`
- `DELETE /api/v1/v-hub/threads/{id}`
- `GET /api/v1/v-hub/threads/{id}/replies`
- `POST /api/v1/v-hub/threads/{id}/replies`
- `PATCH /api/v1/v-hub/threads/{id}/solve`
- `PATCH /api/v1/v-hub/threads/{id}/reopen`
- `DELETE /api/v1/v-hub/threads/replies/{replyId}`

Admin:

- `GET /api/v1/admin/v-hub/settings`
- `PATCH /api/v1/admin/v-hub/settings`
- `GET /api/v1/admin/v-hub/threads`
- `GET /api/v1/admin/v-hub/summary`
- `PATCH /api/v1/admin/v-hub/threads/{id}/lock`
- `PATCH /api/v1/admin/v-hub/threads/{id}/hide`
- `PATCH /api/v1/admin/v-hub/replies/{id}/hide`

## Compatibility Notes

- Thread, reply, author, settings, and summary fields match the Spring DTO names.
- Public listing hides hidden threads/replies.
- Admin listing can filter hidden/locked/type/status/search.
- Authenticated and guest thread/reply creation are supported.
- Owner or super-admin can solve/reopen/delete.
- Super-admin can lock/hide threads and hide replies.

## Deferred Side Effects

The Spring implementation publishes VHub realtime events. This phase preserves API/database behavior; Supabase Realtime channel publishing belongs to Phase 5.

## Known Gaps

- Live Supabase verification was not run in this environment.
- Rate limiting from settings is not enforced yet.
- VHub realtime notifications/feed updates are deferred to Phase 5.
