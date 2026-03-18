package com.vtechai.vcollab.realtime;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FeedPublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public void publish(FeedEvent event) {
        messagingTemplate.convertAndSend("/topic/feed", event);
    }
}
