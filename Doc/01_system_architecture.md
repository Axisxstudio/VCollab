# VCollab – System Architecture Blueprint

---

## 1. System Overview

**VCollab** is a campus-first, project-sharing and collaboration platform built for students, industrial experts, and software engineers. It is a production-grade social-collaboration platform with real-time capabilities, role-based access control, moderation workflows, and rich media support.

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│          React + Vite + Ant Design + Framer Motion               │
│     (Browser SPA with WebSocket client via SockJS/STOMP)         │
└─────────────────────────────┬────────────────────────────────────┘
                              │  HTTP/REST + WebSocket (WS)
┌─────────────────────────────▼────────────────────────────────────┐
│                       API GATEWAY / NGINX                         │
│   (Reverse proxy, CORS, static file serving, SSL termination)    │
└─────────────────────────────┬────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│                    SPRING BOOT BACKEND                            │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────────────────────┐ │
│  │ REST API    │ │ WebSocket    │ │ Async Event / Notification  │ │
│  │ Controllers │ │ STOMP Broker │ │ Publisher                  │ │
│  └─────────────┘ └──────────────┘ └────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Core Services: Auth, User, Project, Post, Blog, Category,   │ │
│  │ Comment, Like, Save, Share, Follow, Request, Notification,  │ │
│  │ Chat, Report, Warning, Admin, RecycleBin, Export, Search    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Security: JWT Filter, Role Guard, Ownership Checks           │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│                     PERSISTENCE LAYER                             │
│   MySQL (primary DB) │ File Storage (local/S3-compatible)        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Role and Permission Matrix

| Capability                        | PUBLIC | STUDENT | INDUSTRIAL_EXPERT | SOFTWARE_ENGINEER | SUPER_ADMIN |
|-----------------------------------|--------|---------|-------------------|-------------------|-------------|
| View landing page                 | ✅     | ✅      | ✅                | ✅                | ✅          |
| View limited public content       | ✅     | ✅      | ✅                | ✅                | ✅          |
| Register / Login                  | ✅     | ✅      | ✅                | ✅                | ✅          |
| View full content                 | ❌     | ✅      | ✅                | ✅                | ✅          |
| Create project / post / blog      | ❌     | ✅      | ✅                | ✅                | ✅          |
| Edit own content                  | ❌     | ✅      | ✅                | ✅                | ✅          |
| Delete own content (soft)         | ❌     | ✅      | ✅                | ✅                | ✅          |
| Like / Comment / Save / Share     | ❌     | ✅      | ✅                | ✅                | ✅          |
| Follow / Unfollow users           | ❌     | ✅      | ✅                | ✅                | ✅          |
| Send / receive messages           | ❌     | ✅      | ✅                | ✅                | ✅          |
| Report content                    | ❌     | ✅      | ✅                | ✅                | ✅          |
| Request projects                  | ❌     | ✅      | ✅                | ✅                | ✅          |
| Receive notifications             | ❌     | ✅      | ✅                | ✅                | ✅          |
| Toggle own content public/private | ❌     | ✅      | ✅                | ✅                | ✅          |
| Toggle own content active/inactive| ❌     | ✅      | ✅                | ✅                | ✅          |
| Admin dashboard access            | ❌     | ❌      | ❌                | ❌                | ✅          |
| Manage all users                  | ❌     | ❌      | ❌                | ❌                | ✅          |
| Override any content toggle       | ❌     | ❌      | ❌                | ❌                | ✅          |
| Send warnings                     | ❌     | ❌      | ❌                | ❌                | ✅          |
| Review / resolve reports          | ❌     | ❌      | ❌                | ❌                | ✅          |
| Soft-delete any content           | ❌     | ❌      | ❌                | ❌                | ✅          |
| Restore from recycle bin          | ❌     | ❌      | ❌                | ❌                | ✅          |
| Export PDFs                       | ❌     | ❌      | ❌                | ❌                | ✅          |
| Manage categories                 | ❌     | ❌      | ❌                | ❌                | ✅          |
| Monitor notifications             | ❌     | ❌      | ❌                | ❌                | ✅          |
| Audit logs access                 | ❌     | ❌      | ❌                | ❌                | ✅          |

---

## 3. Module Breakdown

