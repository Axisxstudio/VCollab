package com.vtechai.vcollab.save.dto;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.MediaType;
import com.vtechai.vcollab.enums.PostType;
import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SavedItemResponse {
    private Long saveId;
    private Instant savedAt;
    private ContentType contentType;
    private Long contentId;
    private String title;
    private String excerpt;
    private String previewMediaUrl;
    private MediaType previewMediaType;
    private List<MediaSummary> media;
    private PostType postType;
    private String githubUrl;
    private String demoUrl;
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
