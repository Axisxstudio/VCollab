package com.vtechai.vcollab.audit.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuditLogResponse {
    private Long id;
    private String moduleName;
    private String actionName;
    private String targetType;
    private Long targetId;
    private String summary;
    private String metadata;
    private Instant createdAt;
    private ActorSummary actor;

    @Data
    @Builder
    public static class ActorSummary {
        private Long id;
        private String username;
        private String fullName;
    }
}
