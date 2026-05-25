/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/server/auth/guards";
import { bearerTokenFromRequest, meFromToken } from "@/server/auth/service";
import { badRequest, forbidden, notFound } from "@/server/http/errors";
import { pageBounds, toPageResponse } from "@/server/pagination/page";
import { publishVHubFeed, publishVHubThread } from "@/server/realtime/publisher";
import { createNotification } from "@/server/social-admin/service";
import { mapReply, mapSettings, mapThread } from "./mapper";

function authorSelect() {
  return `id, username, user_profiles!user_profiles_user_id_fkey ( full_name, profile_image )`;
}

function threadSelect() {
  return `*, author:users!v_hub_threads_author_id_fkey (${authorSelect()})`;
}

function replySelect() {
  return `*, author:users!v_hub_replies_author_id_fkey (${authorSelect()})`;
}

async function optionalUser(request: Request) {
  try {
    return await meFromToken(bearerTokenFromRequest(request));
  } catch {
    return null;
  }
}

async function settingsRow() {
  const { data, error } = await createSupabaseAdminClient()
    .from("platform_feature_settings")
    .select("*")
    .eq("feature_key", "V_HUB")
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw badRequest(error.message);
  return data;
}

export async function getSettings() {
  return mapSettings(await settingsRow());
}

export async function updateSettings(request: Request, input: any) {
  await requireSuperAdmin(request);
  const config = {
    allowGuestView: input.allowGuestView ?? false,
    allowAttachments: input.allowAttachments ?? false,
    maxTitleLength: input.maxTitleLength ?? 180,
    maxBodyLength: input.maxBodyLength ?? 5000,
    rateLimitPerHour: input.rateLimitPerHour ?? 10,
  };
  const { data, error } = await createSupabaseAdminClient()
    .from("platform_feature_settings")
    .upsert({ feature_key: "V_HUB", mode: input.mode, config_json: config }, { onConflict: "feature_key" })
    .select("*")
    .single();
  if (error || !data) throw badRequest(error?.message ?? "Could not update V Hub settings");
  return mapSettings(data);
}

export async function listThreads(request: Request, input: any, adminMode = false) {
  const viewer = await optionalUser(request);
  const bounds = pageBounds(input.page, input.size);
  let query = createSupabaseAdminClient()
    .from("v_hub_threads")
    .select(threadSelect(), { count: "exact" })
    .is("deleted_at", null)
    .order("last_activity_at", { ascending: false })
    .range(bounds.from, bounds.to);
  if (!adminMode) query = query.eq("is_hidden", false);
  if (input.q) query = query.or(`title.ilike.%${input.q}%,body.ilike.%${input.q}%,tags.ilike.%${input.q}%`);
  if (input.type) query = query.eq("thread_type", input.type);
  if (input.status) query = query.eq("status", input.status);
  if (input.mine && viewer) query = query.eq("author_id", viewer.id);
  if (adminMode && input.hidden !== undefined) query = query.eq("is_hidden", input.hidden);
  if (adminMode && input.locked !== undefined) query = query.eq("is_locked", input.locked);
  const { data, error, count } = await query;
  if (error) throw badRequest(error.message);
  return toPageResponse((data ?? []).map((row) => mapThread(row, viewer?.id, viewer?.role === "SUPER_ADMIN")), count ?? 0, bounds.page, bounds.size);
}

export async function createThread(request: Request, input: any) {
  const viewer = await optionalUser(request);
  if (!viewer && !input.guestName) throw forbidden("Guest name is required");
  const { data, error } = await createSupabaseAdminClient()
    .from("v_hub_threads")
    .insert({
      author_id: viewer?.id ?? null,
      guest_name: viewer ? null : input.guestName,
      guest_email: viewer ? null : input.guestEmail ?? null,
      title: input.title,
      body: input.body,
      thread_type: input.threadType,
      status: "OPEN",
      tags: JSON.stringify(input.tags ?? []),
      participant_count: viewer ? 1 : 0,
      last_activity_at: new Date().toISOString(),
    })
    .select(threadSelect())
    .single();
  if (error || !data) throw badRequest(error?.message ?? "Could not create V Hub thread");
  const response = mapThread(data, viewer?.id, viewer?.role === "SUPER_ADMIN");
  await publishVHubFeed({ eventType: "vhub.thread.created", threadId: response.id, thread: response });
  return response;
}

