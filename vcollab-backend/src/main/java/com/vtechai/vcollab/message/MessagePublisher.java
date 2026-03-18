package com.vtechai.vcollab.message;

import com.vtechai.vcollab.message.dto.MessageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MessagePublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public void publishToUser(String username, MessageResponse response) {
        messagingTemplate.convertAndSendToUser(username, "/queue/messages", response);
    }
}
