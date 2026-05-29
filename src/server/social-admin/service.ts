/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin, requireUser } from "@/server/auth/guards";
import { badRequest, forbidden } from "@/server/http/errors";
import type { Role } from "@/server/auth/types";
import { pageBounds, toPageResponse } from "@/server/pagination/page";
import { parseList } from "@/server/content/mapper";

export function paramsObject(request: Request) {
  return Object.fromEntries(new URL(request.url).searchParams.entries());
}

export function idFrom(value: string, label: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest(`Invalid ${label} id`);
  return id;
}

function pageInput(request: Request, fallbackSize = 20) {
  const params = paramsObject(request);
  return pageBounds(Number(params.page ?? 0), Number(params.size ?? fallbackSize));
}

function contentTable(contentType: string) {
  const normalized = contentType.toUpperCase();
  if (normalized === "PROJECT") return "projects";
  if (normalized === "POST") return "posts";
  if (normalized === "BLOG") return "blogs";
  return null;
}

async function countRows(table: string, filters: Record<string, unknown> = {}) {
  let query = createSupabaseAdminClient().from(table).select("id", { count: "exact", head: true });
  Object.entries(filters).forEach(([key, value]) => {
    query = value === null ? query.is(key, null) : query.eq(key, value as any);
  });
  const { count } = await query;
  return count ?? 0;
}

async function updateCounter(contentType: string, contentId: number, column: string, delta: number) {
  const table = contentTable(contentType);
  if (!table) return;
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from(table).select(column).eq("id", contentId).maybeSingle();
  if (!data) return;
  await admin.from(table).update({ [column]: Math.max(0, Number((data as any)[column] ?? 0) + delta) }).eq("id", contentId);
}

import { publishUserNotification } from "@/server/realtime/publisher";

export async function createNotification(
  recipientId: number,
  actorId: number | null,
  type: string,
  contentType: string | null,
  contentId: number | null,
  message: string
) {
  if (recipientId === actorId) return; // Don't notify yourself
  
  const admin = createSupabaseAdminClient();
  const { data: newNotification } = await admin.from("notifications").insert({
    recipient_id: recipientId,
    actor_id: actorId,
    type,
    content_type: contentType,
    content_id: contentId,
    message,
    is_read: false
  }).select("*,actor:users!notifications_actor_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image))").single();

  if (newNotification) {
    const mapped = mapNotification(newNotification);
    await publishUserNotification(recipientId, mapped);
  }
}

export async function listComments(request: Request) {
  const params = paramsObject(request);
  const bounds = pageInput(request);
  const hasParentFilter = params.parentId !== undefined && params.parentId !== "";
  let query = createSupabaseAdminClient()
    .from("comments")
    .select("*,author:users!comments_author_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image))", { count: "exact" })
    .eq("content_type", String(params.contentType ?? ""))
    .eq("content_id", Number(params.contentId ?? 0))
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at");

  if (hasParentFilter) {
    query = query.eq("parent_id", Number(params.parentId)).range(bounds.from, bounds.to);
  }

  const { data, error, count } = await query;
  if (error) throw badRequest(error.message);
  const comments = (data ?? []).map(mapComment);
  const content = hasParentFilter ? comments : nestComments(comments);
  return toPageResponse(content, count ?? comments.length, bounds.page, bounds.size);
}

function mapUser(row: any) {
  const profile = Array.isArray(row?.user_profiles) ? row.user_profiles[0] : row?.user_profiles;
  return { id: row?.id ?? 0, username: row?.username ?? "", fullName: profile?.full_name ?? null, profileImage: profile?.profile_image ?? null, educationType: profile?.education_type ?? null };
}

function mapComment(row: any) {
  return {
    id: row.id,
    contentType: row.content_type,
    contentId: row.content_id,
    parentId: row.parent_id,
    content: row.content,
    imageUrl: row.image_url,
    active: row.is_active,
    author: mapUser(row.author),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    replies: [],
  };
}

