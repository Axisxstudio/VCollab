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
import com.vtechai.vcollab.project.ProjectRepository;
import com.vtechai.vcollab.project.entity.Project;
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
@RequestMapping("/api/v1/admin/projects")
@RequiredArgsConstructor
public class AdminProjectController {
    private final AuditLogService auditLogService;
    private final ProjectRepository projectRepository;
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
        Page<AdminContentSummaryResponse> response = projectRepository.searchAdmin(
            normalize(search),
            categoryId,
            normalize(owner),
            visibility,
            active,
            deleted,
            buildPageable(pageable)
        ).map(this::toResponse);
        return ResponseEntity.ok(ApiResponse.ok("Projects", response));
    }

    @PatchMapping("/{id}/moderation")
    @Transactional
    public ResponseEntity<ApiResponse<AdminContentSummaryResponse>> updateModeration(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody AdminContentModerationRequest request
    ) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (request.getVisibility() != null) {
            project.setVisibility(request.getVisibility());
        }
        if (request.getActive() != null) {
            project.setActive(request.getActive());
        }

        Project saved = projectRepository.save(project);
        auditLogService.record(
            principal.getId(),
            "PROJECT",
            "MODERATION_UPDATED",
            "PROJECT",
            saved.getId(),
            "Updated moderation state for project " + saved.getTitle(),
            "visibility=" + saved.getVisibility() + ",active=" + saved.isActive()
        );
        return ResponseEntity.ok(ApiResponse.ok("Project updated", toResponse(saved)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<AdminContentSummaryResponse>> softDelete(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        project.setDeletedAt(Instant.now());
        project.setDeletedBy(principal.getId());
        Project saved = projectRepository.save(project);
        auditLogService.record(
            principal.getId(),
            "PROJECT",
            "SOFT_DELETED",
            "PROJECT",
            saved.getId(),
            "Moved project to recycle bin: " + saved.getTitle(),
            null
        );
        return ResponseEntity.ok(ApiResponse.ok("Project moved to recycle bin", toResponse(saved)));
    }

    @PatchMapping("/{id}/restore")
    @Transactional
    public ResponseEntity<ApiResponse<AdminContentSummaryResponse>> restore(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        project.setDeletedAt(null);
        project.setDeletedBy(null);
        Project saved = projectRepository.save(project);
        auditLogService.record(
            principal.getId(),
            "PROJECT",
            "RESTORED",
            "PROJECT",
            saved.getId(),
            "Restored project from recycle bin: " + saved.getTitle(),
            null
        );
        return ResponseEntity.ok(ApiResponse.ok("Project restored", toResponse(saved)));
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

    private AdminContentSummaryResponse toResponse(Project project) {
        return AdminContentSummaryResponse.builder()
            .id(project.getId())
            .contentType(ContentType.PROJECT)
            .title(project.getTitle())
            .excerpt(truncate(project.getShortDesc() != null ? project.getShortDesc() : project.getFullDesc()))
            .thumbnailUrl(project.getThumbnail())
            .tags(deserializeList(project.getTags()))
            .ownerId(project.getOwner().getId())
            .ownerUsername(project.getOwner().getUsername())
            .ownerFullName(project.getOwner().getProfile() != null ? project.getOwner().getProfile().getFullName() : null)
            .ownerProfileImage(project.getOwner().getProfile() != null ? project.getOwner().getProfile().getProfileImage() : null)
            .categoryId(project.getCategory() != null ? project.getCategory().getId() : null)
            .categoryName(project.getCategory() != null ? project.getCategory().getName() : null)
            .visibility(project.getVisibility())
            .active(project.isActive())
            .likeCount(project.getLikeCount())
            .commentCount(project.getCommentCount())
            .saveCount(project.getSaveCount())
            .shareCount(project.getShareCount())
            .createdAt(project.getCreatedAt())
            .updatedAt(project.getUpdatedAt())
            .deletedAt(project.getDeletedAt())
            .deletedBy(project.getDeletedBy())
            .build();
    }
}

