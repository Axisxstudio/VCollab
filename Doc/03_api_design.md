# VCollab – API Design Reference

> **Conventions**
> - Base path: `/api/v1`
> - All endpoints return `ApiResponse<T>` envelope
> - Auth: `Authorization: Bearer <JWT>` header on protected routes
> - Pagination: `?page=0&size=12&sort=createdAt,desc`
> - Roles enforced via Spring Security `@PreAuthorize`

---

## 1. Auth APIs

| Method | Path                          | Purpose                   | Auth    |
|--------|-------------------------------|---------------------------|---------|
| POST   | `/auth/register`              | Register new user         | Public  |
| POST   | `/auth/login`                 | Login, get JWT            | Public  |
| POST   | `/auth/forgot-password`       | Send reset email          | Public  |
| POST   | `/auth/reset-password`        | Reset with token          | Public  |
| GET    | `/auth/me`                    | Get current session user  | Auth    |
| POST   | `/auth/logout`                | Logout (token invalidation)| Auth   |

**Register DTO:**
```json
{ "fullName": "string", "username": "string", "email": "string",
  "password": "string", "role": "STUDENT|INDUSTRIAL_EXPERT|SOFTWARE_ENGINEER" }
```

**Login DTO:**
```json
{ "email": "string", "password": "string" }
```

**Login Response:**
```json
{ "token": "jwt_string", "user": { "id":1, "username":"...", "role":"STUDENT", "profileImage":"..." } }
```

---

## 2. User & Profile APIs

| Method | Path                          | Purpose                          | Auth       |
|--------|-------------------------------|----------------------------------|------------|
| GET    | `/users/:username`            | Get user profile by username     | Public*    |
| GET    | `/users/:id/stats`            | Get user stats (counts)          | Auth       |
| PATCH  | `/users/me/profile`           | Update own profile               | Auth (own) |
| PATCH  | `/users/me/password`          | Change password                  | Auth (own) |
| POST   | `/users/me/profile-image`     | Upload profile image             | Auth (own) |
| POST   | `/users/me/cover-image`       | Upload cover image               | Auth (own) |
| GET    | `/users/:id/projects`         | Get user's projects              | Auth       |
| GET    | `/users/:id/posts`            | Get user's posts                 | Auth       |
| GET    | `/users/:id/blogs`            | Get user's blogs                 | Auth       |
| GET    | `/users/:id/followers`        | Get follower list                | Auth       |
| GET    | `/users/:id/following`        | Get following list               | Auth       |
| GET    | `/users/suggestions`          | Get suggested users to follow    | Auth       |

*Public profile shows limited fields; full details require auth.

**Profile Update DTO:**
```json
{
  "fullName": "string", "bio": "string", "department": "string",
  "yearOfStudy": "string", "institution": "string", "skills": ["array"],
  "githubUrl": "string", "linkedinUrl": "string", "websiteUrl": "string"
}
```

---

## 3. Category APIs

| Method | Path                     | Purpose                          | Auth       |
|--------|--------------------------|----------------------------------|------------|
| GET    | `/categories`            | List categories (filterable)     | Auth       |
| GET    | `/categories?type=PROJECT` | Type-filtered categories       | Auth       |
| POST   | `/categories`            | Create new category              | Auth       |
| GET    | `/admin/categories`      | Admin list all categories        | SUPER_ADMIN|
| PUT    | `/admin/categories/:id`  | Admin edit category              | SUPER_ADMIN|
| PATCH  | `/admin/categories/:id/toggle` | Toggle active/inactive     | SUPER_ADMIN|
| DELETE | `/admin/categories/:id`  | Delete category                  | SUPER_ADMIN|

**Create Category DTO:**
```json
{ "name": "string", "type": "PROJECT|POST|BLOG|ALL" }
```

---

## 4. Project APIs

| Method | Path                          | Purpose                          | Auth        |
|--------|-------------------------------|----------------------------------|-------------|
| GET    | `/projects`                   | Browse public projects (paginated)| Public*   |
| GET    | `/projects/:id`               | Get project detail               | Public*    |
| POST   | `/projects`                   | Create project                   | Auth        |
| PUT    | `/projects/:id`               | Update own project               | Auth (own)  |
| DELETE | `/projects/:id`               | Soft delete own project          | Auth (own)  |
| PATCH  | `/projects/:id/toggle`        | Toggle active/private            | Auth (own)  |
| GET    | `/projects/feed`              | Feed from followed users         | Auth        |

