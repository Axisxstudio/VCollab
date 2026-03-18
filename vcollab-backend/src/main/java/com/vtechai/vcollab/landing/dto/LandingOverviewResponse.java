package com.vtechai.vcollab.landing.dto;

import com.vtechai.vcollab.blog.dto.BlogResponse;
import com.vtechai.vcollab.cms.dto.CmsBlockResponse;
import com.vtechai.vcollab.post.dto.PostResponse;
import com.vtechai.vcollab.project.dto.ProjectResponse;
import com.vtechai.vcollab.user.dto.PublicProfileResponse;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LandingOverviewResponse {
    private Summary stats;
    private ProjectResponse featuredProject;
    private List<ProjectResponse> featuredProjects;
    private List<PostResponse> latestPosts;
    private List<BlogResponse> latestBlogs;
    private List<PublicProfileResponse> featuredContributors;
    private List<CmsBlockResponse> heroHighlights;
    private List<CmsBlockResponse> infoBlocks;
    private List<CmsBlockResponse> companyBlocks;
    private List<CmsBlockResponse> footerBlocks;

    @Data
    @Builder
    public static class Summary {
        private long projectCount;
        private long contributorCount;
        private long postCount;
        private long blogCount;
    }
}
