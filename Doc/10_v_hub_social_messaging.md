# VCollab - V Hub Social Messaging MVP

## 1. Product Summary

`V Hub` is a public community messaging layer for VCollab where any visitor on the landing side can post a help request, question, or discussion thread, and anyone else can reply.

This feature should not be built on top of the existing private conversation system. The current `conversations` and `messages` modules are member-scoped and designed for direct messaging. `V Hub` is a discovery-first, community-visible, thread-and-reply system.

The `V` button is the launcher for this feature on the public landing experience, not inside the signed-in workspace shell.

## 2. Core Product Decisions

### Decision 1: Keep V Hub separate from private chat
- Keep private chat in the existing `conversation` and `message` modules.
- Build `V Hub` as new `thread` and `reply` modules.
- Allow users to move from a public reply into private chat by reusing the existing conversation API.

### Decision 2: "Anyone" means any public visitor
- Guests can create threads and replies in MVP.
- Signed-in members can also participate, but the feature belongs to the public landing-side experience.
- Admin still controls visibility and moderation.

### Decision 3: Admin can fully control availability
- `DISABLED`: visitors do not see the `V` launcher and create/reply APIs reject requests.
- `READ_ONLY`: visitors can browse existing threads, but create/reply/solve actions are blocked.
- `ENABLED`: full access.

### Decision 4: Keep MVP flat and reliable
- MVP uses top-level replies only.
- Reserve `parent_reply_id` in the schema so nested replies can be added later without a breaking migration.
- Attachments can be phase 2 unless product priority changes.

## 3. Existing Integration Points In This Repo

The implementation should plug into these existing files and patterns:

- Backend realtime transport: `vcollab-backend/src/main/java/com/vtechai/vcollab/config/WebSocketConfig.java`
- Existing private chat: `vcollab-backend/src/main/java/com/vtechai/vcollab/conversation/ConversationController.java`
- Existing private messages: `vcollab-backend/src/main/java/com/vtechai/vcollab/message/MessageController.java`
- Existing notification delivery: `vcollab-backend/src/main/java/com/vtechai/vcollab/notification/NotificationServiceImpl.java`
- Existing enums to extend:
  - `vcollab-backend/src/main/java/com/vtechai/vcollab/enums/NotificationType.java`
  - `vcollab-backend/src/main/java/com/vtechai/vcollab/enums/ContentType.java`
- Existing frontend route registry: `vcollab-frontend/src/config/routes.js`
- Existing public shell where the `V` launcher belongs: `vcollab-frontend/src/layouts/PublicLayout.jsx`
- Existing admin service pattern: `vcollab-frontend/src/services/admin.service.js`
- Existing websocket client patterns:
  - `vcollab-frontend/src/websocket/notificationClient.js`
  - `vcollab-frontend/src/websocket/feedClient.js`
  - `vcollab-frontend/src/websocket/useMessageUpdates.js`

## 4. MVP Scope

### User capabilities
- Open `V Hub` from a floating `V` launcher on the public landing-side layout.
- Browse active threads ordered by latest activity.
- Filter by `Help`, `Question`, `Discussion`, and `Solved`.
- Create a new thread with title, body, type, and tags without requiring name or email when not signed in.
- Open a thread detail view and post replies.
- Post replies as a public visitor or signed-in member.
- Mark a thread as solved when the actor has ownership or admin rights.
- Mark one reply as the best answer.

### Admin capabilities
- Set feature mode to `DISABLED`, `READ_ONLY`, or `ENABLED`.
- Hide and unhide threads.
- Lock and unlock threads.
- Remove replies by soft-delete or hide.
- View core metrics such as total threads, open threads, solved threads, and reply volume.

### Not in MVP
- File attachments
- Thread reactions
- Nested reply trees in the UI
- Ranking, reputation, or badges
- AI moderation

## 5. Backend Data Model

### 5.1 Migration file

Add:

- `vcollab-backend/src/main/resources/db/migration/V8__add_v_hub_social_messaging.sql`

### 5.2 New tables

#### `platform_feature_settings`

Purpose:
- Central place for platform-level feature availability.
- `V Hub` will use `feature_key = 'V_HUB'`.

