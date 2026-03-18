package com.vtechai.vcollab.save.dto;

import com.vtechai.vcollab.enums.ContentType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SaveRequest {
    @NotNull
    private ContentType contentType;

    @NotNull
    private Long contentId;
}
