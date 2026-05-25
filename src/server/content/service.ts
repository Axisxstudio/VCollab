/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin, requireUser } from "@/server/auth/guards";
import { bearerTokenFromRequest, meFromToken } from "@/server/auth/service";
import { badRequest, forbidden, notFound } from "@/server/http/errors";
import { pageBounds, toPageResponse } from "@/server/pagination/page";
import {
  mapAdminContent,
  mapBlog,
  mapPost,
  mapProject,
  slugify,
  type ContentKind,
  type ContentRow,
} from "./mapper";

type QueryBuilder = any;

type SearchInput = {
  search?: string;
  categoryId?: number;
  tag?: string;
  owner?: string;
  fromDate?: string;
  toDate?: string;
  sort: "NEWEST" | "RECENTLY_UPDATED" | "POPULAR";
  page: number;
  size: number;
  visibility?: string;
  active?: boolean;
  deleted?: boolean;
};

const configs = {
  project: {
    table: "projects",
    ownerColumn: "owner_id",
    mediaTable: "project_media",
    mediaOwnerColumn: "project_id",
    select: `
      *,
      category:categories(id,name),
      owner:users!projects_owner_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image,education_type)),
      project_media(id,url,media_type,file_name,file_size,sort_order)
    `,
  },
  post: {
    table: "posts",
    ownerColumn: "author_id",
    mediaTable: "post_media",
    mediaOwnerColumn: "post_id",
    select: `
      *,
      category:categories(id,name),
      author:users!posts_author_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image,education_type)),
      post_media(id,url,media_type,sort_order)
    `,
  },
  blog: {
    table: "blogs",
    ownerColumn: "author_id",
    mediaTable: "blog_media",
    mediaOwnerColumn: "blog_id",
    select: `
      *,
      category:categories(id,name),
      author:users!blogs_author_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image,education_type)),
      blog_media(id,url,media_type,sort_order)
    `,
  },
} as const;

function mapperFor(kind: ContentKind): (row: ContentRow) => unknown {
  if (kind === "project") return mapProject;
  if (kind === "post") return mapPost;
  return mapBlog;
}

async function maybeUser(request: Request) {
  try {
    const token = bearerTokenFromRequest(request);
    if (!token) return null;
    return await meFromToken(token);
  } catch {
    return null;
  }
}

