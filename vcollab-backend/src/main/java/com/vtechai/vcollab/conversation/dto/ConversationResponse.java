package com.vtechai.vcollab.conversation.dto;

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
    }

    @Data
    @Builder
    public static class MessagePreview {
        private Long id;
        private String content;
        private Instant createdAt;
        private Long senderId;
    }
}
