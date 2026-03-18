# VCollab – Database Schema Design

---

## Strategy Summary

- **Database**: MySQL 8.x
- **Soft Delete**: All major entities use `deleted_at DATETIME NULL` + `deleted_by BIGINT NULL`
- **Audit**: Separate `audit_logs` table for admin actions
- **Interaction Tables**: Separate normalized tables (not polymorphic) for likes, saves, shares, comments for query performance and indexing clarity
- **Tags**: Separate `tags` table with `content_tags` junction table using `content_type` discriminator
- **Categories**: Type-aware, reusable across PROJECT / POST / BLOG
- **Notifications**: Persistent with WebSocket delivery, `ref_type` discriminator
- **Recycle Bin**: Logical view over `deleted_at IS NOT NULL` rows; no separate table needed for content
- **Media**: Separate `_media` tables per content type for clean association

---

## Entity List & Table Purposes

| Table               | Purpose                                                        |
|---------------------|----------------------------------------------------------------|
| users               | Core user accounts (auth, role, status)                        |
| user_profiles       | Extended profile data (bio, links, image, cover)               |
| categories          | Reusable type-aware taxonomy                                   |
| tags                | Reusable labels for content                                    |
| content_tags        | Junction: tag ↔ content (project/post/blog)                    |
| projects            | Project entities                                               |
| project_media       | Images/videos for projects                                     |
| posts               | Social posts                                                   |
| post_media          | Images/videos for posts                                        |
| blogs               | Long-form articles                                             |
| blog_media          | Images/videos for blogs                                        |
| comments            | Comments on projects, posts, blogs (with parent for nesting)   |
| likes               | Likes on projects, posts, blogs                                |
| saves               | Saves/bookmarks on projects, posts, blogs                      |
| shares              | Share tracking on projects, posts, blogs                       |
| follows             | Follower/following relationships                               |
| project_requests    | Project collaboration requests                                 |
| project_request_attachments | Files attached to project requests                   |
| conversations       | Chat conversations                                             |
| conversation_members| Users in a conversation                                        |
| messages            | Individual chat messages                                       |
| notifications       | Persistent notification records                                |
| reports             | User-submitted content reports                                 |
| warnings            | Admin warnings issued to users                                 |
| audit_logs          | Admin action tracking                                          |

---

## Pseudo-DDL (MySQL-style)

### users
```sql
CREATE TABLE users (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  username        VARCHAR(100) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('SUPER_ADMIN','STUDENT','INDUSTRIAL_EXPERT','SOFTWARE_ENGINEER') NOT NULL DEFAULT 'STUDENT',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_suspended    BOOLEAN NOT NULL DEFAULT FALSE,
  suspended_at    DATETIME NULL,
  suspension_reason TEXT NULL,
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at   DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME NULL,
  deleted_by      BIGINT NULL,
  INDEX idx_users_role (role),
  INDEX idx_users_active (is_active),
  INDEX idx_users_email (email),
  INDEX idx_users_username (username),
  INDEX idx_users_deleted (deleted_at)
);
```

### user_profiles
```sql
CREATE TABLE user_profiles (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT NOT NULL UNIQUE,
  full_name       VARCHAR(255) NOT NULL,
  bio             TEXT NULL,
  profile_image   VARCHAR(500) NULL,
  cover_image     VARCHAR(500) NULL,
  department      VARCHAR(255) NULL,
  year_of_study   VARCHAR(50) NULL,
  institution     VARCHAR(255) NULL,
  skills          TEXT NULL,          -- JSON array or comma-separated
  github_url      VARCHAR(500) NULL,
  linkedin_url    VARCHAR(500) NULL,
  website_url     VARCHAR(500) NULL,
  follower_count  INT NOT NULL DEFAULT 0,
  following_count INT NOT NULL DEFAULT 0,
  project_count   INT NOT NULL DEFAULT 0,
  post_count      INT NOT NULL DEFAULT 0,
  blog_count      INT NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_profiles_user (user_id)
);
```

