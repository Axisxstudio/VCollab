export type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  type: string;
  is_system_default: boolean;
  is_active: boolean;
};

export function slugifyCategory(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function mapCategory(row: CategoryRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type,
    systemDefault: row.is_system_default,
    active: row.is_active,
  };
}
