package com.vtechai.vcollab.report.dto;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.ReportReason;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReportCreateRequest {
    @NotNull
    private ContentType contentType;

    @NotNull
    private Long contentId;

    @NotNull
    private ReportReason reason;

    private String description;
}
