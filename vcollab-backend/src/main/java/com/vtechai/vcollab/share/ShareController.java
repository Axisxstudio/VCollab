package com.vtechai.vcollab.share;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.share.dto.ShareRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/shares")
@RequiredArgsConstructor
public class ShareController {
    private final ShareService shareService;

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> share(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ShareRequest request
    ) {
        shareService.share(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Shared", null));
    }
}
