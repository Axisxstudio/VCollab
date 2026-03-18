package com.vtechai.vcollab.warning;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.WarningStatus;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.warning.dto.WarningCreateRequest;
import com.vtechai.vcollab.warning.dto.WarningResponse;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/warnings")
@RequiredArgsConstructor
public class AdminWarningController {
    private final WarningService warningService;

    @PostMapping
    public ResponseEntity<ApiResponse<WarningResponse>> create(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody WarningCreateRequest request
    ) {
        WarningResponse response = warningService.create(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Warning created", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<WarningResponse>>> listAll(
        @RequestParam(value = "status", required = false) WarningStatus status,
        @RequestParam(value = "deleted", defaultValue = "false") boolean deleted,
        Pageable pageable
    ) {
        Page<WarningResponse> responses = warningService.listAll(status, deleted, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Warnings", responses));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        warningService.delete(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Warning deleted", null));
    }
}
