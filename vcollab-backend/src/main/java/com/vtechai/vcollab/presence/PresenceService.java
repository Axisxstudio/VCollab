package com.vtechai.vcollab.presence;

import com.vtechai.vcollab.presence.dto.PresenceResponse;
import java.util.Collection;
import java.util.Map;

public interface PresenceService {
    void handleConnected(Long userId);
    void handleDisconnected(Long userId);
    Map<Long, PresenceResponse> getPresenceMap(Collection<Long> userIds);
}
