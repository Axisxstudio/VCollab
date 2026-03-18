package com.vtechai.vcollab.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NotificationCountResponse {
    private long unreadCount;
}
