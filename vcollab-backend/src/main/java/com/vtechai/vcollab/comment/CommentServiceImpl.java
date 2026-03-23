package com.vtechai.vcollab.comment;

import com.vtechai.vcollab.comment.dto.CommentRequest;
import com.vtechai.vcollab.comment.dto.CommentResponse;
import com.vtechai.vcollab.comment.dto.CommentUpdateRequest;
import com.vtechai.vcollab.comment.entity.Comment;
import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.FeedEventType;
import com.vtechai.vcollab.enums.NotificationType;
import com.vtechai.vcollab.exception.ForbiddenException;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.interaction.ContentCounterService;
import com.vtechai.vcollab.notification.MentionService;
import com.vtechai.vcollab.notification.NotificationService;
import com.vtechai.vcollab.notification.dto.NotificationCreateRequest;
import com.vtechai.vcollab.realtime.FeedEvent;
import com.vtechai.vcollab.realtime.FeedPublisher;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final ContentCounterService contentCounterService;
    private final FeedPublisher feedPublisher;
    private final NotificationService notificationService;
    private final MentionService mentionService;

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> listByContent(ContentType contentType, Long contentId) {
        List<Comment> comments = commentRepository
            .findByContentTypeAndContentIdAndDeletedAtIsNullOrderByCreatedAtAsc(contentType, contentId);
        Map<Long, CommentResponse> mapped = new LinkedHashMap<>();
        for (Comment comment : comments) {
            mapped.put(comment.getId(), toResponse(comment));
        }
        List<CommentResponse> roots = new ArrayList<>();
        for (Comment comment : comments) {
            CommentResponse response = mapped.get(comment.getId());
            if (comment.getParent() != null) {
                CommentResponse parent = mapped.get(comment.getParent().getId());
                if (parent != null) {
                    parent.getReplies().add(response);
                } else {
                    roots.add(response);
                }
            } else {
                roots.add(response);
            }
        }
        return roots;
    }

    @Override
    @Transactional
    public CommentResponse create(CommentRequest request, UserPrincipal principal) {
        contentCounterService.assertContentExists(request.getContentType(), request.getContentId());
        User author = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String normalizedContent = normalizeContent(request.getContent());
        String normalizedImageUrl = normalizeImageUrl(request.getImageUrl());

        validateCommentPayload(normalizedContent, normalizedImageUrl);

        Comment parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findByIdAndDeletedAtIsNull(request.getParentId())
                .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));
            if (parent.getContentType() != request.getContentType()
                || !parent.getContentId().equals(request.getContentId())) {
                throw new ResourceNotFoundException("Parent comment not found");
            }
        }

        Comment comment = Comment.builder()
            .author(author)
            .contentType(request.getContentType())
            .contentId(request.getContentId())
            .parent(parent)
            .content(normalizedContent)
            .imageUrl(normalizedImageUrl)
            .active(true)
            .build();

        Comment saved = commentRepository.save(comment);
        contentCounterService.updateCommentCount(request.getContentType(), request.getContentId(), 1);

        feedPublisher.publish(FeedEvent.builder()
            .eventType(FeedEventType.COMMENT_CREATED)
            .contentType(request.getContentType())
            .contentId(request.getContentId())
            .actorId(principal.getId())
            .actorName(author.getUsername())
            .createdAt(Instant.now())
            .build());

        User owner = contentCounterService.getContentOwner(request.getContentType(), request.getContentId());
        if (owner != null) {
            String label = request.getContentType().name().toLowerCase();
            notificationService.send(NotificationCreateRequest.builder()
                .recipientId(owner.getId())
                .actorId(principal.getId())
                .type(NotificationType.COMMENT)
                .contentType(request.getContentType())
                .contentId(request.getContentId())
                .message("commented on your " + label + ".")
                .metadata(normalizedContent)
                .build());
        }

        // Process mentions in comment
        mentionService.processMentions(saved.getContent(), principal.getId(), ContentType.COMMENT, saved.getId());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public CommentResponse update(Long id, CommentUpdateRequest request, UserPrincipal principal) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        if (!comment.getAuthor().getId().equals(principal.getId())) {
            throw new ForbiddenException("Not allowed to update this comment");
        }
        String normalizedContent = normalizeContent(request.getContent());
        validateCommentPayload(normalizedContent, normalizeImageUrl(comment.getImageUrl()));
        comment.setContent(normalizedContent);
        comment.setEditedAt(Instant.now());
        Comment saved = commentRepository.save(comment);

        // Process mentions on update
        mentionService.processMentions(saved.getContent(), principal.getId(), ContentType.COMMENT, saved.getId());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, UserPrincipal principal) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        if (!comment.getAuthor().getId().equals(principal.getId())) {
            throw new ForbiddenException("Not allowed to delete this comment");
        }
        comment.setDeletedAt(Instant.now());
        comment.setDeletedBy(principal.getId());
        comment.setActive(false);
        commentRepository.save(comment);
        contentCounterService.updateCommentCount(comment.getContentType(), comment.getContentId(), -1);

        feedPublisher.publish(FeedEvent.builder()
            .eventType(FeedEventType.COMMENT_REMOVED)
            .contentType(comment.getContentType())
            .contentId(comment.getContentId())
            .actorId(principal.getId())
            .actorName(comment.getAuthor().getUsername())
            .createdAt(Instant.now())
            .build());
    }

    private CommentResponse toResponse(Comment comment) {
        CommentResponse.AuthorSummary author = CommentResponse.AuthorSummary.builder()
            .id(comment.getAuthor().getId())
            .username(comment.getAuthor().getUsername())
            .fullName(comment.getAuthor().getProfile() != null ? comment.getAuthor().getProfile().getFullName() : null)
            .profileImage(comment.getAuthor().getProfile() != null ? comment.getAuthor().getProfile().getProfileImage() : null)
            .build();

        return CommentResponse.builder()
            .id(comment.getId())
            .content(comment.getContent())
            .imageUrl(comment.getImageUrl())
            .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
            .author(author)
            .createdAt(comment.getCreatedAt())
            .updatedAt(comment.getUpdatedAt())
            .editedAt(comment.getEditedAt())
            .likeCount(comment.getLikeCount())
            .mentionTargets(comment.getMentionTargets())
            .build();
    }

    private void validateCommentPayload(String content, String imageUrl) {
        if (content.isBlank() && imageUrl == null) {
            throw new IllegalArgumentException("Comment text or image is required");
        }
    }

    private String normalizeContent(String content) {
        return content == null ? "" : content.trim();
    }

    private String normalizeImageUrl(String imageUrl) {
        if (imageUrl == null) {
            return null;
        }
        String trimmed = imageUrl.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
