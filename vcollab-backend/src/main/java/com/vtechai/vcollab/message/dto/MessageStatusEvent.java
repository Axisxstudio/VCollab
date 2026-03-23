package com.vtechai.vcollab.message.dto;

import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MessageStatusEvent {
    private String eventType;
    private Long conversationId;
    private List<Long> messageIds;
    private Instant occurredAt;
}
