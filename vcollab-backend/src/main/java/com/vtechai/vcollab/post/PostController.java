package com.vtechai.vcollab.post;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.DiscoverySort;
import com.vtechai.vcollab.post.dto.PostRequestDto;
import com.vtechai.vcollab.post.dto.PostResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import jakarta.validation.Valid;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PostResponse>>> listPublic(
        @RequestParam(value = "search", required = false) String search,
        @RequestParam(value = "categoryId", required = false) Long categoryId,
        @RequestParam(value = "tag", required = false) String tag,
        @RequestParam(value = "owner", required = false) String owner,
        @RequestParam(value = "fromDate", required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(value = "toDate", required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
        @RequestParam(value = "sort", defaultValue = "NEWEST") DiscoverySort sort,
        Pageable pageable
    ) {
        Page<PostResponse> posts = postService.searchPublic(
            search,
            categoryId,
            tag,
            owner,
            fromDate,
            toDate,
            sort,
            pageable
        );
        return ResponseEntity.ok(ApiResponse.ok("Posts", posts));
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> listByUsername(
        @PathVariable String username,
        @AuthenticationPrincipal UserPrincipal principal,
        Pageable pageable
    ) {
        Page<PostResponse> posts = postService.listByUsername(username, principal, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Posts", posts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        PostResponse response = postService.getById(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Post", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody PostRequestDto request
    ) {
        PostResponse response = postService.create(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Post created", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody PostRequestDto request
    ) {
        PostResponse response = postService.update(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Post updated", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deletePost(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        postService.softDelete(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Post deleted", null));
    }
}
