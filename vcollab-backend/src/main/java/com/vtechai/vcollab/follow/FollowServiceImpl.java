package com.vtechai.vcollab.follow;

import com.vtechai.vcollab.enums.FeedEventType;
import com.vtechai.vcollab.enums.NotificationType;
import com.vtechai.vcollab.exception.ForbiddenException;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.follow.dto.FollowRequest;
import com.vtechai.vcollab.follow.dto.FollowUserResponse;
import com.vtechai.vcollab.follow.entity.Follow;
import com.vtechai.vcollab.notification.NotificationService;
import com.vtechai.vcollab.notification.dto.NotificationCreateRequest;
import com.vtechai.vcollab.realtime.FeedEvent;
import com.vtechai.vcollab.realtime.FeedPublisher;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserProfileRepository;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import com.vtechai.vcollab.user.entity.UserProfile;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FollowServiceImpl implements FollowService {
    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final FeedPublisher feedPublisher;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public void follow(FollowRequest request, UserPrincipal principal) {
        if (request.getUserId().equals(principal.getId())) {
            throw new ForbiddenException("You cannot follow yourself");
        }
        User follower = getUser(principal.getId());
        User following = getUser(request.getUserId());

        boolean exists = followRepository.existsByFollowerIdAndFollowingId(follower.getId(), following.getId());
        if (exists) {
            return;
        }

        Follow follow = Follow.builder()
            .follower(follower)
            .following(following)
            .build();
        followRepository.save(follow);
        updateCounts(follower.getId(), following.getId(), 1);

        feedPublisher.publish(FeedEvent.builder()
            .eventType(FeedEventType.FOLLOW_CREATED)
            .contentId(following.getId())
            .actorId(follower.getId())
            .actorName(follower.getUsername())
            .createdAt(Instant.now())
            .build());

        notificationService.send(NotificationCreateRequest.builder()
            .recipientId(following.getId())
            .actorId(follower.getId())
            .type(NotificationType.FOLLOW)
            .message(follower.getUsername() + " started following you.")
            .build());
    }

    @Override
    @Transactional
    public void unfollow(Long userId, UserPrincipal principal) {
        Follow follow = followRepository.findByFollowerIdAndFollowingId(principal.getId(), userId)
            .orElse(null);
        if (follow == null) {
            return;
        }
        followRepository.delete(follow);
        updateCounts(principal.getId(), userId, -1);

        feedPublisher.publish(FeedEvent.builder()
            .eventType(FeedEventType.FOLLOW_REMOVED)
            .contentId(userId)
            .actorId(principal.getId())
            .actorName(follow.getFollower().getUsername())
            .createdAt(Instant.now())
            .build());
    }

    @Override
    public boolean isFollowing(Long userId, UserPrincipal principal) {
        return followRepository.existsByFollowerIdAndFollowingId(principal.getId(), userId);
    }

    @Override
    public List<FollowUserResponse> listFollowers(Long userId) {
        return followRepository.findByFollowingIdOrderByCreatedAtDesc(userId).stream()
            .map(follow -> mapUser(follow.getFollower()))
            .toList();
    }

    @Override
    public List<FollowUserResponse> listFollowing(Long userId) {
        return followRepository.findByFollowerIdOrderByCreatedAtDesc(userId).stream()
            .map(follow -> mapUser(follow.getFollowing()))
            .toList();
    }

    private User getUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getDeletedAt() != null) {
            throw new ResourceNotFoundException("User not found");
        }
        return user;
    }

    private void updateCounts(Long followerId, Long followingId, int delta) {
        UserProfile followerProfile = userProfileRepository.findByUserId(followerId)
            .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
        UserProfile followingProfile = userProfileRepository.findByUserId(followingId)
            .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        followerProfile.setFollowingCount(safeIncrement(followerProfile.getFollowingCount(), delta));
        followingProfile.setFollowerCount(safeIncrement(followingProfile.getFollowerCount(), delta));

        userProfileRepository.save(followerProfile);
        userProfileRepository.save(followingProfile);
    }

    private int safeIncrement(int current, int delta) {
        int updated = current + delta;
        return Math.max(updated, 0);
    }

    private FollowUserResponse mapUser(User user) {
        String fullName = null;
        String profileImage = null;
        if (user.getProfile() != null) {
            fullName = user.getProfile().getFullName();
            profileImage = user.getProfile().getProfileImage();
        }
        return FollowUserResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .fullName(fullName)
            .profileImage(profileImage)
            .build();
    }
}
