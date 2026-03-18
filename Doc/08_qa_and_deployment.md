# VCollab – QA Strategy & Deployment Readiness Checklist

---

## QA Strategy Overview

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit Tests (Backend) | JUnit 5 + Mockito | Service layer business logic |
| Integration Tests | Spring Boot Test + MockMvc | Controller endpoints with DB |
| API Contract Tests | Postman Collections / REST Assured | Full request/response validation |
| Frontend Component Tests | Vitest + React Testing Library | Component behavior |
| E2E Tests | Playwright or Cypress | Critical user flows in browser |
| Manual QA | Browser + Postman | Role-based access, UI behavior |

---

## Module-by-Module QA Checklist

### ✅ Authentication
- [ ] Register with valid data → success + JWT returned
- [ ] Register with duplicate email → 409 Conflict
- [ ] Register with invalid password (too short) → 400 validation error
- [ ] Login with correct credentials → JWT returned
- [ ] Login with wrong password → 401 Unauthorized
- [ ] /auth/me with valid JWT → returns current user
- [ ] /auth/me with expired JWT → 401 Unauthorized
- [ ] /auth/me with no token → 401 Unauthorized
- [ ] Forgot password flow → email sent (test with MailHog/console logger)
- [ ] Reset password with valid token → password changed
- [ ] Reset password with expired token → 400 error
- [ ] Admin-only route accessed with STUDENT token → 403 Forbidden

### ✅ User Profiles
- [ ] GET /users/:username → public profile returns (limited fields)
- [ ] PATCH /users/me/profile → updates profile fields correctly
- [ ] PATCH /users/me/profile of another user's id → 403 Forbidden
- [ ] Profile image upload → image stored, URL returned, profile updated
- [ ] Cover image upload → same as above
- [ ] Stats counts (projects, posts, blogs) match actual counts
- [ ] Profile page shows correct tabs: Projects, Posts, Blogs, About, Saved, Connections

### ✅ Categories
- [ ] GET /categories?type=PROJECT → returns only project categories
- [ ] POST /categories with new name → category created and returned
- [ ] POST /categories with duplicate name+type → 409 Conflict
- [ ] Admin toggle category active/inactive → is_active flips
- [ ] Inline category create in project form → new category appears in dropdown
- [ ] Inactive categories → do NOT appear in user-facing dropdowns
- [ ] System default categories are present after seed

### ✅ Projects
- [ ] Create project (authenticated) → persisted, returned with owner
- [ ] Create project (unauthenticated) → 401
- [ ] Update own project → succeeds
- [ ] Update other user's project → 403
- [ ] Soft delete own project → deleted_at set, not in public list
- [ ] Admin soft delete any project → succeeds
- [ ] Toggle project to PRIVATE → not visible in public browse
- [ ] Toggle project to INACTIVE → not visible in public list
- [ ] Project list filters: category, tags, sort by NEWEST/POPULAR → correct results
- [ ] Project detail page shows all media, tags, tech stack
- [ ] GitHub URL shown only when URL is present
- [ ] Like count increments after like

### ✅ Posts
- [ ] Create text post → persisted
- [ ] Create image post with uploaded media → media attached
- [ ] Update own post → succeeds
- [ ] Soft delete post → not in feed
- [ ] Toggle post to PRIVATE → not visible to others
- [ ] Post feed: only active + public posts appear

### ✅ Blogs
- [ ] Create blog with rich content → HTML preserved
- [ ] Blog detail page renders HTML correctly
- [ ] Blog cover image appears correctly
- [ ] Slug is generated from title, unique
- [ ] Update blog → content and cover image update
- [ ] Soft delete blog → not in list

### ✅ Media Upload
- [ ] Upload valid image (JPEG/PNG/WebP) → URL returned
- [ ] Upload oversized image (>10MB) → 422 error
- [ ] Upload invalid file type (PDF) as image → 422 error
- [ ] Upload valid video (MP4) → URL returned
- [ ] Upload oversized video (>200MB) → 422 error
- [ ] Uploaded file accessible via returned URL
- [ ] Delete media file → file removed from storage

### ✅ Comments
- [ ] Post comment on project → appears in comment list
- [ ] Reply to comment → nested under parent
- [ ] Edit own comment → content updated
- [ ] Delete own comment → removed
- [ ] Delete other user's comment → 403
- [ ] Admin delete any comment → succeeds
- [ ] Comment count on project increments correctly

### ✅ Likes
- [ ] Like project → like_count increments
- [ ] Like same project again (toggle) → removes like, count decrements
- [ ] Like as unauthenticated → 401
- [ ] isLiked field in project response reflects correct state per user

