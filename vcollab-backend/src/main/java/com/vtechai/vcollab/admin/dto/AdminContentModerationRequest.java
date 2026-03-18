package com.vtechai.vcollab.admin.dto;

import com.vtechai.vcollab.enums.Visibility;
import lombok.Data;

@Data
public class AdminContentModerationRequest {
    private Visibility visibility;
    private Boolean active;
}
