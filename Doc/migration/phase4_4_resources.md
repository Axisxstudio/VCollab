# Phase 4.4 Resources Notes

Last updated: 2026-05-07

## Implemented Routes

Public:

- `GET /api/v1/resources/public/overview`
- `GET /api/v1/resources/public/categories`
- `GET /api/v1/resources/public/institutions`
- `GET /api/v1/resources/public/institutions/{id}/years`
- `GET /api/v1/resources/public/years/{id}/semesters`
- `GET /api/v1/resources/public/explorer`
- `GET /api/v1/resources/public/search`
- `GET /api/v1/resources/public/files/{id}/preview`
- `GET /api/v1/resources/public/files/{id}/download`

Owner:

- `GET /api/v1/resources/mine/dashboard`
- `GET /api/v1/resources/mine/explorer`
- `POST /api/v1/resources/folders/ensure-path`
- `POST /api/v1/resources/folders`
- `PATCH /api/v1/resources/folders/{id}`
- `DELETE /api/v1/resources/folders/{id}`
- `POST /api/v1/resources/files/upload`
- `PATCH /api/v1/resources/files/{id}`
- `PUT /api/v1/resources/files/{id}/replace`
- `DELETE /api/v1/resources/files/{id}`

Admin:

- `GET /api/v1/admin/resources`
- `PATCH /api/v1/admin/resources/{id}/moderation`
- `DELETE /api/v1/admin/resources/{id}`
- `PATCH /api/v1/admin/resources/{id}/restore`
- `GET /api/v1/admin/resources/structure`
- `POST /api/v1/admin/resources/structure`
- `PATCH /api/v1/admin/resources/structure/{id}`
- `GET /api/v1/admin/resources/categories`
- `POST /api/v1/admin/resources/categories`
- `PATCH /api/v1/admin/resources/categories/{id}`

## Compatibility Notes

- DTO field names match the Spring resource responses used by the frontend.
- Public search returns Spring Data compatible page metadata.
- Upload/replace uses the Supabase `academic-resources` bucket and stores signed URL/path metadata.
- Owner routes enforce authenticated ownership checks.
- Admin routes use `requireSuperAdmin`.

## Known Gaps

- Live Supabase storage and query verification was not run in this environment.
- Overview ranking lists are present but not fully ranked yet: popular institutions, trending categories, and top contributors return empty arrays until aggregation queries are tuned.
- Admin structure listing currently reuses public folder listing behavior and should be refined against real admin UI expectations.
- Signed URL lifetime is currently one hour and should be finalized in Phase 5.
