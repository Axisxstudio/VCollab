package com.vtechai.vcollab.follow.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FollowRequest {
    @NotNull
    private Long userId;
}
