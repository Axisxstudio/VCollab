package com.vtechai.vcollab.admin.dto;

import com.vtechai.vcollab.enums.Role;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminUserSummaryResponse {
    private Long id;
    private String username;
    private String email;
    private Role role;
    private String fullName;
    private String profileImage;
    private boolean active;
    private boolean suspended;
    private int followerCount;
    private int projectCount;
    private int postCount;
    private int blogCount;
    private Instant joinedAt;
}
