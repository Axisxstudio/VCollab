package com.vtechai.vcollab.report;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.ReportStatus;
import com.vtechai.vcollab.report.dto.ReportResponse;
import com.vtechai.vcollab.report.dto.ReportStatusUpdate;
import com.vtechai.vcollab.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {
    private final ReportService reportService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReportResponse>>> listAll(
        @RequestParam(value = "status", required = false) ReportStatus status,
        @RequestParam(value = "deleted", defaultValue = "false") boolean deleted,
        Pageable pageable
    ) {
        Page<ReportResponse> responses = reportService.listAll(status, deleted, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Reports", responses));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<ReportResponse>> updateStatus(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ReportStatusUpdate request
    ) {
        ReportResponse response = reportService.updateStatus(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Report updated", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        reportService.delete(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Report deleted", null));
    }
}