function applySort(query: QueryBuilder, sort: SearchInput["sort"]) {
  if (sort === "POPULAR") {
    return query.order("like_count", { ascending: false }).order("created_at", { ascending: false });
  }
  if (sort === "RECENTLY_UPDATED") {
    return query.order("updated_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  }
  return query.order("created_at", { ascending: false });
}

async function ownerIdForUsername(username: string) {
  const { data, error } = await createSupabaseAdminClient()
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (error) throw badRequest(error.message);
  return data?.id as number | undefined;
}

function applyFilters(
  query: QueryBuilder,
  kind: ContentKind,
  input: SearchInput,
  ownerId?: number,
) {
  if (input.search) {
    const columns = kind === "project"
      ? ["title", "short_desc", "full_desc", "tags"]
      : kind === "blog"
        ? ["title", "content", "tags"]
        : ["content", "tags"];
    query = query.or(columns.map((column) => `${column}.ilike.%${input.search}%`).join(","));
  }
  if (input.categoryId) query = query.eq("category_id", input.categoryId);
  if (input.tag) query = query.ilike("tags", `%${input.tag}%`);
  if (ownerId) query = query.eq(configs[kind].ownerColumn, ownerId);
  if (input.fromDate) query = query.gte("created_at", `${input.fromDate}T00:00:00.000Z`);
  if (input.toDate) query = query.lte("created_at", `${input.toDate}T23:59:59.999Z`);
  return query;
}

export async function listPublicContent(kind: ContentKind, input: SearchInput) {
  const config = configs[kind];
  const bounds = pageBounds(input.page, input.size);
  const ownerId = input.owner ? await ownerIdForUsername(input.owner) : undefined;
  if (input.owner && !ownerId) return toPageResponse([], 0, bounds.page, bounds.size);

  let query = createSupabaseAdminClient()
    .from(config.table)
    .select(config.select, { count: "exact" })
    .eq("visibility", "PUBLIC")
    .eq("is_active", true)
    .is("deleted_at", null)
    .range(bounds.from, bounds.to);

  query = applySort(applyFilters(query, kind, input, ownerId), input.sort);
  const { data, error, count } = await query;
  if (error) throw badRequest(error.message);
  return toPageResponse(((data ?? []) as unknown as ContentRow[]).map(mapperFor(kind)), count ?? 0, bounds.page, bounds.size);
}

export async function listUserContent(kind: ContentKind, username: string, request: Request, input: SearchInput) {
  const viewer = await maybeUser(request);
  const ownerId = await ownerIdForUsername(username);
  const bounds = pageBounds(input.page, input.size);
  if (!ownerId) return toPageResponse([], 0, bounds.page, bounds.size);

  let query = createSupabaseAdminClient()
    .from(configs[kind].table)
    .select(configs[kind].select, { count: "exact" })
    .eq(configs[kind].ownerColumn, ownerId)
    .is("deleted_at", null)
    .range(bounds.from, bounds.to);

  if (viewer?.id !== ownerId && viewer?.role !== "SUPER_ADMIN") {
    query = query.eq("visibility", "PUBLIC").eq("is_active", true);
  }

  query = applySort(query, input.sort);
  const { data, error, count } = await query;
  if (error) throw badRequest(error.message);
  return toPageResponse(((data ?? []) as unknown as ContentRow[]).map(mapperFor(kind)), count ?? 0, bounds.page, bounds.size);
}

async function rowById(kind: ContentKind, id: number) {
  const { data, error } = await createSupabaseAdminClient()
    .from(configs[kind].table)
    .select(configs[kind].select)
    .eq("id", id)
    .maybeSingle();
  if (error) throw badRequest(error.message);
  if (!data) throw notFound(`${kind} not found`);
  return data as unknown as ContentRow;
}

function normalizeMediaType(value: unknown) {
  const text = String(value ?? "").toUpperCase();
  if (text.includes("VIDEO")) return "VIDEO";
  if (text.includes("PDF") || text.includes("DOCUMENT") || text.includes("APPLICATION")) return "DOCUMENT";
  return "IMAGE";
}

function mediaPayload(kind: ContentKind, contentId: number, media: unknown) {
  if (!Array.isArray(media)) return [];
  const config = configs[kind];
  return media
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && Boolean((item as Record<string, unknown>).url))
    .map((item, index) => {
      const row: Record<string, unknown> = {
        [config.mediaOwnerColumn]: contentId,
        url: item.url,
        media_type: normalizeMediaType(item.mediaType),
        sort_order: Number(item.sortOrder ?? index),
      };

      if (kind === "project") {
        row.file_name = item.fileName ?? null;
        row.file_size = item.fileSize ?? null;
      }

      return row;
    });
}

async function replaceMedia(kind: ContentKind, contentId: number, media: unknown) {
  const config = configs[kind];
  const admin = createSupabaseAdminClient();
  const { error: deleteError } = await admin
    .from(config.mediaTable)
    .delete()
    .eq(config.mediaOwnerColumn, contentId);

  if (deleteError) throw badRequest(deleteError.message);

  const rows = mediaPayload(kind, contentId, media);
  if (rows.length === 0) return;

  const { error: insertError } = await admin.from(config.mediaTable).insert(rows);
  if (insertError) throw badRequest(insertError.message);
}

export async function getContent(kind: ContentKind, id: number, request: Request) {
  const row = await rowById(kind, id);
  const viewer = await maybeUser(request);
  const ownerId = kind === "project" ? row.owner?.id : row.author?.id;
  if (row.deleted_at) throw notFound(`${kind} not found`);
  if ((row.visibility !== "PUBLIC" || !row.is_active) && viewer?.id !== ownerId && viewer?.role !== "SUPER_ADMIN") {
    throw notFound(`${kind} not found`);
  }
  return mapperFor(kind)(row);
}

export async function createProject(request: Request, input: Record<string, unknown>) {
  const user = await requireUser(request);
  const now = new Date().toISOString();
  const { data, error } = await createSupabaseAdminClient().from("projects").insert({
    owner_id: user.id,
    category_id: input.categoryId ?? null,
    title: input.title,
    slug: `${slugify(String(input.title))}-${crypto.randomUUID().slice(0, 8)}`,
    short_desc: input.shortDesc ?? null,
    full_desc: input.fullDesc ?? null,
    tech_stack: JSON.stringify(input.techStack ?? []),
    tags: JSON.stringify(input.tags ?? []),
    github_url: input.githubUrl ?? null,
    demo_url: input.demoUrl ?? null,
    youtube_url: input.youtubeUrl ?? null,
    pdf_url: input.pdfUrl ?? null,
    course_url: input.courseUrl ?? null,
    thumbnail: input.thumbnail ?? null,
    visibility: input.visibility,
    is_active: input.active ?? true,
    updated_at: now,
  }).select("id").single();
  if (error || !data) throw badRequest(error?.message ?? "Could not create project");
  await replaceMedia("project", Number(data.id), input.media);
  return mapProject(await rowById("project", Number(data.id)));
}

export async function createPost(request: Request, input: Record<string, unknown>) {
  const user = await requireUser(request);
  const { data, error } = await createSupabaseAdminClient().from("posts").insert({
    author_id: user.id,
    category_id: input.categoryId ?? null,
    content: input.content,
    post_type: input.postType,
    tags: JSON.stringify(input.tags ?? []),
    visibility: input.visibility,
    is_active: input.active ?? true,
  }).select("id").single();
  if (error || !data) throw badRequest(error?.message ?? "Could not create post");
  await replaceMedia("post", Number(data.id), input.media);
  return mapPost(await rowById("post", Number(data.id)));
}

export async function createBlog(request: Request, input: Record<string, unknown>) {
  const user = await requireUser(request);
  const { data, error } = await createSupabaseAdminClient().from("blogs").insert({
    author_id: user.id,
    category_id: input.categoryId ?? null,
    title: input.title,
    slug: `${slugify(String(input.title))}-${crypto.randomUUID().slice(0, 8)}`,
    cover_image: input.coverImage ?? null,
    content: input.content,
    tags: JSON.stringify(input.tags ?? []),
    visibility: input.visibility,
    is_active: input.active ?? true,
  }).select("id").single();
  if (error || !data) throw badRequest(error?.message ?? "Could not create blog");
  await replaceMedia("blog", Number(data.id), input.media);
  return mapBlog(await rowById("blog", Number(data.id)));
}

export async function updateContent(kind: ContentKind, id: number, request: Request, input: Record<string, unknown>) {
  const user = await requireUser(request);
  const row = await rowById(kind, id);
  const ownerId = kind === "project" ? row.owner?.id : row.author?.id;
  if (ownerId !== user.id && user.role !== "SUPER_ADMIN") throw forbidden("Forbidden");
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;
  if (input.tags !== undefined) patch.tags = JSON.stringify(input.tags ?? []);
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  if (input.active !== undefined) patch.is_active = input.active;
  if (kind === "project") {
    Object.assign(patch, {
      title: input.title,
      short_desc: input.shortDesc ?? null,
      full_desc: input.fullDesc ?? null,
      tech_stack: JSON.stringify(input.techStack ?? []),
      github_url: input.githubUrl ?? null,
      demo_url: input.demoUrl ?? null,
      youtube_url: input.youtubeUrl ?? null,
      pdf_url: input.pdfUrl ?? null,
      course_url: input.courseUrl ?? null,
      thumbnail: input.thumbnail ?? null,
    });
  } else if (kind === "post") {
    Object.assign(patch, { content: input.content, post_type: input.postType });
  } else {
    Object.assign(patch, { title: input.title, cover_image: input.coverImage ?? null, content: input.content });
  }
  const { data, error } = await createSupabaseAdminClient().from(configs[kind].table).update(patch).eq("id", id).select(configs[kind].select).single();
  if (error || !data) throw badRequest(error?.message ?? `Could not update ${kind}`);
  if (input.media !== undefined) {
    await replaceMedia(kind, id, input.media);
  }
  return mapperFor(kind)(await rowById(kind, id));
}

export async function deleteContent(kind: ContentKind, id: number, request: Request) {
  const user = await requireUser(request);
  const row = await rowById(kind, id);
  const ownerId = kind === "project" ? row.owner?.id : row.author?.id;
  if (ownerId !== user.id && user.role !== "SUPER_ADMIN") throw forbidden("Forbidden");
  const { error } = await createSupabaseAdminClient()
    .from(configs[kind].table)
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
    .eq("id", id);
  if (error) throw badRequest(error.message);
}

export async function listAdminContent(kind: ContentKind, request: Request, input: SearchInput) {
  // await requireSuperAdmin(request);
  const bounds = pageBounds(input.page, input.size);
  const ownerId = input.owner ? await ownerIdForUsername(input.owner) : undefined;
  if (input.owner && !ownerId) return toPageResponse([], 0, bounds.page, bounds.size);
  let query = createSupabaseAdminClient()
    .from(configs[kind].table)
    .select(configs[kind].select, { count: "exact" })
    .range(bounds.from, bounds.to);
  query = input.deleted ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  if (input.visibility) query = query.eq("visibility", input.visibility);
  if (input.active !== undefined) query = query.eq("is_active", input.active);
  query = applySort(applyFilters(query, kind, input, ownerId), input.sort);
  const { data, error, count } = await query;
  if (error) throw badRequest(error.message);
  return toPageResponse(((data ?? []) as unknown as ContentRow[]).map((row) => mapAdminContent(row, kind)), count ?? 0, bounds.page, bounds.size);
}

export async function moderateAdminContent(kind: ContentKind, request: Request, id: number, input: { visibility?: string; active?: boolean }) {
  // await requireSuperAdmin(request);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  if (input.active !== undefined) patch.is_active = input.active;
  const { data, error } = await createSupabaseAdminClient().from(configs[kind].table).update(patch).eq("id", id).select(configs[kind].select).single();
  if (error || !data) throw badRequest(error?.message ?? `Could not update ${kind}`);
  return mapAdminContent(data as unknown as ContentRow, kind);
}

export async function adminDeleteContent(kind: ContentKind, request: Request, id: number) {
  // const user = await requireSuperAdmin(request);
  const user = await requireUser(request);
  const { data, error } = await createSupabaseAdminClient()
    .from(configs[kind].table)
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
    .eq("id", id)
    .select(configs[kind].select)
    .single();
  if (error || !data) throw badRequest(error?.message ?? `Could not delete ${kind}`);
  return mapAdminContent(data as unknown as ContentRow, kind);
}

export async function adminRestoreContent(kind: ContentKind, request: Request, id: number) {
  // await requireSuperAdmin(request);
  const { data, error } = await createSupabaseAdminClient()
    .from(configs[kind].table)
    .update({ deleted_at: null, deleted_by: null })
    .eq("id", id)
    .select(configs[kind].select)
    .single();
  if (error || !data) throw badRequest(error?.message ?? `Could not restore ${kind}`);
  return mapAdminContent(data as unknown as ContentRow, kind);
}
