package com.vtechai.vcollab.user.dto;

import com.vtechai.vcollab.enums.Role;
import com.vtechai.vcollab.user.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private Role role;
    private String fullName;
    private String profileImage;
    private String educationType;

    public static UserResponse fromUser(User user) {
        String fullName = null;
        String profileImage = null;
        String educationTypeStr = null;
        if (user.getProfile() != null) {
            fullName = user.getProfile().getFullName();
            profileImage = user.getProfile().getProfileImage();
            educationTypeStr = user.getProfile().getEducationType() != null ? user.getProfile().getEducationType().name() : null;
        }
        return UserResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole())
            .fullName(fullName)
            .profileImage(profileImage)
            .educationType(educationTypeStr)
            .build();
    }
}