### ✅ Saves
- [ ] Save project → appears in /users/me/saved
- [ ] Unsave project → removed from saved list
- [ ] Saved content private to user → other users cannot see it
- [ ] Filter saved by type (PROJECT/POST/BLOG) → correct results

### ✅ Shares
- [ ] Share project → share_count increments
- [ ] Share URL is valid public URL
- [ ] Multiple shares by same user → tracked (non-unique per user)

### ✅ Follows
- [ ] Follow user → follower_count of followed user increments
- [ ] Follow → following_count of current user increments
- [ ] Unfollow → counts decrement
- [ ] Follow self → should be prevented (400)
- [ ] isFollowing field correct in follow check endpoint

### ✅ Project Requests
- [ ] Submit request → status PENDING, owner notified
- [ ] Submit duplicate request → 409 (already requested)
- [ ] Accept request → status changes to ACCEPTED, requester notified
- [ ] Reject request → status REJECTED, requester notified
- [ ] Requester sees status in /requests/sent
- [ ] Owner sees request in /requests/received

### ✅ Notifications
- [ ] Like → owner receives like notification (real-time + persisted)
- [ ] Comment → owner receives comment notification
- [ ] Follow → target user receives follow notification
- [ ] Project request → project owner receives request notification
- [ ] Admin warning → target user receives warning notification
- [ ] Unread count correct on /notifications/unread-count
- [ ] Mark one as read → is_read = true
- [ ] Mark all as read → all notifications is_read = true
- [ ] WebSocket notification delivered in real-time to logged-in user
- [ ] Notification bell shows correct unread count

### ✅ Real-Time (WebSocket)
- [ ] Connect to WebSocket with valid JWT → connected
- [ ] Connect with invalid JWT → handshake rejected
- [ ] Subscribe to /user/queue/notifications → receives events
- [ ] Like triggers notification over WebSocket
- [ ] New message delivered over WebSocket to both users
- [ ] Typing indicator visible to conversation partner
- [ ] Reconnect after disconnect → re-subscribe works

### ✅ Chat / Messages
- [ ] Start conversation with another user → conversation created
- [ ] Start conversation with same user again → returns existing conversation
- [ ] Send message → appears in message list
- [ ] Mark conversation as read → unread count = 0
- [ ] Unread count badge on conversations list
- [ ] Last message preview shown in conversation list
- [ ] Real-time message delivery to both users

### ✅ Reports
- [ ] Report a project → report stored with PENDING status
- [ ] Report same content twice → handled (allow or 409 based on design)
- [ ] Admin list reports → all visible
- [ ] Admin resolve report → status changes to ACTION_TAKEN
- [ ] Admin dismiss report → status changes to DISMISSED
- [ ] Reporter not notified of dismissal (optionally notified of resolution)

### ✅ Warnings
- [ ] Admin send warning → warning stored, target user notified
- [ ] Target user sees warning in /warnings/me
- [ ] Warning linked to content (refType/refId) where applicable
- [ ] Multiple warnings visible in admin warnings list

### ✅ Admin Moderation
- [ ] Admin suspend user → is_suspended = true
- [ ] Suspended user login → 401 or specific error
- [ ] Admin unsuspend → is_suspended = false
- [ ] Admin soft-delete content → appears in recycle bin
- [ ] Admin toggle active/inactive → is_active flips
- [ ] Admin toggle public/private → visibility flips
- [ ] All admin actions logged in audit_logs

### ✅ Recycle Bin
- [ ] Soft-deleted projects appear in recycle bin
- [ ] Filter recycle bin by type=POST → only posts shown
- [ ] Restore project → deleted_at = null, appears in project list
- [ ] Permanent delete → row removed from DB
- [ ] Restored content maintains original owner

### ✅ PDF Export
- [ ] Export users PDF → downloads valid PDF with user table
- [ ] Export projects PDF → downloads with project data
- [ ] Export single user → PDF with profile + content summary
- [ ] Exported PDF has VCollab branding header/footer
- [ ] Filtered exports reflect filters (e.g., active users only)

### ✅ Search / Filter / Sort
- [ ] Universal search for "web app" → returns matching projects, posts, blogs, users
- [ ] Projects filter by category → correct results
- [ ] Posts filter by sort=POPULAR → sorted by like_count desc
- [ ] Blogs filter by tag → returns tagged blogs
- [ ] User search by name → correct results
- [ ] Search with empty query → returns recent content (not error)

### ✅ Public/Private Access
- [ ] Public visitor sees landing page
- [ ] Public visitor sees limited cards (3 per section)
- [ ] Public visitor clicks full project → login prompt
- [ ] Private project NOT visible to other users
- [ ] Inactive project NOT visible in public browse
- [ ] Admin can see all content regardless of visibility

