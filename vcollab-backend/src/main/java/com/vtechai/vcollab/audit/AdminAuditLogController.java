package com.vtechai.vcollab.audit;

import com.vtechai.vcollab.audit.dto.AuditLogResponse;
import com.vtechai.vcollab.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
public class AdminAuditLogController {
    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> list(
        @RequestParam(value = "module", required = false) String module,
        @RequestParam(value = "action", required = false) String action,
        @RequestParam(value = "search", required = false) String search,
        Pageable pageable
    ) {
        Page<AuditLogResponse> response = auditLogService.list(module, action, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Audit logs", response));
    }
}
