package com.vtechai.vcollab.project.dto;

import com.vtechai.vcollab.enums.TargetType;
import com.vtechai.vcollab.enums.Visibility;
import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectResponse {
    private Long id;
    private String title;
    private String slug;
    private String shortDesc;
    private String fullDesc;
    private String thumbnail;
    private List<String> tags;
    private List<String> techStack;
    private String githubUrl;
    private String demoUrl;
    private TargetType targetType;
    private boolean hasGithubUrl;
    private boolean hasDemoUrl;
    private Visibility visibility;
    private boolean active;
    private int likeCount;
    private int commentCount;
    private int saveCount;
    private int shareCount;
    private int viewCount;
    private CategorySummary category;
    private OwnerSummary owner;
    private List<ProjectMediaDto> media;
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
    public static class OwnerSummary {
        private Long id;
        private String username;
        private String fullName;
        private String profileImage;
        private String educationType;
    }
}
