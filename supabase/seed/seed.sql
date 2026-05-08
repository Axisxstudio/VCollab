-- Minimal local seed data for Supabase development.

insert into public.categories (name, slug, type, is_system_default, is_active)
values
  ('1st Year', '1st-year', 'PROJECT', true, true),
  ('2nd Year', '2nd-year', 'PROJECT', true, true),
  ('3rd Year', '3rd-year', 'PROJECT', true, true),
  ('4th Year', '4th-year', 'PROJECT', true, true),
  ('Other', 'other', 'PROJECT', true, true),
  ('Community Updates', 'community-updates', 'POST', true, true),
  ('Learning Notes', 'learning-notes', 'BLOG', true, true)
on conflict (slug) do update
set
  name = excluded.name,
  type = excluded.type,
  is_system_default = excluded.is_system_default,
  is_active = excluded.is_active;

insert into public.cms_blocks (
  section_key,
  title,
  subtitle,
  body,
  badge,
  cta_label,
  cta_url,
  theme_tone,
  display_order,
  is_active,
  is_public_visible
)
values
  (
    'HERO_HIGHLIGHT',
    'Build better semester projects with the right people around you',
    'VCollab makes discovery, collaboration, and visibility feel professional from day one.',
    'Show your work, explore real student projects, and connect with peers, software engineers, and industrial experts in one platform.',
    'Student-first platform',
    'Join VCollab',
    '/register',
    'brand',
    0,
    true,
    true
  ),
  (
    'LANDING_INFO',
    'Why students need a platform like VCollab',
    'Ideas, teammates, inspiration, and guidance should not live in separate places.',
    'VCollab brings project discovery, social interaction, rich profiles, real-time messaging, and academic visibility into one scalable product experience.',
    'Platform update',
    'Create account',
    '/register',
    'surface',
    0,
    true,
    true
  )
on conflict do nothing;

insert into public.resource_categories (name, slug, description, icon, sort_order, active)
values
  ('Notes', 'notes', 'Study notes and structured reading material', 'NotebookPen', 1, true),
  ('Past Papers', 'past-papers', 'Past exams, quizzes, and marking guides', 'FileArchive', 2, true),
  ('Lecture Slides', 'lecture-slides', 'Lecture decks and presentation material', 'Presentation', 3, true),
  ('Research Papers', 'research-papers', 'Published papers and reference research', 'Microscope', 4, true),
  ('Tutorials', 'tutorials', 'Tutorial sheets and guided practice', 'BookOpen', 5, true),
  ('Assignments', 'assignments', 'Assignments, lab sheets, and submissions', 'ClipboardList', 6, true),
  ('Other', 'other', 'Additional academic material', 'FolderOpen', 7, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  active = excluded.active;

insert into public.platform_feature_settings (feature_key, mode, config_json)
values (
  'V_HUB',
  'ENABLED',
  '{"allowGuestView":true,"allowAttachments":false,"maxTitleLength":180,"maxBodyLength":5000,"rateLimitPerHour":10}'::jsonb
)
on conflict (feature_key) do update
set
  mode = excluded.mode,
  config_json = excluded.config_json;

with institutions(name, slug, sort_order) as (
  values
    ('SLIIT', 'sliit', 1),
    ('NSBM Green University', 'nsbm-green-university', 2),
    ('Informatics Institute of Technology', 'informatics-institute-of-technology', 3),
    ('University of Colombo', 'university-of-colombo', 4),
    ('University of Moratuwa', 'university-of-moratuwa', 5)
)
insert into public.resource_folders (
  name,
  slug,
  folder_type,
  visibility,
  active,
  system_generated,
  sort_order,
  tree_path,
  depth,
  institution_name
)
select
  name,
  slug,
  'INSTITUTION',
  'PUBLIC',
  true,
  true,
  sort_order,
  '',
  0,
  name
from institutions
on conflict do nothing;

update public.resource_folders
set tree_path = '/' || id || '/'
where parent_id is null
  and folder_type = 'INSTITUTION'
  and tree_path = '';
