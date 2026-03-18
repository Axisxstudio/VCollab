package com.vtechai.vcollab.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vtechai.vcollab.admin.AdminDashboardController;
import com.vtechai.vcollab.admin.dto.AdminDashboardSummaryResponse;
import com.vtechai.vcollab.blog.BlogRepository;
import com.vtechai.vcollab.category.CategoryRepository;
import com.vtechai.vcollab.cms.AdminCmsBlockController;
import com.vtechai.vcollab.cms.CmsBlockService;
import com.vtechai.vcollab.cms.dto.CmsBlockRequest;
import com.vtechai.vcollab.cms.dto.CmsBlockResponse;
import com.vtechai.vcollab.config.SecurityConfig;
import com.vtechai.vcollab.enums.Role;
import com.vtechai.vcollab.landing.LandingContentController;
import com.vtechai.vcollab.landing.LandingContentService;
import com.vtechai.vcollab.landing.dto.LandingOverviewResponse;
import com.vtechai.vcollab.post.PostRepository;
import com.vtechai.vcollab.project.ProjectRepository;
import com.vtechai.vcollab.report.ReportRepository;
import com.vtechai.vcollab.security.CustomUserDetailsService;
import com.vtechai.vcollab.security.JwtAuthFilter;
import com.vtechai.vcollab.security.JwtTokenProvider;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import com.vtechai.vcollab.warning.WarningRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = {
    LandingContentController.class,
    AdminDashboardController.class,
    AdminCmsBlockController.class
})
@Import({SecurityConfig.class, ControllerSecurityAccessTest.TestSecurityBeans.class})
class ControllerSecurityAccessTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private LandingContentService landingContentService;
    @MockBean
    private CmsBlockService cmsBlockService;
    @MockBean
    private UserRepository userRepository;
    @MockBean
    private ProjectRepository projectRepository;
    @MockBean
    private PostRepository postRepository;
    @MockBean
    private BlogRepository blogRepository;
    @MockBean
    private CategoryRepository categoryRepository;
    @MockBean
    private ReportRepository reportRepository;
    @MockBean
    private WarningRepository warningRepository;

    @Test
    void landingOverviewIsPublic() throws Exception {
        LandingOverviewResponse response = LandingOverviewResponse.builder()
            .stats(
                LandingOverviewResponse.Summary.builder()
                    .projectCount(4)
                    .contributorCount(3)
                    .postCount(2)
                    .blogCount(1)
                    .build()
            )
            .build();
        when(landingContentService.getOverview()).thenReturn(response);

        mockMvc.perform(get("/api/v1/landing/overview"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("Landing overview"))
            .andExpect(jsonPath("$.data.stats.projectCount").value(4));
    }

    @Test
    void adminDashboardRejectsAnonymousAccess() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard/summary"))
            .andExpect(status().isForbidden());
    }

    @Test
    void adminDashboardAllowsSuperAdmin() throws Exception {
        when(userRepository.countByDeletedAtIsNull()).thenReturn(25L);
        when(userRepository.countByDeletedAtIsNullAndActiveTrueAndSuspendedFalse()).thenReturn(21L);
        when(userRepository.countByDeletedAtIsNullAndSuspendedTrue()).thenReturn(4L);
        when(projectRepository.countByDeletedAtIsNull()).thenReturn(18L);
        when(postRepository.countByDeletedAtIsNull()).thenReturn(40L);
        when(blogRepository.countByDeletedAtIsNull()).thenReturn(12L);
        when(categoryRepository.count()).thenReturn(8L);
        when(reportRepository.countByStatusAndDeletedAtIsNull(any())).thenReturn(1L);
        when(warningRepository.countByStatusAndDeletedAtIsNull(any())).thenReturn(2L);

        mockMvc.perform(
                get("/api/v1/admin/dashboard/summary")
                    .with(authentication(tokenFor(Role.SUPER_ADMIN)))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalUsers").value(25))
            .andExpect(jsonPath("$.data.totalProjects").value(18));
    }

    @Test
    void adminCmsCreateRejectsStudentRole() throws Exception {
        CmsBlockRequest request = validCmsRequest();

        mockMvc.perform(
                post("/api/v1/admin/cms-blocks")
                    .with(authentication(tokenFor(Role.STUDENT)))
                    .contentType("application/json")
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isForbidden());
    }

    @Test
    void adminCmsCreateAllowsSuperAdmin() throws Exception {
        CmsBlockRequest request = validCmsRequest();
        CmsBlockResponse response = CmsBlockResponse.builder()
            .id(10L)
            .sectionKey("LANDING_INFO")
            .title("Launch note")
            .active(true)
            .publicVisible(true)
            .build();
        when(cmsBlockService.create(any(CmsBlockRequest.class), any())).thenReturn(response);

        mockMvc.perform(
                post("/api/v1/admin/cms-blocks")
                    .with(authentication(tokenFor(Role.SUPER_ADMIN)))
                    .contentType("application/json")
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.sectionKey").value("LANDING_INFO"))
            .andExpect(jsonPath("$.data.title").value("Launch note"));
    }

    private UsernamePasswordAuthenticationToken tokenFor(Role role) {
        UserPrincipal principal = UserPrincipal.fromUser(
            User.builder()
                .id(99L)
                .email("admin@vcollab.test")
                .username("admin-user")
                .passwordHash("hashed")
                .role(role)
                .active(true)
                .suspended(false)
                .build()
        );
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private CmsBlockRequest validCmsRequest() {
        CmsBlockRequest request = new CmsBlockRequest();
        request.setSectionKey("LANDING_INFO");
        request.setTitle("Launch note");
        request.setSubtitle("Platform update");
        request.setBody("VCollab is ready for students.");
        request.setBadge("Update");
        request.setCtaLabel("Join now");
        request.setCtaUrl("/register");
        request.setThemeTone("brand");
        request.setDisplayOrder(0);
        request.setActive(true);
        request.setPublicVisible(true);
        return request;
    }

    @TestConfiguration
    static class TestSecurityBeans {
        @Bean
        JwtTokenProvider jwtTokenProvider() {
            return Mockito.mock(JwtTokenProvider.class);
        }

        @Bean
        CustomUserDetailsService customUserDetailsService() {
            return Mockito.mock(CustomUserDetailsService.class);
        }

        @Bean
        JwtAuthFilter jwtAuthFilter(JwtTokenProvider tokenProvider, CustomUserDetailsService userDetailsService) {
            return new JwtAuthFilter(tokenProvider, userDetailsService);
        }
    }
}
