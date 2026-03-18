package com.vtechai.vcollab.admin;

import com.vtechai.vcollab.admin.dto.AdminDashboardSummaryResponse;
import com.vtechai.vcollab.blog.BlogRepository;
import com.vtechai.vcollab.category.CategoryRepository;
import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.ReportStatus;
import com.vtechai.vcollab.enums.WarningStatus;
import com.vtechai.vcollab.post.PostRepository;
import com.vtechai.vcollab.project.ProjectRepository;
import com.vtechai.vcollab.report.ReportRepository;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.warning.WarningRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final PostRepository postRepository;
    private final BlogRepository blogRepository;
    private final CategoryRepository categoryRepository;
    private final ReportRepository reportRepository;
    private final WarningRepository warningRepository;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AdminDashboardSummaryResponse>> summary() {
        AdminDashboardSummaryResponse response = AdminDashboardSummaryResponse.builder()
            .totalUsers(userRepository.countByDeletedAtIsNull())
            .activeUsers(userRepository.countByDeletedAtIsNullAndActiveTrueAndSuspendedFalse())
            .suspendedUsers(userRepository.countByDeletedAtIsNullAndSuspendedTrue())
            .totalProjects(projectRepository.countByDeletedAtIsNull())
            .totalPosts(postRepository.countByDeletedAtIsNull())
            .totalBlogs(blogRepository.countByDeletedAtIsNull())
            .totalCategories(categoryRepository.count())
            .pendingReports(reportRepository.countByStatusAndDeletedAtIsNull(ReportStatus.PENDING))
            .reviewedReports(reportRepository.countByStatusAndDeletedAtIsNull(ReportStatus.REVIEWED))
            .actionedReports(reportRepository.countByStatusAndDeletedAtIsNull(ReportStatus.ACTION_TAKEN))
            .dismissedReports(reportRepository.countByStatusAndDeletedAtIsNull(ReportStatus.DISMISSED))
            .openWarnings(warningRepository.countByStatusAndDeletedAtIsNull(WarningStatus.SENT))
            .acknowledgedWarnings(warningRepository.countByStatusAndDeletedAtIsNull(WarningStatus.ACKNOWLEDGED))
            .build();

        return ResponseEntity.ok(ApiResponse.ok("Admin dashboard summary", response));
    }
}
