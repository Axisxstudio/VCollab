# VCollab – Phase-by-Phase Implementation Roadmap

---

## Phase 1 – Architecture, Design, and Planning
**Objective:** Complete all planning artifacts before writing a single line of code.

### Backend Tasks
- [ ] Define all entity ERDs and schemas
- [ ] Plan all API endpoints with request/response DTOs
- [ ] Define enum values, role matrix, permission rules
- [ ] Finalize security and WebSocket strategy

### Frontend Tasks
- [ ] Define design system (colors, typography, spacing, components)
- [ ] Define page and screen map
- [ ] Design wireframes for key screens (landing, home feed, project detail, admin)
- [ ] Plan folder structure

### Database Tasks
- [ ] Finalize all DDL schema including indexes, constraints
- [ ] Prepare seed data SQL (admin user, default categories)
- [ ] Define soft-delete and recycle bin strategy

### Dependencies
- None (starting point)

### Deliverables
- [x] System Architecture Blueprint ([01_system_architecture.md](file:///C:/Users/Dell/.gemini/antigravity/brain/f19dc232-a2f6-4505-8ef9-bacc12d5bff1/01_system_architecture.md))
- [x] Database Schema Reference ([02_database_schema.md](file:///C:/Users/Dell/.gemini/antigravity/brain/f19dc232-a2f6-4505-8ef9-bacc12d5bff1/02_database_schema.md))
- [x] API Design Reference ([03_api_design.md](file:///C:/Users/Dell/.gemini/antigravity/brain/f19dc232-a2f6-4505-8ef9-bacc12d5bff1/03_api_design.md))
- [x] Folder Structure Reference ([04_folder_structures.md](file:///C:/Users/Dell/.gemini/antigravity/brain/f19dc232-a2f6-4505-8ef9-bacc12d5bff1/04_folder_structures.md))
- [x] Design System Reference ([05_design_system.md](file:///C:/Users/Dell/.gemini/antigravity/brain/f19dc232-a2f6-4505-8ef9-bacc12d5bff1/05_design_system.md))
- [x] Implementation Roadmap (`06_implementation_roadmap.md`)

---

## Phase 2 – Project Setup, Auth, Database, Shared Layout
**Objective:** Get a working skeleton running with auth.

### Backend Tasks
- [ ] Initialize Spring Boot project (Spring Initializr)
  - Dependencies: Web, Security, JPA, MySQL, Validation, WebSocket, Lombok
- [ ] Configure `application.yml` for dev/prod profiles
- [ ] Set up MySQL connection and JPA auto-DDL (or Flyway)
- [ ] Create `BaseEntity` with `createdAt`, `updatedAt`, `deletedAt`, `deletedBy`
- [ ] Define all enums (Role, Visibility, ContentType, etc.)
- [ ] Implement `User` and `UserProfile` entities + repositories
- [ ] Implement JWT: `JwtTokenProvider`, `JwtAuthFilter`, `CustomUserDetailsService`
- [ ] Configure `SecurityConfig` (permit public routes, protect admin)
- [ ] Implement `AuthController`: register, login, forgotPassword, resetPassword, /me
- [ ] Create `ApiResponse<T>` and `PageResponse<T>` wrappers
- [ ] Implement `GlobalExceptionHandler`
- [ ] Seed: default admin user + default categories

### Frontend Tasks
- [ ] Initialize React + Vite project
- [ ] Install and configure: Ant Design, React Router, Zustand, React Query, Axios, Framer Motion, Zod
- [ ] Set up Ant Design theme override (`antdTheme.js`)
- [ ] Create CSS variables from design system
- [ ] Implement `axios.js` instance with JWT interceptors
- [ ] Implement `authStore.js` (currentUser, token, role)
- [ ] Create `AppRouter.jsx` with public/protected/admin route groups
- [ ] Create `ProtectedRoute.jsx` and `AdminRoute.jsx`
- [ ] Implement `MainLayout.jsx` (Navbar + Sidebar) – skeleton
- [ ] Implement `AuthLayout.jsx` (centered card)
- [ ] Build: `LoginPage.jsx`, `RegisterPage.jsx`, `ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx`
- [ ] Auth service (`auth.service.js`) + Zod validation schemas

### Database Tasks
- [ ] Run schema.sql (or Flyway: V1__init_schema.sql)
- [ ] Run seed.sql (admin user + categories)

### Dependencies
- Phase 1 completed

### Risks
- JWT configuration issues (CORS, preflight) – test early
- Windows path issues for Spring Boot file upload

---

## Phase 3 – Profile System, Category System, Media Foundation
**Objective:** Users can manage profiles and categories; media upload works.

### Backend Tasks
- [ ] Complete `UserController` – GET profile by username, GET stats, PATCH own profile
- [ ] Implement profile image + cover image upload endpoints
- [ ] Implement `CategoryController` + `CategoryService` – CRUD + type filtering
- [ ] Implement `MediaController` + `MediaService` – multipart upload, file validation, URL return
- [ ] Configure static resource serving for uploaded files
- [ ] Implement `TagService` + `ContentTagRepository`

### Frontend Tasks
- [ ] Build `ProfilePage.jsx` – tabs: Projects, Posts, Blogs, About, Saved, Connections
- [ ] Build `EditProfilePage.jsx` with form + validation
- [ ] Build `CategorySelect.jsx` (searchable dropdown + inline create)
- [ ] Build `MediaUploader.jsx` (drag-drop, preview, remove)
- [ ] Build `UserCard.jsx`, `AuthorChip.jsx` (clickable everywhere)
- [ ] Connect profile image + cover image upload to backend

### Database Tasks
- [ ] Confirm `user_profiles` table is properly seeded for new registrations
- [ ] Confirm `categories` table has seed data

### Dependencies
- Phase 2 completed
- Auth working end-to-end

---

## Phase 4 – Projects, Posts, Blogs CRUD
**Objective:** Users can create, edit, view, and soft-delete all three content types.

### Backend Tasks
- [ ] Implement `ProjectController` + `ProjectService` – CRUD, visibility toggle, soft delete
- [ ] Implement `ProjectMediaRepository` – associate media with projects
- [ ] Implement `PostController` + `PostService` – CRUD, media, toggle, soft delete
- [ ] Implement `BlogController` + `BlogService` – CRUD, rich content, media, toggle, soft delete
- [ ] Implement slug generation for projects and blogs
- [ ] Implement pagination + filtering (category, tag, sort) on all list endpoints
- [ ] Add FULLTEXT search indexes and LIKE query support

### Frontend Tasks
- [ ] Build `ProjectsPage.jsx` – grid view with filters
- [ ] Build `ProjectDetailPage.jsx` – full project view with media, interaction bar
- [ ] Build `CreateProjectPage.jsx` + `EditProjectPage.jsx` with all form fields
- [ ] Build `ProjectCard.jsx` with thumbnail, stats, author chip
- [ ] Build `PostsPage.jsx` – feed layout
- [ ] Build `CreatePostPage.jsx` – text + media upload
- [ ] Build `PostCard.jsx`
- [ ] Build `BlogsPage.jsx` – article card grid
- [ ] Build `BlogDetailPage.jsx` – rendered rich content
- [ ] Build `CreateBlogPage.jsx` + `EditBlogPage.jsx` with rich text editor
- [ ] Build `BlogCard.jsx`
- [ ] Wire all services and React Query hooks

### Database Tasks
- [ ] Confirm `project_media`, `post_media`, `blog_media` tables
- [ ] Confirm `content_tags` junction table with tag creation

### Risks
- Rich text editor (Tiptap) initial setup complexity

---

## Phase 5 – Interactions: Like, Comment, Save, Share, Follow, Project Requests
**Objective:** All social interactions work end-to-end.

### Backend Tasks
- [ ] Implement `LikeService` – toggle like, update counter on content entity
- [ ] Implement `SaveService` – toggle save
- [ ] Implement `ShareService` – track share, increment counter
- [ ] Implement `CommentController` + `CommentService` – nested comments, CRUD, soft delete
- [ ] Implement `FollowService` – follow/unfollow, follower/following lists, following check
- [ ] Update `user_profiles.follower_count`, `following_count` on follow/unfollow
- [ ] Implement `ProjectRequestController` + `ProjectRequestService` – submit, respond, attachment upload
- [ ] Wire notification creation into all interaction services (pre-Phase 6)

### Frontend Tasks
- [ ] Build `ContentInteractionBar.jsx` – like, comment, save, share, report
- [ ] Build `CommentSection.jsx`, `CommentItem.jsx`, `CommentForm.jsx`, `ReplyList.jsx`
- [ ] Build `SavedPage.jsx` – grouped by content type
- [ ] Build `ConnectionsPage.jsx` – followers/following tabs
- [ ] Build `RequestsPage.jsx` – sent/received requests with status
- [ ] Add follow button to `ProfilePage.jsx` (for other users)
- [ ] Add share flow (copy link + toast confirmation)

### Database Tasks
- [ ] No schema changes expected; verify counter columns are updating correctly

---

## Phase 6 – Notifications, WebSocket, Chat
**Objective:** Real-time notification delivery and messaging work.

### Backend Tasks
- [ ] Configure `WebSocketConfig.java` – STOMP broker, /ws endpoint, SockJS
- [ ] Implement `HandshakeInterceptor.java` – validate JWT on WebSocket connect
- [ ] Implement `NotificationService` – create, mark read, list, count
- [ ] Implement `NotificationPublisher` – push to `/user/queue/notifications` via SimpMessagingTemplate
- [ ] Wire notification triggers into all interaction services (like, comment, follow, request, warning)
- [ ] Implement `MessageController` + `MessageService` – conversations, send message, mark read
- [ ] Push new messages via WebSocket to conversation participants
- [ ] Implement typing indicator via WebSocket

### Frontend Tasks
- [ ] Implement `websocket.js` – SockJS + STOMP client with reconnect
- [ ] Implement `useWebSocket.js` hook – subscribe on login, publish events
- [ ] Build `NotificationBell.jsx` + unread count badge
- [ ] Build `NotificationDropdown.jsx` + `NotificationItem.jsx`
- [ ] Build `NotificationsPage.jsx` – full list with filters
- [ ] Build `NotificationToast.jsx` – real-time popup
- [ ] Wire `notificationStore.js` to WebSocket incoming events
- [ ] Build `MessagesPage.jsx` – conversation list with last message + unread
- [ ] Build `ChatPage.jsx` – message window with real-time delivery
- [ ] Build `MessageBubble.jsx`, `ChatInput.jsx`, `TypingIndicator.jsx`

### Database Tasks
- [ ] Confirm `notifications` table indexes (recipient_id, is_read)
- [ ] Confirm `messages` and `conversations` tables with last_message tracking

### Risks
- WebSocket auth and CORS on deployment environments – test early
- Concurrent message delivery deduplication

---

## Phase 7 – Admin Dashboard, Moderation, Recycle Bin
**Objective:** Super Admin has full control and moderation capability.

### Backend Tasks
- [ ] Implement `AdminDashboardController` – stats (users, projects, reports, warnings counts)
- [ ] Implement `AdminUserController` – list, search, suspend, unsuspend, view detail
- [ ] Implement `AdminContentController` – project/post/blog list, toggle, soft delete
- [ ] Implement `ReportController` (admin side) – list by status, resolve, dismiss
- [ ] Implement `WarningController` – send warning, list, target user view
- [ ] Implement `RecycleBinController` – list by type, restore, permanent delete
- [ ] Implement `AuditService` – log every admin action with old/new value
- [ ] Wire warning creation into notification pipeline

### Frontend Tasks
- [ ] Build `AdminLayout.jsx` – fixed sidebar + header
- [ ] Build `AdminDashboardPage.jsx` – stat cards + recent activity
- [ ] Build `AdminUsersPage.jsx` – table with search/filter/suspend
- [ ] Build `AdminUserDetailPage.jsx` – profile view + content overview + actions
- [ ] Build `AdminProjectsPage.jsx`, `AdminPostsPage.jsx`, `AdminBlogsPage.jsx` – table + toggle
- [ ] Build `AdminCategoriesPage.jsx` – CRUD + active toggle
- [ ] Build `AdminReportsPage.jsx` – list + status filter + resolve action
- [ ] Build `AdminWarningsPage.jsx` – send warning modal + warning list
- [ ] Build `AdminRecycleBinPage.jsx` – filter by type + restore + permanent delete
- [ ] Build `AdminAuditLogsPage.jsx` – table with filters
- [ ] Build `AdminToggle.jsx` (active/inactive), `AdminTable.jsx`, `AdminStatCard.jsx`
- [ ] Build `AdminExportButton.jsx`

### Database Tasks
- [ ] Confirm `audit_logs` table indexes
- [ ] Confirm `warnings` table and linked `notifications`

---

## Phase 8 – PDF Export, Search, Feed Refinement, Landing Page
**Objective:** Export works, search/filter is complete, landing page is polished.

### Backend Tasks
- [ ] Implement `ExportController` + `ExportService` using iText/Apache PDFBox
  - Exports: users, projects, posts, blogs, reports, warnings, recycle-bin, single user
- [ ] Implement `SearchController` – universal search across users/projects/posts/blogs
- [ ] Implement `FeedController` – feed from followed users (projects + posts + blogs merged)
- [ ] Implement `LandingController` – featured projects, latest posts, blogs, top contributors for public page

### Frontend Tasks
- [ ] Build `AdminExportPage.jsx` – module selection + PDF download
- [ ] Build `SearchPage.jsx` – unified search results with type tabs
- [ ] Refine `HomePage.jsx` feed – followed user content with sort and infinite scroll
- [ ] Build `LandingPage.jsx` – all sections (Hero, About, Benefits, Featured Projects, Posts, Blogs, Contributors, How It Works, CTA, Footer)
- [ ] Build `CategoryFilterBar.jsx` with tag filter chips
- [ ] Implement infinite scroll or pagination on all list pages

---

## Phase 9 – UI Polish, QA, Performance, Deployment Prep
**Objective:** Platform is production-ready.

### Frontend Tasks
- [ ] Framer Motion page transitions and micro-interactions
- [ ] Skeleton loading states for all cards and lists
- [ ] Empty state illustrations for all list views
- [ ] Error boundary for all critical components
- [ ] Responsive layout audit (mobile, tablet, desktop)
- [ ] Accessibility audit (ARIA labels, keyboard navigation)
- [ ] SEO tags on all pages

### Backend Tasks
- [ ] Input validation review on all endpoints
- [ ] Rate limiting on auth endpoints
- [ ] Request logging middleware
- [ ] DB connection pool tuning
- [ ] JWT secret security review
- [ ] CORS final config for production URL

### Testing
- [ ] Unit tests: Service layer (JUnit 5 + Mockito)
- [ ] Integration tests: Controller layer (Spring Boot Test + MockMvc)
- [ ] E2E: Auth flow, project create, like, notify, chat
- [ ] Browser testing: Cross-browser, mobile viewport

### Deployment Prep
- [ ] Environment variables documented in `.env.example`
- [ ] Docker Compose for MySQL + Spring Boot + React (optional)
- [ ] Spring Boot production profile with prod DB URL
- [ ] Nginx config for React SPA routing + reverse proxy to Spring Boot
- [ ] Media storage: local path or S3 bucket configuration
- [ ] Admin seed account setup documented
- [ ] Backup and restore plan for MySQL

---

## Phase Summary

| Phase | Focus                                    | Estimated Effort |
|-------|------------------------------------------|------------------|
| 1     | Architecture & Design                    | 1 week           |
| 2     | Setup + Auth + Shared Layout             | 1.5 weeks        |
| 3     | Profile + Category + Media               | 1 week           |
| 4     | Projects + Posts + Blogs CRUD            | 2 weeks          |
| 5     | Interactions (Like/Comment/Save/Follow)  | 1.5 weeks        |
| 6     | WebSocket + Notifications + Chat         | 2 weeks          |
| 7     | Admin Dashboard + Moderation             | 2 weeks          |
| 8     | PDF Export + Search + Landing Page       | 1 week           |
| 9     | Polish + QA + Deployment                 | 1.5 weeks        |
| **Total** |                                      | **~14 weeks**    |
