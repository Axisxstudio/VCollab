package com.vtechai.vcollab.presence;

import com.vtechai.vcollab.enums.PresenceStatus;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.presence.dto.PresenceEvent;
import com.vtechai.vcollab.presence.dto.PresenceResponse;
import com.vtechai.vcollab.presence.entity.UserPresence;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PresenceServiceImpl implements PresenceService {
    private final PresenceRepository presenceRepository;
    private final UserRepository userRepository;
    private final PresencePublisher presencePublisher;

    @Override
    @Transactional
    public void handleConnected(Long userId) {
        UserPresence presence = getOrCreate(userId);
        Instant now = Instant.now();
        presence.setSessionCount(presence.getSessionCount() + 1);
        presence.setStatus(PresenceStatus.ONLINE);
        presence.setLastHeartbeatAt(now);
        presenceRepository.save(presence);
        publish(presence, "presence.online");
    }

    @Override
    @Transactional
    public void handleDisconnected(Long userId) {
        UserPresence presence = getOrCreate(userId);
        int nextCount = Math.max(presence.getSessionCount() - 1, 0);
        Instant now = Instant.now();
        presence.setSessionCount(nextCount);
        presence.setLastHeartbeatAt(now);

        if (nextCount == 0) {
            presence.setStatus(PresenceStatus.OFFLINE);
            presence.setLastSeenAt(now);
            presence.setActiveConversation(null);
        }

        presenceRepository.save(presence);
        publish(presence, nextCount == 0 ? "presence.offline" : "presence.online");
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, PresenceResponse> getPresenceMap(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Long, PresenceResponse> result = new HashMap<>();
        presenceRepository.findByUserIdIn(userIds).forEach((presence) -> {
            result.put(presence.getUser().getId(), toResponse(presence));
        });

        userIds.forEach((userId) -> result.putIfAbsent(
            userId,
            PresenceResponse.builder()
                .userId(userId)
                .status(PresenceStatus.OFFLINE)
                .online(false)
                .build()
        ));

        return result;
    }

    private UserPresence getOrCreate(Long userId) {
        return presenceRepository.findByUserId(userId)
            .orElseGet(() -> UserPresence.builder()
                .user(getUser(userId))
                .status(PresenceStatus.OFFLINE)
                .sessionCount(0)
                .build());
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private PresenceResponse toResponse(UserPresence presence) {
        return PresenceResponse.builder()
            .userId(presence.getUser().getId())
            .status(presence.getStatus())
            .online(presence.getStatus() == PresenceStatus.ONLINE)
            .lastSeenAt(presence.getLastSeenAt())
            .lastHeartbeatAt(presence.getLastHeartbeatAt())
            .build();
    }

    private void publish(UserPresence presence, String eventType) {
        presencePublisher.publish(PresenceEvent.builder()
            .eventType(eventType)
            .userId(presence.getUser().getId())
            .status(presence.getStatus())
            .online(presence.getStatus() == PresenceStatus.ONLINE)
            .lastSeenAt(presence.getLastSeenAt())
            .lastHeartbeatAt(presence.getLastHeartbeatAt())
            .build());
    }
}
