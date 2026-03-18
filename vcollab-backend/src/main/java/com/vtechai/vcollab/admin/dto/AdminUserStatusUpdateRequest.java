package com.vtechai.vcollab.admin.dto;

import lombok.Data;

@Data
public class AdminUserStatusUpdateRequest {
    private Boolean active;
    private Boolean suspended;
}
