package com.vtechai.vcollab.admin.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminRecycleRecordResponse {
    private Long id;
    private String entityType;
    private String title;
    private String excerpt;
    private String status;
    private Long ownerId;
    private String ownerUsername;
    private String ownerFullName;
    private String ownerProfileImage;
    private String secondaryLabel;
    private String tertiaryLabel;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant deletedAt;
    private Long deletedBy;
}
