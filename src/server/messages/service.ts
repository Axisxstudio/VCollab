import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { bearerTokenFromRequest, meFromToken } from "@/server/auth/service";
import { badRequest, forbidden, notFound } from "@/server/http/errors";
import { pageBounds, toPageResponse } from "@/server/pagination/page";
import {
  publishConversationMessage,
  publishConversationStatus,
  publishUserMessage,
} from "@/server/realtime/publisher";
import { createNotification } from "@/server/social-admin/service";
import { mapMessage, userSummary } from "./mapper";
import type {
  ConversationResponse,
  MessagePreview,
  MessageResponse,
  MessageRow,
  ParticipantSummary,
  UserSummaryRow,
} from "./types";

type PageInput = {
  page: number;
  size: number;
};

function userSelect() {
  return `
    id,
    username,
    user_profiles!user_profiles_user_id_fkey (
      full_name,
      profile_image
    )
  `;
}

function messageSelect() {
  return `
    id,
    conversation_id,
    content,
    message_type,
    attachment_url,
    created_at,
    delivered_at,
    read_at,
    sender_id,
    sender:users!messages_sender_id_fkey (
      ${userSelect()}
    )
  `;
}

async function currentUserId(request: Request) {
  const user = await meFromToken(bearerTokenFromRequest(request));
  return user.id;
}

async function ensureMember(conversationId: number, userId: number) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("conversation_members")
    .select("id, last_read_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw badRequest(error.message);
  }

  if (!data) {
    throw forbidden("Not allowed to access this conversation");
  }

  return data as { id: number; last_read_at: string | null };
}

async function getUserSummary(userId: number): Promise<UserSummaryRow> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("users")
    .select(userSelect())
    .eq("id", userId)
    .eq("is_active", true)
    .eq("is_suspended", false)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw badRequest(error.message);
  }

  if (!data) {
    throw notFound("User not found");
  }

  return data as unknown as UserSummaryRow;
}

async function conversationExists(conversationId: number) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw badRequest(error.message);
  }

  if (!data) {
    throw notFound("Conversation not found");
  }
}

async function findDirectConversation(currentUserId: number, targetUserId: number) {
  const admin = createSupabaseAdminClient();
  const { data: currentMemberships, error } = await admin
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", currentUserId)
    .is("deleted_at", null);

  if (error) {
    throw badRequest(error.message);
  }

  const ids = (currentMemberships ?? []).map((row) => row.conversation_id);
  if (ids.length === 0) {
    return null;
  }

  const { data: targetMembership, error: targetError } = await admin
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", targetUserId)
    .in("conversation_id", ids)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (targetError) {
    throw badRequest(targetError.message);
  }

  return targetMembership?.conversation_id ?? null;
}

async function conversationMembers(conversationId: number) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("conversation_members")
    .select(
      `
        user_id,
        users!conversation_members_user_id_fkey (
          ${userSelect()}
        )
      `,
    )
    .eq("conversation_id", conversationId)
    .is("deleted_at", null);

  if (error) {
    throw badRequest(error.message);
  }

  return (data ?? []) as unknown as Array<{
    user_id: number;
    users: UserSummaryRow | null;
  }>;
}

async function conversationUserIds(conversationId: number) {
  return (await conversationMembers(conversationId)).map((member) => member.user_id);
}

async function lastMessage(conversationId: number): Promise<MessagePreview | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("messages")
    .select("id, content, message_type, attachment_url, created_at, sender_id")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw badRequest(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    content: data.content,
    messageType: data.message_type,
    attachmentUrl: data.attachment_url,
    createdAt: data.created_at,
    senderId: data.sender_id,
  };
}

async function unreadCount(conversationId: number, viewerId: number) {
  const member = await ensureMember(conversationId, viewerId);
  const since = member.last_read_at ?? "1970-01-01T00:00:00.000Z";
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", viewerId)
    .gt("created_at", since)
    .is("deleted_at", null);

  if (error) {
    throw badRequest(error.message);
  }

  return count ?? 0;
}

async function mapConversation(
  conversationId: number,
  viewerId: number,
): Promise<ConversationResponse> {
  await conversationExists(conversationId);
  const members = await conversationMembers(conversationId);
  const participants: ParticipantSummary[] = members.map((member) => ({
    ...userSummary(member.users),
    online: false,
    lastSeenAt: null,
  }));

  return {
    id: conversationId,
    participants,
    lastMessage: await lastMessage(conversationId),
    unreadCount: await unreadCount(conversationId, viewerId),
  };
}

