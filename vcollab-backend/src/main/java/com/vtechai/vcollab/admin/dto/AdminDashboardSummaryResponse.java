package com.vtechai.vcollab.admin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminDashboardSummaryResponse {
    private long totalUsers;
    private long activeUsers;
    private long suspendedUsers;
    private long totalProjects;
    private long totalPosts;
    private long totalBlogs;
    private long totalCategories;
    private long pendingReports;
    private long reviewedReports;
    private long actionedReports;
    private long dismissedReports;
    private long openWarnings;
    private long acknowledgedWarnings;
}