| # | Module                  | Purpose                                                         |
|---|-------------------------|-----------------------------------------------------------------|
| 1 | Public Landing Page     | Marketing page, limited content preview, sign-up encouragement |
| 2 | Authentication          | Register, login, JWT, forgot/reset password, session           |
| 3 | User Profile            | Rich profiles, stats, social links, tabs, follow/connect       |
| 4 | Category Management     | Reusable, type-aware categories with admin controls            |
| 5 | Project Module          | Full project CRUD + media + interactions + requests            |
| 6 | Post Module             | Social posts with media + interactions                         |
| 7 | Blog Module             | Long-form articles with rich content + media                   |
| 8 | Media Upload            | Images + videos for all content types and profiles             |
| 9 | Comment System          | Nested comments on all content types                           |
|10 | Like System             | Toggle likes on projects, posts, blogs                         |
|11 | Save / Bookmark         | Save content privately                                         |
|12 | Share System            | Share links, track share counts                                |
|13 | Follow / Connection     | Follow users, followers/following lists                        |
|14 | Project Request         | Request projects with status workflow                          |
|15 | Chat / Messaging        | Real-time DMs with read state and conversation management      |
|16 | Notification System     | Persistent + real-time, bell dropdown, full page              |
|17 | Report System           | Report content, admin review workflow                          |
|18 | Warning System          | Admin sends warnings before moderation                         |
|19 | Admin Dashboard         | Full admin moderation, management, monitoring                  |
|20 | Recycle Bin             | Soft-deleted content restoration and permanent delete          |
|21 | Export / PDF            | PDF export of all admin modules                                |
|22 | Search / Filter / Sort  | Universal search and filter across all content                 |
|23 | Audit Log               | Admin action tracking for accountability                       |
|24 | Real-Time Event Layer   | WebSocket + STOMP for notifications, chat, live updates        |

---

## 4. Frontend Architecture

### Tech Stack
- **Framework**: React 18 + Vite
- **UI Library**: Ant Design 5.x
- **Routing**: React Router v6 (nested routes, protected routes)
- **State Management**: Zustand (preferred for simplicity and scalability)
- **Server State**: React Query (TanStack Query) for async cache management
- **HTTP Client**: Axios with interceptors for JWT injection and refresh
- **Forms**: React Hook Form + Zod for type-safe validation
- **Animations**: Framer Motion for micro-interactions and page transitions
- **Real-Time**: SockJS + @stomp/stompjs for WebSocket communication
- **Rich Text**: React Quill or Tiptap for blog content editor

### Architectural Patterns
- **Feature-based folder structure** (not layer-based)
- **Lazy-loaded routes** for code splitting
- **Compound components** for complex UI (chat, notifications)
- **Custom hooks** for business logic extraction
- **Centralized API service layer** with Axios instance
- **Role-aware route guards** via ProtectedRoute components
- **Global WebSocket context** for real-time subscription management

### State Management Strategy
```
┌─────────────────────────────────────────────────────────┐
│ Zustand Global Stores                                    │
│  authStore     → current user, JWT token, role          │
│  notifStore    → unread count, notification list        │
│  chatStore     → active conversation, unread messages   │
│  uiStore       → modals, sidebar state, theme           │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ React Query (Server State)                               │
│  useProjects, usePosts, useBlogs, useProfile, etc.      │
│  Automatic cache invalidation on mutations               │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Backend Architecture

### Tech Stack
- **Framework**: Spring Boot 3.x (Java 17+)
- **Security**: Spring Security 6 + JWT (JJWT library)
- **ORM**: Spring Data JPA + Hibernate
- **Database**: MySQL 8.x
- **Real-Time**: Spring WebSocket + STOMP + SockJS
- **PDF Export**: iText or Apache PDFBox
- **Validation**: Jakarta Validation (Bean Validation 3)
- **Exception Handling**: `@RestControllerAdvice` global handler

### Architectural Patterns
- **Package-by-feature** module organization
- **DTO pattern**: Request DTOs (validated), Response DTOs (clean, no entity exposure)
- **Service-Repository separation**: Services handle business logic, repositories handle data access
- **Soft delete via `deleted_at` timestamp** on all major entities
- **Audit logging**: `@EntityListeners(AuditingEntityListener.class)` + custom audit service
- **Async notifications**: `@Async` + Spring Events or ApplicationEventPublisher
- **WebSocket event publisher**: Dedicated `NotificationPublisher` sends to `/topic/user/{userId}`

### Security Architecture
```
Request → JwtAuthFilter → SecurityFilterChain → Controller
              │
              ├── Extract token from Authorization header
              ├── Validate token (signature + expiry)
              ├── Load UserDetails from DB
              └── Set SecurityContextHolder

