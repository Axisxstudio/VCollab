# Phase 6 Landing, CMS, and Categories Notes

Last updated: 2026-05-07

## Implemented Routes

- `GET /api/v1/landing/overview`
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `GET /api/v1/admin/categories`
- `PATCH /api/v1/admin/categories/{id}`
- `PATCH /api/v1/admin/categories/{id}/toggle`
- `GET /api/v1/admin/cms-blocks`
- `POST /api/v1/admin/cms-blocks`
- `PATCH /api/v1/admin/cms-blocks/{id}`

## Compatibility Notes

- Category responses preserve the Spring fields: `id`, `name`, `slug`, `type`, `systemDefault`, and `active`.
- Public category listing filters to active, non-deleted categories and includes `ALL` categories when a `type` filter is provided.
- Admin category and CMS block routes require `SUPER_ADMIN`.
- CMS block request fields and response fields preserve Spring naming: `sectionKey`, `displayOrder`, and `publicVisible`.
- Landing overview preserves the Spring top-level shape: `stats`, `featuredProject`, `featuredProjects`, `latestPosts`, `latestBlogs`, `featuredContributors`, and CMS block groups.
- Landing project/post/blog cards are mapped to camelCase DTO shapes; media arrays are currently empty until those full content modules are migrated.

## Tests

Added coverage for:

- Category response mapping and slug generation.
- CMS block response mapping and normalization helpers.
- Landing public project mapping.
- Missing bearer token behavior for admin CMS listing.

## Known Gaps

- Live Supabase verification was not run in this environment.
- Landing content depends on partially migrated `projects`, `posts`, and `blogs` tables. Full CRUD/admin moderation for those modules is still pending.
- Landing media arrays are placeholders until project/post/blog media services move fully to Next.
- Audit log side effects for category/CMS admin mutations are not restored yet.
