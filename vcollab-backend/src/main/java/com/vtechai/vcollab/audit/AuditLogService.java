package com.vtechai.vcollab.audit;

import com.vtechai.vcollab.audit.dto.AuditLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {
    void record(
        Long actorId,
        String moduleName,
        String actionName,
        String targetType,
        Long targetId,
        String summary,
        String metadata
    );

    Page<AuditLogResponse> list(String moduleName, String actionName, String search, Pageable pageable);
}
