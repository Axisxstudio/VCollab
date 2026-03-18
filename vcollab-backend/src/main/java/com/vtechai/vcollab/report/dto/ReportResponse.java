package com.vtechai.vcollab.report.dto;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.ReportReason;
import com.vtechai.vcollab.enums.ReportStatus;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReportResponse {
    private Long id;
    private ContentType contentType;
    private Long contentId;
    private ReportReason reason;
    private String description;
    private ReportStatus status;
    private String adminNote;
    private Instant createdAt;
    private Instant resolvedAt;
    private ReporterSummary reporter;

    @Data
    @Builder
    public static class ReporterSummary {
        private Long id;
        private String username;
        private String fullName;
        private String profileImage;
    }
}
