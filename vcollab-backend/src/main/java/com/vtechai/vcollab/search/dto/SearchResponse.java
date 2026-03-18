package com.vtechai.vcollab.search.dto;

import com.vtechai.vcollab.blog.dto.BlogResponse;
import com.vtechai.vcollab.post.dto.PostResponse;
import com.vtechai.vcollab.project.dto.ProjectResponse;
import com.vtechai.vcollab.user.dto.PublicProfileResponse;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SearchResponse {
    private String query;
    private int requestedSize;
    private SearchStats stats;
    private List<PublicProfileResponse> users;
    private List<ProjectResponse> projects;
    private List<PostResponse> posts;
    private List<BlogResponse> blogs;

    @Data
    @Builder
    public static class SearchStats {
        private long totalResults;
        private long userCount;
        private long projectCount;
        private long postCount;
        private long blogCount;
    }
}
