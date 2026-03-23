package com.vtechai.vcollab.realtime.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConversationTypingEvent {
    private String eventType;
    private Long conversationId;
    private Long userId;
    private String username;
    private boolean typing;
    private Instant occurredAt;
}
