package com.vtechai.vcollab.projectrequest.dto;

import com.vtechai.vcollab.enums.ProjectRequestStatus;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectRequestResponse {
    private Long id;
    private ProjectRequestStatus status;
    private String message;
    private ProjectSummary project;
    private UserSummary requester;
    private UserSummary owner;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant respondedAt;

    @Data
    @Builder
    public static class ProjectSummary {
        private Long id;
        private String title;
        private String thumbnail;
        private String slug;
    }

    @Data
    @Builder
    public static class UserSummary {
        private Long id;
        private String username;
        private String fullName;
        private String profileImage;
    }
}