**Create/Update Project DTO:**
```json
{
  "title": "string", "shortDesc": "string", "fullDesc": "string",
  "categoryId": 1, "tagNames": ["array"], "techStack": ["Java","React"],
  "githubUrl": "string", "demoUrl": "string", "thumbnail": "url",
  "mediaUrls": [{"url":"string","type":"IMAGE|VIDEO"}],
  "visibility": "PUBLIC|PRIVATE", "isActive": true
}
```

**Project Response DTO:**
```json
{
  "id": 1, "title": "...", "shortDesc": "...", "thumbnail": "...",
  "category": {"id":1,"name":"2nd Year"}, "tags": [],
  "owner": {"id":1,"username":"...","profileImage":"..."},
  "likeCount": 10, "commentCount": 3, "saveCount": 2,
  "githubUrl": "...", "demoUrl": "...",
  "visibility": "PUBLIC", "isActive": true,
  "isLiked": false, "isSaved": false,
  "createdAt": "...", "mediaList": []
}
```

**Toggle DTO:**
```json
{ "field": "isActive|visibility", "value": "true|false|PUBLIC|PRIVATE" }
```

---

## 5. Project Request APIs

| Method | Path                                      | Purpose                        | Auth       |
|--------|-------------------------------------------|--------------------------------|------------|
| POST   | `/projects/:id/requests`                  | Submit request for a project   | Auth       |
| GET    | `/requests/sent`                          | Get my sent requests           | Auth       |
| GET    | `/requests/received`                      | Get requests on my projects    | Auth       |
| PATCH  | `/requests/:id`                           | Accept/Reject a request        | Auth (own) |
| GET    | `/admin/project-requests`                 | Admin view all requests        | SUPER_ADMIN|

**Request DTO:**
```json
{ "message": "string", "attachmentUrls": ["url1","url2"] }
```

**Accept/Reject DTO:**
```json
{ "status": "ACCEPTED|REJECTED" }
```

---

## 6. Post APIs

| Method | Path                    | Purpose                  | Auth       |
|--------|-------------------------|--------------------------|------------|
| GET    | `/posts`                | Browse public posts      | Public*    |
| GET    | `/posts/:id`            | Get post detail          | Auth       |
| POST   | `/posts`                | Create post              | Auth       |
| PUT    | `/posts/:id`            | Update own post          | Auth (own) |
| DELETE | `/posts/:id`            | Soft delete own post     | Auth (own) |
| PATCH  | `/posts/:id/toggle`     | Toggle visibility/active | Auth (own) |
| GET    | `/posts/feed`           | Feed from followed users  | Auth       |

**Create Post DTO:**
```json
{
  "content": "string", "postType": "TEXT|IMAGE|VIDEO|ANNOUNCEMENT",
  "categoryId": 1, "tagNames": [], "visibility": "PUBLIC",
  "mediaUrls": [{"url":"string","type":"IMAGE"}]
}
```

---

## 7. Blog APIs

| Method | Path                    | Purpose                  | Auth       |
|--------|-------------------------|--------------------------|------------|
| GET    | `/blogs`                | Browse public blogs      | Public*    |
| GET    | `/blogs/:id`            | Get blog detail          | Auth       |
| POST   | `/blogs`                | Create blog              | Auth       |
| PUT    | `/blogs/:id`            | Update own blog          | Auth (own) |
| DELETE | `/blogs/:id`            | Soft delete own blog     | Auth (own) |
| PATCH  | `/blogs/:id/toggle`     | Toggle visibility/active | Auth (own) |

**Create Blog DTO:**
```json
{
  "title": "string", "coverImage": "url", "content": "richtext_html",
  "categoryId": 1, "tagNames": [], "visibility": "PUBLIC",
  "mediaUrls": []
}
```

---

## 8. Media Upload APIs

| Method | Path                     | Purpose                         | Auth |
|--------|--------------------------|---------------------------------|------|
| POST   | `/media/upload`          | Upload image or video           | Auth |
| DELETE | `/media/:filename`       | Delete uploaded media file      | Auth |