Controller → @PreAuthorize("hasRole('SUPER_ADMIN')")
           → Ownership check via service layer
           → Return 401 Unauthorized / 403 Forbidden on failure
```

### Exception Handling
```java
GlobalExceptionHandler (@RestControllerAdvice)
  ├── ResourceNotFoundException    → 404
  ├── UnauthorizedException        → 401
  ├── ForbiddenException           → 403
  ├── DuplicateResourceException   → 409
  ├── ValidationException          → 400
  ├── MediaUploadException         → 422
  └── GenericServerException       → 500
```

### API Response Wrapper
All APIs return a consistent envelope:
```json
{
  "success": true,
  "message": "...",
  "data": { ... },
  "timestamp": "2026-03-12T07:00:00Z",
  "pagination": { "page": 0, "size": 10, "total": 100 }
}
```

---

## 6. Real-Time Architecture

### WebSocket Flow
```
Browser (SockJS) → Spring WebSocket Endpoint (/ws)
   ├── STOMP CONNECT
   ├── SUBSCRIBE to /user/queue/notifications  ← personal channel
   ├── SUBSCRIBE to /user/queue/messages       ← personal chat
   └── SUBSCRIBE to /topic/feed/{userId}       ← optional feed updates

Server Side:
   NotificationService.send(userId, notifDto)
       → SimpMessagingTemplate.convertAndSendToUser(userId, "/queue/notifications", notifDto)

   MessageService.send(conversationId, messageDto)
       → sends to each participant's /user/queue/messages
```

### Real-Time Events
| Event Type          | Channel                           | Trigger                              |
|---------------------|-----------------------------------|--------------------------------------|
| New notification    | `/user/queue/notifications`       | Like, comment, follow, request, etc. |
| New message         | `/user/queue/messages`            | Incoming DM                          |
| Typing indicator    | `/topic/conversation/{id}/typing` | User typing in chat                  |
| Unread count update | `/user/queue/unread`              | Any unread notification              |

---

## 7. Notification Management Architecture

### Notification Types (Enum)
```
LIKE, COMMENT, FOLLOW, MESSAGE, PROJECT_REQUEST,
ADMIN_WARNING, REPORT_RESULT, CONTENT_MODERATED,
PROJECT_REQUEST_ACCEPTED, PROJECT_REQUEST_REJECTED
```

### Notification Flow
```
User Action (like, comment, follow...)
   → Service method triggers NotificationService.create(...)
   → Notification row inserted to DB (recipient_id, type, content, ref_id, ref_type)
   → NotificationPublisher.sendRealTime(recipientId, dto)
       → WebSocket push to recipient's personal channel
   → Unread count auto-incremented
```

### Notification DB Design
```
notifications
  id, recipient_id, sender_id, type, title, message,
  ref_type (PROJECT|POST|BLOG|COMMENT|MESSAGE|USER),
  ref_id, is_read, created_at, read_at
```

---

## 8. Category Management Architecture

### Category Design
- Categories are **type-aware**: `PROJECT`, `POST`, `BLOG`
- System-default categories pre-seeded: `1st Year`, `2nd Year`, `3rd Year`, `4th Year`, `Other`
- Users can create new categories inline when not found
- New user-created categories are **persisted** and appear in future dropdowns
- Admin can manage (CRUD, toggle active/inactive) all categories
- Category slug is auto-generated from name

### Category Entity Fields
```
categories
  id, name, slug, type (PROJECT|POST|BLOG|ALL), 
  is_system_default, is_active, created_by (user_id nullable),
  created_at, updated_at
