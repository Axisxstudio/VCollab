INSERT INTO categories (name, slug, type, is_system_default, is_active, created_at, updated_at)
VALUES
  ('1st Year', '1st-year', 'PROJECT', TRUE, TRUE, NOW(), NOW()),
  ('2nd Year', '2nd-year', 'PROJECT', TRUE, TRUE, NOW(), NOW()),
  ('3rd Year', '3rd-year', 'PROJECT', TRUE, TRUE, NOW(), NOW()),
  ('4th Year', '4th-year', 'PROJECT', TRUE, TRUE, NOW(), NOW()),
  ('Other', 'other', 'PROJECT', TRUE, TRUE, NOW(), NOW()),
  ('General', 'general', 'POST', TRUE, TRUE, NOW(), NOW()),
  ('Announcement', 'announcement', 'POST', TRUE, TRUE, NOW(), NOW()),
  ('Tutorial', 'tutorial', 'BLOG', TRUE, TRUE, NOW(), NOW()),
  ('Case Study', 'case-study', 'BLOG', TRUE, TRUE, NOW(), NOW()),
  ('Technology', 'technology', 'ALL', TRUE, TRUE, NOW(), NOW()),
  ('Career', 'career', 'ALL', TRUE, TRUE, NOW(), NOW());
