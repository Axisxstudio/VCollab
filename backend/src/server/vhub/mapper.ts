/* eslint-disable @typescript-eslint/no-explicit-any */
import { parseTags } from "@/server/resources/mapper";

type AuthorRow = {
  id: number;
  username: string;
  user_profiles:
    | { full_name: string | null; profile_image: string | null }
    | Array<{ full_name: string | null; profile_image: string | null }>
    | null;
} | null;

function profile(author: AuthorRow) {
  return Array.isArray(author?.user_profiles)
    ? author.user_profiles[0] ?? null
    : author?.user_profiles ?? null;
}

export function mapAuthor(row: { author?: AuthorRow; guest_name?: string | null } | any) {
  const author = row.author ?? null;
  const rawProfile = profile(author);
  const guest = !author;
  return {
    id: author?.id ?? null,
    username: author?.username ?? null,
    fullName: rawProfile?.full_name ?? null,
    profileImage: rawProfile?.profile_image ?? null,
    displayName: guest ? row.guest_name ?? "Guest" : rawProfile?.full_name ?? author?.username ?? "User",
    guest,
  };
}

export function bodyPreview(body: string) {
  return body.length > 180 ? `${body.slice(0, 177)}...` : body;
}

export function mapThread(row: any, viewerId?: number | null, superAdmin = false) {
  const owner = row.author_id != null && viewerId === row.author_id;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    bodyPreview: bodyPreview(row.body),
    threadType: row.thread_type,
    status: row.status,
    tags: parseTags(row.tags),
    locked: row.is_locked,
    hidden: row.is_hidden,
    bestReplyId: row.best_reply_id,
    replyCount: row.reply_count,
    participantCount: row.participant_count,
    viewCount: row.view_count,
    lastActivityAt: row.last_activity_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: mapAuthor(row),
    currentUserCanReply: !row.is_locked && !row.is_hidden,
    currentUserCanModerate: superAdmin,
    currentUserCanEdit: owner || superAdmin,
    currentUserCanDelete: owner || superAdmin,
  };
}

export function mapReply(row: any, viewerId?: number | null, superAdmin = false) {
  const owner = row.author_id != null && viewerId === row.author_id;
  return {
    id: row.id,
    threadId: row.thread_id,
    body: row.body,
    bestAnswer: row.is_best_answer,
    hidden: row.is_hidden,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: mapAuthor(row),
    currentUserCanEdit: owner || superAdmin,
    currentUserCanDelete: owner || superAdmin,
  };
}

export function mapSettings(row: any) {
  const config = row?.config_json ?? {};
  return {
    featureKey: row?.feature_key ?? "V_HUB",
    mode: row?.mode ?? "DISABLED",
    allowGuestView: Boolean(config.allowGuestView),
    allowAttachments: Boolean(config.allowAttachments),
    maxTitleLength: Number(config.maxTitleLength ?? 180),
    maxBodyLength: Number(config.maxBodyLength ?? 5000),
    rateLimitPerHour: Number(config.rateLimitPerHour ?? 10),
  };
}