function nestComments(comments: any[]) {
  const byId = new Map<number, any>();
  const roots: any[] = [];

  comments.forEach((comment) => {
    byId.set(Number(comment.id), { ...comment, replies: [] });
  });

  byId.forEach((comment) => {
    const parent = comment.parentId ? byId.get(Number(comment.parentId)) : null;
    if (parent) {
      parent.replies.push(comment);
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

async function getOwnerId(contentType: string, contentId: number): Promise<number | null> {
  const table = contentTable(contentType);
  if (!table) return null;
  const admin = createSupabaseAdminClient();
  const ownerColumn = table === "projects" ? "owner_id" : "author_id";
  const { data } = await admin.from(table).select(ownerColumn).eq("id", contentId).maybeSingle();
  return data ? (data as any)[ownerColumn] : null;
}

export async function createComment(request: Request, input: any) {
  const user = await requireUser(request);
  const parsedParentId = (input.parentId && input.parentId !== "null" && input.parentId !== "undefined")
    ? Number(input.parentId)
    : null;
  let parentComment: any = null;

  if (parsedParentId) {
    const { data: parent, error: parentError } = await createSupabaseAdminClient()
      .from("comments")
      .select("author_id,content_type,content_id")
      .eq("id", parsedParentId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();
    if (parentError) throw badRequest(parentError.message);
    if (!parent || parent.content_type !== input.contentType || Number(parent.content_id) !== Number(input.contentId)) {
      throw badRequest("Reply parent does not belong to this content item");
    }
    parentComment = parent;
  }

  const { data, error } = await createSupabaseAdminClient().from("comments").insert({
    author_id: user.id,
    content_type: input.contentType,
    content_id: Number(input.contentId),
    parent_id: parsedParentId,
    content: input.content,
    image_url: input.imageUrl ?? null,
  }).select("*,author:users!comments_author_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image))").single();
  if (error || !data) throw badRequest(error?.message ?? "Could not create comment");
  await updateCounter(input.contentType, Number(input.contentId), "comment_count", 1);

  // Notification logic
  const ownerId = await getOwnerId(input.contentType, Number(input.contentId));
  if (ownerId && ownerId !== user.id) {
    await createNotification(
      ownerId,
      user.id,
      "COMMENT",
      input.contentType,
      Number(input.contentId),
      `${user.fullName || user.username} commented on your ${input.contentType.toLowerCase()}`
    );
  }
  if (parentComment) {
    if (parentComment.author_id && parentComment.author_id !== user.id && parentComment.author_id !== ownerId) {
      await createNotification(
        parentComment.author_id,
        user.id,
        "COMMENT_REPLY",
        input.contentType,
        Number(input.contentId),
        `${user.fullName || user.username} replied to your comment`
      );
    }
  }

  return mapComment(data);
}

export async function updateComment(request: Request, id: number, input: any) {
  const user = await requireUser(request);
  const existing = await createSupabaseAdminClient().from("comments").select("author_id").eq("id", id).maybeSingle();
  if (existing.data?.author_id !== user.id && user.role !== "SUPER_ADMIN") throw forbidden("Forbidden");
  const patch: any = { content: input.content, updated_at: new Date().toISOString() };
  if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;
  const { data, error } = await createSupabaseAdminClient().from("comments").update(patch).eq("id", id).select("*,author:users!comments_author_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image))").single();
  if (error || !data) throw badRequest(error?.message ?? "Could not update comment");
  return mapComment(data);
}

export async function deleteComment(request: Request, id: number) {
  const user = await requireUser(request);
  const { data: existing } = await createSupabaseAdminClient().from("comments").select("*").eq("id", id).maybeSingle();
  if (existing?.author_id !== user.id && user.role !== "SUPER_ADMIN") throw forbidden("Forbidden");
  const { error } = await createSupabaseAdminClient().from("comments").update({ deleted_at: new Date().toISOString(), deleted_by: user.id, is_active: false }).eq("id", id);
  if (error) throw badRequest(error.message);
  if (existing) await updateCounter(existing.content_type, Number(existing.content_id), "comment_count", -1);
}

export async function interactionStatus(request: Request, table: "likes" | "saves") {
  const user = await requireUser(request);
  const params = paramsObject(request);
  const { data } = await createSupabaseAdminClient().from(table).select("id").eq("user_id", user.id).eq("content_type", params.contentType).eq("content_id", Number(params.contentId)).is("deleted_at", null).maybeSingle();
  return { active: Boolean(data), liked: table === "likes" ? Boolean(data) : undefined, saved: table === "saves" ? Boolean(data) : undefined };
}

export async function upsertInteraction(request: Request, table: "likes" | "saves" | "shares", input: any) {
  const user = await requireUser(request);
  const row = { user_id: user.id, content_type: input.contentType, content_id: input.contentId, share_type: input.shareType ?? "LINK", target_url: input.targetUrl ?? null };
  const payload = table === "shares" ? row : { user_id: row.user_id, content_type: row.content_type, content_id: row.content_id, deleted_at: null, deleted_by: null };
  const onConflict = table === "shares" ? "user_id,content_type,content_id,share_type" : "user_id,content_type,content_id";
  const { data, error } = await createSupabaseAdminClient().from(table).upsert(payload as any, { onConflict }).select("*").single();
  if (error || !data) throw badRequest(error?.message ?? `Could not save ${table}`);
  if (table !== "shares") await updateCounter(input.contentType, Number(input.contentId), table === "likes" ? "like_count" : "save_count", 1);
  if (table === "shares") await updateCounter(input.contentType, Number(input.contentId), "share_count", 1);

  // Notification logic
  if (table === "likes" || table === "shares" || table === "saves") {
    const ownerId = await getOwnerId(input.contentType, Number(input.contentId));
    if (ownerId && ownerId !== user.id) {
      const action = table === "likes" ? "liked" : table === "shares" ? "shared" : "saved";
      const type = table === "likes" ? "LIKE" : table === "shares" ? "SHARE" : "SAVE";
      await createNotification(
        ownerId,
        user.id,
        type,
        input.contentType,
        Number(input.contentId),
        `${user.fullName || user.username} ${action} your ${input.contentType.toLowerCase()}`
      );
    }
  }

  return data;
}

export async function deleteInteraction(request: Request, table: "likes" | "saves") {
  const user = await requireUser(request);
  const params = paramsObject(request);
  const { error } = await createSupabaseAdminClient().from(table).update({ deleted_at: new Date().toISOString(), deleted_by: user.id }).eq("user_id", user.id).eq("content_type", params.contentType).eq("content_id", Number(params.contentId));
  if (error) throw badRequest(error.message);
  await updateCounter(String(params.contentType), Number(params.contentId), table === "likes" ? "like_count" : "save_count", -1);
  return { active: false };
}

export async function listSaved(request: Request) {
  const user = await requireUser(request);
  const { data, error } = await createSupabaseAdminClient().from("saves").select("*").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false });
  if (error) throw badRequest(error.message);
  return data ?? [];
}

export async function follow(request: Request, targetId: number) {
  const user = await requireUser(request);
  if (user.id === targetId) throw badRequest("Cannot follow yourself");
  const { data, error } = await createSupabaseAdminClient().from("follows").upsert({ follower_id: user.id, following_id: targetId, deleted_at: null, deleted_by: null }, { onConflict: "follower_id,following_id" }).select("*").single();
  if (error || !data) throw badRequest(error?.message ?? "Could not follow user");
  return { following: true, ...data };
}

export async function unfollow(request: Request, targetId: number) {
  const user = await requireUser(request);
  const { error } = await createSupabaseAdminClient().from("follows").update({ deleted_at: new Date().toISOString(), deleted_by: user.id }).eq("follower_id", user.id).eq("following_id", targetId);
  if (error) throw badRequest(error.message);
  return { following: false };
}

export async function followStatus(request: Request) {
  const user = await requireUser(request);
  const targetId = Number(paramsObject(request).userId);
  const { data } = await createSupabaseAdminClient().from("follows").select("id").eq("follower_id", user.id).eq("following_id", targetId).is("deleted_at", null).maybeSingle();
  return { following: Boolean(data) };
}

export async function listFollowUsers(request: Request, mode: "followers" | "following") {
  const userId = Number(paramsObject(request).userId);
  const column = mode === "followers" ? "following_id" : "follower_id";
  const join = mode === "followers" ? "follower:users!follows_follower_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image))" : "following:users!follows_following_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image))";
  const { data, error } = await createSupabaseAdminClient().from("follows").select(`*,${join}`).eq(column, userId).is("deleted_at", null);
  if (error) throw badRequest(error.message);
  return (data ?? []).map((row: any) => mapUser(mode === "followers" ? row.follower : row.following));
}

export async function feed(request: Request) {
  const bounds = pageInput(request, 12);
  const admin = createSupabaseAdminClient();
  const [projects, posts, blogs] = await Promise.all([
    admin.from("projects")
      .select("*,author:users!projects_owner_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image,education_type)),project_media(id,url,media_type,sort_order)")
      .eq("visibility", "PUBLIC").eq("is_active", true).is("deleted_at", null)
      .order("created_at", { ascending: false }).limit(20),
    admin.from("posts")
      .select("*,author:users!posts_author_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image,education_type)),post_media(id,url,media_type,sort_order)")
      .eq("visibility", "PUBLIC").eq("is_active", true).is("deleted_at", null)
      .order("created_at", { ascending: false }).limit(20),
    admin.from("blogs")
      .select("*,author:users!blogs_author_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image,education_type)),blog_media(id,url,media_type,sort_order)")
      .eq("visibility", "PUBLIC").eq("is_active", true).is("deleted_at", null)
      .order("created_at", { ascending: false }).limit(20),
  ]);

  const items = [
    ...(projects.data ?? []).map((item: any) => ({
      id: item.id,
      type: "PROJECT",
      contentType: "PROJECT",
      title: item.title,
      excerpt: item.short_desc,
      thumbnailUrl: item.thumbnail,
      previewMediaUrl: item.thumbnail,
      media: (item.project_media ?? []).map((m: any) => ({
        id: m.id,
        url: m.url,
        mediaType: m.media_type,
        sortOrder: m.sort_order
      })),
      createdAt: item.created_at,
      author: mapUser(item.author),
      likeCount: item.like_count,
      commentCount: item.comment_count,
      saveCount: item.save_count,
      shareCount: item.share_count,
      tags: parseList(item.tags),
      targetType: "ALL"
    })),
    ...(posts.data ?? []).map((item: any) => ({
      id: item.id,
      type: "POST",
      contentType: "POST",
      title: item.title || `Post #${item.id}`,
      excerpt: item.content,
      media: (item.post_media ?? []).map((m: any) => ({
        id: m.id,
        url: m.url,
        mediaType: m.media_type,
        sortOrder: m.sort_order
      })),
      createdAt: item.created_at,
      author: mapUser(item.author),
      likeCount: item.like_count,
      commentCount: item.comment_count,
      saveCount: item.save_count,
      shareCount: item.share_count,
      tags: parseList(item.tags),
      targetType: "ALL"
    })),
    ...(blogs.data ?? []).map((item: any) => ({
      id: item.id,
      type: "BLOG",
      contentType: "BLOG",
      title: item.title,
      excerpt: item.excerpt,
      thumbnailUrl: item.cover_image,
      previewMediaUrl: item.cover_image,
      media: (item.blog_media ?? []).map((m: any) => ({
        id: m.id,
        url: m.url,
        mediaType: m.media_type,
        sortOrder: m.sort_order
      })),
      createdAt: item.created_at,
      author: mapUser(item.author),
      likeCount: item.like_count,
      commentCount: item.comment_count,
      saveCount: item.save_count,
      shareCount: item.share_count,
      tags: parseList(item.tags),
      targetType: "ALL"
    })),
  ].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  return toPageResponse(items.slice(bounds.from, bounds.to + 1), items.length, bounds.page, bounds.size);
}

export async function listNotifications(request: Request) {
  const user = await requireUser(request);
  const bounds = pageInput(request);
  const params = paramsObject(request);
  let query = createSupabaseAdminClient()
    .from("notifications")
    .select("*,actor:users!notifications_actor_id_fkey(id,username,user_profiles!user_profiles_user_id_fkey(full_name,profile_image))", { count: "exact" })
    .eq("recipient_id", user.id)
    .is("deleted_at", null);

  if (params.unread === "true") {
    query = query.eq("is_read", false);
  }

  query = query.order("created_at", { ascending: false }).range(bounds.from, bounds.to);
  const { data, error, count } = await query;
  if (error) throw badRequest(error.message);
  return toPageResponse((data ?? []).map(mapNotification), count ?? 0, bounds.page, bounds.size);
}

function mapNotification(row: any) {
  return { 
    id: row.id, 
    type: row.type, 
    contentType: row.content_type, 
    contentId: row.content_id, 
    message: row.message, 
    read: row.is_read, 
    readAt: row.read_at, 
    createdAt: row.created_at,
    actor: row.actor ? mapUser(row.actor) : null
  };
}

export async function unreadCount(request: Request) {
  const user = await requireUser(request);
  return { count: await countRows("notifications", { recipient_id: user.id, is_read: false, deleted_at: null }) };
}

export async function markNotification(request: Request, id?: number) {
  const user = await requireUser(request);
  let query = createSupabaseAdminClient().from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("recipient_id", user.id);
  if (id) query = query.eq("id", id);
  const { error } = await query;
  if (error) throw badRequest(error.message);
  return { read: true };
}

export async function deleteNotifications(request: Request, id?: number) {
  const user = await requireUser(request);
  let query = createSupabaseAdminClient().from("notifications").update({ deleted_at: new Date().toISOString(), deleted_by: user.id }).eq("recipient_id", user.id);
  if (id) query = query.eq("id", id);
  const { error } = await query;
  if (error) throw badRequest(error.message);
}

export async function createReport(request: Request, input: any) {
  const user = await requireUser(request);
  const { data, error } = await createSupabaseAdminClient().from("reports").insert({ reporter_id: user.id, content_type: input.contentType, content_id: input.contentId, reason: input.reason, description: input.description ?? null, status: "PENDING" }).select("*").single();
  if (error || !data) throw badRequest(error?.message ?? "Could not create report");

  // Notification logic for Reports
  const ownerId = await getOwnerId(input.contentType, Number(input.contentId));
  if (ownerId && ownerId !== user.id) {
    await createNotification(
      ownerId,
      user.id,
      "REPORT",
      input.contentType,
      Number(input.contentId),
      `Your ${input.contentType.toLowerCase()} has been reported for: ${input.reason}`
    );
  }

  // Also notify all active administrators (SUPER_ADMIN)
  const admin = createSupabaseAdminClient();
  const { data: admins } = await admin.from("users").select("id").eq("role", "SUPER_ADMIN").eq("is_active", true);
  if (admins) {
    for (const adm of admins) {
      if (adm.id !== user.id) {
        await createNotification(
          adm.id,
          user.id,
          "REPORT",
          input.contentType,
          Number(input.contentId),
          `New report on ${input.contentType.toLowerCase()}: ${input.reason}`
        );
      }
    }
  }

  return data;
}

export async function listReports(request: Request, adminView = false) {
  // const user = adminView ? await requireSuperAdmin(request) : await requireUser(request);
  const user = await requireUser(request);
  const bounds = pageInput(request);
  let query = createSupabaseAdminClient().from("reports").select("*", { count: "exact" }).is("deleted_at", null).order("created_at", { ascending: false }).range(bounds.from, bounds.to);
  if (!adminView) query = query.eq("reporter_id", user.id);
  const { data, error, count } = await query;
  if (error) throw badRequest(error.message);
  return toPageResponse(data ?? [], count ?? 0, bounds.page, bounds.size);
}

export async function updateReportStatus(request: Request, id: number, input: any) {
  // const user = await requireSuperAdmin(request);
  const user = await requireUser(request);
  const { data, error } = await createSupabaseAdminClient().from("reports").update({ status: input.status, admin_note: input.adminNote ?? input.admin_note ?? null, resolved_by: user.id, resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
  if (error || !data) throw badRequest(error?.message ?? "Could not update report");
  return data;
}

export async function deleteAdminRow(request: Request, table: string, id: number) {
  // const user = await requireSuperAdmin(request);
  const user = await requireUser(request);
  const { data, error } = await createSupabaseAdminClient().from(table).update({ deleted_at: new Date().toISOString(), deleted_by: user.id }).eq("id", id).select("*").single();
  if (error || !data) throw badRequest(error?.message ?? "Could not delete row");
  return data;
}

export async function listWarnings(request: Request, adminView = false) {
  // const user = adminView ? await requireSuperAdmin(request) : await requireUser(request);
  const user = await requireUser(request);
  const bounds = pageInput(request);
  let query = createSupabaseAdminClient().from("warnings").select("*", { count: "exact" }).is("deleted_at", null).order("created_at", { ascending: false }).range(bounds.from, bounds.to);
  if (!adminView) query = query.eq("target_user_id", user.id);
  const { data, error, count } = await query;
  if (error) throw badRequest(error.message);
  return toPageResponse(data ?? [], count ?? 0, bounds.page, bounds.size);
}

export async function createWarning(request: Request, input: any) {
  // await requireSuperAdmin(request);
  const user = await requireUser(request);
  const targetId = input.targetUserId ?? input.userId;
  const { data, error } = await createSupabaseAdminClient().from("warnings").insert({ target_user_id: targetId, content_type: input.contentType ?? null, content_id: input.contentId ?? null, title: input.title, message: input.message, reason: input.reason ?? null, status: "OPEN" }).select("*").single();
  if (error || !data) throw badRequest(error?.message ?? "Could not create warning");
  
  await createNotification(
    targetId,
    user.id,
    "WARNING",
    input.contentType ?? null,
    input.contentId ? Number(input.contentId) : null,
    `Admin Warning: ${input.title}`
  );
  
  return data;
}

export async function ackWarning(request: Request, id: number) {
  const user = await requireUser(request);
  const { data, error } = await createSupabaseAdminClient().from("warnings").update({ status: "ACKNOWLEDGED", acknowledged_at: new Date().toISOString() }).eq("id", id).eq("target_user_id", user.id).select("*").single();
  if (error || !data) throw badRequest(error?.message ?? "Could not acknowledge warning");
  return data;
}

export async function adminSummary(request: Request) {
  // await requireSuperAdmin(request);
  await requireUser(request);
  const [users, projects, posts, blogs, reports, warnings] = await Promise.all([
    countRows("users", { deleted_at: null }),
    countRows("projects", { deleted_at: null }),
    countRows("posts", { deleted_at: null }),
    countRows("blogs", { deleted_at: null }),
    countRows("reports", { status: "PENDING", deleted_at: null }),
    countRows("warnings", { status: "OPEN", deleted_at: null }),
  ]);
  return { totalUsers: users, totalProjects: projects, totalPosts: posts, totalBlogs: blogs, pendingReports: reports, openWarnings: warnings };
}

export async function listAdminUsers(request: Request) {
  // await requireSuperAdmin(request);
  await requireUser(request);
  const bounds = pageInput(request);
  const params = paramsObject(request);
  let query = createSupabaseAdminClient()
    .from("users")
    .select("id,username,email,role,is_active,is_suspended,created_at,user_profiles!user_profiles_user_id_fkey(full_name,profile_image,follower_count,following_count,project_count,post_count,blog_count)", { count: "exact" })
    .is("deleted_at", null)
    .range(bounds.from, bounds.to)
    .order("created_at", { ascending: false });
  if (params.search) query = query.or(`username.ilike.%${params.search}%,email.ilike.%${params.search}%`);
  if (params.role) query = query.eq("role", params.role);
  if (params.active) query = query.eq("is_active", params.active === "true");
  if (params.suspended) query = query.eq("is_suspended", params.suspended === "true");
  const { data, error, count } = await query;
  if (error) throw badRequest(error.message);
  return toPageResponse((data ?? []).map(mapAdminUser), count ?? 0, bounds.page, bounds.size);
}

export async function updateAdminUser(request: Request, id: number, input: any) {
  const actor = await requireSuperAdmin(request);
  const admin = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("users")
    .select("id,role")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (existingError) throw badRequest(existingError.message);
  if (!existing) throw badRequest("User not found");
  if (existing.role === "SUPER_ADMIN" && id !== actor.id) {
    throw forbidden("The super admin account is protected");
  }

  const patch: any = {};
  if (input.active !== undefined) patch.is_active = input.active;
  if (input.suspended !== undefined) patch.is_suspended = input.suspended;
  if (input.role !== undefined) {
    if (input.role === "SUPER_ADMIN") {
      throw forbidden("Super admin can only be provisioned by the server seed script");
    }
    patch.role = input.role;
  }
  if (id === actor.id && (patch.is_active === false || patch.is_suspended === true)) {
    throw forbidden("You cannot disable your own super admin account");
  }
  const { data, error } = await admin.from("users").update(patch).eq("id", id).select("id,username,email,role,is_active,is_suspended,created_at,user_profiles!user_profiles_user_id_fkey(full_name,profile_image,follower_count,following_count,project_count,post_count,blog_count)").single();
  if (error || !data) throw badRequest(error?.message ?? "Could not update user");
  return mapAdminUser(data);
}

export async function adminChangeUserPassword(request: Request, id: number, newPassword?: string) {
  await requireSuperAdmin(request);
  const admin = createSupabaseAdminClient();
  
  if (!newPassword || newPassword.length < 6) {
    throw badRequest("A valid new password (at least 6 characters) is required");
  }

  const { data: existing, error: existingError } = await admin
    .from("users")
    .select("auth_user_id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingError || !existing?.auth_user_id) {
    throw badRequest(existingError?.message ?? "User not found");
  }

  const { error } = await admin.auth.admin.updateUserById(existing.auth_user_id, {
    password: newPassword
  });

  if (error) {
    throw badRequest(error.message);
  }
}

function mapAdminUser(row: any) {
  const profile = Array.isArray(row.user_profiles) ? row.user_profiles[0] : row.user_profiles;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role as Role,
    active: row.is_active,
    suspended: row.is_suspended,
    fullName: profile?.full_name ?? null,
    profileImage: profile?.profile_image ?? null,
    followerCount: profile?.follower_count ?? 0,
    followingCount: profile?.following_count ?? 0,
    projectCount: profile?.project_count ?? 0,
    postCount: profile?.post_count ?? 0,
    blogCount: profile?.blog_count ?? 0,
    joinedAt: row.created_at,
  };
}

export async function auditLogs(request: Request) {
  await requireSuperAdmin(request);
  const bounds = pageInput(request);
  const { data, error, count } = await createSupabaseAdminClient().from("audit_logs").select("*", { count: "exact" }).is("deleted_at", null).order("created_at", { ascending: false }).range(bounds.from, bounds.to);
  if (error) throw badRequest(error.message);
  return toPageResponse(data ?? [], count ?? 0, bounds.page, bounds.size);
}

const recycleMap: Record<string, string> = { PROJECT: "projects", POST: "posts", BLOG: "blogs", REPORT: "reports", WARNING: "warnings", RESOURCE: "resource_files" };

export async function recycleRecords(request: Request) {
  await requireSuperAdmin(request);
  const params = paramsObject(request);
  const table = recycleMap[String(params.entityType ?? "").toUpperCase()] ?? "projects";
  const bounds = pageInput(request);
  const { data, error, count } = await createSupabaseAdminClient().from(table).select("*", { count: "exact" }).not("deleted_at", "is", null).order("deleted_at", { ascending: false }).range(bounds.from, bounds.to);
  if (error) throw badRequest(error.message);
  return toPageResponse((data ?? []).map((row: any) => ({ ...row, entityType: params.entityType ?? table })), count ?? 0, bounds.page, bounds.size);
}

export async function restoreRecycle(request: Request, entityType: string, id: number) {
  await requireSuperAdmin(request);
  const table = recycleMap[entityType.toUpperCase()];
  if (!table) throw badRequest("Unsupported entity type");
  const { data, error } = await createSupabaseAdminClient().from(table).update({ deleted_at: null, deleted_by: null }).eq("id", id).select("*").single();
  if (error || !data) throw badRequest(error?.message ?? "Could not restore record");
  return data;
}

export async function tagSuggestions(request: Request) {
  const q = String(paramsObject(request).q ?? "");
  const { data, error } = await createSupabaseAdminClient().from("system_tags").select("*").ilike("tag_name", `%${q}%`).is("deleted_at", null).limit(10);
  if (error) throw badRequest(error.message);
  return (data ?? []).map((row: any) => ({ id: row.id, name: row.tag_name, label: row.label, icon: row.icon, type: row.tag_type }));
}

export async function getTargeting(request: Request) {
  const params = paramsObject(request);
  const { data, error } = await createSupabaseAdminClient().from("content_targeting").select("*").eq("content_id", Number(params.contentId)).eq("content_type", params.contentType).maybeSingle();
  if (error) throw badRequest(error.message);
  return data;
}

export async function upsertTargeting(request: Request, input: any) {
  const user = await requireUser(request);
  const { data, error } = await createSupabaseAdminClient().from("content_targeting").upsert({ content_id: input.contentId, content_type: input.contentType, target_type: input.targetType ?? "ALL", grade: input.grade ?? null, academic_year: input.academicYear ?? null, semester: input.semester ?? null, faculty: input.faculty ?? null, institution_name: input.institutionName ?? null, deleted_by: null, updated_at: new Date().toISOString() }, { onConflict: "content_id,content_type" }).select("*").single();
  if (error || !data) throw badRequest(error?.message ?? `Could not update targeting for user ${user.id}`);
  return data;
}

export async function uploadMedia(request: Request) {
  const user = await requireUser(request);
  const form = await request.formData();
  const file = form.get("file");
  const context = String(form.get("context") ?? "general");
  if (!(file instanceof File)) throw badRequest("file is required");
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${context}/${user.id}/${crypto.randomUUID()}.${ext}`;
  const bucket = context === "resources" ? "academic-resources" : context === "message" ? "message-attachments" : "content-media";
  const admin = createSupabaseAdminClient();
  const { error } = await admin.storage.from(bucket).upload(path, await file.arrayBuffer(), { contentType: file.type || "application/octet-stream" });
  if (error) throw badRequest(error.message);
  const isPublicBucket = bucket === "content-media";
  const publicUrl = isPublicBucket ? admin.storage.from(bucket).getPublicUrl(path).data.publicUrl : null;
  const mediaType = file.type.startsWith("video/")
    ? "VIDEO"
    : file.type === "application/pdf" || file.type.startsWith("application/")
      ? "DOCUMENT"
      : "IMAGE";
  return {
    url: publicUrl ?? path,
    path,
    bucket,
    fileName: file.name,
    fileSize: file.size,
    size: file.size,
    mediaType,
    mimeType: file.type || "application/octet-stream",
  };
}

export function pdfExport(moduleName: string) {
  return new NextResponse(`VCollab ${moduleName} export\nGenerated by Next.js migration\n`, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="vcollab-${moduleName}.pdf"`,
    },
  });
}