### categories
```sql
CREATE TABLE categories (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(200) NOT NULL,
  slug              VARCHAR(220) NOT NULL UNIQUE,
  type              ENUM('PROJECT','POST','BLOG','ALL') NOT NULL DEFAULT 'ALL',
  is_system_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_by        BIGINT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_categories_type (type),
  INDEX idx_categories_active (is_active),
  UNIQUE KEY uq_category_name_type (name, type)
);
```

### tags
```sql
CREATE TABLE tags (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  slug       VARCHAR(120) NOT NULL UNIQUE,
  usage_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### content_tags
```sql
CREATE TABLE content_tags (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  tag_id       BIGINT NOT NULL,
  content_type ENUM('PROJECT','POST','BLOG') NOT NULL,
  content_id   BIGINT NOT NULL,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE KEY uq_content_tag (tag_id, content_type, content_id),
  INDEX idx_content_tags_content (content_type, content_id),
  INDEX idx_content_tags_tag (tag_id)
);
```

### projects
```sql
CREATE TABLE projects (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  owner_id        BIGINT NOT NULL,
  category_id     BIGINT NULL,
  title           VARCHAR(500) NOT NULL,
  slug            VARCHAR(520) NOT NULL UNIQUE,
  short_desc      VARCHAR(1000) NULL,
  full_desc       LONGTEXT NULL,
  tech_stack      TEXT NULL,            -- JSON array
  github_url      VARCHAR(500) NULL,
  demo_url        VARCHAR(500) NULL,
  thumbnail       VARCHAR(500) NULL,
  visibility      ENUM('PUBLIC','PRIVATE') NOT NULL DEFAULT 'PUBLIC',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  like_count      INT NOT NULL DEFAULT 0,
  comment_count   INT NOT NULL DEFAULT 0,
  save_count      INT NOT NULL DEFAULT 0,
  share_count     INT NOT NULL DEFAULT 0,
  view_count      INT NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME NULL,
  deleted_by      BIGINT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_projects_owner (owner_id),
  INDEX idx_projects_category (category_id),
  INDEX idx_projects_visibility (visibility),
  INDEX idx_projects_active (is_active),
  INDEX idx_projects_deleted (deleted_at),
  FULLTEXT INDEX ft_projects_title_desc (title, short_desc)
);
```

### project_media
```sql
CREATE TABLE project_media (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id   BIGINT NOT NULL,
  url          VARCHAR(1000) NOT NULL,
  media_type   ENUM('IMAGE','VIDEO') NOT NULL,
  file_name    VARCHAR(500) NULL,
  file_size    BIGINT NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_media_proj (project_id)
);
```

### posts
```sql
CREATE TABLE posts (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  author_id     BIGINT NOT NULL,
  category_id   BIGINT NULL,
  content       LONGTEXT NOT NULL,
  post_type     ENUM('TEXT','IMAGE','VIDEO','ANNOUNCEMENT') NOT NULL DEFAULT 'TEXT',
  visibility    ENUM('PUBLIC','PRIVATE') NOT NULL DEFAULT 'PUBLIC',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  like_count    INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  save_count    INT NOT NULL DEFAULT 0,
  share_count   INT NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME NULL,
  deleted_by    BIGINT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_posts_author (author_id),
  INDEX idx_posts_deleted (deleted_at),
  FULLTEXT INDEX ft_posts_content (content)
);
```

### post_media
```sql
CREATE TABLE post_media (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id    BIGINT NOT NULL,
  url        VARCHAR(1000) NOT NULL,
  media_type ENUM('IMAGE','VIDEO') NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
```

### blogs
```sql
CREATE TABLE blogs (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  author_id     BIGINT NOT NULL,
  category_id   BIGINT NULL,
  title         VARCHAR(500) NOT NULL,
  slug          VARCHAR(520) NOT NULL UNIQUE,
  cover_image   VARCHAR(500) NULL,
  content       LONGTEXT NOT NULL,
  visibility    ENUM('PUBLIC','PRIVATE') NOT NULL DEFAULT 'PUBLIC',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  like_count    INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  save_count    INT NOT NULL DEFAULT 0,
  share_count   INT NOT NULL DEFAULT 0,
  read_time_mins INT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME NULL,
  deleted_by    BIGINT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_blogs_author (author_id),
  INDEX idx_blogs_deleted (deleted_at),
  FULLTEXT INDEX ft_blogs_title_content (title, content)
);
```

### blog_media
```sql
CREATE TABLE blog_media (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  blog_id    BIGINT NOT NULL,
  url        VARCHAR(1000) NOT NULL,
  media_type ENUM('IMAGE','VIDEO') NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE
);
```

### comments
```sql
CREATE TABLE comments (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  author_id    BIGINT NOT NULL,
  content_type ENUM('PROJECT','POST','BLOG') NOT NULL,
  content_id   BIGINT NOT NULL,
  parent_id    BIGINT NULL,               -- NULL = top-level, non-null = reply
  body         TEXT NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   DATETIME NULL,
  deleted_by   BIGINT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_comments_content (content_type, content_id),
  INDEX idx_comments_parent (parent_id),
  INDEX idx_comments_author (author_id),
  INDEX idx_comments_deleted (deleted_at)
);
```

### likes
```sql
CREATE TABLE likes (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT NOT NULL,
  content_type ENUM('PROJECT','POST','BLOG') NOT NULL,
  content_id   BIGINT NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_like (user_id, content_type, content_id),
  INDEX idx_likes_content (content_type, content_id),
  INDEX idx_likes_user (user_id)
);
```

### saves
```sql
CREATE TABLE saves (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT NOT NULL,
  content_type ENUM('PROJECT','POST','BLOG') NOT NULL,
  content_id   BIGINT NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_save (user_id, content_type, content_id),
  INDEX idx_saves_user (user_id),
  INDEX idx_saves_content (content_type, content_id)
);
```

### shares
```sql
CREATE TABLE shares (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT NOT NULL,
  content_type ENUM('PROJECT','POST','BLOG') NOT NULL,
  content_id   BIGINT NOT NULL,
  shared_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_shares_content (content_type, content_id),
  INDEX idx_shares_user (user_id)
);
```

### follows
```sql
CREATE TABLE follows (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  follower_id  BIGINT NOT NULL,
  following_id BIGINT NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_follow (follower_id, following_id),
  INDEX idx_follows_follower (follower_id),
  INDEX idx_follows_following (following_id)
);
```

### project_requests
```sql
CREATE TABLE project_requests (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  requester_id BIGINT NOT NULL,
  project_id   BIGINT NOT NULL,
  message      TEXT NULL,
  status       ENUM('PENDING','ACCEPTED','REJECTED') NOT NULL DEFAULT 'PENDING',
  responded_at DATETIME NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY uq_request (requester_id, project_id),
  INDEX idx_requests_project (project_id),
  INDEX idx_requests_requester (requester_id),
  INDEX idx_requests_status (status)
);
```

### project_request_attachments
```sql
CREATE TABLE project_request_attachments (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  request_id  BIGINT NOT NULL,
  url         VARCHAR(1000) NOT NULL,
  file_name   VARCHAR(500) NULL,
  file_type   VARCHAR(100) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES project_requests(id) ON DELETE CASCADE
);
```

### conversations
```sql
CREATE TABLE conversations (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  last_message_id BIGINT NULL,
  last_message_at DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conversations_last_msg (last_message_at)
);
```

### conversation_members
```sql
CREATE TABLE conversation_members (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  user_id         BIGINT NOT NULL,
  unread_count    INT NOT NULL DEFAULT 0,
  last_read_at    DATETIME NULL,
  joined_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_member (conversation_id, user_id),
  INDEX idx_conv_members_user (user_id)
);
```

### messages
```sql
CREATE TABLE messages (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  sender_id       BIGINT NOT NULL,
  body            TEXT NULL,
  media_url       VARCHAR(1000) NULL,
  media_type      ENUM('IMAGE','VIDEO','FILE') NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at      DATETIME NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  INDEX idx_messages_conv (conversation_id),
  INDEX idx_messages_sender (sender_id),
  INDEX idx_messages_created (created_at)
);
```

### notifications
```sql
CREATE TABLE notifications (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  recipient_id BIGINT NOT NULL,
  sender_id    BIGINT NULL,
  type         ENUM('LIKE','COMMENT','FOLLOW','MESSAGE','PROJECT_REQUEST',
                    'PROJECT_REQUEST_ACCEPTED','PROJECT_REQUEST_REJECTED',
                    'ADMIN_WARNING','REPORT_RESULT','CONTENT_MODERATED') NOT NULL,
  title        VARCHAR(500) NULL,
  message      TEXT NOT NULL,
  ref_type     ENUM('PROJECT','POST','BLOG','COMMENT','MESSAGE','USER','WARNING','REPORT') NULL,
  ref_id       BIGINT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  read_at      DATETIME NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_notifs_recipient (recipient_id),
  INDEX idx_notifs_read (is_read),
  INDEX idx_notifs_type (type),
  INDEX idx_notifs_created (created_at)
);
```

### reports
```sql
CREATE TABLE reports (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  reporter_id  BIGINT NOT NULL,
  content_type ENUM('PROJECT','POST','BLOG','COMMENT','USER') NOT NULL,
  content_id   BIGINT NOT NULL,
  reason       ENUM('SPAM','ABUSE','INAPPROPRIATE','COPYRIGHT','FAKE_MISLEADING','OTHER') NOT NULL,
  description  TEXT NULL,
  status       ENUM('PENDING','REVIEWED','DISMISSED','ACTION_TAKEN') NOT NULL DEFAULT 'PENDING',
  reviewed_by  BIGINT NULL,
  reviewed_at  DATETIME NULL,
  admin_notes  TEXT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_reports_status (status),
  INDEX idx_reports_content (content_type, content_id),
  INDEX idx_reports_reporter (reporter_id)
);
```

### warnings
```sql
CREATE TABLE warnings (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  admin_id        BIGINT NOT NULL,
  target_user_id  BIGINT NOT NULL,
  title           VARCHAR(500) NOT NULL,
  message         TEXT NOT NULL,
  reason          VARCHAR(500) NULL,
  ref_type        ENUM('PROJECT','POST','BLOG','COMMENT','USER') NULL,
  ref_id          BIGINT NULL,
  is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_at DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_warnings_target (target_user_id),
  INDEX idx_warnings_admin (admin_id)
);
```

### audit_logs
```sql
CREATE TABLE audit_logs (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  admin_id     BIGINT NOT NULL,
  action_type  ENUM('USER_SUSPENDED','USER_RESTORED','CONTENT_DELETED',
                    'CONTENT_RESTORED','CONTENT_TOGGLED','WARNING_SENT',
                    'REPORT_RESOLVED','CATEGORY_MODIFIED','PERMANENT_DELETE') NOT NULL,
  target_type  ENUM('USER','PROJECT','POST','BLOG','COMMENT','CATEGORY','REPORT','WARNING') NOT NULL,
  target_id    BIGINT NOT NULL,
  description  TEXT NULL,
  old_value    JSON NULL,
  new_value    JSON NULL,
  ip_address   VARCHAR(50) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  INDEX idx_audit_admin (admin_id),
  INDEX idx_audit_target (target_type, target_id),
  INDEX idx_audit_action (action_type),
  INDEX idx_audit_created (created_at)
);
```

---

## Seed Data

### Roles (handled via ENUM in users table)
```sql
-- Roles are enforced as ENUM values in the users table
-- 'SUPER_ADMIN', 'STUDENT', 'INDUSTRIAL_EXPERT', 'SOFTWARE_ENGINEER'
```

### Default Admin User Seed
```sql
INSERT INTO users (email, username, password_hash, role, is_active, email_verified)
VALUES ('admin@vcollab.com', 'superadmin', '<bcrypt_hash>', 'SUPER_ADMIN', TRUE, TRUE);

INSERT INTO user_profiles (user_id, full_name) VALUES (1, 'VCollab Admin');
```

### Default Categories Seed
```sql
INSERT INTO categories (name, slug, type, is_system_default, is_active)
VALUES
  ('1st Year',   '1st-year',   'PROJECT', TRUE, TRUE),
  ('2nd Year',   '2nd-year',   'PROJECT', TRUE, TRUE),
  ('3rd Year',   '3rd-year',   'PROJECT', TRUE, TRUE),
  ('4th Year',   '4th-year',   'PROJECT', TRUE, TRUE),
  ('Other',      'other',      'PROJECT', TRUE, TRUE),
  ('General',    'general',    'POST',    TRUE, TRUE),
  ('Announcement','announcement','POST',  TRUE, TRUE),
  ('Tutorial',   'tutorial',   'BLOG',    TRUE, TRUE),
  ('Case Study', 'case-study', 'BLOG',    TRUE, TRUE),
  ('Technology', 'technology', 'ALL',     TRUE, TRUE),
  ('Career',     'career',     'ALL',     TRUE, TRUE);
```

---

## Key Architecture Decisions

### Why Separate Interaction Tables (Not Polymorphic)?
- Separate `likes`, `saves`, `shares` tables with `content_type` ENUM and `content_id` are used
- This allows: indexing per content type, simple count queries, easy foreign key reasoning
- Full polymorphism (with no FK constraints) sacrifices data integrity for flexibility – not recommended for a production system

### Why Separate `_media` Tables?
- Clean cascade delete behavior
- Independent ordering per content type
- No cross-content media pollution

### Soft Delete Strategy
```
Content lifecycle:
  ACTIVE     → deleted_at IS NULL
  SOFT DELETE → deleted_at = NOW(), deleted_by = userId
  RESTORED   → deleted_at = NULL, deleted_by = NULL
  HARD DELETE → physical row removal (admin only)

Queries always include: WHERE deleted_at IS NULL
RecycleBin queries: WHERE deleted_at IS NOT NULL
```

### Counter Denormalization Strategy
- `like_count`, `comment_count`, `save_count`, `share_count` are denormalized on content tables
- Updated via service layer triggered by interaction create/delete
- Avoids expensive COUNT(*) queries on every card render
- Periodic reconciliation job recommended for production

---

## ERD Summary (Relationships)

```
users ──────────────── user_profiles (1:1)
users ──────────────── projects (1:N)
users ──────────────── posts (1:N)
users ──────────────── blogs (1:N)
users ──────────────── follows (N:M via follows table)
users ──────────────── conversations (N:M via conversation_members)
categories ─────────── projects, posts, blogs (1:N)
tags ────────────────── content_tags ─── projects/posts/blogs (N:M)
projects ────────────── project_media (1:N)
posts ───────────────── post_media (1:N)
blogs ───────────────── blog_media (1:N)
projects/posts/blogs ── comments (polymorphic via content_type)
projects/posts/blogs ── likes (polymorphic via content_type)
projects/posts/blogs ── saves (polymorphic via content_type)
projects/posts/blogs ── shares (polymorphic via content_type)
projects ────────────── project_requests (1:N)
project_requests ─────── project_request_attachments (1:N)
conversations ────────── messages (1:N)
users ──────────────── notifications (1:N, recipient)
users ──────────────── reports (1:N, reporter)
users ──────────────── warnings (1:N, target)
users ──────────────── audit_logs (1:N, admin)
```
