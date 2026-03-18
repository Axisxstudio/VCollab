package com.vtechai.vcollab.cms.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CmsBlockResponse {
    private Long id;
    private String sectionKey;
    private String title;
    private String subtitle;
    private String body;
    private String badge;
    private String ctaLabel;
    private String ctaUrl;
    private String themeTone;
    private int displayOrder;
    private boolean active;
    private boolean publicVisible;
    private Instant createdAt;
    private Instant updatedAt;
}