Recommended columns:

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | Auto increment |
| `feature_key` | VARCHAR(100) | Unique, ex: `V_HUB` |
| `mode` | VARCHAR(50) | `DISABLED`, `READ_ONLY`, `ENABLED` |
| `config_json` | LONGTEXT | JSON string for optional settings |
| `created_at` | DATETIME(6) | Required |
| `updated_at` | DATETIME(6) | Nullable |

Recommended constraints and indexes:
- unique key on `feature_key`

Example `config_json`:

```json
{
  "allowGuestView": true,
  "allowAttachments": false,
  "maxTitleLength": 140,
  "maxBodyLength": 5000,
  "rateLimitPerHour": 10
}
```

#### `v_hub_threads`

Purpose:
- Stores top-level community posts.

Recommended columns:

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | Auto increment |
| `author_id` | BIGINT | FK to `users.id` |
| `title` | VARCHAR(180) | Required |
| `body` | LONGTEXT | Required |
| `thread_type` | VARCHAR(50) | `HELP`, `QUESTION`, `DISCUSSION` |
| `status` | VARCHAR(50) | `OPEN`, `SOLVED` |
| `tags` | TEXT | JSON array string or comma-safe serialization |
| `is_locked` | BOOLEAN | Default false |
| `is_hidden` | BOOLEAN | Default false |
| `best_reply_id` | BIGINT | Nullable FK set after reply creation |
| `reply_count` | INT | Default 0 |
| `participant_count` | INT | Default 1 |
| `view_count` | INT | Default 0 |
| `last_activity_at` | DATETIME(6) | Required |
| `created_at` | DATETIME(6) | Required |
| `updated_at` | DATETIME(6) | Nullable |
| `deleted_at` | DATETIME(6) | Nullable |
| `deleted_by` | BIGINT | Nullable |

Recommended indexes:
- `idx_v_hub_threads_author (author_id)`
- `idx_v_hub_threads_type_status (thread_type, status, is_hidden)`
- `idx_v_hub_threads_last_activity (last_activity_at)`
- `idx_v_hub_threads_deleted_at (deleted_at)`

#### `v_hub_replies`

Purpose:
- Stores thread replies.

Recommended columns:

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | Auto increment |
| `thread_id` | BIGINT | FK to `v_hub_threads.id` |
| `author_id` | BIGINT | FK to `users.id` |
| `parent_reply_id` | BIGINT | Nullable, reserved for future nested replies |
| `body` | TEXT | Required |
| `is_best_answer` | BOOLEAN | Default false |
| `is_hidden` | BOOLEAN | Default false |
| `created_at` | DATETIME(6) | Required |
| `updated_at` | DATETIME(6) | Nullable |
| `deleted_at` | DATETIME(6) | Nullable |
| `deleted_by` | BIGINT | Nullable |

Recommended indexes:
- `idx_v_hub_replies_thread_created (thread_id, created_at)`
- `idx_v_hub_replies_author (author_id)`
- `idx_v_hub_replies_parent (parent_reply_id)`
- `idx_v_hub_replies_deleted_at (deleted_at)`

#### `v_hub_thread_participants`

Purpose:
- Tracks users who should receive participant notifications.
- Supports unread state and future mute/watch features.

Recommended columns:

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | Auto increment |
| `thread_id` | BIGINT | FK to `v_hub_threads.id` |
| `user_id` | BIGINT | FK to `users.id` |
| `last_read_at` | DATETIME(6) | Nullable |
| `created_at` | DATETIME(6) | Required |
| `updated_at` | DATETIME(6) | Nullable |

Recommended constraints and indexes:
- unique key on `(thread_id, user_id)`
- `idx_v_hub_participants_user (user_id, updated_at)`

### 5.3 Existing tables to reuse

#### `reports`
- Reuse the current generic `reports` table.
- Extend `ContentType` so users can report `V_HUB_THREAD` and `V_HUB_REPLY`.

#### `warnings`
- Reuse warnings for moderation escalation if required.

#### `notifications`
- Reuse the existing notification infrastructure.

### 5.4 Enum additions

Add to `ContentType.java`:

```java
V_HUB_THREAD,
V_HUB_REPLY
```

Add to `NotificationType.java`:

```java
V_HUB_THREAD_REPLY,
V_HUB_THREAD_MENTION,
V_HUB_THREAD_SOLVED,
V_HUB_BEST_ANSWER,
V_HUB_ADMIN_ACTION
```

Add new enums in a new `vhub` package:
- `VHubFeatureMode`
- `VHubThreadType`
- `VHubThreadStatus`

Recommended enum values:

```java
public enum VHubFeatureMode {
    DISABLED,
    READ_ONLY,
    ENABLED
}
```

```java
public enum VHubThreadType {
    HELP,
    QUESTION,
    DISCUSSION
}
```

```java
public enum VHubThreadStatus {
    OPEN,
    SOLVED
}
```

## 6. Backend Module Layout

Create a new package:

```text
vcollab-backend/src/main/java/com/vtechai/vcollab/vhub/
```

Recommended structure:

```text
vhub/
  VHubThreadController.java
  VHubReplyController.java
  VHubAdminController.java
  VHubSettingsController.java
  VHubService.java
  VHubServiceImpl.java
  VHubSettingsService.java
  VHubNotificationHelper.java
  dto/
    VHubThreadCreateRequest.java
    VHubThreadUpdateRequest.java
    VHubReplyCreateRequest.java
    VHubThreadResponse.java
    VHubReplyResponse.java
    VHubFeatureSettingsResponse.java
    VHubFeatureSettingsUpdateRequest.java
    VHubAdminThreadActionRequest.java
  entity/
    VHubThread.java
    VHubReply.java
    VHubThreadParticipant.java
    PlatformFeatureSetting.java
  repository/
    VHubThreadRepository.java
    VHubReplyRepository.java
    VHubThreadParticipantRepository.java
    PlatformFeatureSettingRepository.java
```

## 7. REST API Contract

Base path:

- `/api/v1/v-hub`

All endpoints should return the existing `ApiResponse<T>` envelope.

### 7.1 Feature settings for authenticated users

#### `GET /api/v1/v-hub/settings`

Purpose:
- Lets the frontend decide whether to show the launcher, show read-only mode, or block actions.

Response:

```json
{
  "featureKey": "V_HUB",
  "mode": "ENABLED",
  "allowAttachments": false,
  "allowGuestView": false,
  "maxTitleLength": 180,
  "maxBodyLength": 5000
}
```

### 7.2 Thread list

#### `GET /api/v1/v-hub/threads`

Query params:
- `page`
- `size`
- `sort=lastActivityAt,desc`
- `type=HELP|QUESTION|DISCUSSION`
- `status=OPEN|SOLVED`
- `mine=true|false`
- `q=<search text>`

Behavior:
- Exclude hidden and soft-deleted threads for normal users.
- In `READ_ONLY`, listing still works.

Response item shape:

```json
{
  "id": 42,
  "title": "Need help with Spring WebSocket auth",
  "bodyPreview": "I can connect locally but not after deployment...",
  "threadType": "HELP",
  "status": "OPEN",
  "tags": ["spring", "websocket"],
  "locked": false,
  "hidden": false,
  "replyCount": 6,
  "participantCount": 4,
  "viewCount": 28,
  "lastActivityAt": "2026-03-24T10:15:00Z",
  "createdAt": "2026-03-24T09:30:00Z",
  "author": {
    "id": 7,
    "username": "vtn02",
    "fullName": "VTN",
    "profileImage": null
  },
  "bestReplyId": 91,
  "currentUserCanReply": true,
  "currentUserCanModerate": false
}
```

### 7.3 Create thread

#### `POST /api/v1/v-hub/threads`

Rules:
- Auth required.
- Reject when feature mode is `DISABLED` or `READ_ONLY`.

Request:

```json
{
  "title": "Need help centering a mobile login card",
  "body": "The auth card looks offset on smaller screens. What is the cleanest fix?",
  "threadType": "HELP",
  "tags": ["css", "mobile", "auth"]
}
```

Success response:
- Returns full `VHubThreadResponse`.

### 7.4 Get thread detail

#### `GET /api/v1/v-hub/threads/{id}`

Behavior:
- Increments `view_count`.
- Returns thread summary and paginated replies.

Response:

```json
{
  "thread": {
    "id": 42,
    "title": "Need help with Spring WebSocket auth",
    "body": "Detailed thread body...",
    "threadType": "HELP",
    "status": "OPEN",
    "tags": ["spring", "websocket"],
    "locked": false,
    "bestReplyId": 91,
    "replyCount": 6,
    "participantCount": 4,
    "viewCount": 28,
    "lastActivityAt": "2026-03-24T10:15:00Z",
    "createdAt": "2026-03-24T09:30:00Z",
    "author": {
      "id": 7,
      "username": "vtn02",
      "fullName": "VTN",
      "profileImage": null
    }
  },
  "replies": {
    "content": [
      {
        "id": 91,
        "threadId": 42,
        "body": "Use the same token handshake interceptor pattern as notifications.",
        "isBestAnswer": true,
        "createdAt": "2026-03-24T09:45:00Z",
        "author": {
          "id": 11,
          "username": "alex",
          "fullName": "Alex"
        }
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 6
  }
}
```

### 7.5 Create reply

#### `POST /api/v1/v-hub/threads/{id}/replies`

Rules:
- Auth required.
- Reject when feature mode is `DISABLED` or `READ_ONLY`.
- Reject when thread is hidden, deleted, or locked for normal users.

Request:

```json
{
  "body": "I would move the centering rule into the shared auth layout and use safe center."
}
```

### 7.6 Mark solved

#### `PATCH /api/v1/v-hub/threads/{id}/solve`

Rules:
- Allowed for thread author or `SUPER_ADMIN`.

Request:

```json
{
  "bestReplyId": 91,
  "status": "SOLVED"
}
```

Behavior:
- Updates `status = SOLVED`
- Sets `best_reply_id`
- Marks matching reply as `is_best_answer = true`
- Sends a notification to the reply author

### 7.7 Reopen thread

#### `PATCH /api/v1/v-hub/threads/{id}/reopen`

Rules:
- Allowed for thread author or `SUPER_ADMIN`.

Behavior:
- Sets `status = OPEN`
- Clears `best_reply_id`
- Clears previous `is_best_answer`

### 7.8 Delete own thread or reply

#### `DELETE /api/v1/v-hub/threads/{id}`
#### `DELETE /api/v1/v-hub/replies/{id}`

Rules:
- Allowed for content owner or `SUPER_ADMIN`.
- Use soft-delete only.

## 8. Admin API Contract

Base path:

- `/api/v1/admin/v-hub`

### 8.1 Get feature settings

#### `GET /api/v1/admin/v-hub/settings`

Response:

```json
{
  "featureKey": "V_HUB",
  "mode": "ENABLED",
  "config": {
    "allowGuestView": false,
    "allowAttachments": false,
    "maxTitleLength": 180,
    "maxBodyLength": 5000,
    "rateLimitPerHour": 10
  }
}
```

### 8.2 Update feature settings

#### `PATCH /api/v1/admin/v-hub/settings`

Request:

```json
{
  "mode": "READ_ONLY",
  "config": {
    "allowGuestView": false,
    "allowAttachments": false,
    "maxTitleLength": 180,
    "maxBodyLength": 5000,
    "rateLimitPerHour": 10
  }
}
```

Behavior:
- Persists mode change.
- Writes an admin audit log.

### 8.3 Moderate threads

#### `GET /api/v1/admin/v-hub/threads`

Purpose:
- Admin moderation list, including hidden threads.

#### `PATCH /api/v1/admin/v-hub/threads/{id}/lock`

Request:

```json
{
  "locked": true,
  "note": "Temporary moderation lock while reviewed"
}
```

#### `PATCH /api/v1/admin/v-hub/threads/{id}/hide`

Request:

```json
{
  "hidden": true,
  "note": "Hidden for policy review"
}
```

### 8.4 Moderate replies

#### `PATCH /api/v1/admin/v-hub/replies/{id}/hide`

Request:

```json
{
  "hidden": true,
  "note": "Removed for abuse"
}
```

### 8.5 Dashboard summary

#### `GET /api/v1/admin/v-hub/summary`

Response:

```json
{
  "mode": "ENABLED",
  "threadCount": 120,
  "openThreadCount": 73,
  "solvedThreadCount": 47,
  "replyCount": 688,
  "hiddenThreadCount": 3,
  "lockedThreadCount": 4
}
```

## 9. Service Rules And Validation

### Feature guard
- Centralize mode validation in `VHubSettingsService`.
- All mutating endpoints must call the guard before proceeding.

### Permissions
- Normal users can create threads and replies only when feature mode is `ENABLED`.
- Normal users can edit or delete only their own threads and replies.
- Thread author or `SUPER_ADMIN` can mark solved and reopen.
- `SUPER_ADMIN` can lock, hide, delete, and switch feature mode.

### Counter updates
- On thread create:
  - create author participant record
  - set `participant_count = 1`
  - set `reply_count = 0`
  - set `last_activity_at = created_at`
- On reply create:
  - increment `reply_count`
  - update `last_activity_at`
  - add participant if user not already present
  - recalculate `participant_count` only when a new participant is added

### Notifications
- On reply create:
  - notify thread author unless replying to own thread
  - optionally notify other participants except actor
- On solved:
  - notify best-reply author
- On mention:
  - notify mentioned users if mention parsing is added in MVP or phase 2

## 10. WebSocket And Realtime Contract

Reuse the existing STOMP/SockJS setup from `WebSocketConfig.java`.

### Recommended destinations
- Feed-wide thread updates: `/topic/v-hub.feed`
- Single-thread updates: `/topic/v-hub.thread.{id}`
- User-specific helper events if needed later: `/user/queue/v-hub`

### Event names
- `vhub.thread.created`
- `vhub.thread.updated`
- `vhub.thread.hidden`
- `vhub.reply.created`
- `vhub.thread.solved`

### Event envelope

```json
{
  "event": "vhub.reply.created",
  "version": 1,
  "occurredAt": "2026-03-24T10:15:00Z",
  "threadId": 42,
  "replyId": 91,
  "actorId": 11,
  "payload": {
    "replyCount": 6,
    "lastActivityAt": "2026-03-24T10:15:00Z"
  }
}
```

### Frontend update strategy
- Invalidate `["v-hub", "threads"]` on feed events.
- Invalidate `["v-hub", "thread", id]` on thread events.
- Continue using the existing notification client for notification payloads.

## 11. Frontend UX Contract

### 11.1 Routes

Add to `vcollab-frontend/src/config/routes.js`:

```js
vHub: "/v-hub",
adminVHub: "/admin/v-hub"
```

### 11.2 Launcher behavior

Add a floating `V` button to `vcollab-frontend/src/layouts/MainLayout.jsx`.

Behavior:
- Visible only for signed-in users when feature mode is not `DISABLED`
- Opens the `V Hub` page or drawer
- Shows subtle unread/activity state in a later phase if desired

Recommended MVP behavior:
- Desktop: open a page route at `/v-hub`
- Mobile: still use the route, but style it as a full-screen page

This is simpler and more durable than introducing a complex drawer first.

### 11.3 Frontend files to add

Recommended files:

```text
vcollab-frontend/src/pages/vhub/VHubPage.jsx
vcollab-frontend/src/pages/admin/AdminVHubPage.jsx
vcollab-frontend/src/components/vhub/VHubLauncher.jsx
vcollab-frontend/src/components/vhub/VHubThreadComposer.jsx
vcollab-frontend/src/components/vhub/VHubThreadFeed.jsx
vcollab-frontend/src/components/vhub/VHubThreadCard.jsx
vcollab-frontend/src/components/vhub/VHubThreadDetail.jsx
vcollab-frontend/src/components/vhub/VHubReplyComposer.jsx
vcollab-frontend/src/components/vhub/VHubReplyList.jsx
vcollab-frontend/src/components/admin/AdminVHubSettingsPanel.jsx
vcollab-frontend/src/services/vhub.service.js
vcollab-frontend/src/websocket/vhubClient.js
vcollab-frontend/src/websocket/useVHubUpdates.js
vcollab-frontend/src/styles/vhub.css
```

### 11.4 Main user screen layout

`VHubPage.jsx` should contain:
- Header with feature title and short explanation
- Primary action: `Ask For Help`
- Filter pills: `All`, `Help`, `Question`, `Discussion`, `Solved`, `My Threads`
- Thread feed on the left or top
- Active thread panel on the right on desktop, stacked on mobile