export async function startConversation(
  request: Request,
  targetUserId: number,
): Promise<ConversationResponse> {
  const viewerId = await currentUserId(request);
  if (viewerId === targetUserId) {
    throw forbidden("You cannot message yourself");
  }

  await getUserSummary(targetUserId);
  const existingId = await findDirectConversation(viewerId, targetUserId);
  if (existingId) {
    return mapConversation(existingId, viewerId);
  }

  const admin = createSupabaseAdminClient();
  const { data: conversation, error } = await admin
    .from("conversations")
    .insert({ created_by: viewerId })
    .select("id")
    .single();

  if (error || !conversation) {
    throw badRequest(error?.message ?? "Could not create conversation");
  }

  const now = new Date().toISOString();
  const { error: membersError } = await admin.from("conversation_members").insert([
    {
      conversation_id: conversation.id,
      user_id: viewerId,
      last_read_at: now,
    },
    {
      conversation_id: conversation.id,
      user_id: targetUserId,
    },
  ]);

  if (membersError) {
    throw badRequest(membersError.message);
  }

  return mapConversation(conversation.id, viewerId);
}

export async function listConversations(request: Request, input: PageInput) {
  const viewerId = await currentUserId(request);
  const bounds = pageBounds(input.page, input.size);
  const admin = createSupabaseAdminClient();
  const { data, error, count } = await admin
    .from("conversation_members")
    .select("conversation_id", { count: "exact" })
    .eq("user_id", viewerId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .range(bounds.from, bounds.to);

  if (error) {
    throw badRequest(error.message);
  }

  const content = await Promise.all(
    (data ?? []).map((row) => mapConversation(row.conversation_id, viewerId)),
  );

  return toPageResponse(content, count ?? 0, bounds.page, bounds.size);
}

export async function getConversation(request: Request, conversationId: number) {
  const viewerId = await currentUserId(request);
  await ensureMember(conversationId, viewerId);
  return mapConversation(conversationId, viewerId);
}

export async function markConversationRead(request: Request, conversationId: number) {
  const viewerId = await currentUserId(request);
  await ensureMember(conversationId, viewerId);
  const now = new Date().toISOString();
  const admin = createSupabaseAdminClient();

  const { error: messagesError } = await admin
    .from("messages")
    .update({ delivered_at: now, read_at: now })
    .eq("conversation_id", conversationId)
    .neq("sender_id", viewerId)
    .is("deleted_at", null);

  if (messagesError) {
    throw badRequest(messagesError.message);
  }

  const { error: memberError } = await admin
    .from("conversation_members")
    .update({ last_delivered_at: now, last_read_at: now })
    .eq("conversation_id", conversationId)
    .eq("user_id", viewerId);

  if (memberError) {
    throw badRequest(memberError.message);
  }
}

async function markConversationDelivered(conversationId: number, viewerId: number) {
  const now = new Date().toISOString();
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("messages")
    .update({ delivered_at: now })
    .eq("conversation_id", conversationId)
    .neq("sender_id", viewerId)
    .is("delivered_at", null)
    .is("deleted_at", null);

  if (error) {
    throw badRequest(error.message);
  }

  await admin
    .from("conversation_members")
    .update({ last_delivered_at: now })
    .eq("conversation_id", conversationId)
    .eq("user_id", viewerId);
}

export async function listMessages(
  request: Request,
  conversationId: number,
  input: PageInput,
) {
  const viewerId = await currentUserId(request);
  await ensureMember(conversationId, viewerId);
  await markConversationDelivered(conversationId, viewerId);

  const bounds = pageBounds(input.page, input.size);
  const admin = createSupabaseAdminClient();
  const { data, error, count } = await admin
    .from("messages")
    .select(messageSelect(), { count: "exact" })
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(bounds.from, bounds.to);

  if (error) {
    throw badRequest(error.message);
  }

  return toPageResponse(
    ((data ?? []) as unknown as MessageRow[]).map(mapMessage),
    count ?? 0,
    bounds.page,
    bounds.size,
  );
}

function normalizeMessagePayload(content?: string | null, attachmentUrl?: string | null) {
  const normalizedContent = content?.trim() ?? "";
  const normalizedAttachment = attachmentUrl?.trim() || null;
  if (!normalizedContent && !normalizedAttachment) {
    throw badRequest("Message text or image is required");
  }

  return {
    content: normalizedContent,
    attachmentUrl: normalizedAttachment,
    messageType: normalizedAttachment ? "IMAGE" : "TEXT",
  } as const;
}

export async function sendMessage(
  request: Request,
  input: { conversationId: number; content?: string | null; attachmentUrl?: string | null },
): Promise<MessageResponse> {
  const senderId = await currentUserId(request);
  await ensureMember(input.conversationId, senderId);
  const payload = normalizeMessagePayload(input.content, input.attachmentUrl);
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: senderId,
      content: payload.content,
      attachment_url: payload.attachmentUrl,
      message_type: payload.messageType,
    })
    .select(messageSelect())
    .single();

  if (error || !data) {
    throw badRequest(error?.message ?? "Could not send message");
  }

  const message = data as unknown as MessageRow;
  const now = new Date().toISOString();
  await admin
    .from("conversations")
    .update({ last_message_id: message.id, last_message_at: message.created_at, updated_at: now })
    .eq("id", input.conversationId);
  await admin
    .from("conversation_members")
    .update({ last_read_at: now, last_delivered_at: now })
    .eq("conversation_id", input.conversationId)
    .eq("user_id", senderId);

  const response = mapMessage(message);
  await publishConversationMessage(input.conversationId, response);
  
  const userIds = await conversationUserIds(input.conversationId);
  const senderSummary = await getUserSummary(senderId);
  const senderName = Array.isArray(senderSummary.user_profiles) ? senderSummary.user_profiles[0]?.full_name : senderSummary.user_profiles?.full_name;
  const displayName = senderName || senderSummary.username;
  
  await Promise.all(
    userIds.map((userId) => publishUserMessage(userId, response))
  );

  await Promise.all(
    userIds.filter(id => id !== senderId).map(id =>
      createNotification(
        id,
        senderId,
        "MESSAGE",
        "conversation",
        input.conversationId,
        `New message from ${displayName}`
      )
    )
  );

  return response;
}

