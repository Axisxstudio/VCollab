# VCollab Realtime Social Collaboration Upgrade

## 1. Feature Overview

VCollab should operate as a realtime social collaboration platform where every high-value interaction propagates instantly across the web app, notification center, and active sessions.

### Target outcomes
- Realtime notifications, comments, reactions, saves, shares, requests, chat, warnings, and counters
- Professional social collaboration UX across feed, messaging, moderation, and request flows
- Scalable backend modules with clean ownership and clear event contracts
- Database design that supports denormalized counters, auditability, and future horizontal scaling
- A frontend system that feels immediate, structured, premium, and readable on desktop and mobile

## 2. Product And UX Decisions

### Core product principles
- Every action should acknowledge within 150-300ms through optimistic UI, local state updates, or a visible loading state
- Every server-confirmed event should fan out through websocket delivery so other sessions update without refresh
- Every social object should preserve attribution to the source author and source content
- Every moderation touchpoint should feel serious, clear, and actionable rather than punitive or cluttered

### UX rules applied
- Notifications use a non-blocking toast plus a persistent inbox
- Comments prioritize readability: avatar, username link, timestamp, clean reply indentation
- Messaging follows a messenger-style split layout with fast conversation switching and obvious unread state
- Requests and warnings use strong hierarchy, state chips, and supportive explanatory copy
- Status colors stay restrained: navy/slate foundation, cool blue highlights, amber warnings, red destructive actions, green success confirmations

## 3. Current-State Upgrade Strategy

The current repo already includes:
- Spring Boot feature modules for comments, follows, notifications, conversations, messages, requests, and warnings
- React pages for the main social surfaces
- SockJS/STOMP realtime subscriptions for feed, notifications, and messages

This upgrade extends that baseline in two layers:
- Immediate implementation layer: improved frontend surfaces, realtime popup notifications, richer comments, and follow-first messaging enforcement
- Target-state architecture layer: presence, typing, read/delivery receipts, follow requests, richer notification taxonomy, grouped inboxes, and scalable pub/sub contracts

## 4. Backend Architecture

### Module structure
```text
com.vtechai.vcollab
├─ auth
├─ user
├─ profile
├─ follow
├─ followrequest
├─ feed
├─ post
├─ project
├─ blog
├─ comment
├─ reaction
├─ save
├─ share
├─ notification
├─ conversation
├─ message
├─ presence
├─ warning
├─ moderation
├─ admin
├─ audit
├─ realtime
└─ common
```

### Service responsibilities
- `NotificationService`: persist notification records, create toast-friendly payloads, publish to user channels, handle read state transitions
- `MessagingService`: create conversations, enforce follow-first rule, persist messages, update unread state, publish thread events
- `PresenceService`: maintain online/offline/last_seen, emit presence snapshots and deltas
- `CommentService`: create threaded comments, mentions, reply notifications, pagination, and live thread refresh events
- `ContentInteractionService`: like/save/share toggles, optimistic-safe counter updates, event publication
- `FollowService`: manage direct follows and future follow-request approval flows
- `WarningService`: issue moderation warnings, track acknowledgements, publish alert notifications
- `RealtimeGateway`: websocket session auth, channel routing, reconnect-safe subscriptions, delivery fanout

### Permissions model
- Public users can view landing content only
- Authenticated users can interact with visible content
- Content owners can edit/delete their own content
- Messaging creation requires an authenticated user and an existing follow relationship from initiator to target
- Warning and moderation actions are admin only
- Notification read/delete actions are recipient scoped

## 5. Realtime Event Architecture

### Transport
- Primary: WebSocket via STOMP over SockJS for browser compatibility
- App destination prefix: `/app`
- Broadcast destinations: `/topic/*`
- User destinations: `/user/queue/*`

### Event naming conventions
- Domain events use dot-delimited names: `notification.created`, `comment.created`, `message.created`
- Client channels follow a resource-oriented pattern:
  - `/user/queue/notifications`
  - `/user/queue/messages`
  - `/user/queue/presence`
  - `/topic/feed`
  - `/topic/content.{type}.{id}.comments`
  - `/topic/conversation.{id}.typing`