**Upload Request:** `multipart/form-data` with `file` and optional `type` (PROJECT|POST|BLOG|PROFILE)

**Upload Response:**
```json
{ "url": "https://cdn.vcollab.com/uploads/uuid.jpg", "type": "IMAGE", "fileName": "uuid.jpg", "size": 204800 }
```

---

## 9. Comment APIs

| Method | Path                                       | Purpose                    | Auth       |
|--------|--------------------------------------------|----------------------------|------------|
| GET    | `/projects/:id/comments`                   | Get project comments       | Auth       |
| POST   | `/projects/:id/comments`                   | Add comment to project     | Auth       |
| GET    | `/posts/:id/comments`                      | Get post comments          | Auth       |
| POST   | `/posts/:id/comments`                      | Add comment to post        | Auth       |
| GET    | `/blogs/:id/comments`                      | Get blog comments          | Auth       |
| POST   | `/blogs/:id/comments`                      | Add comment to blog        | Auth       |
| PUT    | `/comments/:id`                            | Edit own comment           | Auth (own) |
| DELETE | `/comments/:id`                            | Delete own comment         | Auth (own) |
| POST   | `/comments/:id/replies`                    | Reply to a comment         | Auth       |

**Comment DTO:**
```json
{ "body": "string", "parentId": null }
```

**Comment Response:**
```json
{
  "id": 1, "body": "...", "author": {"id":1,"username":"...","profileImage":"..."},
  "replies": [], "createdAt": "...", "isEdited": false
}
```

---

## 10. Like APIs

| Method | Path                        | Purpose                     | Auth |
|--------|-----------------------------|-----------------------------|------|
| POST   | `/projects/:id/likes`       | Like/unlike project         | Auth |
| POST   | `/posts/:id/likes`          | Like/unlike post            | Auth |
| POST   | `/blogs/:id/likes`          | Like/unlike blog            | Auth |
| GET    | `/projects/:id/likes/check` | Check if current user liked | Auth |

**Like Response:**
```json
{ "liked": true, "likeCount": 42 }
```

---

## 11. Save APIs

| Method | Path                        | Purpose              | Auth |
|--------|-----------------------------|----------------------|------|
| POST   | `/projects/:id/saves`       | Save/unsave project  | Auth |
| POST   | `/posts/:id/saves`          | Save/unsave post     | Auth |
| POST   | `/blogs/:id/saves`          | Save/unsave blog     | Auth |
| GET    | `/users/me/saved`           | Get all saved content| Auth |
| GET    | `/users/me/saved?type=PROJECT` | Saved by type    | Auth |

---

## 12. Share APIs

| Method | Path                     | Purpose                 | Auth |
|--------|--------------------------|-------------------------|------|
| POST   | `/projects/:id/shares`   | Track project share     | Auth |
| POST   | `/posts/:id/shares`      | Track post share        | Auth |
| POST   | `/blogs/:id/shares`      | Track blog share        | Auth |

**Share Response:**
```json
{ "shareUrl": "https://vcollab.com/projects/123", "shareCount": 15 }
```

---

## 13. Follow APIs

| Method | Path                      | Purpose                     | Auth |
|--------|---------------------------|-----------------------------|------|
| POST   | `/users/:id/follow`       | Follow / unfollow user      | Auth |
| GET    | `/users/:id/followers`    | Get followers list          | Auth |
| GET    | `/users/:id/following`    | Get following list          | Auth |
| GET    | `/users/me/following`     | Get my following list       | Auth |
| GET    | `/users/:id/follow/check` | Check if following this user| Auth |

---

## 14. Message APIs

| Method | Path                               | Purpose                        | Auth |
|--------|------------------------------------|--------------------------------|------|
| GET    | `/conversations`                   | Get all my conversations       | Auth |
| POST   | `/conversations`                   | Start new conversation         | Auth |
| GET    | `/conversations/:id/messages`      | Get messages in conversation   | Auth |
| POST   | `/conversations/:id/messages`      | Send message                   | Auth |
| PATCH  | `/conversations/:id/read`          | Mark all messages as read      | Auth |
| GET    | `/conversations/unread-count`      | Total unread message count     | Auth |

**Start Conversation DTO:**
```json
{ "recipientId": 2 }
```

