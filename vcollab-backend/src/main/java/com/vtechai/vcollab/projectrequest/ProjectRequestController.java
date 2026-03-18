package com.vtechai.vcollab.projectrequest;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.projectrequest.dto.ProjectRequestCreate;
import com.vtechai.vcollab.projectrequest.dto.ProjectRequestResponse;
import com.vtechai.vcollab.projectrequest.dto.ProjectRequestStatusUpdate;
import com.vtechai.vcollab.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/project-requests")
@RequiredArgsConstructor
public class ProjectRequestController {
    private final ProjectRequestService projectRequestService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectRequestResponse>> create(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ProjectRequestCreate request
    ) {
        ProjectRequestResponse response = projectRequestService.create(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Project request created", response));
    }

    @GetMapping("/sent")
    public ResponseEntity<ApiResponse<List<ProjectRequestResponse>>> sent(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<ProjectRequestResponse> responses = projectRequestService.listSent(principal);
        return ResponseEntity.ok(ApiResponse.ok("Sent requests", responses));
    }

    @GetMapping("/received")
    public ResponseEntity<ApiResponse<List<ProjectRequestResponse>>> received(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<ProjectRequestResponse> responses = projectRequestService.listReceived(principal);
        return ResponseEntity.ok(ApiResponse.ok("Received requests", responses));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ProjectRequestResponse>> updateStatus(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ProjectRequestStatusUpdate request
    ) {
        ProjectRequestResponse response = projectRequestService.updateStatus(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Project request updated", response));
    }
}
