package com.vtechai.vcollab.audit;

import com.vtechai.vcollab.audit.dto.AuditLogResponse;
import com.vtechai.vcollab.audit.entity.AuditLog;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    public void record(
        Long actorId,
        String moduleName,
        String actionName,
        String targetType,
        Long targetId,
        String summary,
        String metadata
    ) {
        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;

        AuditLog log = AuditLog.builder()
            .actor(actor)
            .moduleName(moduleName)
            .actionName(actionName)
            .targetType(targetType)
            .targetId(targetId)
            .summary(summary)
            .metadata(metadata)
            .build();
        auditLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> list(String moduleName, String actionName, String search, Pageable pageable) {
        Pageable safePageable = buildPageable(pageable);
        return auditLogRepository.search(normalize(moduleName), normalize(actionName), normalize(search), safePageable)
            .map(this::toResponse);
    }

    private Pageable buildPageable(Pageable pageable) {
        int page = pageable != null && pageable.isPaged() ? pageable.getPageNumber() : 0;
        int size = pageable != null && pageable.isPaged() ? pageable.getPageSize() : 20;
        Sort sort = pageable != null && pageable.getSort().isSorted()
            ? pageable.getSort()
            : Sort.by(Sort.Direction.DESC, "createdAt");
        return PageRequest.of(page, size, sort);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private AuditLogResponse toResponse(AuditLog log) {
        User actor = log.getActor();
        return AuditLogResponse.builder()
            .id(log.getId())
            .moduleName(log.getModuleName())
            .actionName(log.getActionName())
            .targetType(log.getTargetType())
            .targetId(log.getTargetId())
            .summary(log.getSummary())
            .metadata(log.getMetadata())
            .createdAt(log.getCreatedAt())
            .actor(actor != null
                ? AuditLogResponse.ActorSummary.builder()
                    .id(actor.getId())
                    .username(actor.getUsername())
                    .fullName(actor.getProfile() != null ? actor.getProfile().getFullName() : null)
                    .build()
                : null)
            .build();
    }
}
