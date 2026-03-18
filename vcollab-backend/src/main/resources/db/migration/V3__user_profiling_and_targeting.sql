-- ─────────────────────────────────────────────────────────────────────────────
-- V3: User Profiling System — Extended Fields
-- Adds DOB, education type, institution name, grade (school), academic year,
-- semester, faculty (university) to user_profiles.
-- Adds content_targeting table for audience-based content delivery.
-- Adds system_tags table for smart @mention suggestions.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── user_profiles: New profiling columns ────────────────────────────────────
ALTER TABLE user_profiles
    ADD COLUMN dob             DATE         NULL,
    ADD COLUMN education_type  VARCHAR(20)  NULL COMMENT 'SCHOOL or UNIVERSITY',
    ADD COLUMN institution_name VARCHAR(255) NULL COMMENT 'School or university name (structured)',
    ADD COLUMN grade           VARCHAR(20)  NULL COMMENT 'School: Grade 1-10, OL, AL',
    ADD COLUMN academic_year   VARCHAR(20)  NULL COMMENT 'University: Year 1-4',
    ADD COLUMN semester        VARCHAR(20)  NULL COMMENT 'University: Semester 1-2',
    ADD COLUMN faculty         VARCHAR(255) NULL COMMENT 'University: Faculty/Department';

-- ─── content_targeting ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_targeting (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    content_id       BIGINT       NOT NULL,
    content_type     VARCHAR(20)  NOT NULL COMMENT 'POST, BLOG, PROJECT',
    target_type      VARCHAR(20)  NOT NULL DEFAULT 'ALL' COMMENT 'ALL, SCHOOL, UNIVERSITY, INSTITUTION',
    grade            VARCHAR(20)  NULL,
    academic_year    VARCHAR(20)  NULL,
    semester         VARCHAR(20)  NULL,
    faculty          VARCHAR(255) NULL,
    institution_name VARCHAR(255) NULL,
    created_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at       DATETIME(6)  NULL,
    deleted_by       BIGINT       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_content_targeting (content_id, content_type),
    INDEX idx_ct_target_type (target_type),
    INDEX idx_ct_grade (grade),
    INDEX idx_ct_academic_year (academic_year),
    INDEX idx_ct_institution (institution_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── system_tags ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_tags (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    tag_name         VARCHAR(100) NOT NULL,
    tag_type         VARCHAR(20)  NOT NULL DEFAULT 'SYSTEM' COMMENT 'USER or SYSTEM',
    label            VARCHAR(255) NULL,
    mapped_attribute TEXT         NULL COMMENT 'education_type=SCHOOL&grade=Grade 10',
    icon             VARCHAR(50)  NULL,
    created_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at       DATETIME(6)  NULL,
    deleted_by       BIGINT       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tag_name (tag_name),
    FULLTEXT KEY ft_tag_search (tag_name, label)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
