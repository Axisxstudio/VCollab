package com.vtechai.vcollab.share.dto;

import com.vtechai.vcollab.enums.ContentType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ShareRequest {
    @NotNull
    private ContentType contentType;

    @NotNull
    private Long contentId;
}
