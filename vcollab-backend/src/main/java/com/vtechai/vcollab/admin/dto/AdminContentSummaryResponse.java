package com.vtechai.vcollab.admin.dto;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.Visibility;
import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminContentSummaryResponse {
    private Long id;
    private ContentType contentType;
    private String title;
    private String excerpt;
    private String subtype;
    private String thumbnailUrl;
    private List<String> tags;
    private Long ownerId;
    private String ownerUsername;
    private String ownerFullName;
    private String ownerProfileImage;
    private Long categoryId;
    private String categoryName;
    private Visibility visibility;
    private boolean active;
    private int likeCount;
    private int commentCount;
    private int saveCount;
    private int shareCount;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant deletedAt;
    private Long deletedBy;
}