### Recommended event envelope
```json
{
  "event": "notification.created",
  "version": 1,
  "occurredAt": "2026-03-19T13:10:22Z",
  "actorId": 14,
  "recipientId": 29,
  "entity": {
    "type": "NOTIFICATION",
    "id": 481
  },
  "payload": {}
}
```

### Target realtime flows

#### Notifications
1. User action commits in a service transaction
2. Notification row is inserted
3. Notification payload is published to `/user/queue/notifications`
4. All active user sessions update bell count, inbox list, and toast layer

#### Comments
1. Comment is created with parent or root reference
2. `comment.created` event publishes to content channel
3. Content detail page invalidates comment thread query
4. Denormalized `comment_count` is updated in the same transaction

#### Messaging
1. Conversation membership is validated
2. Message is persisted
3. Conversation updated timestamp advances
4. Recipient unread state is recomputed or incremented
5. `message.created` emits to `/user/queue/messages`
6. `conversation.updated` can emit later for richer list-side updates

#### Presence and typing
1. Client heartbeat updates presence store
2. Presence state publishes to `/user/queue/presence`
3. Typing events stay ephemeral and are never persisted

### Reconnection strategy
- Client reconnect backoff starts at 5s with jitter
- On reconnect, client refetches notifications, conversations, active thread, and content thread queries
- Presence is re-registered on reconnect

### Scalability path
- Current repo can use Spring simple broker during development
- Production recommendation:
  - Redis pub/sub for multi-instance fanout
  - RabbitMQ or Kafka for durable event propagation if growth justifies it
  - Dedicated websocket nodes behind sticky sessions only if necessary

## 6. Database Schema Design

### Core entities

#### `users`
Key fields
- `id`, `email`, `username`, `role`, `is_active`, `is_suspended`, `last_login_at`

Indexes
- unique on `email`
- unique on `username`
- composite on `(is_active, is_suspended, deleted_at)`

#### `follows`
Key fields
- `follower_id`, `following_id`, `created_at`

Indexes
- unique on `(follower_id, following_id)`
- secondary on `following_id`

#### `follow_requests` target state
Key fields
- `requester_id`, `target_user_id`, `status`, `responded_at`

Indexes
- unique on `(requester_id, target_user_id)`
- composite on `(target_user_id, status, created_at desc)`

#### `content` aggregate model
Current repo uses `projects`, `posts`, and `blogs`. Keep that split.

Common important fields
- owner/author reference
- `visibility`
- `is_active`
- `like_count`
- `comment_count`
- `save_count`
- `share_count`

Indexes
- `(visibility, is_active, deleted_at, created_at desc)`
- owner foreign key
- category foreign key

#### `comments`
Key fields
- `id`, `author_id`, `content_type`, `content_id`, `parent_id`, `content`, `created_at`

Indexes
- `(content_type, content_id, created_at)`
- `parent_id`
- `author_id`

Realtime considerations
- Root and reply retrieval should support cursor pagination
- Keep `parent_id` nullable for single-table threaded comments

#### `shares`
Target state fields
- `user_id`, `content_type`, `content_id`, `share_mode`, `share_post_id`, `shared_url`

Why
- Support both in-platform reshares and link sharing without losing attribution

#### `notifications`
Key fields
- `recipient_id`, `actor_id`, `type`, `content_type`, `content_id`, `message`, `is_read`, `read_at`

Recommended target-state additions
- `group_key`
- `navigation_url`
- `priority`
- `image_url`
- `metadata_json`

Indexes
- `(recipient_id, is_read, created_at desc)`
- `(recipient_id, type, created_at desc)`

#### `conversations`
Key fields
- `id`, `created_by`, `updated_at`, `last_message_id`, `last_message_at`

Indexes
- `last_message_at desc`

#### `conversation_participants`
Key fields
- `conversation_id`, `user_id`, `last_read_at`, `last_delivered_at`, `joined_at`

Indexes
- unique `(conversation_id, user_id)`
- `(user_id, updated_at desc)`

#### `messages`
Key fields
- `conversation_id`, `sender_id`, `content`, `attachment_url`, `attachment_type`, `created_at`

Target-state additions
- `client_message_id`
- `delivered_at`
- `read_at`
- `reply_to_message_id`

Indexes
- `(conversation_id, created_at)`
- `(sender_id, created_at desc)`

