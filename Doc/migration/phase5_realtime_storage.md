# Phase 5 Realtime and Storage Notes

Last updated: 2026-05-07

## Realtime Replacement

Spring STOMP destinations are mapped to Supabase broadcast channels:

| Spring STOMP | Supabase channel | Event |
|---|---|---|
| `/topic/feed` | `vcollab:feed` | `feed.event` |
| `/user/queue/notifications` | `vcollab:user:{userId}` | `notification.event` |
| `/user/queue/messages` | `vcollab:user:{userId}` | `message.event` |
| `/topic/presence` | `vcollab:presence` | `presence.event` |
| `/topic/conversations/{id}/typing` | `vcollab:conversation:{id}` | `conversation.typing` |
| `/topic/v-hub.feed` | `vcollab:vhub:feed` | `vhub.feed` |
| `/topic/v-hub.thread.{id}` | `vcollab:vhub:thread:{id}` | `vhub.thread` |

Implemented helpers:

- `src/server/realtime/channels.ts`
- `src/server/realtime/publisher.ts`
- `src/server/realtime/client-contract.md`

Message and VHub mutations now publish Supabase broadcast events from the Next API layer.

## Storage Strategy

Buckets were created in Phase 2:

- `profile-media`
- `content-media`
- `message-attachments`
- `academic-resources`

Phase 5 adds:

- `POST /api/v1/storage/signed-url`
- `src/server/storage/signed-url.ts`
- `src/server/storage/schemas.ts`

Private object access should use short-lived signed URLs. Resource uploads now store the object path in `resource_files.public_url` instead of storing a temporary signed URL.

## Client Migration Guidance

Frontend STOMP clients should be replaced with Supabase subscriptions:

```js
supabase
  .channel("vcollab:conversation:123")
  .on("broadcast", { event: "message.event" }, (payload) => {
    // invalidate messages/conversations
  })
  .subscribe();
```

Typing indicators should broadcast on `vcollab:conversation:{id}` with event `conversation.typing`.

## Known Gaps

- Supabase Realtime was not tested against a live Supabase project in this environment.
- Frontend websocket clients are not switched yet; that belongs to Phase 6.
- Presence publishing is scaffolded but not fully wired into frontend session lifecycle.
- Notification/feed modules still need full Next API migration for complete side effects.
- Storage policies should be tested and tightened in Supabase after live verification.
