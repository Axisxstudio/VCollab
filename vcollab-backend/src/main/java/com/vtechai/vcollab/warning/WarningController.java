package com.vtechai.vcollab.warning;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.warning.dto.WarningResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/warnings")
@RequiredArgsConstructor
public class WarningController {
    private final WarningService warningService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<WarningResponse>>> listMine(
        @AuthenticationPrincipal UserPrincipal principal,
        Pageable pageable
    ) {
        Page<WarningResponse> responses = warningService.listMine(principal, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Warnings", responses));
    }

    @PatchMapping("/{id}/ack")
    public ResponseEntity<ApiResponse<WarningResponse>> acknowledge(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WarningResponse response = warningService.acknowledge(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Warning acknowledged", response));
    }
}