async function threadById(id: number, includeHidden = false) {
  let query = createSupabaseAdminClient().from("v_hub_threads").select(threadSelect()).eq("id", id).is("deleted_at", null);
  if (!includeHidden) query = query.eq("is_hidden", false);
  const { data, error } = await query.maybeSingle();
  if (error) throw badRequest(error.message);
  if (!data) throw notFound("V Hub thread not found");
  return data as any;
}

export async function getThread(request: Request, id: number) {
  const viewer = await optionalUser(request);
  const row = await threadById(id, viewer?.role === "SUPER_ADMIN");
  await createSupabaseAdminClient().from("v_hub_threads").update({ view_count: Number(row.view_count ?? 0) + 1 }).eq("id", id);
  return mapThread({ ...row, view_count: Number(row.view_count ?? 0) + 1 }, viewer?.id, viewer?.role === "SUPER_ADMIN");
}

export async function listReplies(request: Request, threadId: number, input: any) {
  const viewer = await optionalUser(request);
  await threadById(threadId, viewer?.role === "SUPER_ADMIN");
  const bounds = pageBounds(input.page, input.size);
  let query = createSupabaseAdminClient().from("v_hub_replies").select(replySelect(), { count: "exact" }).eq("thread_id", threadId).is("deleted_at", null).order("created_at").range(bounds.from, bounds.to);
  if (viewer?.role !== "SUPER_ADMIN") query = query.eq("is_hidden", false);
  const { data, error, count } = await query;
  if (error) throw badRequest(error.message);
  return toPageResponse((data ?? []).map((row) => mapReply(row, viewer?.id, viewer?.role === "SUPER_ADMIN")), count ?? 0, bounds.page, bounds.size);
}

export async function createReply(request: Request, threadId: number, input: any) {
  const viewer = await optionalUser(request);
  const thread = await threadById(threadId);
  if (thread.is_locked) throw forbidden("Thread is locked");
  if (!viewer && !input.guestName) throw forbidden("Guest name is required");
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("v_hub_replies").insert({
    thread_id: threadId,
    author_id: viewer?.id ?? null,
    guest_name: viewer ? null : input.guestName,
    guest_email: viewer ? null : input.guestEmail ?? null,
    body: input.body,
  }).select(replySelect()).single();
  if (error || !data) throw badRequest(error?.message ?? "Could not create V Hub reply");
  await admin.from("v_hub_threads").update({ reply_count: Number(thread.reply_count ?? 0) + 1, last_activity_at: new Date().toISOString() }).eq("id", threadId);
  const response = mapReply(data, viewer?.id, viewer?.role === "SUPER_ADMIN");
  await publishVHubThread(threadId, { eventType: "vhub.reply.created", threadId, reply: response });
  await publishVHubFeed({ eventType: "vhub.reply.created", threadId, replyId: response.id });

  if (thread.author_id && thread.author_id !== viewer?.id) {
    const actorName = viewer ? (viewer.fullName || viewer.username) : (input.guestName || "A guest");
    await createNotification(
      thread.author_id,
      viewer?.id ?? null,
      "COMMENT",
      "v_hub_thread",
      threadId,
      `${actorName} replied to your V Hub thread`
    );
  }

  return response;
}

function canChange(row: any, user: any) {
  return user && (user.role === "SUPER_ADMIN" || row.author_id === user.id);
}

export async function solveThread(request: Request, id: number, bestReplyId: number) {
  const viewer = await optionalUser(request);
  const thread = await threadById(id, viewer?.role === "SUPER_ADMIN");
  if (!canChange(thread, viewer)) throw forbidden("Not allowed to update this thread");
  const admin = createSupabaseAdminClient();
  await admin.from("v_hub_replies").update({ is_best_answer: true }).eq("id", bestReplyId).eq("thread_id", id);
  const { data, error } = await admin.from("v_hub_threads").update({ status: "SOLVED", best_reply_id: bestReplyId }).eq("id", id).select(threadSelect()).single();
  if (error || !data) throw badRequest(error?.message ?? "Could not solve thread");
  const response = mapThread(data, viewer?.id, viewer?.role === "SUPER_ADMIN");
  await publishVHubThread(id, { eventType: "vhub.thread.solved", threadId: id, thread: response });
  await publishVHubFeed({ eventType: "vhub.thread.solved", threadId: id });
  return response;
}

