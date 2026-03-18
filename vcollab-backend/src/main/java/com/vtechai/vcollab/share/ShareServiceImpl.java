package com.vtechai.vcollab.share;

import com.vtechai.vcollab.enums.FeedEventType;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.interaction.ContentCounterService;
import com.vtechai.vcollab.realtime.FeedEvent;
import com.vtechai.vcollab.realtime.FeedPublisher;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.share.dto.ShareRequest;
import com.vtechai.vcollab.share.entity.Share;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShareServiceImpl implements ShareService {
    private final ShareRepository shareRepository;
    private final UserRepository userRepository;
    private final ContentCounterService contentCounterService;
    private final FeedPublisher feedPublisher;

    @Override
    @Transactional
    public void share(ShareRequest request, UserPrincipal principal) {
        contentCounterService.assertContentExists(request.getContentType(), request.getContentId());
        boolean exists = shareRepository.existsByUserIdAndContentTypeAndContentId(
            principal.getId(),
            request.getContentType(),
            request.getContentId()
        );
        if (exists) {
            return;
        }
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Share share = Share.builder()
            .user(user)
            .contentType(request.getContentType())
            .contentId(request.getContentId())
            .build();
        shareRepository.save(share);
        contentCounterService.updateShareCount(request.getContentType(), request.getContentId(), 1);

        feedPublisher.publish(FeedEvent.builder()
            .eventType(FeedEventType.SHARE_CREATED)
            .contentType(request.getContentType())
            .contentId(request.getContentId())
            .actorId(principal.getId())
            .actorName(user.getUsername())
            .createdAt(Instant.now())
            .build());
    }
}
