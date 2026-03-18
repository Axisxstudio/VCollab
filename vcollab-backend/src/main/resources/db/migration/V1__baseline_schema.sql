CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_username (username),
    KEY idx_users_role (role),
    KEY idx_users_active (is_active, is_suspended),
    KEY idx_users_deleted_at (deleted_at)
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    bio TEXT NULL,
    profile_image VARCHAR(255) NULL,
    cover_image VARCHAR(255) NULL,
    department VARCHAR(255) NULL,
    year_of_study VARCHAR(255) NULL,
    institution VARCHAR(255) NULL,
    skills TEXT NULL,
    github_url VARCHAR(255) NULL,
    linkedin_url VARCHAR(255) NULL,
    website_url VARCHAR(255) NULL,
    follower_count INT NOT NULL DEFAULT 0,
    following_count INT NOT NULL DEFAULT 0,
    project_count INT NOT NULL DEFAULT 0,
    post_count INT NOT NULL DEFAULT 0,
    blog_count INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_profiles_user (user_id),
    CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_system_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_categories_slug (slug),
    KEY idx_categories_type_active (type, is_active),
    KEY idx_categories_deleted_at (deleted_at),
    CONSTRAINT fk_categories_created_by FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS projects (
    id BIGINT NOT NULL AUTO_INCREMENT,
    owner_id BIGINT NOT NULL,
    category_id BIGINT NULL,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(520) NOT NULL,
    short_desc VARCHAR(1000) NULL,
    full_desc LONGTEXT NULL,
    tech_stack TEXT NULL,
    tags TEXT NULL,
    github_url VARCHAR(255) NULL,
    demo_url VARCHAR(255) NULL,
    thumbnail VARCHAR(255) NULL,
    visibility VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    like_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    save_count INT NOT NULL DEFAULT 0,
    share_count INT NOT NULL DEFAULT 0,
    view_count INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    KEY idx_projects_owner (owner_id),
    KEY idx_projects_category (category_id),
    KEY idx_projects_visibility_active (visibility, is_active, deleted_at),
    KEY idx_projects_created_at (created_at),
    CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users (id),
    CONSTRAINT fk_projects_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE IF NOT EXISTS project_media (
    id BIGINT NOT NULL AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    url VARCHAR(1000) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NULL,
    file_size BIGINT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_project_media_project (project_id, sort_order),
    CONSTRAINT fk_project_media_project FOREIGN KEY (project_id) REFERENCES projects (id)
);

CREATE TABLE IF NOT EXISTS posts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    author_id BIGINT NOT NULL,
    category_id BIGINT NULL,
    content LONGTEXT NOT NULL,
    post_type VARCHAR(50) NOT NULL,
    tags TEXT NULL,
    visibility VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    like_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    save_count INT NOT NULL DEFAULT 0,
    share_count INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    KEY idx_posts_author (author_id),
    KEY idx_posts_category (category_id),
    KEY idx_posts_visibility_active (visibility, is_active, deleted_at),
    KEY idx_posts_created_at (created_at),
    CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users (id),
    CONSTRAINT fk_posts_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE IF NOT EXISTS post_media (
    id BIGINT NOT NULL AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    url VARCHAR(1000) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_post_media_post (post_id, sort_order),
    CONSTRAINT fk_post_media_post FOREIGN KEY (post_id) REFERENCES posts (id)
);

CREATE TABLE IF NOT EXISTS blogs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    author_id BIGINT NOT NULL,
    category_id BIGINT NULL,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(520) NOT NULL,
    cover_image VARCHAR(255) NULL,
    content LONGTEXT NOT NULL,
    tags TEXT NULL,
    visibility VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    like_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    save_count INT NOT NULL DEFAULT 0,
    share_count INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    KEY idx_blogs_author (author_id),
    KEY idx_blogs_category (category_id),
    KEY idx_blogs_visibility_active (visibility, is_active, deleted_at),
    KEY idx_blogs_created_at (created_at),
    CONSTRAINT fk_blogs_author FOREIGN KEY (author_id) REFERENCES users (id),
    CONSTRAINT fk_blogs_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE IF NOT EXISTS blog_media (
    id BIGINT NOT NULL AUTO_INCREMENT,
    blog_id BIGINT NOT NULL,
    url VARCHAR(1000) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_blog_media_blog (blog_id, sort_order),
    CONSTRAINT fk_blog_media_blog FOREIGN KEY (blog_id) REFERENCES blogs (id)
);

CREATE TABLE IF NOT EXISTS comments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    author_id BIGINT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_id BIGINT NOT NULL,
    parent_id BIGINT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    KEY idx_comments_content (content_type, content_id),
    KEY idx_comments_author (author_id),
    KEY idx_comments_parent (parent_id),
    CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users (id),
    CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments (id)
);

