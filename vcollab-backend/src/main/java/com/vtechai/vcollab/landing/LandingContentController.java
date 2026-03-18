package com.vtechai.vcollab.landing;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.landing.dto.LandingOverviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/landing")
@RequiredArgsConstructor
public class LandingContentController {
    private final LandingContentService landingContentService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<LandingOverviewResponse>> getOverview() {
        LandingOverviewResponse response = landingContentService.getOverview();
        return ResponseEntity.ok(ApiResponse.ok("Landing overview", response));
    }
}
