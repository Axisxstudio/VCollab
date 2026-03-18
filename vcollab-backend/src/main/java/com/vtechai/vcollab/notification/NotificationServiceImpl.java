package com.vtechai.vcollab.notification;

import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.notification.dto.NotificationCreateRequest;
import com.vtechai.vcollab.notification.dto.NotificationResponse;
import com.vtechai.vcollab.notification.entity.Notification;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationPublisher notificationPublisher;

    @Override
    @Transactional
    public void send(NotificationCreateRequest request) {
        if (request == null || request.getRecipientId() == null || request.getType() == null) {
            return;
        }

        User recipient = userRepository.findById(request.getRecipientId())
            .orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));
        if (recipient.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Recipient not found");
        }

        User actor = null;
        if (request.getActorId() != null) {
            actor = userRepository.findById(request.getActorId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }

        if (actor != null && recipient.getId().equals(actor.getId())) {
            return;
        }

        Notification notification = Notification.builder()
            .recipient(recipient)
            .actor(actor)
            .type(request.getType())
            .contentType(request.getContentType())
            .contentId(request.getContentId())
            .message(request.getMessage())
            .read(false)
            .build();

        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = toResponse(saved);
        notificationPublisher.publishToUser(recipient.getUsername(), response);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> list(UserPrincipal principal, Pageable pageable) {
        return notificationRepository.findByRecipientIdAndDeletedAtIsNullOrderByCreatedAtDesc(principal.getId(), pageable)
            .map(this::toResponse);
    }

    @Override
    public long unreadCount(UserPrincipal principal) {
        return notificationRepository.countByRecipientIdAndReadFalseAndDeletedAtIsNull(principal.getId());
    }

    @Override
    @Transactional
    public NotificationResponse markRead(Long id, UserPrincipal principal) {
        Notification notification = notificationRepository.findByIdAndRecipientIdAndDeletedAtIsNull(id, principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
            notificationRepository.save(notification);
        }

        return toResponse(notification);
    }

    @Override
    @Transactional
    public int markAllRead(UserPrincipal principal) {
        List<Notification> notifications = notificationRepository.findByRecipientIdAndReadFalseAndDeletedAtIsNull(principal.getId());
        if (notifications.isEmpty()) {
            return 0;
        }
        Instant now = Instant.now();
        notifications.forEach(notification -> {
            notification.setRead(true);
            notification.setReadAt(now);
        });
        notificationRepository.saveAll(notifications);
        return notifications.size();
    }

    @Override
    @Transactional
    public void delete(Long id, UserPrincipal principal) {
        Notification notification = notificationRepository.findByIdAndRecipientIdAndDeletedAtIsNull(id, principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setDeletedAt(Instant.now());
        notification.setDeletedBy(principal.getId());
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public int deleteAll(UserPrincipal principal) {
        Page<Notification> page = notificationRepository.findByRecipientIdAndDeletedAtIsNullOrderByCreatedAtDesc(
            principal.getId(),
            Pageable.unpaged()
        );
        List<Notification> notifications = page.getContent();
        if (notifications.isEmpty()) {
            return 0;
        }
        Instant now = Instant.now();
        notifications.forEach(notification -> {
            notification.setDeletedAt(now);
            notification.setDeletedBy(principal.getId());
        });
        notificationRepository.saveAll(notifications);
        return notifications.size();
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
            .id(notification.getId())
            .type(notification.getType())
            .contentType(notification.getContentType())
            .contentId(notification.getContentId())
            .message(notification.getMessage())
            .read(notification.isRead())
            .createdAt(notification.getCreatedAt())
            .actor(mapActor(notification.getActor()))
            .build();
    }

    private NotificationResponse.ActorSummary mapActor(User actor) {
        if (actor == null) {
            return null;
        }
        String fullName = actor.getProfile() != null ? actor.getProfile().getFullName() : null;
        String profileImage = actor.getProfile() != null ? actor.getProfile().getProfileImage() : null;
        return NotificationResponse.ActorSummary.builder()
            .id(actor.getId())
            .username(actor.getUsername())
            .fullName(fullName)
            .profileImage(profileImage)
            .build();
    }
}
