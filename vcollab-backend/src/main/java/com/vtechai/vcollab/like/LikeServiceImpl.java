package com.vtechai.vcollab.like;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.FeedEventType;
import com.vtechai.vcollab.enums.NotificationType;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.interaction.ContentCounterService;
import com.vtechai.vcollab.like.dto.LikeRequest;
import com.vtechai.vcollab.like.entity.Like;
import com.vtechai.vcollab.notification.NotificationService;
import com.vtechai.vcollab.notification.dto.NotificationCreateRequest;
import com.vtechai.vcollab.realtime.FeedEvent;
import com.vtechai.vcollab.realtime.FeedPublisher;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LikeServiceImpl implements LikeService {
    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final ContentCounterService contentCounterService;
    private final FeedPublisher feedPublisher;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public void like(LikeRequest request, UserPrincipal principal) {
        contentCounterService.assertContentExists(request.getContentType(), request.getContentId());
        boolean exists = likeRepository.existsByUserIdAndContentTypeAndContentId(
            principal.getId(),
            request.getContentType(),
            request.getContentId()
        );
        if (exists) {
            return;
        }
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Like like = Like.builder()
            .user(user)
            .contentType(request.getContentType())
            .contentId(request.getContentId())
            .build();
        likeRepository.save(like);
        contentCounterService.updateLikeCount(request.getContentType(), request.getContentId(), 1);

        feedPublisher.publish(FeedEvent.builder()
            .eventType(FeedEventType.LIKE_CREATED)
            .contentType(request.getContentType())
            .contentId(request.getContentId())
            .actorId(principal.getId())
            .actorName(user.getUsername())
            .createdAt(Instant.now())
            .build());

        User owner = contentCounterService.getContentOwner(request.getContentType(), request.getContentId());
        String label = request.getContentType().name().toLowerCase();
        notificationService.send(NotificationCreateRequest.builder()
            .recipientId(owner.getId())
            .actorId(principal.getId())
            .type(NotificationType.LIKE)
            .contentType(request.getContentType())
            .contentId(request.getContentId())
            .message("liked your " + label + ".")
            .build());
    }

    @Override
    @Transactional
    public void unlike(ContentType contentType, Long contentId, UserPrincipal principal) {
        Like like = likeRepository.findByUserIdAndContentTypeAndContentId(principal.getId(), contentType, contentId)
            .orElse(null);
        if (like == null) {
            return;
        }
        likeRepository.delete(like);
        contentCounterService.updateLikeCount(contentType, contentId, -1);

        feedPublisher.publish(FeedEvent.builder()
            .eventType(FeedEventType.LIKE_REMOVED)
            .contentType(contentType)
            .contentId(contentId)
            .actorId(principal.getId())
            .actorName(like.getUser().getUsername())
            .createdAt(Instant.now())
            .build());
    }

    @Override
    public boolean isLiked(ContentType contentType, Long contentId, UserPrincipal principal) {
        return likeRepository.existsByUserIdAndContentTypeAndContentId(principal.getId(), contentType, contentId);
    }
}
