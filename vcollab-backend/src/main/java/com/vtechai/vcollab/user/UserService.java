package com.vtechai.vcollab.user;

import com.vtechai.vcollab.enums.Role;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.dto.ProfileUpdateRequest;
import com.vtechai.vcollab.user.dto.PublicProfileResponse;
import com.vtechai.vcollab.user.dto.UserProfileResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    Page<PublicProfileResponse> searchPublicProfiles(String query, Role role, Pageable pageable);
    PublicProfileResponse getPublicProfile(String username);
    UserProfileResponse getMyProfile(UserPrincipal principal);
    UserProfileResponse updateMyProfile(UserPrincipal principal, ProfileUpdateRequest request);
    UserProfileResponse updateProfileImage(UserPrincipal principal, MultipartFile file);
    UserProfileResponse updateCoverImage(UserPrincipal principal, MultipartFile file);
}
