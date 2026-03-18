package com.vtechai.vcollab.report.dto;

import com.vtechai.vcollab.enums.ReportStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReportStatusUpdate {
    @NotNull
    private ReportStatus status;

    private String adminNote;
}
