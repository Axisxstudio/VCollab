package com.vtechai.vcollab.report;

import com.vtechai.vcollab.audit.AuditLogService;
import com.vtechai.vcollab.enums.NotificationType;
import com.vtechai.vcollab.enums.ReportStatus;
import com.vtechai.vcollab.enums.Role;
import com.vtechai.vcollab.exception.ForbiddenException;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.interaction.ContentCounterService;
import com.vtechai.vcollab.notification.NotificationService;
import com.vtechai.vcollab.notification.dto.NotificationCreateRequest;
import com.vtechai.vcollab.report.dto.ReportCreateRequest;
import com.vtechai.vcollab.report.dto.ReportResponse;
import com.vtechai.vcollab.report.dto.ReportStatusUpdate;
import com.vtechai.vcollab.report.entity.Report;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
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
public class ReportServiceImpl implements ReportService {
    private final AuditLogService auditLogService;
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ContentCounterService contentCounterService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public ReportResponse create(ReportCreateRequest request, UserPrincipal principal) {
        contentCounterService.assertContentExists(request.getContentType(), request.getContentId());
        User reporter = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Report report = Report.builder()
            .reporter(reporter)
            .contentType(request.getContentType())
            .contentId(request.getContentId())
            .reason(request.getReason())
            .description(request.getDescription())
            .status(ReportStatus.PENDING)
            .build();
        Report saved = reportRepository.save(report);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReportResponse> listMine(UserPrincipal principal, Pageable pageable) {
        return reportRepository.findByReporterIdAndDeletedAtIsNullOrderByCreatedAtDesc(principal.getId(), pageable)
            .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReportResponse> listAll(ReportStatus status, boolean deleted, Pageable pageable) {
        Pageable safePageable = buildPageable(pageable);
        Page<Report> reports = deleted
            ? reportRepository.findByDeletedAtIsNotNullOrderByDeletedAtDesc(safePageable)
            : status == null
                ? reportRepository.findByDeletedAtIsNull(safePageable)
                : reportRepository.findByStatusAndDeletedAtIsNull(status, safePageable);
        return reports.map(this::toResponse);
    }

    @Override
    @Transactional
    public ReportResponse updateStatus(Long id, ReportStatusUpdate request, UserPrincipal admin) {
        Report report = reportRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        User adminUser = userRepository.findById(admin.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        report.setStatus(request.getStatus());
        report.setAdminNote(request.getAdminNote());
        report.setResolvedBy(adminUser);
        report.setResolvedAt(Instant.now());
        Report saved = reportRepository.save(report);

        notificationService.send(NotificationCreateRequest.builder()
            .recipientId(report.getReporter().getId())
            .actorId(adminUser.getId())
            .type(NotificationType.REPORT_RESULT)
            .message("Your report was updated to " + request.getStatus().name().toLowerCase() + ".")
            .build());

        auditLogService.record(
            admin.getId(),
            "REPORT",
            "STATUS_UPDATED",
            "REPORT",
            saved.getId(),
            "Updated report #" + saved.getId() + " to " + request.getStatus(),
            request.getAdminNote()
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id, UserPrincipal principal) {
        Report report = reportRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        boolean isAdmin = principal.getRole() == Role.SUPER_ADMIN;
        if (!isAdmin && !report.getReporter().getId().equals(principal.getId())) {
            throw new ForbiddenException("Not allowed to delete this report");
        }

        report.setDeletedAt(Instant.now());
        report.setDeletedBy(principal.getId());
        reportRepository.save(report);

        if (isAdmin) {
            auditLogService.record(
                principal.getId(),
                "REPORT",
                "SOFT_DELETED",
                "REPORT",
                report.getId(),
                "Moved report #" + report.getId() + " to recycle bin",
                null
            );
        }
    }

    private Pageable buildPageable(Pageable pageable) {
        int page = pageable != null && pageable.isPaged() ? pageable.getPageNumber() : 0;
        int size = pageable != null && pageable.isPaged() ? pageable.getPageSize() : 12;
        Sort sort = pageable != null && pageable.getSort().isSorted()
            ? pageable.getSort()
            : Sort.by(Sort.Direction.DESC, "createdAt");
        return PageRequest.of(page, size, sort);
    }

    private ReportResponse toResponse(Report report) {
        User reporter = report.getReporter();
        String fullName = reporter.getProfile() != null ? reporter.getProfile().getFullName() : null;
        String profileImage = reporter.getProfile() != null ? reporter.getProfile().getProfileImage() : null;

        return ReportResponse.builder()
            .id(report.getId())
            .contentType(report.getContentType())
            .contentId(report.getContentId())
            .reason(report.getReason())
            .description(report.getDescription())
            .status(report.getStatus())
            .adminNote(report.getAdminNote())
            .createdAt(report.getCreatedAt())
            .resolvedAt(report.getResolvedAt())
            .reporter(ReportResponse.ReporterSummary.builder()
                .id(reporter.getId())
                .username(reporter.getUsername())
                .fullName(fullName)
                .profileImage(profileImage)
                .build())
            .build();
    }
}
