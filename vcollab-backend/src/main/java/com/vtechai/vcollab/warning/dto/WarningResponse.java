package com.vtechai.vcollab.warning.dto;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.WarningStatus;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WarningResponse {
    private Long id;
    private ContentType contentType;
    private Long contentId;
    private String title;
    private String message;
    private String reason;
    private WarningStatus status;
    private Instant createdAt;
    private Instant acknowledgedAt;
    private TargetSummary target;

    @Data
    @Builder
    public static class TargetSummary {
        private Long id;
        private String username;
        private String fullName;
        private String profileImage;
    }
}
