package com.vtechai.vcollab.blog.dto;

import com.vtechai.vcollab.enums.TargetType;
import com.vtechai.vcollab.enums.Visibility;
import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BlogResponse {
    private Long id;
    private String title;
    private String slug;
    private String coverImage;
    private String content;
    private TargetType targetType;
    private Visibility visibility;
    private boolean active;
    private List<String> tags;
    private int likeCount;
    private int commentCount;
    private int saveCount;
    private int shareCount;
    private CategorySummary category;
    private AuthorSummary author;
    private List<BlogMediaDto> media;
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
}