#### `user_presence` target state
Key fields
- `user_id`, `status`, `last_seen_at`, `last_heartbeat_at`, `active_conversation_id`

Indexes
- unique `user_id`
- `(status, last_seen_at desc)`

#### `warnings`
Key fields
- `target_user_id`, `content_type`, `content_id`, `title`, `message`, `reason`, `status`, `acknowledged_at`

Indexes
- `(target_user_id, status, created_at desc)`

#### `mentions`
Key fields
- `source_type`, `source_id`, `mentioned_user_id`, `created_at`

Indexes
- `(mentioned_user_id, created_at desc)`
- `(source_type, source_id)`

### Counter strategy

#### Recommended approach
- `like_count`, `comment_count`, `share_count`, and `save_count` remain denormalized on `projects`, `posts`, and `blogs`
- Mutations update both the interaction table and parent counter within one transaction
- A nightly reconciliation job re-computes counts to detect drift

#### Why denormalize
- Feed cards render these values frequently
- Count queries on every page view do not scale well on large interaction tables
- Reconciliation provides operational safety without forcing runtime aggregation

## 7. API Structure

### Notifications
```http
GET    /api/v1/notifications?page=0&size=20
GET    /api/v1/notifications/unread-count
PATCH  /api/v1/notifications/{id}/read
PATCH  /api/v1/notifications/read-all
DELETE /api/v1/notifications/{id}
DELETE /api/v1/notifications/clear-all
```

### Comments
```http
GET    /api/v1/comments?contentType=POST&contentId=88&page=0&size=20
POST   /api/v1/comments
PUT    /api/v1/comments/{id}
DELETE /api/v1/comments/{id}
```

### Follows and follow requests
```http
POST   /api/v1/follows
DELETE /api/v1/follows?userId=42
GET    /api/v1/follows/status?userId=42
GET    /api/v1/follows/followers?userId=42
GET    /api/v1/follows/following?userId=42

POST   /api/v1/follow-requests
PATCH  /api/v1/follow-requests/{id}/accept
PATCH  /api/v1/follow-requests/{id}/reject
```

### Conversations and messages
```http
POST   /api/v1/conversations
GET    /api/v1/conversations?page=0&size=50
GET    /api/v1/conversations/{id}
PATCH  /api/v1/conversations/{id}/read

GET    /api/v1/messages/conversations/{conversationId}?page=0&size=50
POST   /api/v1/messages
PATCH  /api/v1/messages/{id}/read
DELETE /api/v1/messages/{id}
```

### Requests and warnings
```http
POST   /api/v1/project-requests
GET    /api/v1/project-requests/sent
GET    /api/v1/project-requests/received
PATCH  /api/v1/project-requests/{id}/status

GET    /api/v1/warnings
PATCH  /api/v1/warnings/{id}/ack
POST   /api/v1/admin/warnings
```

### Sample request payloads

#### Create comment
```json
{
  "contentType": "POST",
  "contentId": 88,
  "content": "This architecture direction looks strong.",
  "parentId": 311
}
```

#### Send message
```json
{
  "conversationId": 12,
  "content": "Can we review the API contract after lunch?"
}
```

#### Update request status
```json
{
  "status": "ACCEPTED"
}
```

## 8. WebSocket Event Examples

### Notification event
```json
{
  "event": "notification.created",
  "id": 481,
  "type": "COMMENT_REPLY",
  "message": "Anita replied to your comment.",
  "contentType": "POST",
  "contentId": 88,
  "createdAt": "2026-03-19T13:10:22Z",
  "actor": {
    "id": 14,
    "username": "anita",
    "fullName": "Anita Perera",
    "profileImage": "/uploads/profile/anita.png"
  }
}
```

### Message event
```json
{
  "event": "message.created",
  "id": 921,
  "conversationId": 12,
  "content": "Can we review the API contract after lunch?",
  "createdAt": "2026-03-19T13:12:08Z",
  "sender": {
    "id": 14,
    "username": "anita",
    "fullName": "Anita Perera",
    "profileImage": "/uploads/profile/anita.png"
  }
}
```

### Comment event
```json
{
  "event": "comment.created",
  "contentType": "POST",
  "contentId": 88,
  "commentId": 311,
  "parentId": null,
  "actorId": 14,
  "createdAt": "2026-03-19T13:14:01Z"
}
```