### 11.5 Thread card content

Each thread card should show:
- Title
- Thread type badge
- Status badge
- Author identity
- Short preview
- Reply count
- Last activity time
- Tags

### 11.6 Thread detail content

Each thread detail should show:
- Full thread body
- Solved badge or open state
- Reply list
- Best answer pinned near the top if available
- Reply composer
- `Message Privately` button that reuses the existing conversation service

### 11.7 Read-only mode UI

When mode is `READ_ONLY`:
- Keep the launcher visible
- Show a banner: `V Hub is currently in read-only mode`
- Disable composer and reply box
- Keep browsing active

## 12. Frontend Service Contract

Add to `vcollab-frontend/src/services/vhub.service.js`:

```js
getVHubSettings()
listVHubThreads(params)
getVHubThread(id, params)
createVHubThread(payload)
createVHubReply(threadId, payload)
solveVHubThread(id, payload)
reopenVHubThread(id)
deleteVHubThread(id)
deleteVHubReply(id)
getAdminVHubSettings()
updateAdminVHubSettings(payload)
listAdminVHubThreads(params)
lockAdminVHubThread(id, payload)
hideAdminVHubThread(id, payload)
hideAdminVHubReply(id, payload)
getAdminVHubSummary()
```

All service functions should mirror the current Axios style in `message.service.js` and `admin.service.js`.

## 13. File-By-File Implementation Order

### Step 1: Database and enums
- Add migration `V8__add_v_hub_social_messaging.sql`
- Extend `ContentType.java`
- Extend `NotificationType.java`
- Add `vhub` enums

### Step 2: Entities and repositories
- Add `PlatformFeatureSetting`
- Add `VHubThread`
- Add `VHubReply`
- Add `VHubThreadParticipant`
- Add matching repositories

### Step 3: Settings and feature guard
- Add `VHubSettingsService`
- Add user `GET /v-hub/settings`
- Add admin `GET/PATCH /admin/v-hub/settings`

### Step 4: User thread APIs
- Add thread list, create, detail
- Add reply create
- Add solve and reopen
- Add soft delete

### Step 5: Notifications and realtime
- Publish reply and solved events
- Send notifications through `NotificationServiceImpl`
- Add websocket topic publisher and frontend subscription hook

### Step 6: Frontend routing and launcher
- Add routes to `routes.js`
- Mount page in router
- Add floating `V` launcher in `MainLayout.jsx`

### Step 7: Frontend user screens
- Add `VHubPage.jsx`
- Add thread feed and detail components
- Add composer and reply form
- Add read-only banner behavior

### Step 8: Admin screens
- Add `AdminVHubPage.jsx`
- Add settings panel and moderation list
- Add summary widgets

### Step 9: Tests
- Backend integration tests for:
  - feature mode guard
  - create thread
  - create reply
  - solve and reopen
  - admin lock and hide
- Frontend tests for:
  - launcher visibility
  - read-only composer disable
  - thread list rendering

## 14. Recommended MVP Acceptance Criteria

- Signed-in user can open `V Hub` from the `V` launcher.
- Signed-in user can create a thread with title, body, type, and tags.
- Other signed-in users can reply.
- Thread author can mark a reply as best answer and solve the thread.
- Admin can disable the feature completely.
- Admin can set read-only mode without removing existing content.
- Hidden threads do not appear in the normal user feed.
- Reply creation updates the thread in realtime.
- Notifications are created for reply and solved events.

## 15. Phase 2 After MVP

After MVP is stable, add:
- Attachments via a `v_hub_thread_media` table or reuse media service
- Nested replies using `parent_reply_id`
- Mentions with highlighted parsing and notification fanout
- Thread reactions
- Saved or watched threads
- Trending sort and expert badges
- Optional AI moderation and spam throttling

## 16. Recommendation

Build `V Hub` first as a focused support-and-discussion feature:
- strong thread model
- strong admin control
- strong solve flow
- strong realtime updates

Do not merge it into the private `messages` table design. That would make moderation, discovery, filtering, and solved-state logic much harder than necessary.
