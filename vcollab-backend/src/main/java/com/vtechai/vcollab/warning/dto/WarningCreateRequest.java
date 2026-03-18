package com.vtechai.vcollab.warning.dto;

import com.vtechai.vcollab.enums.ContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WarningCreateRequest {
    @NotNull
    private Long targetUserId;

    private ContentType contentType;
    private Long contentId;

    @NotBlank
    private String title;

    @NotBlank
    private String message;

    private String reason;
}