```

### Category UX Pattern
1. Dropdown appears with filtered list
2. User types → live search filters results
3. If not found → "Create '{typed}' category" option appears
4. On select → POST to /api/categories to create and return id
5. Id stored in content form's category field

---

## 9. Content Status / Toggle Architecture

### Toggles on Content
Every major entity (project, post, blog, user) supports two orthogonal toggles:

| Toggle    | Values           | Who Controls              |
|-----------|------------------|---------------------------|
| Active    | ACTIVE/INACTIVE  | Owner + Admin override    |
| Visibility| PUBLIC/PRIVATE   | Owner + Admin override    |

### Visibility Rules
```
if user.is_active == false → account suspended, content hidden
if content.is_active == false → not shown in feed/search
if content.visibility == PRIVATE → only owner can see
if content.is_active == true AND visibility == PUBLIC → shown to all authenticated users
if content.is_active == true AND visibility == PUBLIC → shown limited on landing page
```

### Admin Override Pattern
- Admin can call `PATCH /admin/projects/{id}/toggle` with body `{field: "is_active", value: false}`
- Audit log entry created on every admin toggle
- Original owner cannot undo admin-forced toggles without admin reversal

---

## 10. Media Upload Architecture

### Storage Strategy
- **Phase 1**: Local filesystem storage (`/uploads/{type}/{userId}/{filename}`)
- **Phase 2**: S3-compatible object storage (configurable via `application.yml`)
- File served via Spring static resource mapping or signed URL

### Upload Flow
```
Frontend: File selected → preview shown
POST /api/media/upload (multipart/form-data)
   → MediaService validates type (image/video) and size
   → Stores file with UUID filename
   → Returns { url, fileName, type }
   → Frontend stores URL, includes in content create/edit DTO