export async function reopenThread(request: Request, id: number) {
  const viewer = await optionalUser(request);
  const thread = await threadById(id, viewer?.role === "SUPER_ADMIN");
  if (!canChange(thread, viewer)) throw forbidden("Not allowed to update this thread");
  const { data, error } = await createSupabaseAdminClient().from("v_hub_threads").update({ status: "OPEN", best_reply_id: null }).eq("id", id).select(threadSelect()).single();
  if (error || !data) throw badRequest(error?.message ?? "Could not reopen thread");
  const response = mapThread(data, viewer?.id, viewer?.role === "SUPER_ADMIN");
  await publishVHubThread(id, { eventType: "vhub.thread.reopened", threadId: id, thread: response });
  await publishVHubFeed({ eventType: "vhub.thread.reopened", threadId: id });
  return response;
}

export async function deleteThread(request: Request, id: number) {
  const viewer = await optionalUser(request);
  const thread = await threadById(id, true);
  if (!canChange(thread, viewer)) throw forbidden("Not allowed to delete this thread");
  await createSupabaseAdminClient().from("v_hub_threads").update({ deleted_at: new Date().toISOString(), deleted_by: viewer?.id }).eq("id", id);
  await publishVHubFeed({ eventType: "vhub.thread.deleted", threadId: id });
}

export async function deleteReply(request: Request, id: number) {
  const viewer = await optionalUser(request);
  const { data, error } = await createSupabaseAdminClient().from("v_hub_replies").select(replySelect()).eq("id", id).is("deleted_at", null).maybeSingle();
  if (error) throw badRequest(error.message);
  if (!data) throw notFound("V Hub reply not found");
  const reply = data as any;
  if (!canChange(reply, viewer)) throw forbidden("Not allowed to delete this reply");
  await createSupabaseAdminClient().from("v_hub_replies").update({ deleted_at: new Date().toISOString(), deleted_by: viewer?.id }).eq("id", id);
  await publishVHubThread(reply.thread_id, { eventType: "vhub.reply.deleted", threadId: reply.thread_id, replyId: id });
  await publishVHubFeed({ eventType: "vhub.reply.deleted", threadId: reply.thread_id, replyId: id });
}

export async function summary(request: Request) {
  await requireSuperAdmin(request);
  const admin = createSupabaseAdminClient();
  const settings = await getSettings();
  const [threads, open, solved, replies, hidden, locked] = await Promise.all([
    admin.from("v_hub_threads").select("id", { count: "exact", head: true }).is("deleted_at", null),
    admin.from("v_hub_threads").select("id", { count: "exact", head: true }).eq("status", "OPEN").is("deleted_at", null),
    admin.from("v_hub_threads").select("id", { count: "exact", head: true }).eq("status", "SOLVED").is("deleted_at", null),
    admin.from("v_hub_replies").select("id", { count: "exact", head: true }).is("deleted_at", null),
    admin.from("v_hub_threads").select("id", { count: "exact", head: true }).eq("is_hidden", true).is("deleted_at", null),
    admin.from("v_hub_threads").select("id", { count: "exact", head: true }).eq("is_locked", true).is("deleted_at", null),
  ]);
  return { mode: settings.mode, threadCount: threads.count ?? 0, openThreadCount: open.count ?? 0, solvedThreadCount: solved.count ?? 0, replyCount: replies.count ?? 0, hiddenThreadCount: hidden.count ?? 0, lockedThreadCount: locked.count ?? 0 };
}

export async function moderateThread(request: Request, id: number, field: "is_locked" | "is_hidden", value: boolean) {
  const user = await requireSuperAdmin(request);
  const { data, error } = await createSupabaseAdminClient().from("v_hub_threads").update({ [field]: value, deleted_by: user.id }).eq("id", id).select(threadSelect()).single();
  if (error || !data) throw badRequest(error?.message ?? "Could not moderate thread");
  const response = mapThread(data, user.id, true);
  await publishVHubThread(id, { eventType: "vhub.thread.moderated", threadId: id, thread: response });
  await publishVHubFeed({ eventType: "vhub.thread.moderated", threadId: id });
  return response;
}

export async function moderateReply(request: Request, id: number, value: boolean) {
  const user = await requireSuperAdmin(request);
  const { data, error } = await createSupabaseAdminClient().from("v_hub_replies").update({ is_hidden: value, deleted_by: user.id }).eq("id", id).select(replySelect()).single();
  if (error || !data) throw badRequest(error?.message ?? "Could not moderate reply");
  const reply = data as any;
  const response = mapReply(reply, user.id, true);
  await publishVHubThread(reply.thread_id, { eventType: "vhub.reply.moderated", threadId: reply.thread_id, reply: response });
  await publishVHubFeed({ eventType: "vhub.reply.moderated", threadId: reply.thread_id, replyId: id });
  return response;
}