**Send Message DTO:**
```json
{ "body": "string", "mediaUrl": "url|null", "mediaType": "IMAGE|VIDEO|FILE|null" }
```

---

## 15. Notification APIs

| Method | Path                           | Purpose                        | Auth |
|--------|--------------------------------|--------------------------------|------|
| GET    | `/notifications`               | Get all notifications (paginated)| Auth|
| PATCH  | `/notifications/:id/read`      | Mark one as read               | Auth |
| PATCH  | `/notifications/read-all`      | Mark all as read               | Auth |
| GET    | `/notifications/unread-count`  | Get unread count               | Auth |
| DELETE | `/notifications/:id`           | Delete one notification        | Auth |

---

## 16. Report APIs

| Method | Path              | Purpose               | Auth |
|--------|-------------------|-----------------------|------|
| POST   | `/reports`        | Submit a report       | Auth |

**Report DTO:**
```json
{
  "contentType": "PROJECT|POST|BLOG|COMMENT|USER",
  "contentId": 42,
  "reason": "SPAM|ABUSE|INAPPROPRIATE|COPYRIGHT|FAKE_MISLEADING|OTHER",
  "description": "optional text"
}
```

---

## 17. Warning APIs (Admin Only)

| Method | Path               | Purpose                   | Auth        |
|--------|--------------------|---------------------------|-------------|
| POST   | `/admin/warnings`  | Send warning to user       | SUPER_ADMIN |
| GET    | `/admin/warnings`  | List all warnings          | SUPER_ADMIN |
| GET    | `/warnings/me`     | View my received warnings  | Auth        |

**Warning DTO:**
```json
{
  "targetUserId": 5, "title": "Content Violation",
  "message": "string", "reason": "string",
  "refType": "PROJECT|POST|BLOG|null", "refId": 42
}
```

---

## 18. Toggle / Status APIs

| Method | Path                             | Purpose                   | Auth        |
|--------|----------------------------------|---------------------------|-------------|
| PATCH  | `/admin/users/:id/suspend`       | Suspend/unsuspend user    | SUPER_ADMIN |
| PATCH  | `/admin/projects/:id/toggle`     | Toggle any field          | SUPER_ADMIN |
| PATCH  | `/admin/posts/:id/toggle`        | Toggle post field         | SUPER_ADMIN |
| PATCH  | `/admin/blogs/:id/toggle`        | Toggle blog field         | SUPER_ADMIN |

---

## 19. Admin User Management APIs

| Method | Path                           | Purpose                          | Auth        |
|--------|--------------------------------|----------------------------------|-------------|
| GET    | `/admin/users`                 | List all users (filterable)      | SUPER_ADMIN |
| GET    | `/admin/users/:id`             | Get user detail                  | SUPER_ADMIN |
| PATCH  | `/admin/users/:id`             | Edit user profile                | SUPER_ADMIN |
| DELETE | `/admin/users/:id`             | Soft delete user                 | SUPER_ADMIN |

**Admin User List Params:** `?role=STUDENT&isActive=true&search=name&sort=newest`

---

## 20. Admin Content Management APIs

| Method | Path                          | Purpose                          | Auth        |
|--------|-------------------------------|----------------------------------|-------------|
| GET    | `/admin/projects`             | List all projects                | SUPER_ADMIN |
| DELETE | `/admin/projects/:id`         | Soft delete any project          | SUPER_ADMIN |
| GET    | `/admin/posts`                | List all posts                   | SUPER_ADMIN |
| DELETE | `/admin/posts/:id`            | Soft delete any post             | SUPER_ADMIN |
| GET    | `/admin/blogs`                | List all blogs                   | SUPER_ADMIN |
| DELETE | `/admin/blogs/:id`            | Soft delete any blog             | SUPER_ADMIN |
| GET    | `/admin/reports`              | List all reports                 | SUPER_ADMIN |
| PATCH  | `/admin/reports/:id`          | Resolve/dismiss report           | SUPER_ADMIN |
| GET    | `/admin/audit-logs`           | Get audit logs                   | SUPER_ADMIN |

---

## 21. Recycle Bin APIs

