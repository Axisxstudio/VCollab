package com.vtechai.vcollab.notification.dto;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.NotificationType;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private NotificationType type;
    private ContentType contentType;
    private Long contentId;
    private String message;
    private boolean read;
    private Instant createdAt;
    private ActorSummary actor;

    @Data
    @Builder
    public static class ActorSummary {
        private Long id;
        private String username;
        private String fullName;
        private String profileImage;
    }
}
