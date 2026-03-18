package com.vtechai.vcollab.blog;

import com.vtechai.vcollab.blog.dto.BlogRequestDto;
import com.vtechai.vcollab.blog.dto.BlogResponse;
import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.DiscoverySort;
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
@RequestMapping("/api/v1/blogs")
@RequiredArgsConstructor
public class BlogController {
    private final BlogService blogService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BlogResponse>>> listPublic(
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
        Page<BlogResponse> blogs = blogService.searchPublic(
            search,
            categoryId,
            tag,
            owner,
            fromDate,
            toDate,
            sort,
            pageable
        );
        return ResponseEntity.ok(ApiResponse.ok("Blogs", blogs));
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<ApiResponse<Page<BlogResponse>>> listByUsername(
        @PathVariable String username,
        @AuthenticationPrincipal UserPrincipal principal,
        Pageable pageable
    ) {
        Page<BlogResponse> blogs = blogService.listByUsername(username, principal, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Blogs", blogs));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BlogResponse>> getBlog(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        BlogResponse response = blogService.getById(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Blog", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BlogResponse>> createBlog(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody BlogRequestDto request
    ) {
        BlogResponse response = blogService.create(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Blog created", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BlogResponse>> updateBlog(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody BlogRequestDto request
    ) {
        BlogResponse response = blogService.update(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Blog updated", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteBlog(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        blogService.softDelete(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Blog deleted", null));
    }
}