| Method | Path                              | Purpose                     | Auth        |
|--------|-----------------------------------|-----------------------------|-------------|
| GET    | `/admin/recycle-bin`              | List all soft-deleted items | SUPER_ADMIN |
| GET    | `/admin/recycle-bin?type=PROJECT` | Filter by content type      | SUPER_ADMIN |
| POST   | `/admin/recycle-bin/:type/:id/restore` | Restore item           | SUPER_ADMIN |
| DELETE | `/admin/recycle-bin/:type/:id`    | Permanently delete item     | SUPER_ADMIN |

---

## 22. Export / PDF APIs

| Method | Path                          | Purpose                     | Auth        |
|--------|-------------------------------|-----------------------------|-------------|
| GET    | `/admin/export/users`         | Export users PDF            | SUPER_ADMIN |
| GET    | `/admin/export/projects`      | Export projects PDF         | SUPER_ADMIN |
| GET    | `/admin/export/posts`         | Export posts PDF            | SUPER_ADMIN |
| GET    | `/admin/export/blogs`         | Export blogs PDF            | SUPER_ADMIN |
| GET    | `/admin/export/reports`       | Export reports PDF          | SUPER_ADMIN |
| GET    | `/admin/export/warnings`      | Export warnings PDF         | SUPER_ADMIN |
| GET    | `/admin/export/recycle-bin`   | Export recycle bin PDF      | SUPER_ADMIN |
| GET    | `/admin/export/users/:id`     | Export single user PDF      | SUPER_ADMIN |

All export endpoints return `application/pdf` binary response with `Content-Disposition: attachment`.

---

## 23. Search & Filter APIs

| Method | Path               | Purpose                           | Auth   |
|--------|--------------------|-----------------------------------|--------|
| GET    | `/search`          | Universal search                  | Auth   |
| GET    | `/projects`        | Projects with filter/sort/paginate| Auth   |
| GET    | `/posts`           | Posts with filter/sort            | Auth   |
| GET    | `/blogs`           | Blogs with filter/sort            | Auth   |
| GET    | `/users`           | User search                       | Auth   |

**Search Params:** `?q=text&type=PROJECT|POST|BLOG|USER&page=0&size=12`
**Content Params:** `?category={id}&tag={name}&sort=NEWEST|POPULAR&visibility=PUBLIC`

---

## 24. Feed / Discovery APIs

| Method | Path                      | Purpose                           | Auth |
|--------|---------------------------|-----------------------------------|------|
| GET    | `/feed`                   | Home feed (followed users)        | Auth |
| GET    | `/discover/projects`      | Discover trending/new projects    | Auth |
| GET    | `/discover/posts`         | Discover trending posts           | Auth |
| GET    | `/discover/blogs`         | Discover trending blogs           | Auth |
| GET    | `/landing/featured`       | Public featured content preview   | Public|

**Landing Featured Response:**
```json
{
  "featuredProjects": [...3 projects],
  "latestPosts": [...3 posts],
  "latestBlogs": [...3 blogs],
  "topContributors": [...6 users]
}
```

---

## 25. WebSocket Event Specification

### Connection
```
Client connects via: ws://backend/ws (SockJS transport)
STOMP CONNECT with header: Authorization: Bearer <jwt>
Server validates JWT on handshake interceptor
```

### Client Subscriptions
```
/user/queue/notifications   → personal notification delivery
/user/queue/messages        → private message delivery
/user/queue/unread          → unread count update
/topic/conversation/{id}/typing → typing indicator
```

### Server-to-Client Events

**Notification Event:**
```json
{
  "type": "LIKE|COMMENT|FOLLOW|MESSAGE|PROJECT_REQUEST|ADMIN_WARNING|...",
  "title": "string",
  "message": "string",
  "refType": "PROJECT",
  "refId": 42,
  "sender": { "id": 1, "username": "...", "profileImage": "..." },
  "createdAt": "ISO8601",
  "unreadCount": 5
}
```

**Message Event:**
```json
{
  "conversationId": 10,
  "messageId": 55,
  "senderId": 3,
  "senderName": "...",
  "body": "...",
  "createdAt": "ISO8601"
}
```

**Typing Event (client → server):**
```
Client sends to: /app/conversation/{id}/typing
Payload: { "typing": true }
```

### Server Endpoint (client → server)
```
/app/conversation/{id}/message  → Send new message via WebSocket (alternative to REST)
```
