export type CmsBlockRow = {
  id: number;
  section_key: string;
  title: string;
  subtitle: string | null;
  body: string;
  badge: string | null;
  cta_label: string | null;
  cta_url: string | null;
  theme_tone: string | null;
  display_order: number;
  is_active: boolean;
  is_public_visible: boolean;
  created_at: string;
  updated_at: string | null;
};

export function normalizeSectionKey(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "_");
}

export function trimToNull(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export function mapCmsBlock(row: CmsBlockRow) {
  return {
    id: row.id,
    sectionKey: row.section_key,
    title: row.title,
    subtitle: row.subtitle,
    body: row.body,
    badge: row.badge,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    themeTone: row.theme_tone,
    displayOrder: row.display_order,
    active: row.is_active,
    publicVisible: row.is_public_visible,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
