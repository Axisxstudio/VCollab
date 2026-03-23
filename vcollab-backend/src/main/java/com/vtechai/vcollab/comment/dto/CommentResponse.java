package com.vtechai.vcollab.comment.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CommentResponse {
    private Long id;
    private String content;
    private String imageUrl;
    private Long parentId;
    private AuthorSummary author;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant editedAt;
    private int likeCount;
    private String mentionTargets;
    private boolean likedByCurrentUser;
    @Builder.Default
    private List<CommentResponse> replies = new ArrayList<>();

    @Data
    @Builder
    public static class AuthorSummary {
        private Long id;
        private String username;
        private String fullName;
        private String profileImage;
    }
}
