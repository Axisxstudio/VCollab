package com.vtechai.vcollab.admin;

import com.vtechai.vcollab.admin.dto.AdminRecycleRecordResponse;
import com.vtechai.vcollab.audit.AuditLogService;
import com.vtechai.vcollab.comment.CommentRepository;
import com.vtechai.vcollab.comment.entity.Comment;
import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.interaction.ContentCounterService;
import com.vtechai.vcollab.message.MessageRepository;
import com.vtechai.vcollab.message.entity.Message;
import com.vtechai.vcollab.notification.NotificationRepository;
import com.vtechai.vcollab.notification.entity.Notification;
import com.vtechai.vcollab.report.ReportRepository;
import com.vtechai.vcollab.report.entity.Report;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import com.vtechai.vcollab.user.entity.UserProfile;
import com.vtechai.vcollab.warning.WarningRepository;
import com.vtechai.vcollab.warning.entity.Warning;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/recycle-bin")
@RequiredArgsConstructor
public class AdminRecycleBinController {
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final WarningRepository warningRepository;
    private final MessageRepository messageRepository;
    private final NotificationRepository notificationRepository;
    private final CommentRepository commentRepository;
    private final ContentCounterService contentCounterService;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<AdminRecycleRecordResponse>>> list(
        @RequestParam("entityType") String entityType,
        Pageable pageable
    ) {
        Page<AdminRecycleRecordResponse> response = switch (normalizeType(entityType)) {
            case "USER" -> userRepository.findByDeletedAtIsNotNullOrderByDeletedAtDesc(buildPageable(pageable)).map(this::mapUser);
            case "REPORT" -> reportRepository.findByDeletedAtIsNotNullOrderByDeletedAtDesc(buildPageable(pageable)).map(this::mapReport);
            case "WARNING" -> warningRepository.findByDeletedAtIsNotNullOrderByDeletedAtDesc(buildPageable(pageable)).map(this::mapWarning);
            case "MESSAGE" -> messageRepository.findByDeletedAtIsNotNullOrderByDeletedAtDesc(buildPageable(pageable)).map(this::mapMessage);
            case "NOTIFICATION" -> notificationRepository.findByDeletedAtIsNotNullOrderByDeletedAtDesc(buildPageable(pageable)).map(this::mapNotification);
            case "COMMENT" -> commentRepository.findByDeletedAtIsNotNullOrderByDeletedAtDesc(buildPageable(pageable)).map(this::mapComment);
            default -> throw new ResourceNotFoundException("Unsupported recycle-bin type");
        };
        return ResponseEntity.ok(ApiResponse.ok("Recycle bin records", response));
    }

    @PatchMapping("/{entityType}/{id}/restore")
    @Transactional
    public ResponseEntity<ApiResponse<AdminRecycleRecordResponse>> restore(
        @PathVariable String entityType,
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        String normalizedType = normalizeType(entityType);
        AdminRecycleRecordResponse response = switch (normalizedType) {
            case "USER" -> restoreUser(id, principal);
            case "REPORT" -> restoreReport(id, principal);
            case "WARNING" -> restoreWarning(id, principal);
            case "MESSAGE" -> restoreMessage(id, principal);
            case "NOTIFICATION" -> restoreNotification(id, principal);
            case "COMMENT" -> restoreComment(id, principal);
            default -> throw new ResourceNotFoundException("Unsupported recycle-bin type");
        };
        return ResponseEntity.ok(ApiResponse.ok("Record restored", response));
    }

    private AdminRecycleRecordResponse restoreUser(Long id, UserPrincipal principal) {
        User user = userRepository.findById(id)
            .filter(item -> item.getDeletedAt() != null)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setDeletedAt(null);
        user.setDeletedBy(null);
        user.setActive(true);
        user.setSuspended(false);
        User saved = userRepository.save(user);
        auditLogService.record(principal.getId(), "USER", "RESTORED", "USER", saved.getId(), "Restored user @" + saved.getUsername(), null);
        return mapUser(saved);
    }

    private AdminRecycleRecordResponse restoreReport(Long id, UserPrincipal principal) {
        Report report = reportRepository.findById(id)
            .filter(item -> item.getDeletedAt() != null)
            .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        report.setDeletedAt(null);
        report.setDeletedBy(null);
        Report saved = reportRepository.save(report);
        auditLogService.record(principal.getId(), "REPORT", "RESTORED", "REPORT", saved.getId(), "Restored report #" + saved.getId(), null);
        return mapReport(saved);
    }

