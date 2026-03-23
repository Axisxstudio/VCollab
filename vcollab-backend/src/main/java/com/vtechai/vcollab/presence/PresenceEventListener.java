package com.vtechai.vcollab.presence;

import com.vtechai.vcollab.security.UserPrincipal;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
public class PresenceEventListener {
    private final PresenceService presenceService;

    @EventListener
    public void handleConnected(SessionConnectedEvent event) {
        UserPrincipal principal = extractPrincipal(StompHeaderAccessor.wrap(event.getMessage()).getUser());
        if (principal != null) {
            presenceService.handleConnected(principal.getId());
        }
    }

    @EventListener
    public void handleDisconnected(SessionDisconnectEvent event) {
        UserPrincipal principal = extractPrincipal(StompHeaderAccessor.wrap(event.getMessage()).getUser());
        if (principal != null) {
            presenceService.handleDisconnected(principal.getId());
        }
    }

    private UserPrincipal extractPrincipal(Principal principal) {
        if (principal instanceof Authentication authentication) {
            Object authPrincipal = authentication.getPrincipal();
            if (authPrincipal instanceof UserPrincipal userPrincipal) {
                return userPrincipal;
            }
        }
        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal;
        }
        return null;
    }
}
