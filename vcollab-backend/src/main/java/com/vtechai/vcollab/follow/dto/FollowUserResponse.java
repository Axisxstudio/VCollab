package com.vtechai.vcollab.follow.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FollowUserResponse {
    private Long id;
    private String username;
    private String fullName;
    private String profileImage;
}
