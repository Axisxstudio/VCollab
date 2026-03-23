package com.vtechai.vcollab.conversation.dto;

import com.vtechai.vcollab.enums.MessageType;
import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConversationResponse {
    private Long id;
    private List<ParticipantSummary> participants;
    private MessagePreview lastMessage;
    private long unreadCount;

    @Data
    @Builder
    public static class ParticipantSummary {
        private Long id;
        private String username;
        private String fullName;
        private String profileImage;
        private boolean online;
        private Instant lastSeenAt;
    }

    @Data
    @Builder
    public static class MessagePreview {
        private Long id;
        private String content;
        private MessageType messageType;
        private String attachmentUrl;
        private Instant createdAt;
        private Long senderId;
    }
}
