package com.vtechai.vcollab.feed.dto;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.MediaType;
import com.vtechai.vcollab.enums.PostType;
import com.vtechai.vcollab.enums.TargetType;
import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FeedItemResponse {
    private ContentType contentType;
    private Long id;
    private String title;
    private String excerpt;
    private String previewMediaUrl;
    private MediaType previewMediaType;
    private List<MediaSummary> media;
    private PostType postType;
    private TargetType targetType;
    private String githubUrl;
    private String demoUrl;
    private boolean prioritized;
    private int likeCount;
    private int commentCount;
    private int saveCount;
    private int shareCount;
    private CategorySummary category;
    private AuthorSummary author;
    private List<String> tags;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    public static class CategorySummary {
        private Long id;
        private String name;
    }

    @Data
    @Builder
    public static class AuthorSummary {
        private Long id;
        private String username;
        private String fullName;
        private String profileImage;
        private String educationType;
    }

    @Data
    @Builder
    public static class MediaSummary {
        private String url;
        private MediaType mediaType;
        private String label;
        private String fileName;
        private Integer sortOrder;
    }
}