package com.vtechai.vcollab.follow;

import com.vtechai.vcollab.follow.entity.Follow;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    Optional<Follow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);
    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);
    List<Follow> findByFollowingIdOrderByCreatedAtDesc(Long followingId);
    List<Follow> findByFollowerIdOrderByCreatedAtDesc(Long followerId);
}
