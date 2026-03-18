package com.vtechai.vcollab.post.dto;

import com.vtechai.vcollab.enums.PostType;
import com.vtechai.vcollab.enums.TargetType;
import com.vtechai.vcollab.enums.Visibility;
import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostResponse {
    private Long id;
    private String content;
    private PostType postType;
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
    private List<PostMediaDto> media;
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
