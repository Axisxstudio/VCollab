package com.vtechai.vcollab.landing;

import com.vtechai.vcollab.blog.BlogService;
import com.vtechai.vcollab.blog.dto.BlogResponse;
import com.vtechai.vcollab.cms.CmsBlockService;
import com.vtechai.vcollab.cms.dto.CmsBlockResponse;
import com.vtechai.vcollab.enums.DiscoverySort;
import com.vtechai.vcollab.landing.dto.LandingOverviewResponse;
import com.vtechai.vcollab.post.PostService;
import com.vtechai.vcollab.post.dto.PostResponse;
import com.vtechai.vcollab.project.ProjectService;
import com.vtechai.vcollab.project.dto.ProjectResponse;
import com.vtechai.vcollab.user.UserService;
import com.vtechai.vcollab.user.dto.PublicProfileResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LandingContentServiceImpl implements LandingContentService {
    private final ProjectService projectService;
    private final PostService postService;
    private final BlogService blogService;
    private final UserService userService;
    private final CmsBlockService cmsBlockService;

    @Override
    public LandingOverviewResponse getOverview() {
        Page<ProjectResponse> featuredProjectPage = projectService.searchPublic(
            null, null, null, null, null, null, DiscoverySort.MOST_LIKED, PageRequest.of(0, 8)
        );
        Page<PostResponse> latestPostPage = postService.searchPublic(
            null, null, null, null, null, null, DiscoverySort.NEWEST, PageRequest.of(0, 8)
        );
        Page<BlogResponse> latestBlogPage = blogService.searchPublic(
            null, null, null, null, null, null, DiscoverySort.NEWEST, PageRequest.of(0, 8)
        );
        Page<PublicProfileResponse> contributorPage = userService.searchPublicProfiles(
            null, null, PageRequest.of(0, 8)
        );

        long projectCount = projectService.searchPublic(
            null, null, null, null, null, null, DiscoverySort.NEWEST, PageRequest.of(0, 1)
        ).getTotalElements();
        long postCount = postService.searchPublic(
            null, null, null, null, null, null, DiscoverySort.NEWEST, PageRequest.of(0, 1)
        ).getTotalElements();
        long blogCount = blogService.searchPublic(
            null, null, null, null, null, null, DiscoverySort.NEWEST, PageRequest.of(0, 1)
        ).getTotalElements();
        long contributorCount = userService.searchPublicProfiles(null, null, PageRequest.of(0, 1)).getTotalElements();

        List<ProjectResponse> featuredProjects = featuredProjectPage.getContent();
        List<CmsBlockResponse> heroHighlights = cmsBlockService.listPublic("HERO_HIGHLIGHT");
        List<CmsBlockResponse> infoBlocks = cmsBlockService.listPublic("LANDING_INFO");
        List<CmsBlockResponse> companyBlocks = cmsBlockService.listPublic("VTECH_AI_SOLUTIONS");
        List<CmsBlockResponse> footerBlocks = cmsBlockService.listPublic("FOOTER_NOTE");

        return LandingOverviewResponse.builder()
            .stats(
                LandingOverviewResponse.Summary.builder()
                    .projectCount(projectCount)
                    .contributorCount(contributorCount)
                    .postCount(postCount)
                    .blogCount(blogCount)
                    .build()
            )
            .featuredProject(featuredProjects.isEmpty() ? null : featuredProjects.get(0))
            .featuredProjects(featuredProjects)
            .latestPosts(latestPostPage.getContent())
            .latestBlogs(latestBlogPage.getContent())
            .featuredContributors(contributorPage.getContent())
            .heroHighlights(heroHighlights)
            .infoBlocks(infoBlocks)
            .companyBlocks(companyBlocks)
            .footerBlocks(footerBlocks)
            .build();
    }
}
