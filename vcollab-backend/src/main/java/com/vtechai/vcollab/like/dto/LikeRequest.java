package com.vtechai.vcollab.like.dto;

import com.vtechai.vcollab.enums.ContentType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LikeRequest {
    @NotNull
    private ContentType contentType;

    @NotNull
    private Long contentId;
}
