package com.vtechai.vcollab.follow;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.follow.dto.FollowRequest;
import com.vtechai.vcollab.follow.dto.FollowStatusResponse;
import com.vtechai.vcollab.follow.dto.FollowUserResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/follows")
@RequiredArgsConstructor
public class FollowController {
    private final FollowService followService;

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> follow(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody FollowRequest request
    ) {
        followService.follow(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Followed", null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Object>> unfollow(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam Long userId
    ) {
        followService.unfollow(userId, principal);
        return ResponseEntity.ok(ApiResponse.ok("Unfollowed", null));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<FollowStatusResponse>> status(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam Long userId
    ) {
        boolean following = followService.isFollowing(userId, principal);
        return ResponseEntity.ok(ApiResponse.ok("Follow status", new FollowStatusResponse(following)));
    }

    @GetMapping("/followers")
    public ResponseEntity<ApiResponse<List<FollowUserResponse>>> followers(@RequestParam Long userId) {
        List<FollowUserResponse> responses = followService.listFollowers(userId);
        return ResponseEntity.ok(ApiResponse.ok("Followers", responses));
    }

    @GetMapping("/following")
    public ResponseEntity<ApiResponse<List<FollowUserResponse>>> following(@RequestParam Long userId) {
        List<FollowUserResponse> responses = followService.listFollowing(userId);
        return ResponseEntity.ok(ApiResponse.ok("Following", responses));
    }
}