    private AdminRecycleRecordResponse restoreWarning(Long id, UserPrincipal principal) {
        Warning warning = warningRepository.findById(id)
            .filter(item -> item.getDeletedAt() != null)
            .orElseThrow(() -> new ResourceNotFoundException("Warning not found"));
        warning.setDeletedAt(null);
        warning.setDeletedBy(null);
        Warning saved = warningRepository.save(warning);
        auditLogService.record(principal.getId(), "WARNING", "RESTORED", "WARNING", saved.getId(), "Restored warning #" + saved.getId(), null);
        return mapWarning(saved);
    }

    private AdminRecycleRecordResponse restoreMessage(Long id, UserPrincipal principal) {
        Message message = messageRepository.findById(id)
            .filter(item -> item.getDeletedAt() != null)
            .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        message.setDeletedAt(null);
        message.setDeletedBy(null);
        Message saved = messageRepository.save(message);
        auditLogService.record(principal.getId(), "MESSAGE", "RESTORED", "MESSAGE", saved.getId(), "Restored message #" + saved.getId(), null);
        return mapMessage(saved);
    }

    private AdminRecycleRecordResponse restoreNotification(Long id, UserPrincipal principal) {
        Notification notification = notificationRepository.findById(id)
            .filter(item -> item.getDeletedAt() != null)
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setDeletedAt(null);
        notification.setDeletedBy(null);
        Notification saved = notificationRepository.save(notification);
        auditLogService.record(principal.getId(), "NOTIFICATION", "RESTORED", "NOTIFICATION", saved.getId(), "Restored notification #" + saved.getId(), null);
        return mapNotification(saved);
    }

    private AdminRecycleRecordResponse restoreComment(Long id, UserPrincipal principal) {
        Comment comment = commentRepository.findById(id)
            .filter(item -> item.getDeletedAt() != null)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        comment.setDeletedAt(null);
        comment.setDeletedBy(null);
        comment.setActive(true);
        Comment saved = commentRepository.save(comment);
        contentCounterService.updateCommentCount(saved.getContentType(), saved.getContentId(), 1);
        auditLogService.record(principal.getId(), "COMMENT", "RESTORED", "COMMENT", saved.getId(), "Restored comment #" + saved.getId(), null);
        return mapComment(saved);
    }

    private Pageable buildPageable(Pageable pageable) {
        int page = pageable != null && pageable.isPaged() ? pageable.getPageNumber() : 0;
        int size = pageable != null && pageable.isPaged() ? pageable.getPageSize() : 12;
        Sort sort = pageable != null && pageable.getSort().isSorted()
            ? pageable.getSort()
            : Sort.by(Sort.Direction.DESC, "deletedAt");
        return PageRequest.of(page, size, sort);
    }

    private String normalizeType(String entityType) {
        return entityType == null ? "" : entityType.trim().toUpperCase();
    }

    private AdminRecycleRecordResponse mapUser(User user) {
        UserProfile profile = user.getProfile();
        String fullName = resolveName(user);
        return baseBuilder("USER", user.getId(), fullName, user.getEmail(), user.getCreatedAt(), user.getUpdatedAt(), user.getDeletedAt(), user.getDeletedBy())
            .status(user.getRole().name())
            .ownerId(user.getId())
            .ownerUsername(user.getUsername())
            .ownerFullName(fullName)
            .ownerProfileImage(profile != null ? profile.getProfileImage() : null)
            .secondaryLabel("@" + user.getUsername())
            .tertiaryLabel((user.isActive() ? "Active" : "Inactive") + " / " + (user.isSuspended() ? "Suspended" : "Open"))
            .build();
    }

    private AdminRecycleRecordResponse mapReport(Report report) {
        User reporter = report.getReporter();
        return baseBuilder("REPORT", report.getId(), report.getReason().name(), report.getDescription(), report.getCreatedAt(), report.getUpdatedAt(), report.getDeletedAt(), report.getDeletedBy())
            .status(report.getStatus().name())
            .ownerId(reporter.getId())
            .ownerUsername(reporter.getUsername())
            .ownerFullName(resolveName(reporter))
            .ownerProfileImage(reporter.getProfile() != null ? reporter.getProfile().getProfileImage() : null)
            .secondaryLabel(report.getContentType() + " #" + report.getContentId())
            .tertiaryLabel("Reporter @" + reporter.getUsername())
            .build();
    }

