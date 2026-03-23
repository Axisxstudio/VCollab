package com.vtechai.vcollab.presence;

import com.vtechai.vcollab.presence.dto.PresenceEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PresencePublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public void publish(PresenceEvent event) {
        messagingTemplate.convertAndSend("/topic/presence", event);
    }
}
