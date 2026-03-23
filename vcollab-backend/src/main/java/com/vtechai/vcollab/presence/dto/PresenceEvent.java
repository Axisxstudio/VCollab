package com.vtechai.vcollab.presence.dto;

import com.vtechai.vcollab.enums.PresenceStatus;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PresenceEvent {
    private String eventType;
    private Long userId;
    private PresenceStatus status;
    private boolean online;
    private Instant lastSeenAt;
    private Instant lastHeartbeatAt;
}
