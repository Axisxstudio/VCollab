package com.vtechai.vcollab.notification.dto;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.NotificationType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationCreateRequest {
    private Long recipientId;
    private Long actorId;
    private NotificationType type;
    private ContentType contentType;
    private Long contentId;
    private String message;
}
