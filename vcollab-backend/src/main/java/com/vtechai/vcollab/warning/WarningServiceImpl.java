package com.vtechai.vcollab.warning;

import com.vtechai.vcollab.audit.AuditLogService;
import com.vtechai.vcollab.enums.NotificationType;
import com.vtechai.vcollab.enums.Role;
import com.vtechai.vcollab.enums.WarningStatus;
import com.vtechai.vcollab.exception.ForbiddenException;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.notification.NotificationService;
import com.vtechai.vcollab.notification.dto.NotificationCreateRequest;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import com.vtechai.vcollab.warning.dto.WarningCreateRequest;
import com.vtechai.vcollab.warning.dto.WarningResponse;
import com.vtechai.vcollab.warning.entity.Warning;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WarningServiceImpl implements WarningService {
    private final AuditLogService auditLogService;
    private final WarningRepository warningRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public WarningResponse create(WarningCreateRequest request, UserPrincipal admin) {
        User target = userRepository.findById(request.getTargetUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Warning warning = Warning.builder()
            .targetUser(target)
            .contentType(request.getContentType())
            .contentId(request.getContentId())
            .title(request.getTitle())
            .message(request.getMessage())
            .reason(request.getReason())
            .status(WarningStatus.SENT)
            .build();
        Warning saved = warningRepository.save(warning);

        notificationService.send(NotificationCreateRequest.builder()
            .recipientId(target.getId())
            .actorId(admin.getId())
            .type(NotificationType.WARNING)
            .message("Warning: " + request.getTitle())
            .build());

        auditLogService.record(
            admin.getId(),
            "WARNING",
            "CREATED",
            "WARNING",
            saved.getId(),
            "Issued warning '" + request.getTitle() + "' to @" + target.getUsername(),
            request.getReason()
        );

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WarningResponse> listAll(WarningStatus status, boolean deleted, Pageable pageable) {
        Pageable safePageable = buildPageable(pageable);
        Page<Warning> warnings = deleted
            ? warningRepository.findByDeletedAtIsNotNullOrderByDeletedAtDesc(safePageable)
            : status == null
                ? warningRepository.findByDeletedAtIsNull(safePageable)
                : warningRepository.findByStatusAndDeletedAtIsNull(status, safePageable);
        return warnings.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WarningResponse> listMine(UserPrincipal principal, Pageable pageable) {
        return warningRepository.findByTargetUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(principal.getId(), pageable)
            .map(this::toResponse);
    }

    @Override
    @Transactional
    public WarningResponse acknowledge(Long id, UserPrincipal principal) {
        Warning warning = warningRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Warning not found"));
        if (!warning.getTargetUser().getId().equals(principal.getId())) {
            throw new ForbiddenException("Not allowed to update this warning");
        }
        if (warning.getStatus() != WarningStatus.ACKNOWLEDGED) {
            warning.setStatus(WarningStatus.ACKNOWLEDGED);
            warning.setAcknowledgedAt(Instant.now());
            warningRepository.save(warning);
        }
        return toResponse(warning);
    }

    @Override
    @Transactional
    public void delete(Long id, UserPrincipal principal) {
        if (principal.getRole() != Role.SUPER_ADMIN) {
            throw new ForbiddenException("Only super admin can delete warnings");
        }

        Warning warning = warningRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Warning not found"));
        warning.setDeletedAt(Instant.now());
        warning.setDeletedBy(principal.getId());
        warningRepository.save(warning);

        auditLogService.record(
            principal.getId(),
            "WARNING",
            "SOFT_DELETED",
            "WARNING",
            warning.getId(),
            "Moved warning #" + warning.getId() + " to recycle bin",
            warning.getReason()
        );
    }

    private Pageable buildPageable(Pageable pageable) {
        int page = pageable != null && pageable.isPaged() ? pageable.getPageNumber() : 0;
        int size = pageable != null && pageable.isPaged() ? pageable.getPageSize() : 12;
        Sort sort = pageable != null && pageable.getSort().isSorted()
            ? pageable.getSort()
            : Sort.by(Sort.Direction.DESC, "createdAt");
        return PageRequest.of(page, size, sort);
    }

    private WarningResponse toResponse(Warning warning) {
        User target = warning.getTargetUser();
        String fullName = target.getProfile() != null ? target.getProfile().getFullName() : null;
        String profileImage = target.getProfile() != null ? target.getProfile().getProfileImage() : null;

        return WarningResponse.builder()
            .id(warning.getId())
            .contentType(warning.getContentType())
            .contentId(warning.getContentId())
            .title(warning.getTitle())
            .message(warning.getMessage())
            .reason(warning.getReason())
            .status(warning.getStatus())
            .createdAt(warning.getCreatedAt())
            .acknowledgedAt(warning.getAcknowledgedAt())
            .target(WarningResponse.TargetSummary.builder()
                .id(target.getId())
                .username(target.getUsername())
                .fullName(fullName)
                .profileImage(profileImage)
                .build())
            .build();
    }
}
