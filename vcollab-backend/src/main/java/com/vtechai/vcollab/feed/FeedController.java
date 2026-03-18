package com.vtechai.vcollab.feed;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.feed.dto.FeedResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/feed")
@RequiredArgsConstructor
public class FeedController {
    private final FeedService feedService;

    @GetMapping
    public ResponseEntity<ApiResponse<FeedResponse>> getFeed(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(defaultValue = "FOR_YOU") FeedScope scope,
        @RequestParam(defaultValue = "9") int size,
        @RequestParam(defaultValue = "false") boolean includeSchool
    ) {
        FeedResponse response = feedService.getFeed(principal, scope, size, includeSchool);
        return ResponseEntity.ok(ApiResponse.ok("Feed", response));
    }
}
