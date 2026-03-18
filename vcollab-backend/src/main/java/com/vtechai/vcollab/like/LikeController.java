package com.vtechai.vcollab.like;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.like.dto.LikeRequest;
import com.vtechai.vcollab.like.dto.LikeStatusResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import jakarta.validation.Valid;
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
@RequestMapping("/api/v1/likes")
@RequiredArgsConstructor
public class LikeController {
    private final LikeService likeService;

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> like(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody LikeRequest request
    ) {
        likeService.like(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Liked", null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Object>> unlike(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam ContentType contentType,
        @RequestParam Long contentId
    ) {
        likeService.unlike(contentType, contentId, principal);
        return ResponseEntity.ok(ApiResponse.ok("Unliked", null));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<LikeStatusResponse>> status(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam ContentType contentType,
        @RequestParam Long contentId
    ) {
        boolean liked = likeService.isLiked(contentType, contentId, principal);
        return ResponseEntity.ok(ApiResponse.ok("Like status", new LikeStatusResponse(liked)));
    }
}
