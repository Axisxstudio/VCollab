# Phase 4.2 Search and Project Requests Notes

Last updated: 2026-05-07

## Implemented Routes

- `GET /api/v1/search`
- `POST /api/v1/project-requests`
- `GET /api/v1/project-requests/sent`
- `GET /api/v1/project-requests/received`
- `PATCH /api/v1/project-requests/{id}/status`

## Compatibility Notes

- Search keeps the Spring response shape: `query`, `requestedSize`, `stats`, `users`, `projects`, `posts`, `blogs`.
- Search size is normalized to Spring behavior: default `4`, max `8`.
- Blank search returns empty arrays and zero counts.
- Project request responses match `ProjectRequestResponse.java`.
- Project request create blocks duplicate requests and self-requests.
- Project request status updates are restricted to the project owner.

## Deferred Side Effects

The Spring service publishes feed events and notifications when project requests are created or updated. The migrated route currently preserves CRUD and response behavior. Notification/feed side effects should be restored when the notifications/feed modules move to Next/Supabase Realtime.

## Tests

Added coverage for:

- Search schema defaults.
- Project request create/status validation.
- Project request response mapping.
- Missing bearer token behavior for project request lists.

## Known Gaps

- Live Supabase query verification was not run in this environment.
- Search currently uses `ilike` queries. Add full-text/trigram ranking once real data is available.
- Project request notification/feed side effects are documented but not yet ported.