async function getMessageForMutation(messageId: number) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("messages")
    .select(messageSelect())
    .eq("id", messageId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw badRequest(error.message);
  }

  if (!data) {
    throw notFound("Message not found");
  }

  return data as unknown as MessageRow;
}

export async function updateMessage(
  request: Request,
  messageId: number,
  input: { content?: string | null },
) {
  const viewerId = await currentUserId(request);
  const existing = await getMessageForMutation(messageId);
  await ensureMember(existing.conversation_id, viewerId);

  if (existing.sender_id !== viewerId) {
    throw forbidden("Not allowed to update this message");
  }

  const payload = normalizeMessagePayload(input.content, existing.attachment_url);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("messages")
    .update({ content: payload.content })
    .eq("id", messageId)
    .select(messageSelect())
    .single();

  if (error || !data) {
    throw badRequest(error?.message ?? "Could not update message");
  }

  const response = mapMessage(data as unknown as MessageRow);
  await publishConversationMessage(existing.conversation_id, response);
  return response;
}

export async function deleteMessage(request: Request, messageId: number) {
  const viewerId = await currentUserId(request);
  const existing = await getMessageForMutation(messageId);
  await ensureMember(existing.conversation_id, viewerId);

  if (existing.sender_id !== viewerId) {
    throw forbidden("Not allowed to delete this message");
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("messages")
    .update({ deleted_at: now, deleted_by: viewerId, is_deleted: true })
    .eq("id", messageId);

  if (error) {
    throw badRequest(error.message);
  }

  const latest = await lastMessage(existing.conversation_id);
  await admin
    .from("conversations")
    .update({
      last_message_id: latest?.id ?? null,
      last_message_at: latest?.createdAt ?? null,
      updated_at: now,
    })
    .eq("id", existing.conversation_id);
  await publishConversationStatus(existing.conversation_id, {
    eventType: "message.deleted",
    conversationId: existing.conversation_id,
    messageIds: [messageId],
    occurredAt: now,
  });
}
