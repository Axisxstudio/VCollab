package com.vtechai.vcollab.message.dto;

import com.vtechai.vcollab.enums.MessageType;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MessageResponse {
    private Long id;
    private Long conversationId;
    private String content;
    private MessageType messageType;
    private String attachmentUrl;
    private Instant createdAt;
    private Instant deliveredAt;
    private Instant readAt;
    private SenderSummary sender;

    @Data
    @Builder
    public static class SenderSummary {
        private Long id;
        private String username;
        private String fullName;
        private String profileImage;
    }
}
