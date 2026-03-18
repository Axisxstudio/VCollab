package com.vtechai.vcollab.landing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class LandingContentServiceImplTest {
    @Mock
    private ProjectService projectService;
    @Mock
    private PostService postService;
    @Mock
    private BlogService blogService;
    @Mock
    private UserService userService;
    @Mock
    private CmsBlockService cmsBlockService;

    private LandingContentServiceImpl landingContentService;

    @BeforeEach
    void setUp() {
        landingContentService = new LandingContentServiceImpl(
            projectService,
            postService,
            blogService,
            userService,
            cmsBlockService
        );
    }

    @Test
    void getOverviewCombinesPublicContentAndCmsBlocks() {
        ProjectResponse featuredProject = ProjectResponse.builder()
            .id(101L)
            .title("Smart Attendance")
            .likeCount(22)
            .build();
        PostResponse latestPost = PostResponse.builder()
            .id(201L)
            .content("Looking for teammates")
            .build();
        BlogResponse latestBlog = BlogResponse.builder()
            .id(301L)
            .title("How we shipped our campus app")
            .build();
        PublicProfileResponse contributor = PublicProfileResponse.builder()
            .id(401L)
            .username("student-builder")
            .fullName("Student Builder")
            .build();
        CmsBlockResponse heroBlock = CmsBlockResponse.builder()
            .id(1L)
            .sectionKey("HERO_HIGHLIGHT")
            .title("Build together")
            .build();

        when(projectService.searchPublic(isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), eq(DiscoverySort.MOST_LIKED), any(PageRequest.class)))
            .thenReturn(new PageImpl<>(List.of(featuredProject), PageRequest.of(0, 4), 12));
        when(projectService.searchPublic(isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), eq(DiscoverySort.NEWEST), any(PageRequest.class)))
            .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 1), 12));
        when(postService.searchPublic(isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), eq(DiscoverySort.NEWEST), any(PageRequest.class)))
            .thenReturn(
                new PageImpl<>(List.of(latestPost), PageRequest.of(0, 3), 7),
                new PageImpl<>(List.of(), PageRequest.of(0, 1), 7)
            );
        when(blogService.searchPublic(isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), eq(DiscoverySort.NEWEST), any(PageRequest.class)))
            .thenReturn(
                new PageImpl<>(List.of(latestBlog), PageRequest.of(0, 3), 5),
                new PageImpl<>(List.of(), PageRequest.of(0, 1), 5)
            );
        when(userService.searchPublicProfiles(isNull(), isNull(), any(PageRequest.class)))
            .thenReturn(
                new PageImpl<>(List.of(contributor), PageRequest.of(0, 4), 9),
                new PageImpl<>(List.of(), PageRequest.of(0, 1), 9)
            );
        when(cmsBlockService.listPublic("HERO_HIGHLIGHT")).thenReturn(List.of(heroBlock));
        when(cmsBlockService.listPublic("LANDING_INFO")).thenReturn(List.of());
        when(cmsBlockService.listPublic("VTECH_AI_SOLUTIONS")).thenReturn(List.of());
        when(cmsBlockService.listPublic("FOOTER_NOTE")).thenReturn(List.of());

        LandingOverviewResponse response = landingContentService.getOverview();

        assertThat(response.getFeaturedProject()).isNotNull();
        assertThat(response.getFeaturedProject().getId()).isEqualTo(101L);
        assertThat(response.getFeaturedProjects()).hasSize(1);
        assertThat(response.getLatestPosts()).hasSize(1);
        assertThat(response.getLatestBlogs()).hasSize(1);
        assertThat(response.getFeaturedContributors()).hasSize(1);
        assertThat(response.getHeroHighlights()).extracting(CmsBlockResponse::getTitle).containsExactly("Build together");
        assertThat(response.getStats().getProjectCount()).isEqualTo(12);
        assertThat(response.getStats().getPostCount()).isEqualTo(7);
        assertThat(response.getStats().getBlogCount()).isEqualTo(5);
        assertThat(response.getStats().getContributorCount()).isEqualTo(9);
    }
}
