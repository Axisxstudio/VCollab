# Phase 4.3 Messages and Chat Notes

Last updated: 2026-05-07

## Implemented Routes

- `POST /api/v1/conversations`
- `GET /api/v1/conversations`
- `GET /api/v1/conversations/{id}`
- `PATCH /api/v1/conversations/{id}/read`
- `GET /api/v1/messages/conversations/{conversationId}`
- `POST /api/v1/messages`
- `PATCH /api/v1/messages/{id}`
- `PUT /api/v1/messages/{id}`
- `DELETE /api/v1/messages/{id}`

## Compatibility Notes

- Conversation responses match `ConversationResponse.java`.
- Message responses match `MessageResponse.java`.
- Conversation and message lists return Spring Data compatible page metadata.
- Direct conversations are reused when both users already share one.
- Message list marks peer messages delivered.
- Mark-read updates delivered/read timestamps for peer messages and conversation member read state.
- Message update/delete require sender ownership.
- `PUT /api/v1/messages/{id}` is supported as a compatibility adapter because the current frontend calls `PUT`, while Spring exposes `PATCH`.

## Deferred Side Effects

Spring currently publishes STOMP message/status events and creates message notifications. This phase preserves database/API behavior. Supabase Realtime broadcasts, typing events, delivered/read fan-out, and notification side effects should be completed in Phase 5 and the notifications module migration.

## Tests

Added coverage for:

- Message and conversation schemas.
- Message response mapping.
- Missing bearer token behavior for conversation list and message send.

## Known Gaps

- Live Supabase message/conversation verification was not run in this environment.
- Presence in participant summaries is returned as offline/null until the Supabase Realtime presence replacement is implemented.
- Realtime events and message notifications are deferred.
