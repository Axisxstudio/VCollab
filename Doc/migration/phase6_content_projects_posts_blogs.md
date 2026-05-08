# Phase 6 Content Projects, Posts, and Blogs Notes

Last updated: 2026-05-07

## Implemented Routes

- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/{id}`
- `PUT /api/v1/projects/{id}`
- `DELETE /api/v1/projects/{id}`
- `GET /api/v1/projects/user/{username}`
- `GET /api/v1/posts`
- `POST /api/v1/posts`
- `GET /api/v1/posts/{id}`
- `PUT /api/v1/posts/{id}`
- `DELETE /api/v1/posts/{id}`
- `GET /api/v1/posts/user/{username}`
- `GET /api/v1/blogs`
- `POST /api/v1/blogs`
- `GET /api/v1/blogs/{id}`
- `PUT /api/v1/blogs/{id}`
- `DELETE /api/v1/blogs/{id}`
- `GET /api/v1/blogs/user/{username}`
- `GET /api/v1/admin/projects`
- `PATCH /api/v1/admin/projects/{id}/moderation`
- `DELETE /api/v1/admin/projects/{id}`
- `PATCH /api/v1/admin/projects/{id}/restore`
- `GET /api/v1/admin/posts`
- `PATCH /api/v1/admin/posts/{id}/moderation`
- `DELETE /api/v1/admin/posts/{id}`
- `PATCH /api/v1/admin/posts/{id}/restore`
- `GET /api/v1/admin/blogs`
- `PATCH /api/v1/admin/blogs/{id}/moderation`
- `DELETE /api/v1/admin/blogs/{id}`
- `PATCH /api/v1/admin/blogs/{id}/restore`

## Compatibility Notes

- Public list endpoints preserve Spring-style page responses and support `search`, `categoryId`, `tag`, `owner`, `fromDate`, `toDate`, `sort`, `page`, and `size`.
- Detail endpoints allow private/inactive content only to the owner or `SUPER_ADMIN`.
- Create/update/delete endpoints require authentication and enforce owner or admin permissions.
- Admin list/moderation/delete/restore endpoints require `SUPER_ADMIN`.
- Project/post/blog responses preserve the Spring DTO field names in camelCase.
- Admin summaries preserve `AdminContentSummaryResponse` fields.
- List-style fields (`tags`, `techStack`) remain JSON strings in Postgres and are mapped back to arrays for the API.

## Tests

Added coverage for:

- Shared content mapper behavior.
- JSON and CSV list parsing fallback.
- Admin summary mapping.
- Missing bearer token behavior for admin project listing.

## Known Gaps

- Live Supabase verification was not run in this environment.
- Media arrays are placeholders until media upload/relationship handling is fully ported.
- Feed, notification, audit log, targeting, comments, and interaction side effects are still deferred.
- Slugs include a random suffix for uniqueness rather than reproducing all legacy collision behavior.