CREATE TABLE IF NOT EXISTS likes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_likes_user_content (user_id, content_type, content_id),
    KEY idx_likes_content (content_type, content_id),
    CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS saves (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_saves_user_content (user_id, content_type, content_id),
    KEY idx_saves_content (content_type, content_id),
    CONSTRAINT fk_saves_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS shares (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_shares_user_content (user_id, content_type, content_id),
    KEY idx_shares_content (content_type, content_id),
    CONSTRAINT fk_shares_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS follows (
    id BIGINT NOT NULL AUTO_INCREMENT,
    follower_id BIGINT NOT NULL,
    following_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_follows_pair (follower_id, following_id),
    KEY idx_follows_following (following_id),
    CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id) REFERENCES users (id),
    CONSTRAINT fk_follows_following FOREIGN KEY (following_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS project_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    requester_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    message TEXT NULL,
    status VARCHAR(50) NOT NULL,
    responded_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_project_requests_unique (project_id, requester_id),
    KEY idx_project_requests_owner (owner_id, status),
    CONSTRAINT fk_project_requests_project FOREIGN KEY (project_id) REFERENCES projects (id),
    CONSTRAINT fk_project_requests_requester FOREIGN KEY (requester_id) REFERENCES users (id),
    CONSTRAINT fk_project_requests_owner FOREIGN KEY (owner_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    KEY idx_conversations_updated_at (updated_at),
    CONSTRAINT fk_conversations_created_by FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS conversation_members (
    id BIGINT NOT NULL AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    last_read_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_conversation_members_pair (conversation_id, user_id),
    KEY idx_conversation_members_user (user_id),
    CONSTRAINT fk_conversation_members_conversation FOREIGN KEY (conversation_id) REFERENCES conversations (id),
    CONSTRAINT fk_conversation_members_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS messages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    KEY idx_messages_conversation_created (conversation_id, created_at),
    KEY idx_messages_sender (sender_id),
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations (id),
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    recipient_id BIGINT NOT NULL,
    actor_id BIGINT NULL,
    type VARCHAR(50) NOT NULL,
    content_type VARCHAR(50) NULL,
    content_id BIGINT NULL,
    message TEXT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    KEY idx_notifications_recipient_read (recipient_id, is_read, created_at),
    KEY idx_notifications_content (content_type, content_id),
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users (id),
    CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS reports (
    id BIGINT NOT NULL AUTO_INCREMENT,
    reporter_id BIGINT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_id BIGINT NOT NULL,
    reason VARCHAR(50) NOT NULL,
    description TEXT NULL,
    status VARCHAR(50) NOT NULL,
    admin_note TEXT NULL,
    resolved_by BIGINT NULL,
    resolved_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    KEY idx_reports_status_created (status, created_at),
    KEY idx_reports_content (content_type, content_id),
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users (id),
    CONSTRAINT fk_reports_resolved_by FOREIGN KEY (resolved_by) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS warnings (
    id BIGINT NOT NULL AUTO_INCREMENT,
    target_user_id BIGINT NOT NULL,
    content_type VARCHAR(50) NULL,
    content_id BIGINT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reason TEXT NULL,
    status VARCHAR(50) NOT NULL,
    acknowledged_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    KEY idx_warnings_target_status (target_user_id, status),
    CONSTRAINT fk_warnings_target_user FOREIGN KEY (target_user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    actor_id BIGINT NULL,
    module_name VARCHAR(100) NOT NULL,
    action_name VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NULL,
    target_id BIGINT NULL,
    summary VARCHAR(500) NULL,
    metadata TEXT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    KEY idx_audit_logs_module_action (module_name, action_name, created_at),
    KEY idx_audit_logs_target (target_type, target_id),
    CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    token VARCHAR(128) NOT NULL,
    user_id BIGINT NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    used_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_password_reset_tokens_token (token),
    KEY idx_password_reset_tokens_user (user_id),
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS cms_blocks (
    id BIGINT NOT NULL AUTO_INCREMENT,
    section_key VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(400) NULL,
    body LONGTEXT NOT NULL,
    badge VARCHAR(120) NULL,
    cta_label VARCHAR(120) NULL,
    cta_url VARCHAR(400) NULL,
    theme_tone VARCHAR(60) NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_public_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    KEY idx_cms_blocks_section_order (section_key, display_order),
    KEY idx_cms_blocks_public (is_active, is_public_visible, deleted_at)
);
