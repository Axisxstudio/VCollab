package com.vtechai.vcollab.admin;

import com.vtechai.vcollab.admin.dto.AdminUserStatusUpdateRequest;
import com.vtechai.vcollab.admin.dto.AdminUserSummaryResponse;
import com.vtechai.vcollab.audit.AuditLogService;
import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.Role;
import com.vtechai.vcollab.exception.ForbiddenException;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import com.vtechai.vcollab.user.entity.UserProfile;
import java.time.Instant;
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
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<AdminUserSummaryResponse>>> listUsers(
        @RequestParam(value = "search", required = false) String search,
        @RequestParam(value = "role", required = false) Role role,
        @RequestParam(value = "active", required = false) Boolean active,
        @RequestParam(value = "suspended", required = false) Boolean suspended,
        Pageable pageable
    ) {
        Page<User> users = userRepository.searchAdminUsers(
            normalize(search),
            role,
            active,
            suspended,
            buildPageable(pageable)
        );
        Page<AdminUserSummaryResponse> response = users.map(this::toResponse);
        return ResponseEntity.ok(ApiResponse.ok("Users", response));
    }

    @PatchMapping("/{id}/status")
    @Transactional
    public ResponseEntity<ApiResponse<AdminUserSummaryResponse>> updateUserStatus(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody AdminUserStatusUpdateRequest request
    ) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ensureMutableUser(user, principal);

        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }
        if (request.getSuspended() != null) {
            user.setSuspended(request.getSuspended());
        }

        User saved = userRepository.save(user);
        auditLogService.record(
            principal.getId(),
            "USER",
            "STATUS_UPDATED",
            "USER",
            saved.getId(),
            "Updated account status for @" + saved.getUsername(),
            "active=" + saved.isActive() + ",suspended=" + saved.isSuspended()
        );
        return ResponseEntity.ok(ApiResponse.ok("User updated", toResponse(saved)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteUser(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ensureMutableUser(user, principal);

        user.setActive(false);
        user.setSuspended(true);
        user.setDeletedAt(Instant.now());
        user.setDeletedBy(principal.getId());

        User saved = userRepository.save(user);
        auditLogService.record(
            principal.getId(),
            "USER",
            "SOFT_DELETED",
            "USER",
            saved.getId(),
            "Soft deleted user @" + saved.getUsername(),
            "active=" + saved.isActive() + ",suspended=" + saved.isSuspended()
        );
        return ResponseEntity.ok(ApiResponse.ok("User deleted", null));
    }

    @PatchMapping("/{id}/restore")
    @Transactional
    public ResponseEntity<ApiResponse<AdminUserSummaryResponse>> restoreUser(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getDeletedAt() == null) {
            throw new ResourceNotFoundException("User not found");
        }
        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new ForbiddenException("Super admin accounts cannot be restored here");
        }

        user.setDeletedAt(null);
        user.setDeletedBy(null);
        user.setActive(true);
        user.setSuspended(false);

        User saved = userRepository.save(user);
        auditLogService.record(
            principal.getId(),
            "USER",
            "RESTORED",
            "USER",
            saved.getId(),
            "Restored user @" + saved.getUsername() + " from recycle bin",
            null
        );
        return ResponseEntity.ok(ApiResponse.ok("User restored", toResponse(saved)));
    }

    private void ensureMutableUser(User user, UserPrincipal principal) {
        if (user.getDeletedAt() != null) {
            throw new ResourceNotFoundException("User not found");
        }
        if (user.getId().equals(principal.getId())) {
            throw new ForbiddenException("You cannot change your own admin account status");
        }
        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new ForbiddenException("Super admin accounts cannot be moderated here");
        }
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

    private AdminUserSummaryResponse toResponse(User user) {
        UserProfile profile = user.getProfile();
        return AdminUserSummaryResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole())
            .fullName(profile != null ? profile.getFullName() : user.getUsername())
            .profileImage(profile != null ? profile.getProfileImage() : null)
            .active(user.isActive())
            .suspended(user.isSuspended())
            .followerCount(profile != null ? profile.getFollowerCount() : 0)
            .projectCount(profile != null ? profile.getProjectCount() : 0)
            .postCount(profile != null ? profile.getPostCount() : 0)
            .blogCount(profile != null ? profile.getBlogCount() : 0)
            .joinedAt(user.getCreatedAt())
            .build();
    }
}
