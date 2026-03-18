package com.vtechai.vcollab.notification;

import com.vtechai.vcollab.notification.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationPublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public void publishToUser(String username, NotificationResponse response) {
        messagingTemplate.convertAndSendToUser(username, "/queue/notifications", response);
    }
}
