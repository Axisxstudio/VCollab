package com.vtechai.vcollab.user;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.Role;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.dto.ProfileUpdateRequest;
import com.vtechai.vcollab.user.dto.PublicProfileResponse;
import com.vtechai.vcollab.user.dto.UserProfileResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/discover")
    public ResponseEntity<ApiResponse<Page<PublicProfileResponse>>> discoverUsers(
        @RequestParam(value = "query", required = false) String query,
        @RequestParam(value = "role", required = false) Role role,
        Pageable pageable
    ) {
        Page<PublicProfileResponse> response = userService.searchPublicProfiles(query, role, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Contributors", response));
    }

    @GetMapping("/{username}")
    public ResponseEntity<ApiResponse<PublicProfileResponse>> getPublicProfile(
        @PathVariable String username
    ) {
        PublicProfileResponse response = userService.getPublicProfile(username);
        return ResponseEntity.ok(ApiResponse.ok("Public profile", response));
    }

    @GetMapping("/me/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        UserProfileResponse response = userService.getMyProfile(principal);
        return ResponseEntity.ok(ApiResponse.ok("My profile", response));
    }

    @PatchMapping("/me/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ProfileUpdateRequest request
    ) {
        UserProfileResponse response = userService.updateMyProfile(principal, request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", response));
    }

    @PostMapping(value = "/me/profile-image", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<UserProfileResponse>> uploadProfileImage(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestPart("file") MultipartFile file
    ) {
        UserProfileResponse response = userService.updateProfileImage(principal, file);
        return ResponseEntity.ok(ApiResponse.ok("Profile image updated", response));
    }

    @PostMapping(value = "/me/cover-image", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<UserProfileResponse>> uploadCoverImage(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestPart("file") MultipartFile file
    ) {
        UserProfileResponse response = userService.updateCoverImage(principal, file);
        return ResponseEntity.ok(ApiResponse.ok("Cover image updated", response));
    }
}
