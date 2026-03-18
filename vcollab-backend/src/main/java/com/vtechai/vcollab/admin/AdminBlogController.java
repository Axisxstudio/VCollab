package com.vtechai.vcollab.admin;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vtechai.vcollab.admin.dto.AdminContentModerationRequest;
import com.vtechai.vcollab.admin.dto.AdminContentSummaryResponse;
import com.vtechai.vcollab.audit.AuditLogService;
import com.vtechai.vcollab.blog.BlogRepository;
import com.vtechai.vcollab.blog.entity.Blog;
import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.Visibility;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.security.UserPrincipal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/blogs")
@RequiredArgsConstructor
public class AdminBlogController {
    private final AuditLogService auditLogService;
    private final BlogRepository blogRepository;
    private final ObjectMapper objectMapper;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<AdminContentSummaryResponse>>> list(
        @RequestParam(value = "search", required = false) String search,
        @RequestParam(value = "categoryId", required = false) Long categoryId,
        @RequestParam(value = "owner", required = false) String owner,
        @RequestParam(value = "visibility", required = false) Visibility visibility,
        @RequestParam(value = "active", required = false) Boolean active,
        @RequestParam(value = "deleted", defaultValue = "false") boolean deleted,
        Pageable pageable
    ) {
        Page<AdminContentSummaryResponse> response = blogRepository.searchAdmin(
            normalize(search),
            categoryId,
            normalize(owner),
            visibility,
            active,
            deleted,
            buildPageable(pageable)
        ).map(this::toResponse);
        return ResponseEntity.ok(ApiResponse.ok("Blogs", response));
    }

    @PatchMapping("/{id}/moderation")
    @Transactional
    public ResponseEntity<ApiResponse<AdminContentSummaryResponse>> updateModeration(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody AdminContentModerationRequest request
    ) {
        Blog blog = blogRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));

        if (request.getVisibility() != null) {
            blog.setVisibility(request.getVisibility());
        }
        if (request.getActive() != null) {
            blog.setActive(request.getActive());
        }

        Blog saved = blogRepository.save(blog);
        auditLogService.record(
            principal.getId(),
            "BLOG",
            "MODERATION_UPDATED",
            "BLOG",
            saved.getId(),
            "Updated moderation state for blog " + saved.getTitle(),
            "visibility=" + saved.getVisibility() + ",active=" + saved.isActive()
        );
        return ResponseEntity.ok(ApiResponse.ok("Blog updated", toResponse(saved)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<AdminContentSummaryResponse>> softDelete(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        Blog blog = blogRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));
        blog.setDeletedAt(Instant.now());
        blog.setDeletedBy(principal.getId());
        Blog saved = blogRepository.save(blog);
        auditLogService.record(
            principal.getId(),
            "BLOG",
            "SOFT_DELETED",
            "BLOG",
            saved.getId(),
            "Moved blog to recycle bin: " + saved.getTitle(),
            null
        );
        return ResponseEntity.ok(ApiResponse.ok("Blog moved to recycle bin", toResponse(saved)));
    }

    @PatchMapping("/{id}/restore")
    @Transactional
    public ResponseEntity<ApiResponse<AdminContentSummaryResponse>> restore(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        Blog blog = blogRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));
        blog.setDeletedAt(null);
        blog.setDeletedBy(null);
        Blog saved = blogRepository.save(blog);
        auditLogService.record(
            principal.getId(),
            "BLOG",
            "RESTORED",
            "BLOG",
            saved.getId(),
            "Restored blog from recycle bin: " + saved.getTitle(),
            null
        );
        return ResponseEntity.ok(ApiResponse.ok("Blog restored", toResponse(saved)));
    }

    private Pageable buildPageable(Pageable pageable) {
        int page = pageable != null && pageable.isPaged() ? pageable.getPageNumber() : 0;
        int size = pageable != null && pageable.isPaged() ? pageable.getPageSize() : 12;
        Sort sort = pageable != null && pageable.getSort().isSorted()
            ? pageable.getSort()
            : Sort.by(Sort.Direction.DESC, "createdAt");
        return PageRequest.of(page, size, sort);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private List<String> deserializeList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException ex) {
            return Collections.emptyList();
        }
    }

    private String truncate(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        if (value.length() <= 180) {
            return value;
        }
        return value.substring(0, 180) + "...";
    }

    private AdminContentSummaryResponse toResponse(Blog blog) {
        return AdminContentSummaryResponse.builder()
            .id(blog.getId())
            .contentType(ContentType.BLOG)
            .title(blog.getTitle())
            .excerpt(truncate(blog.getContent()))
            .thumbnailUrl(blog.getCoverImage())
            .tags(deserializeList(blog.getTags()))
            .ownerId(blog.getAuthor().getId())
            .ownerUsername(blog.getAuthor().getUsername())
            .ownerFullName(blog.getAuthor().getProfile() != null ? blog.getAuthor().getProfile().getFullName() : null)
            .ownerProfileImage(blog.getAuthor().getProfile() != null ? blog.getAuthor().getProfile().getProfileImage() : null)
            .categoryId(blog.getCategory() != null ? blog.getCategory().getId() : null)
            .categoryName(blog.getCategory() != null ? blog.getCategory().getName() : null)
            .visibility(blog.getVisibility())
            .active(blog.isActive())
            .likeCount(blog.getLikeCount())
            .commentCount(blog.getCommentCount())
            .saveCount(blog.getSaveCount())
            .shareCount(blog.getShareCount())
            .createdAt(blog.getCreatedAt())
            .updatedAt(blog.getUpdatedAt())
            .deletedAt(blog.getDeletedAt())
            .deletedBy(blog.getDeletedBy())
            .build();
    }
}

