import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/server/auth/guards";
import { badRequest } from "@/server/http/errors";
import { pageBounds, toPageResponse } from "@/server/pagination/page";
import { mapCmsBlock, normalizeSectionKey, trimToNull, type CmsBlockRow } from "./mapper";

type CmsBlockInput = {
  sectionKey: string;
  title: string;
  subtitle?: string | null;
  body: string;
  badge?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  themeTone?: string | null;
  displayOrder: number;
  active: boolean;
  publicVisible: boolean;
};

type CmsBlockListInput = {
  sectionKey?: string;
  active?: boolean;
  publicVisible?: boolean;
  search?: string;
  page: number;
  size: number;
};

function cmsBlockSelect() {
  return "id,section_key,title,subtitle,body,badge,cta_label,cta_url,theme_tone,display_order,is_active,is_public_visible,created_at,updated_at";
}

function toRow(input: CmsBlockInput) {
  return {
    section_key: normalizeSectionKey(input.sectionKey),
    title: input.title.trim(),
    subtitle: trimToNull(input.subtitle),
    body: input.body.trim(),
    badge: trimToNull(input.badge),
    cta_label: trimToNull(input.ctaLabel),
    cta_url: trimToNull(input.ctaUrl),
    theme_tone: trimToNull(input.themeTone),
    display_order: input.displayOrder,
    is_active: input.active,
    is_public_visible: input.publicVisible,
  };
}

export async function listPublicCmsBlocks(sectionKey?: string) {
  let query = createSupabaseAdminClient()
    .from("cms_blocks")
    .select(cmsBlockSelect())
    .eq("is_active", true)
    .eq("is_public_visible", true)
    .is("deleted_at", null)
    .order("display_order")
    .order("created_at");

  if (sectionKey) {
    query = query.eq("section_key", normalizeSectionKey(sectionKey));
  }

  const { data, error } = await query;
  if (error) throw badRequest(error.message);
  return ((data ?? []) as unknown as CmsBlockRow[]).map(mapCmsBlock);
}

export async function listAdminCmsBlocks(request: Request, input: CmsBlockListInput) {
  await requireSuperAdmin(request);
  const bounds = pageBounds(input.page, input.size);
  let query = createSupabaseAdminClient()
    .from("cms_blocks")
    .select(cmsBlockSelect(), { count: "exact" })
    .is("deleted_at", null)
    .range(bounds.from, bounds.to)
    .order("display_order")
    .order("created_at");

  if (input.sectionKey) query = query.eq("section_key", normalizeSectionKey(input.sectionKey));
  if (input.active !== undefined) query = query.eq("is_active", input.active);
  if (input.publicVisible !== undefined) query = query.eq("is_public_visible", input.publicVisible);
  if (input.search) query = query.or(`title.ilike.%${input.search}%,subtitle.ilike.%${input.search}%,body.ilike.%${input.search}%`);

  const { data, error, count } = await query;
  if (error) throw badRequest(error.message);
  return toPageResponse(((data ?? []) as unknown as CmsBlockRow[]).map(mapCmsBlock), count ?? 0, bounds.page, bounds.size);
}

export async function createAdminCmsBlock(request: Request, input: CmsBlockInput) {
  await requireSuperAdmin(request);
  const { data, error } = await createSupabaseAdminClient()
    .from("cms_blocks")
    .insert(toRow(input))
    .select(cmsBlockSelect())
    .single();

  if (error || !data) throw badRequest(error?.message ?? "Could not create CMS block");
  return mapCmsBlock(data as unknown as CmsBlockRow);
}

export async function updateAdminCmsBlock(request: Request, id: number, input: CmsBlockInput) {
  await requireSuperAdmin(request);
  const { data, error } = await createSupabaseAdminClient()
    .from("cms_blocks")
    .update({ ...toRow(input), updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select(cmsBlockSelect())
    .single();

  if (error || !data) throw badRequest(error?.message ?? "Could not update CMS block");
  return mapCmsBlock(data as unknown as CmsBlockRow);
}
