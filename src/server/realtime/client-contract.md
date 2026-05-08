# Supabase Realtime Client Contract

This file documents the replacement for Spring STOMP destinations.

| Old STOMP destination | Supabase channel | Event |
|---|---|---|
| `/topic/feed` | `vcollab:feed` | `feed.event` |
| `/user/queue/notifications` | `vcollab:user:{userId}` | `notification.event` |
| `/user/queue/messages` | `vcollab:user:{userId}` | `message.event` |
| `/topic/presence` | `vcollab:presence` | `presence.event` |
| `/topic/conversations/{id}/typing` | `vcollab:conversation:{id}` | `conversation.typing` |
| `/topic/v-hub.feed` | `vcollab:vhub:feed` | `vhub.feed` |
| `/topic/v-hub.thread.{id}` | `vcollab:vhub:thread:{id}` | `vhub.thread` |

Clients should subscribe with Supabase `broadcast` events. Database change subscriptions can be layered later for tables where direct Postgres changes are useful.
