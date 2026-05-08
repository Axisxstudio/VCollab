export type ParticipantSummary = {
  id: number;
  username: string;
  fullName: string | null;
  profileImage: string | null;
  online: boolean;
  lastSeenAt: string | null;
};

export type MessagePreview = {
  id: number;
  content: string;
  messageType: "TEXT" | "IMAGE";
  attachmentUrl: string | null;
  createdAt: string;
  senderId: number;
};

export type ConversationResponse = {
  id: number;
  participants: ParticipantSummary[];
  lastMessage: MessagePreview | null;
  unreadCount: number;
};

export type MessageResponse = {
  id: number;
  conversationId: number;
  content: string;
  messageType: "TEXT" | "IMAGE";
  attachmentUrl: string | null;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  sender: {
    id: number;
    username: string;
    fullName: string | null;
    profileImage: string | null;
  };
};

export type UserSummaryRow = {
  id: number;
  username: string;
  user_profiles:
    | {
        full_name: string | null;
        profile_image: string | null;
      }
    | Array<{
        full_name: string | null;
        profile_image: string | null;
      }>
    | null;
};

export type MessageRow = {
  id: number;
  conversation_id: number;
  content: string;
  message_type: "TEXT" | "IMAGE";
  attachment_url: string | null;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
  sender_id: number;
  sender: UserSummaryRow | null;
};
