# Phase 6 Frontend Cutover Notes

Last updated: 2026-05-07

## Current Cutover Path

- Run the migrated Next API from `apps/vcollab-next` on `http://localhost:3000`.
- Run the existing Vite frontend from `vcollab-frontend`.
- Vite development now defaults API requests to `http://localhost:3000/api/v1`.
- Production keeps same-origin `/api/v1` behavior unless `VITE_NEXT_API_URL` is provided.
- Supabase Realtime clients read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Migrated Frontend Services Already Pointing At Next-Compatible Routes

- `auth.service.js`
- `profile.service.js`
- `search.service.js`
- `projectrequest.service.js`
- `conversation.service.js`
- `message.service.js`
- `resource.service.js`
- `vhub.service.js`

These services use the shared Axios client, so they inherit `VITE_NEXT_API_URL` and the Spring-compatible `/api/v1` response envelope.

## Environment

Use `vcollab-frontend/.env.example` as the Vite frontend template.

For local Next/Supabase migration testing:

```env
VITE_NEXT_API_URL=http://localhost:3000/api/v1
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Keep `VITE_API_URL` and `VITE_WS_URL` only while unmigrated Spring modules still need fallback access.

## Remaining Work

- Replace remaining STOMP websocket hooks with Supabase Realtime hooks.
- Port remaining Spring content/admin modules before routing all services to Next permanently:
  `projects`, `posts`, `blogs`, `comments`, `likes`, `saves`, `shares`, `follows`, `feed`, `notifications`, `reports`, `warnings`, `landing`, `cms`, `categories`, and broad admin dashboards.
- Add an explicit fallback strategy if the old Spring API must continue serving unmigrated modules during staged deployment.
- Run browser smoke tests against a live Supabase project.
