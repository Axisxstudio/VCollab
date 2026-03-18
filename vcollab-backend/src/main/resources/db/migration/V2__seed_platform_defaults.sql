INSERT INTO categories (name, slug, type, is_system_default, is_active, created_at, updated_at)
SELECT '1st Year', '1st-year', 'PROJECT', TRUE, TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE slug = '1st-year' OR (name = '1st Year' AND type = 'PROJECT')
);

INSERT INTO categories (name, slug, type, is_system_default, is_active, created_at, updated_at)
SELECT '2nd Year', '2nd-year', 'PROJECT', TRUE, TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE slug = '2nd-year' OR (name = '2nd Year' AND type = 'PROJECT')
);

INSERT INTO categories (name, slug, type, is_system_default, is_active, created_at, updated_at)
SELECT '3rd Year', '3rd-year', 'PROJECT', TRUE, TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE slug = '3rd-year' OR (name = '3rd Year' AND type = 'PROJECT')
);

INSERT INTO categories (name, slug, type, is_system_default, is_active, created_at, updated_at)
SELECT '4th Year', '4th-year', 'PROJECT', TRUE, TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE slug = '4th-year' OR (name = '4th Year' AND type = 'PROJECT')
);

INSERT INTO categories (name, slug, type, is_system_default, is_active, created_at, updated_at)
SELECT 'Other', 'other', 'PROJECT', TRUE, TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE slug = 'other' OR (name = 'Other' AND type = 'PROJECT')
);

INSERT INTO categories (name, slug, type, is_system_default, is_active, created_at, updated_at)
SELECT 'Community Updates', 'community-updates', 'POST', TRUE, TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE slug = 'community-updates' OR (name = 'Community Updates' AND type = 'POST')
);

INSERT INTO categories (name, slug, type, is_system_default, is_active, created_at, updated_at)
SELECT 'Learning Notes', 'learning-notes', 'BLOG', TRUE, TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE slug = 'learning-notes' OR (name = 'Learning Notes' AND type = 'BLOG')
);

INSERT INTO cms_blocks (section_key, title, subtitle, body, badge, cta_label, cta_url, theme_tone, display_order, is_active, is_public_visible, created_at, updated_at)
SELECT
    'HERO_HIGHLIGHT',
    'Build better semester projects with the right people around you',
    'VCollab makes discovery, collaboration, and visibility feel professional from day one.',
    'Show your work, explore real student projects, and connect with peers, software engineers, and industrial experts in one platform.',
    'Student-first platform',
    'Join VCollab',
    '/register',
    'brand',
    0,
    TRUE,
    TRUE,
    NOW(6),
    NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM cms_blocks WHERE section_key = 'HERO_HIGHLIGHT' AND title = 'Build better semester projects with the right people around you'
);

INSERT INTO cms_blocks (section_key, title, subtitle, body, badge, cta_label, cta_url, theme_tone, display_order, is_active, is_public_visible, created_at, updated_at)
SELECT
    'LANDING_INFO',
    'Why students need a platform like VCollab',
    'Ideas, teammates, inspiration, and guidance should not live in separate places.',
    'VCollab brings project discovery, social interaction, rich profiles, real-time messaging, and academic visibility into one scalable product experience.',
    'Platform update',
    'Create account',
    '/register',
    'surface',
    0,
    TRUE,
    TRUE,
    NOW(6),
    NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM cms_blocks WHERE section_key = 'LANDING_INFO' AND title = 'Why students need a platform like VCollab'
);

INSERT INTO cms_blocks (section_key, title, subtitle, body, badge, cta_label, cta_url, theme_tone, display_order, is_active, is_public_visible, created_at, updated_at)
SELECT
    'VTECH_AI_SOLUTIONS',
    'VCollab by VTech AI Solutions',
    'A premium academic collaboration platform with room for future company storytelling.',
    'This block is ready for trust messaging, partnerships, roadmap notes, and broader VTech AI Solutions content managed directly by admin.',
    'Company spotlight',
    'Explore VCollab',
    '/login',
    'brand',
    0,
    TRUE,
    TRUE,
    NOW(6),
    NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM cms_blocks WHERE section_key = 'VTECH_AI_SOLUTIONS' AND title = 'VCollab by VTech AI Solutions'
);

INSERT INTO cms_blocks (section_key, title, subtitle, body, badge, cta_label, cta_url, theme_tone, display_order, is_active, is_public_visible, created_at, updated_at)
SELECT
    'FOOTER_NOTE',
    'Campus-first collaboration by VTech AI Solutions',
    NULL,
    'Future footer messaging, policy notes, trust signals, and institutional links can be managed here.',
    NULL,
    NULL,
    NULL,
    'muted',
    0,
    TRUE,
    TRUE,
    NOW(6),
    NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM cms_blocks WHERE section_key = 'FOOTER_NOTE' AND title = 'Campus-first collaboration by VTech AI Solutions'
);