    private AdminRecycleRecordResponse mapWarning(Warning warning) {
        User target = warning.getTargetUser();
        return baseBuilder("WARNING", warning.getId(), warning.getTitle(), warning.getMessage(), warning.getCreatedAt(), warning.getUpdatedAt(), warning.getDeletedAt(), warning.getDeletedBy())
            .status(warning.getStatus().name())
            .ownerId(target.getId())
            .ownerUsername(target.getUsername())
            .ownerFullName(resolveName(target))
            .ownerProfileImage(target.getProfile() != null ? target.getProfile().getProfileImage() : null)
            .secondaryLabel(warning.getContentType() != null ? warning.getContentType() + " #" + warning.getContentId() : "User moderation")
            .tertiaryLabel(warning.getReason())
            .build();
    }

    private AdminRecycleRecordResponse mapMessage(Message message) {
        User sender = message.getSender();
        return baseBuilder("MESSAGE", message.getId(), "Conversation #" + message.getConversation().getId(), message.getContent(), message.getCreatedAt(), message.getUpdatedAt(), message.getDeletedAt(), message.getDeletedBy())
            .status("CHAT")
            .ownerId(sender.getId())
            .ownerUsername(sender.getUsername())
            .ownerFullName(resolveName(sender))
            .ownerProfileImage(sender.getProfile() != null ? sender.getProfile().getProfileImage() : null)
            .secondaryLabel("Sender @" + sender.getUsername())
            .tertiaryLabel("Conversation #" + message.getConversation().getId())
            .build();
    }

    private AdminRecycleRecordResponse mapNotification(Notification notification) {
        User recipient = notification.getRecipient();
        return baseBuilder("NOTIFICATION", notification.getId(), notification.getType().name(), notification.getMessage(), notification.getCreatedAt(), notification.getUpdatedAt(), notification.getDeletedAt(), notification.getDeletedBy())
            .status(notification.isRead() ? "READ" : "UNREAD")
            .ownerId(recipient.getId())
            .ownerUsername(recipient.getUsername())
            .ownerFullName(resolveName(recipient))
            .ownerProfileImage(recipient.getProfile() != null ? recipient.getProfile().getProfileImage() : null)
            .secondaryLabel("Recipient @" + recipient.getUsername())
            .tertiaryLabel(notification.getContentType() != null ? notification.getContentType() + " #" + notification.getContentId() : "System event")
            .build();
    }

    private AdminRecycleRecordResponse mapComment(Comment comment) {
        User author = comment.getAuthor();
        return baseBuilder("COMMENT", comment.getId(), comment.getContentType() + " #" + comment.getContentId(), comment.getContent(), comment.getCreatedAt(), comment.getUpdatedAt(), comment.getDeletedAt(), comment.getDeletedBy())
            .status(comment.isActive() ? "ACTIVE" : "INACTIVE")
            .ownerId(author.getId())
            .ownerUsername(author.getUsername())
            .ownerFullName(resolveName(author))
            .ownerProfileImage(author.getProfile() != null ? author.getProfile().getProfileImage() : null)
            .secondaryLabel("Author @" + author.getUsername())
            .tertiaryLabel(comment.getParent() != null ? "Reply to #" + comment.getParent().getId() : "Root comment")
            .build();
    }

    private AdminRecycleRecordResponse.AdminRecycleRecordResponseBuilder baseBuilder(
        String entityType,
        Long id,
        String title,
        String excerpt,
        java.time.Instant createdAt,
        java.time.Instant updatedAt,
        java.time.Instant deletedAt,
        Long deletedBy
    ) {
        return AdminRecycleRecordResponse.builder()
            .id(id)
            .entityType(entityType)
            .title(title)
            .excerpt(excerpt)
            .createdAt(createdAt)
            .updatedAt(updatedAt)
            .deletedAt(deletedAt)
            .deletedBy(deletedBy);
    }

    private String resolveName(User user) {
        if (user == null) {
            return "Unknown user";
        }
        UserProfile profile = user.getProfile();
        if (profile != null && profile.getFullName() != null && !profile.getFullName().isBlank()) {
            return profile.getFullName();
        }
        return user.getUsername();
    }
}
