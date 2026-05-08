# Phase 7 Backend Cutover Notes

Last updated: 2026-05-07

## Completed

- Added compatibility route handlers for the remaining backend surface: comments, interactions, follows, feed, notifications, reports, warnings, admin utilities, tags, targeting, and media upload.
- Switched Docker Compose from the deleted Spring/MySQL backend to `apps/vcollab-next`.
- Switched frontend nginx and Vite proxy targets from `localhost:8080` / `backend:8080` to the Next API.
- Removed `vcollab-backend`.
- Removed the old Spring launcher script.

## Runtime

- Next API: `apps/vcollab-next`
- Frontend: `vcollab-frontend`
- Database/auth/storage/realtime: Supabase

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_PASSWORD_RESET_REDIRECT_URL=
```

## Caveats

- PDF export returns a minimal generated PDF response placeholder.
- Feed aggregation is a simple recent public content merge.
- Audit log creation is not emitted for every mutation.
- Notification fan-out is not automatically generated for every interaction.
- Media relationship arrays are still lightweight placeholders in content DTOs.
- Live Supabase verification still needs real project credentials and migrated data.
