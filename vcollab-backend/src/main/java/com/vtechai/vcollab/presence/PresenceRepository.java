package com.vtechai.vcollab.presence;

import com.vtechai.vcollab.presence.entity.UserPresence;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PresenceRepository extends JpaRepository<UserPresence, Long> {
    Optional<UserPresence> findByUserId(Long userId);
    List<UserPresence> findByUserIdIn(Collection<Long> userIds);
}