### ✅ Responsive UI
- [ ] Landing page 3-col → 2-col → 1-col breakpoints
- [ ] Navbar collapses to hamburger on mobile
- [ ] Admin sidebar collapses on tablet
- [ ] Cards stack vertically on mobile (<640px)
- [ ] Forms are usable on mobile (no overflow, no tiny inputs)
- [ ] Chat window usable on mobile

### ✅ Empty / Loading / Error States
- [ ] Empty projects page shows empty state illustration + CTA
- [ ] Loading → skeleton cards shown, no flash of empty
- [ ] Network error → error state with retry button
- [ ] Form submission error → inline validation messages
- [ ] 404 route → 404 page with back button

---

## Deployment Readiness Checklist

### Environment Variables

**Backend (`application-prod.yml` or env vars):**
```yaml
spring.datasource.url: ${DB_URL}
spring.datasource.username: ${DB_USER}
spring.datasource.password: ${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto: validate  # never 'create' in prod
app.jwt.secret: ${JWT_SECRET}            # 256-bit random string
app.jwt.expiration: 86400000             # 24h ms
app.media.upload-dir: ${MEDIA_UPLOAD_DIR}
app.media.base-url: ${MEDIA_BASE_URL}
spring.mail.host: ${MAIL_HOST}
spring.mail.username: ${MAIL_USERNAME}
spring.mail.password: ${MAIL_PASSWORD}
```

**Frontend (`.env.production`):**
```
VITE_API_URL=https://api.vcollab.com/api/v1
VITE_WS_URL=wss://api.vcollab.com/ws
```

### Security Checklist
- [ ] JWT_SECRET is a randomly generated 256-bit key (never default)
- [ ] JWT_SECRET is NOT in source control
- [ ] Admin default password is strong and changed post-deploy
- [ ] CORS configured to production frontend URL only
- [ ] `spring.jpa.show-sql: false` in production
- [ ] Debug logging disabled in production
- [ ] HTTPS enforced (TLS at nginx or load balancer)

### Database Setup
- [ ] MySQL 8.x production instance provisioned
- [ ] Schema applied via Flyway migrations (or manual DDL)
- [ ] Seed data applied (admin account + default categories)
- [ ] Database user has minimal required privileges (not root)
- [ ] Regular automated backup configured (daily minimum)
- [ ] Connection pool size tuned (`spring.datasource.hikari.maximum-pool-size`)

### Media Storage
- [ ] Upload directory created and writable by Spring Boot process
- [ ] OR S3 bucket provisioned with correct bucket policy
- [ ] MEDIA_BASE_URL points to accessible CDN or static server
- [ ] File upload size limits configured in nginx and Spring Boot
  ```yaml
  spring.servlet.multipart.max-file-size: 200MB
  spring.servlet.multipart.max-request-size: 250MB
  ```

### WebSocket Deployment
- [ ] Nginx configured to support WebSocket upgrade:
  ```nginx
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  ```
- [ ] SockJS fallback configured for environments without native WS
- [ ] WebSocket endpoint protected by JWT handshake interceptor

### CORS Final Config
- [ ] `allowedOrigins` lists production frontend URL
- [ ] `allowCredentials: true`
- [ ] No wildcard `*` in production

### Admin Account Seed
- [ ] Default admin created via seed.sql
- [ ] Admin credentials documented in secure password manager
- [ ] First-login password change enforced (optional)

### Logging
- [ ] Spring Boot application logs written to file (not just console)
- [ ] Log rotation configured (max file size, max history)
- [ ] Audit logs table operational and queryable

### Monitoring Considerations
- [ ] Spring Boot Actuator endpoints enabled (health, metrics) – secured
- [ ] Application health check endpoint at `/actuator/health`
- [ ] Uptime monitoring configured (UptimeRobot or similar)
- [ ] Error rate alerting configured
- [ ] DB slow query logging enabled

### PDF Export Dependencies
- [ ] iText or Apache PDFBox dependency included in pom.xml
- [ ] PDF generation tested with real data in staging

### Pre-Launch Checklist
- [ ] All API endpoints tested via Postman collection
- [ ] All critical user flows tested E2E (register, create project, like, notify, chat)
- [ ] Mobile responsive tested on real devices or BrowserStack
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Page load time < 3s on 3G (Lighthouse audit)
- [ ] All console errors cleared
- [ ] All TODO/FIXME comments resolved
- [ ] .env.example committed to repo (no actual secrets)
- [ ] README.md with setup instructions complete
- [ ] Admin notified of credentials