```

### Media Association
- `project_media`, `post_media`, `blog_media` junction tables
- Each stores: `{ id, content_id, url, type, sort_order, created_at }`
- Profile images + cover images stored directly on user profile entity

### Validation
```
Images: max 10MB, types: image/jpeg, image/png, image/webp
Videos: max 200MB, types: video/mp4, video/webm
```

---

## 11. Security Architecture

### JWT Token Strategy
- Access token: 24h expiry, stored in `localStorage` (consider `httpOnly` cookie for production)
- Refresh token: 7-day expiry (future enhancement)
- Token contains: `sub (userId)`, `role`, `iat`, `exp`

### Protected Routes (Frontend)
```
/app/*              → require any authenticated user
/admin/*            → require SUPER_ADMIN role
/profile/edit       → require own user context
```

### Ownership Validation Pattern (Backend)
```java
// In service layer, before any update/delete:
if (!content.getOwner().getId().equals(currentUserId)
    && !currentUser.getRole().equals(SUPER_ADMIN)) {
    throw new ForbiddenException("Not authorized");
}
```

### CORS Configuration
```
Allowed Origins: [frontend URL, localhost:5173 for dev]
Allowed Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Allowed Headers: Authorization, Content-Type
Exposed Headers: X-Total-Count
Allow Credentials: true
```

---

## 12. Search / Filter / Sort Architecture

### Universal Search
- Endpoint: `GET /api/search?q=term&type=PROJECT|POST|BLOG|USER&page=0&size=12`
- Backend uses JPA Specifications or JPQL with LIKE queries
- Returns mixed results grouped by type

### Content-Specific Filters
```
GET /api/projects?category={id}&tag={name}&sort=NEWEST|POPULAR&page=0&size=12
GET /api/posts?category={id}&sort=NEWEST|POPULAR
GET /api/blogs?category={id}&tag={name}&sort=NEWEST|POPULAR
GET /api/admin/users?role={role}&status=ACTIVE|INACTIVE&sort=NEWEST
```

### Sort Options
| Sort Key  | Implementation                              |
|-----------|---------------------------------------------|
| NEWEST    | `ORDER BY created_at DESC`                  |
| OLDEST    | `ORDER BY created_at ASC`                   |
| POPULAR   | `ORDER BY like_count DESC, comment_count DESC` |
| TRENDING  | `ORDER BY (likes+comments)/(hours+1) DESC`  |

---

## 13. Admin Architecture

### Admin Module Organization
```
/admin
  ├── Dashboard Overview (stats, recent reports, recent users)
  ├── Users Management (list, search, filter by role/status)
  ├── User Detail View (profile, content, actions)
  ├── Projects Management (list, toggle, delete, restore)
  ├── Posts Management
  ├── Blogs Management
  ├── Categories Management (CRUD, toggle active)
  ├── Reports (list, filter by status, resolve/dismiss)
  ├── Warnings (send, list, history)
  ├── Notifications Monitor (system-wide notification logs)
  ├── Recycle Bin (filter by type, restore, permanent delete)
  ├── Export Center (module-based PDF generation)
  └── Audit Logs (filter by admin, action type, date)
```

### Soft Delete + Recycle Bin Strategy
```
Content soft-deleted → set deleted_at = NOW(), deleted_by = adminId
Content shown in RecycleBin → fetch WHERE deleted_at IS NOT NULL
Restore → set deleted_at = NULL, deleted_by = NULL
Permanent delete → physical row deletion (admin only, irreversible)
```

### Audit Log Strategy
```
audit_logs
  id, admin_id, action_type, target_type, target_id,
  description, old_value (JSON), new_value (JSON), created_at, ip_address
```

---

## 14. Page and Screen Map

### Public Pages
```
/                          → Landing Page
/login                     → Sign In
/register                  → Sign Up
/forgot-password           → Forgot Password
/reset-password            → Reset Password
```

### Authenticated Pages
```
/home                      → Feed / Discovery
/profile/:username         → User Profile Page
/profile/edit              → Edit Own Profile
/projects                  → Project Browse
/projects/:id              → Project Detail
/projects/create           → Create Project
/projects/:id/edit         → Edit Project
/posts                     → Posts Feed
/posts/:id                 → Post Detail
/posts/create              → Create Post
/blogs                     → Blog List
/blogs/:id                 → Blog Detail
/blogs/create              → Create Blog
/blogs/:id/edit            → Edit Blog
/messages                  → Conversations List
/messages/:conversationId  → Chat Window
/notifications             → Notifications Page
/saved                     → Saved Content
/connections               → Followers / Following
/requests                  → Project Requests (sent/received)
/search                    → Search Results
```

### Admin Pages
```
/admin                          → Admin Dashboard
/admin/users                    → Users Management
/admin/users/:id                → User Detail
/admin/projects                 → Projects Management
/admin/posts                    → Posts Management
/admin/blogs                    → Blogs Management
/admin/categories               → Categories Management
/admin/reports                  → Reports Management
/admin/warnings                 → Warnings Management
/admin/notifications            → Notifications Monitor
/admin/recycle-bin              → Recycle Bin
/admin/export                   → Export Center
/admin/audit-logs               → Audit Logs
```

---

## 15. Implementation Roadmap (Summary)

| Phase | Focus                                    | Duration Estimate |
|-------|------------------------------------------|-----------------  |
| 1     | Architecture, ERD, API Spec, Design System | 1 week          |
| 2     | Project setup, Auth, DB, Layout/Theme    | 1.5 weeks         |
| 3     | Profile, Category, Media Foundation      | 1 week            |
| 4     | Projects, Posts, Blogs CRUD + Media      | 2 weeks           |
| 5     | Interactions (Like, Comment, Save, Share, Follow, Request) | 1.5 weeks |
| 6     | Notifications + WebSocket + Chat         | 2 weeks           |
| 7     | Admin Dashboard, Moderation, Warnings    | 2 weeks           |
| 8     | PDF Export, Search, Feed Refinement      | 1 week            |
| 9     | UI Polish, QA, Performance, Deployment  | 1.5 weeks         |
| **Total** | **~14 weeks for full production system** |               |

---

## 16. Final Recommendations

1. **Use Zustand + React Query together**: Zustand for UI and auth state, React Query for server-side cache – avoids over-fetching and keeps UI reactive.

2. **Package-by-feature in Spring Boot**: Prevents cross-feature coupling and enables independent feature development and testing.

3. **Soft delete from day one**: Never implement hard deletes for user content – recycle bin and audit trail require it.

4. **Notification system as core infrastructure**: Wire notifications into every service from the start, not added later.

5. **Decouple media uploads from content creation**: Two-step upload (upload first, attach URL to content) is more reliable and handles retry scenarios.

6. **Category type-awareness from schema level**: Prevents cross-contamination of categories between projects, posts, and blogs.

7. **Admin audit logs on every PATCH/DELETE admin action**: Required for accountability and future moderation dashboards.

8. **Use Spring Profiles**: `dev`, `prod`, `test` profiles with separate configs for DB, file storage, CORS, and JWT secrets.

9. **WebSocket authentication via handshake interceptor**: Validate JWT during handshake, not just on REST calls.

10. **Plan for S3-compatible storage from Phase 1**: Design media URLs to be storage-agnostic using a configurable base URL property.
