package com.vtechai.vcollab.report;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.report.dto.ReportCreateRequest;
import com.vtechai.vcollab.report.dto.ReportResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReportResponse>> create(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ReportCreateRequest request
    ) {
        ReportResponse response = reportService.create(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Report submitted", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReportResponse>>> listMine(
        @AuthenticationPrincipal UserPrincipal principal,
        Pageable pageable
    ) {
        Page<ReportResponse> responses = reportService.listMine(principal, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Reports", responses));
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
