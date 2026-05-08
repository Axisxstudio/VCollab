# Phase 4.1 Users/Auth Profile Notes

Last updated: 2026-05-07

## Implemented Routes

- `GET /api/v1/users/discover`
- `GET /api/v1/users/{username}`
- `GET /api/v1/users/me/profile`
- `PATCH /api/v1/users/me/profile`
- `POST /api/v1/users/me/profile-image`
- `POST /api/v1/users/me/cover-image`

## Compatibility Notes

- Public discovery returns a Spring Data compatible page shape.
- Public profile response excludes private `email` and `dob` fields, matching `PublicProfileResponse.java`.
- My profile response includes `email` and `dob`, matching `UserProfileResponse.java`.
- Profile updates preserve partial update semantics: omitted fields are ignored, explicit `null` values are written.
- `skills` remains stored as serialized JSON text to match the legacy schema.
- Profile and cover uploads write to the Supabase `profile-media` bucket and store public URLs in `user_profiles`.

## Route Mapping

| Spring endpoint | Next endpoint |
|---|---|
| `GET /api/v1/users/discover` | `GET /api/v1/users/discover` |
| `GET /api/v1/users/{username}` | `GET /api/v1/users/{username}` |
| `GET /api/v1/users/me/profile` | `GET /api/v1/users/me/profile` |
| `PATCH /api/v1/users/me/profile` | `PATCH /api/v1/users/me/profile` |
| `POST /api/v1/users/me/profile-image` | `POST /api/v1/users/me/profile-image` |
| `POST /api/v1/users/me/cover-image` | `POST /api/v1/users/me/cover-image` |

## Tests

Added coverage for:

- Profile response mapping.
- Spring-style serialized skills parsing.
- Spring Data page metadata compatibility.
- Missing bearer token behavior for `GET /users/me/profile`.

## Known Gaps

- Live Supabase reads/writes/uploads were not run in this environment.
- Search across joined `user_profiles.full_name` may need query tuning once tested against Supabase with real data.
- Storage policies are starter policies from Phase 2 and should be hardened in Phase 5.
