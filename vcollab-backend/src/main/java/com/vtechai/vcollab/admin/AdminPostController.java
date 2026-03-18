package com.vtechai.vcollab.admin;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vtechai.vcollab.admin.dto.AdminContentModerationRequest;
import com.vtechai.vcollab.admin.dto.AdminContentSummaryResponse;
import com.vtechai.vcollab.audit.AuditLogService;
import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.Visibility;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.post.PostRepository;
import com.vtechai.vcollab.post.entity.Post;
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
@RequestMapping("/api/v1/admin/posts")
@RequiredArgsConstructor
public class AdminPostController {
    private final AuditLogService auditLogService;
    private final PostRepository postRepository;
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
        Page<AdminContentSummaryResponse> response = postRepository.searchAdmin(
            normalize(search),
            categoryId,
            normalize(owner),
            visibility,
            active,
            deleted,
            buildPageable(pageable)
        ).map(this::toResponse);
        return ResponseEntity.ok(ApiResponse.ok("Posts", response));
    }

    @PatchMapping("/{id}/moderation")
    @Transactional
    public ResponseEntity<ApiResponse<AdminContentSummaryResponse>> updateModeration(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody AdminContentModerationRequest request
    ) {
        Post post = postRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        if (request.getVisibility() != null) {
            post.setVisibility(request.getVisibility());
        }
        if (request.getActive() != null) {
            post.setActive(request.getActive());
        }

        Post saved = postRepository.save(post);
        auditLogService.record(
            principal.getId(),
            "POST",
            "MODERATION_UPDATED",
            "POST",
            saved.getId(),
            "Updated moderation state for post #" + saved.getId(),
            "visibility=" + saved.getVisibility() + ",active=" + saved.isActive()
        );
        return ResponseEntity.ok(ApiResponse.ok("Post updated", toResponse(saved)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<AdminContentSummaryResponse>> softDelete(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        Post post = postRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        post.setDeletedAt(Instant.now());
        post.setDeletedBy(principal.getId());
        Post saved = postRepository.save(post);
        auditLogService.record(
            principal.getId(),
            "POST",
            "SOFT_DELETED",
            "POST",
            saved.getId(),
            "Moved post to recycle bin: #" + saved.getId(),
            null
        );
        return ResponseEntity.ok(ApiResponse.ok("Post moved to recycle bin", toResponse(saved)));
    }

    @PatchMapping("/{id}/restore")
    @Transactional
    public ResponseEntity<ApiResponse<AdminContentSummaryResponse>> restore(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        Post post = postRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        post.setDeletedAt(null);
        post.setDeletedBy(null);
        Post saved = postRepository.save(post);
        auditLogService.record(
            principal.getId(),
            "POST",
            "RESTORED",
            "POST",
            saved.getId(),
            "Restored post from recycle bin: #" + saved.getId(),
            null
        );
        return ResponseEntity.ok(ApiResponse.ok("Post restored", toResponse(saved)));
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

    private AdminContentSummaryResponse toResponse(Post post) {
        return AdminContentSummaryResponse.builder()
            .id(post.getId())
            .contentType(ContentType.POST)
            .title("Post #" + post.getId())
            .excerpt(truncate(post.getContent()))
            .subtype(post.getPostType() != null ? post.getPostType().name() : null)
            .thumbnailUrl(null)
            .tags(deserializeList(post.getTags()))
            .ownerId(post.getAuthor().getId())
            .ownerUsername(post.getAuthor().getUsername())
            .ownerFullName(post.getAuthor().getProfile() != null ? post.getAuthor().getProfile().getFullName() : null)
            .ownerProfileImage(post.getAuthor().getProfile() != null ? post.getAuthor().getProfile().getProfileImage() : null)
            .categoryId(post.getCategory() != null ? post.getCategory().getId() : null)
            .categoryName(post.getCategory() != null ? post.getCategory().getName() : null)
            .visibility(post.getVisibility())
            .active(post.isActive())
            .likeCount(post.getLikeCount())
            .commentCount(post.getCommentCount())
            .saveCount(post.getSaveCount())
            .shareCount(post.getShareCount())
            .createdAt(post.getCreatedAt())
            .updatedAt(post.getUpdatedAt())
            .deletedAt(post.getDeletedAt())
            .deletedBy(post.getDeletedBy())
            .build();
    }
}

