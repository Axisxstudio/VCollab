# Phase 3 Auth Notes

Last updated: 2026-05-07

## Implemented Routes

The Next app now exposes Spring-compatible auth endpoints:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/check-username`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

Responses keep the existing envelope:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "supabase-access-token",
    "user": {
      "id": 1,
      "username": "student",
      "email": "student@example.com",
      "role": "STUDENT",
      "fullName": "Student User",
      "profileImage": null,
      "educationType": null
    }
  },
  "timestamp": "2026-05-07T00:00:00.000Z"
}
```

## Compatibility Choices

- The old `token` field now carries the Supabase access token.
- Login accepts `identifier`, `email`, or `username` like the Spring DTO aliases.
- Super-admin self-registration remains blocked.
- User responses match `UserResponse.java` fields.
- `GET /auth/me` uses the `Authorization: Bearer <token>` header expected by the existing Axios interceptor.

## Server Utilities

- `src/server/auth/schemas.ts`: zod validation.
- `src/server/auth/service.ts`: Supabase Auth and app-user compatibility logic.
- `src/server/auth/guards.ts`: `requireUser`, `requireRole`, `requireSuperAdmin`.
- `src/server/http/errors.ts`: Spring-like status mapping.
- `src/server/http/route.ts`: shared route response wrapper.

## Environment

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `NEXT_PUBLIC_PASSWORD_RESET_REDIRECT_URL`
- `JWT_SECRET` only if a temporary legacy JWT bridge is later required.

## Tests

Added Vitest coverage for:

- Login aliases.
- Super-admin registration rejection.
- User response mapping.
- Bearer token extraction.
- HTTP error status helpers.
- Route-level invalid registration and missing-auth behavior.

## Known Gaps

- Live register/login/reset flows were not verified against a real Supabase project in this environment.
- Password reset assumes Supabase recovery-token flow; the existing Spring one-time reset token behavior is not preserved as a custom table flow.
- Frontend is not yet switched to the Next auth routes; that belongs to Phase 6 unless an earlier compatibility adapter is requested.
