package com.vtechai.vcollab.realtime;

import com.vtechai.vcollab.conversation.ConversationMemberRepository;
import com.vtechai.vcollab.exception.ForbiddenException;
import com.vtechai.vcollab.realtime.dto.ConversationTypingEvent;
import com.vtechai.vcollab.realtime.dto.ConversationTypingPayload;
import com.vtechai.vcollab.security.UserPrincipal;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ConversationRealtimeController {
    private final ConversationMemberRepository conversationMemberRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/conversations/{conversationId}/typing")
    public void publishTyping(
        @DestinationVariable Long conversationId,
        ConversationTypingPayload payload,
        Authentication authentication
    ) {
        UserPrincipal principal = authentication != null && authentication.getPrincipal() instanceof UserPrincipal userPrincipal
            ? userPrincipal
            : null;
        if (principal == null) {
            throw new ForbiddenException("Authentication required");
        }

        conversationMemberRepository.findByConversationIdAndUserId(conversationId, principal.getId())
            .orElseThrow(() -> new ForbiddenException("Not allowed to access this conversation"));

        ConversationTypingEvent event = ConversationTypingEvent.builder()
            .eventType("conversation.typing")
            .conversationId(conversationId)
            .userId(principal.getId())
            .username(principal.getUsername())
            .typing(payload != null && payload.isTyping())
            .occurredAt(Instant.now())
            .build();

        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId + "/typing", event);
    }
}
