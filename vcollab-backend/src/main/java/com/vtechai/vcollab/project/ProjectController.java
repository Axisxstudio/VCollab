package com.vtechai.vcollab.project;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.DiscoverySort;
import com.vtechai.vcollab.project.dto.ProjectRequestDto;
import com.vtechai.vcollab.project.dto.ProjectResponse;
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
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProjectResponse>>> listPublic(
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
        Page<ProjectResponse> projects = projectService.searchPublic(
            search,
            categoryId,
            tag,
            owner,
            fromDate,
            toDate,
            sort,
            pageable
        );
        return ResponseEntity.ok(ApiResponse.ok("Projects", projects));
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<ApiResponse<Page<ProjectResponse>>> listByUsername(
        @PathVariable String username,
        @AuthenticationPrincipal UserPrincipal principal,
        Pageable pageable
    ) {
        Page<ProjectResponse> projects = projectService.listByUsername(username, principal, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Projects", projects));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProject(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProjectResponse response = projectService.getById(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Project", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ProjectRequestDto request
    ) {
        ProjectResponse response = projectService.create(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Project created", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ProjectRequestDto request
    ) {
        ProjectResponse response = projectService.update(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Project updated", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteProject(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        projectService.softDelete(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Project deleted", null));
    }
}
