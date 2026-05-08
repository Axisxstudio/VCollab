import type { MessageResponse, MessageRow, UserSummaryRow } from "./types";

export function userSummary(user: UserSummaryRow | null) {
  const profile = Array.isArray(user?.user_profiles)
    ? user.user_profiles[0]
    : user?.user_profiles;

  return {
    id: user?.id ?? 0,
    username: user?.username ?? "",
    fullName: profile?.full_name ?? null,
    profileImage: profile?.profile_image ?? null,
  };
}

export function mapMessage(row: MessageRow): MessageResponse {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    content: row.content,
    messageType: row.message_type,
    attachmentUrl: row.attachment_url,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at,
    readAt: row.read_at,
    sender: userSummary(row.sender),
  };
}