### Typing event target state
```json
{
  "event": "conversation.typing",
  "conversationId": 12,
  "userId": 14,
  "username": "anita",
  "typing": true,
  "expiresAt": "2026-03-19T13:15:02Z"
}
```

## 9. Frontend Architecture

### Recommended structure
```text
src
├─ components
│  ├─ comments
│  ├─ messaging
│  ├─ notifications
│  ├─ requests
│  ├─ warnings
│  └─ shared
├─ hooks
├─ pages
├─ services
├─ store
├─ styles
└─ websocket
```

### State model
- React Query for server state and cache invalidation
- Zustand for auth and UI shell state
- Local component state for ephemeral inputs like typing, drafts, expanded reply targets, and toast stacks

### Frontend component breakdown
- `NotificationBell`
- `RealtimeNotificationToaster`
- `NotificationCenterGroup`
- `CommentThread`
- `CommentComposer`
- `CommentItem`
- `MessagesSidebar`
- `MessageThread`
- `MessageComposer`
- `RequestSummaryCard`
- `WarningAlertCard`

## 10. UI Theme Guidance

### Theme direction
- Deep navy shell and crisp white or mist-gray surfaces
- Subtle cyan/blue accents for live activity and focus states
- Rounded corners in the 16-24px range for major surfaces
- Layered shadows, never heavy black outlines
- Typography:
  - display/headlines: `Sora`
  - UI/body: `Inter`

### Suggested token set
```css
--bg-shell: #071726;
--bg-canvas: #eef4fb;
--surface-primary: #ffffff;
--surface-secondary: #f4f8fc;
--text-strong: #0f2238;
--text-muted: #62748a;
--accent-primary: #1f6fe5;
--accent-soft: #dcecff;
--accent-cyan: #1bb8d9;
--warning-soft: #fff4dd;
--warning-text: #9a6800;
--danger-soft: #ffe7ea;
--danger-text: #b42338;
```

## 11. Page-By-Page Improvements

### Notification popup and center
- Add compact realtime toast stack
- Group inbox by date and state
- Show actor avatar, readable message, age, and a direct route target

### Content interactions
- Keep counters aligned to live updates
- Use optimistic toggles for like/save/share
- Preserve original attribution in platform shares

### Comment section
- Avatar-led layout
- Smaller clickable username and compact timestamp
- Rich reply preview state
- Responsive indentation and subtle dividers

### Requests page
- Separate incoming and outgoing queues
- Show request owner/requester identity, project reference, status chip, and response timing
- Clear accept/reject actions only when pending

### Messages page
- Messenger-style split layout
- Searchable conversation rail
- Sticky composer
- Realtime-synced thread with clear sender grouping
- Empty state that explains follow-first chat policy

### Warning pages
- Serious but calm moderation styling
- Highlight unacknowledged items
- Provide reference context and acknowledgement action

## 12. Recommended Tech Patterns

- Keep feature modules package-based on both frontend and backend
- Publish user-targeted events after successful transaction commit
- Use denormalized counters with reconciliation jobs
- Prefer cursor pagination for high-volume comments and messages
- Keep typing and presence ephemeral; do not persist everything
- Separate persistent notifications from transient toast presentation
- Adopt structured event payload versions for backward-compatible clients

## 13. Scalability And Performance Notes

- WebSocket simple broker is acceptable for dev and low concurrency; move to Redis-backed broker when deploying multiple backend instances
- Add indexes for recipient unread queries, conversation recent-activity queries, and content-thread traversal
- Keep notification and message payloads compact; client should re-fetch detail only when needed
- Use query invalidation by scope, not full-cache invalidation, to avoid unnecessary refetching
- Reconcile denormalized counts off the hot path
- Add rate limiting for messaging, comments, follows, and notifications to protect abuse-sensitive paths

## 14. Delivery Summary

### Immediate implementation priorities
1. Realtime popup notifications and improved notification center
2. Premium comments, requests, warnings, and messaging UX
3. Follow-first messaging enforcement in backend and profile flows
4. Shared visual language across social collaboration pages

### Next recommended backend milestones
1. Add presence and typing event infrastructure
2. Add follow request workflows where private messaging needs approval
3. Add richer notification types and grouped inbox metadata
4. Add delivery/read receipt fields and websocket events for messages
