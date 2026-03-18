package com.vtechai.vcollab.exports;

import com.vtechai.vcollab.audit.AuditLogService;
import com.vtechai.vcollab.audit.dto.AuditLogResponse;
import com.vtechai.vcollab.blog.BlogRepository;
import com.vtechai.vcollab.blog.entity.Blog;
import com.vtechai.vcollab.category.entity.Category;
import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.ReportStatus;
import com.vtechai.vcollab.enums.Role;
import com.vtechai.vcollab.enums.Visibility;
import com.vtechai.vcollab.enums.WarningStatus;
import com.vtechai.vcollab.post.PostRepository;
import com.vtechai.vcollab.post.entity.Post;
import com.vtechai.vcollab.project.ProjectRepository;
import com.vtechai.vcollab.project.entity.Project;
import com.vtechai.vcollab.report.ReportRepository;
import com.vtechai.vcollab.report.entity.Report;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import com.vtechai.vcollab.user.entity.UserProfile;
import com.vtechai.vcollab.warning.WarningRepository;
import com.vtechai.vcollab.warning.entity.Warning;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/admin/exports")
@RequiredArgsConstructor
public class AdminExportController {
    private final PdfDocumentService pdfDocumentService;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final PostRepository postRepository;
    private final BlogRepository blogRepository;
    private final ReportRepository reportRepository;
    private final WarningRepository warningRepository;
    private final AuditLogService auditLogService;

    @GetMapping("/{module}/pdf")
    public ResponseEntity<byte[]> exportPdf(
        @PathVariable String module,
        @RequestParam(value = "search", required = false) String search,
        @RequestParam(value = "id", required = false) Long id,
        @RequestParam(value = "role", required = false) Role role,
        @RequestParam(value = "active", required = false) Boolean active,
        @RequestParam(value = "suspended", required = false) Boolean suspended,
        @RequestParam(value = "categoryId", required = false) Long categoryId,
        @RequestParam(value = "owner", required = false) String owner,
        @RequestParam(value = "visibility", required = false) Visibility visibility,
        @RequestParam(value = "status", required = false) String status,
        @RequestParam(value = "contentType", required = false) ContentType contentType,
        @RequestParam(value = "auditModule", required = false) String auditModule,
        @RequestParam(value = "action", required = false) String action
    ) {
        String normalizedModule = module == null ? "" : module.trim().toLowerCase();
        ExportPayload payload = switch (normalizedModule) {
            case "users" -> exportUsers(id, search, role, active, suspended);
            case "projects" -> exportProjects(id, search, categoryId, owner, visibility, active, false);
            case "posts" -> exportPosts(id, search, categoryId, owner, visibility, active, false);
            case "blogs" -> exportBlogs(id, search, categoryId, owner, visibility, active, false);
            case "reports" -> exportReports(id, status);
            case "warnings" -> exportWarnings(id, status);
            case "recycle-bin" -> exportRecycleBin(id, contentType, search, categoryId, owner, visibility, active);
            case "audit-logs" -> exportAuditLogs(auditModule, action, search);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported export module");
        };

        byte[] pdf = pdfDocumentService.buildDocument(payload.title(), payload.lines());
        String filename = "vcollab-" + normalizedModule + "-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + ".pdf";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }

    private ExportPayload exportUsers(Long id, String search, Role role, Boolean active, Boolean suspended) {
        List<User> users = id != null
            ? userRepository.findById(id)
                .filter(user -> user.getDeletedAt() == null)
                .map(List::of)
                .orElse(List.of())
            : userRepository.searchAdminUsers(
                normalize(search),
                role,
                active,
                suspended,
                PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"))
            ).getContent();

        List<String> lines = new ArrayList<>();
        lines.add("Users export");
        lines.add("Filters: id=" + valueOrAll(id) + ", search=" + valueOrAll(search) + ", role=" + valueOrAll(role) + ", active=" + valueOrAll(active) + ", suspended=" + valueOrAll(suspended));
        lines.add("");

        for (User user : users) {
            appendUser(lines, user);
        }
        return new ExportPayload("VCollab Users Export", lines);
    }

    private ExportPayload exportProjects(Long id, String search, Long categoryId, String owner, Visibility visibility, Boolean active, boolean deleted) {
        List<Project> items = id != null
            ? projectRepository.findById(id)
                .filter(project -> deleted == (project.getDeletedAt() != null))
                .map(List::of)
                .orElse(List.of())
            : projectRepository.searchAdmin(
                normalize(search),
                categoryId,
                normalize(owner),
                visibility,
                active,
                deleted,
                PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"))
            ).getContent();

        List<String> lines = new ArrayList<>();
        lines.add(deleted ? "Projects recycle-bin export" : "Projects export");
        lines.add("Filters: id=" + valueOrAll(id) + ", search=" + valueOrAll(search) + ", categoryId=" + valueOrAll(categoryId) + ", owner=" + valueOrAll(owner) + ", visibility=" + valueOrAll(visibility) + ", active=" + valueOrAll(active));
        lines.add("");

        for (Project item : items) {
            appendProject(lines, item);
        }
        return new ExportPayload(deleted ? "VCollab Project Recycle Bin Export" : "VCollab Projects Export", lines);
    }

    private ExportPayload exportPosts(Long id, String search, Long categoryId, String owner, Visibility visibility, Boolean active, boolean deleted) {
        List<Post> items = id != null
            ? postRepository.findById(id)
                .filter(post -> deleted == (post.getDeletedAt() != null))
                .map(List::of)
                .orElse(List.of())
            : postRepository.searchAdmin(
                normalize(search),
                categoryId,
                normalize(owner),
                visibility,
                active,
                deleted,
                PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"))
            ).getContent();

        List<String> lines = new ArrayList<>();
        lines.add(deleted ? "Posts recycle-bin export" : "Posts export");
        lines.add("Filters: id=" + valueOrAll(id) + ", search=" + valueOrAll(search) + ", categoryId=" + valueOrAll(categoryId) + ", owner=" + valueOrAll(owner) + ", visibility=" + valueOrAll(visibility) + ", active=" + valueOrAll(active));
        lines.add("");

        for (Post item : items) {
            appendPost(lines, item);
        }
        return new ExportPayload(deleted ? "VCollab Post Recycle Bin Export" : "VCollab Posts Export", lines);
    }

    private ExportPayload exportBlogs(Long id, String search, Long categoryId, String owner, Visibility visibility, Boolean active, boolean deleted) {
        List<Blog> items = id != null
            ? blogRepository.findById(id)
                .filter(blog -> deleted == (blog.getDeletedAt() != null))
                .map(List::of)
                .orElse(List.of())
            : blogRepository.searchAdmin(
                normalize(search),
                categoryId,
                normalize(owner),
                visibility,
                active,
                deleted,
                PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"))
            ).getContent();

        List<String> lines = new ArrayList<>();
        lines.add(deleted ? "Blogs recycle-bin export" : "Blogs export");
        lines.add("Filters: id=" + valueOrAll(id) + ", search=" + valueOrAll(search) + ", categoryId=" + valueOrAll(categoryId) + ", owner=" + valueOrAll(owner) + ", visibility=" + valueOrAll(visibility) + ", active=" + valueOrAll(active));
        lines.add("");

        for (Blog item : items) {
            appendBlog(lines, item);
        }
        return new ExportPayload(deleted ? "VCollab Blog Recycle Bin Export" : "VCollab Blogs Export", lines);
    }

    private ExportPayload exportReports(Long id, String status) {
        ReportStatus reportStatus = status == null || status.isBlank() ? null : ReportStatus.valueOf(status);
        List<Report> reports = id != null
            ? reportRepository.findById(id).map(List::of).orElse(List.of())
            : reportStatus == null
                ? reportRepository.findAll(PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent()
                : reportRepository.findByStatusAndDeletedAtIsNull(reportStatus, PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();

        List<String> lines = new ArrayList<>();
        lines.add("Reports export");
        lines.add("Filters: id=" + valueOrAll(id) + ", status=" + valueOrAll(reportStatus));
        lines.add("");

        for (Report report : reports) {
            appendReport(lines, report);
        }
        return new ExportPayload("VCollab Reports Export", lines);
    }

    private ExportPayload exportWarnings(Long id, String status) {
        WarningStatus warningStatus = status == null || status.isBlank() ? null : WarningStatus.valueOf(status);
        List<Warning> warnings = id != null
            ? warningRepository.findById(id).map(List::of).orElse(List.of())
            : warningStatus == null
                ? warningRepository.findAll(PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent()
                : warningRepository.findByStatusAndDeletedAtIsNull(warningStatus, PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();

        List<String> lines = new ArrayList<>();
        lines.add("Warnings export");
        lines.add("Filters: id=" + valueOrAll(id) + ", status=" + valueOrAll(warningStatus));
        lines.add("");

        for (Warning warning : warnings) {
            appendWarning(lines, warning);
        }
        return new ExportPayload("VCollab Warnings Export", lines);
    }

    private ExportPayload exportRecycleBin(Long id, ContentType contentType, String search, Long categoryId, String owner, Visibility visibility, Boolean active) {
        if (contentType == ContentType.PROJECT) {
            return exportProjects(id, search, categoryId, owner, visibility, active, true);
        }
        if (contentType == ContentType.POST) {
            return exportPosts(id, search, categoryId, owner, visibility, active, true);
        }
        if (contentType == ContentType.BLOG) {
            return exportBlogs(id, search, categoryId, owner, visibility, active, true);
        }

        List<String> lines = new ArrayList<>();
        lines.addAll(exportProjects(id, search, categoryId, owner, visibility, active, true).lines());
        lines.add("");
        lines.addAll(exportPosts(id, search, categoryId, owner, visibility, active, true).lines());
        lines.add("");
        lines.addAll(exportBlogs(id, search, categoryId, owner, visibility, active, true).lines());
        return new ExportPayload("VCollab Recycle Bin Export", lines);
    }

    private ExportPayload exportAuditLogs(String module, String action, String search) {
        List<AuditLogResponse> logs = auditLogService.list(module, action, search, PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();

        List<String> lines = new ArrayList<>();
        lines.add("Audit logs export");
        lines.add("Filters: module=" + valueOrAll(module) + ", action=" + valueOrAll(action) + ", search=" + valueOrAll(search));
        lines.add("");

        for (AuditLogResponse log : logs) {
            lines.add(
                log.getCreatedAt()
                    + " | "
                    + log.getModuleName()
                    + " | "
                    + log.getActionName()
                    + " | "
                    + (log.getActor() != null ? "@" + log.getActor().getUsername() : "system")
                    + " | "
                    + log.getSummary()
            );
        }
        return new ExportPayload("VCollab Audit Log Export", lines);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String valueOrAll(Object value) {
        return value == null || value.toString().isBlank() ? "ALL" : value.toString();
    }

    private void appendUser(List<String> lines, User user) {
        UserProfile profile = user.getProfile();
        lines.add("------------------------------------------------------------");
        lines.add("User #" + user.getId());
        lines.add("Name: " + valueOrDash(profile != null ? profile.getFullName() : null));
        lines.add("Username: @" + user.getUsername());
        lines.add("Email: " + valueOrDash(user.getEmail()));
        lines.add("Role: " + valueOrDash(user.getRole()));
        lines.add("Active: " + user.isActive());
        lines.add("Suspended: " + user.isSuspended());
        lines.add("Email verified: " + user.isEmailVerified());
        lines.add("Last login: " + valueOrDash(user.getLastLoginAt()));
        lines.add("Bio: " + valueOrDash(profile != null ? profile.getBio() : null));
        lines.add("Department: " + valueOrDash(profile != null ? profile.getDepartment() : null));
        lines.add("Institution: " + valueOrDash(profile != null ? profile.getInstitution() : null));
        lines.add("Year of study: " + valueOrDash(profile != null ? profile.getYearOfStudy() : null));
        lines.add("Skills: " + valueOrDash(profile != null ? profile.getSkills() : null));
        lines.add("GitHub: " + valueOrDash(profile != null ? profile.getGithubUrl() : null));
        lines.add("LinkedIn: " + valueOrDash(profile != null ? profile.getLinkedinUrl() : null));
        lines.add("Website: " + valueOrDash(profile != null ? profile.getWebsiteUrl() : null));
        lines.add("Profile image: " + valueOrDash(profile != null ? profile.getProfileImage() : null));
        lines.add("Cover image: " + valueOrDash(profile != null ? profile.getCoverImage() : null));
        lines.add("Followers: " + (profile != null ? profile.getFollowerCount() : 0));
        lines.add("Following: " + (profile != null ? profile.getFollowingCount() : 0));
        lines.add("Projects: " + (profile != null ? profile.getProjectCount() : 0));
        lines.add("Posts: " + (profile != null ? profile.getPostCount() : 0));
        lines.add("Blogs: " + (profile != null ? profile.getBlogCount() : 0));
        lines.add("Created at: " + valueOrDash(user.getCreatedAt()));
        lines.add("Updated at: " + valueOrDash(user.getUpdatedAt()));
        lines.add("Deleted at: " + valueOrDash(user.getDeletedAt()));
        lines.add("Deleted by: " + valueOrDash(user.getDeletedBy()));
        lines.add("");
    }

    private void appendProject(List<String> lines, Project item) {
        lines.add("------------------------------------------------------------");
        lines.add("Project #" + item.getId());
        lines.add("Title: " + valueOrDash(item.getTitle()));
        lines.add("Slug: " + valueOrDash(item.getSlug()));
        lines.add("Owner: " + valueOrDash(resolveUserName(item.getOwner())) + " (@" + item.getOwner().getUsername() + ")");
        lines.add("Category: " + valueOrDash(resolveCategory(item.getCategory())));
        lines.add("Short description: " + valueOrDash(item.getShortDesc()));
        lines.add("Full description: " + valueOrDash(item.getFullDesc()));
        lines.add("Tech stack: " + valueOrDash(item.getTechStack()));
        lines.add("Tags: " + valueOrDash(item.getTags()));
        lines.add("GitHub URL: " + valueOrDash(item.getGithubUrl()));
        lines.add("Demo URL: " + valueOrDash(item.getDemoUrl()));
        lines.add("Thumbnail: " + valueOrDash(item.getThumbnail()));
        lines.add("Visibility: " + valueOrDash(item.getVisibility()));
        lines.add("Active: " + item.isActive());
        lines.add("Like count: " + item.getLikeCount());
        lines.add("Comment count: " + item.getCommentCount());
        lines.add("Save count: " + item.getSaveCount());
        lines.add("Share count: " + item.getShareCount());
        lines.add("View count: " + item.getViewCount());
        lines.add("Created at: " + valueOrDash(item.getCreatedAt()));
        lines.add("Updated at: " + valueOrDash(item.getUpdatedAt()));
        lines.add("Deleted at: " + valueOrDash(item.getDeletedAt()));
        lines.add("Deleted by: " + valueOrDash(item.getDeletedBy()));
        lines.add("");
    }

    private void appendPost(List<String> lines, Post item) {
        lines.add("------------------------------------------------------------");
        lines.add("Post #" + item.getId());
        lines.add("Author: " + valueOrDash(resolveUserName(item.getAuthor())) + " (@" + item.getAuthor().getUsername() + ")");
        lines.add("Category: " + valueOrDash(resolveCategory(item.getCategory())));
        lines.add("Post type: " + valueOrDash(item.getPostType()));
        lines.add("Content: " + valueOrDash(item.getContent()));
        lines.add("Tags: " + valueOrDash(item.getTags()));
        lines.add("Visibility: " + valueOrDash(item.getVisibility()));
        lines.add("Active: " + item.isActive());
        lines.add("Like count: " + item.getLikeCount());
        lines.add("Comment count: " + item.getCommentCount());
        lines.add("Save count: " + item.getSaveCount());
        lines.add("Share count: " + item.getShareCount());
        lines.add("Created at: " + valueOrDash(item.getCreatedAt()));
        lines.add("Updated at: " + valueOrDash(item.getUpdatedAt()));
        lines.add("Deleted at: " + valueOrDash(item.getDeletedAt()));
        lines.add("Deleted by: " + valueOrDash(item.getDeletedBy()));
        lines.add("");
    }

    private void appendBlog(List<String> lines, Blog item) {
        lines.add("------------------------------------------------------------");
        lines.add("Blog #" + item.getId());
        lines.add("Title: " + valueOrDash(item.getTitle()));
        lines.add("Slug: " + valueOrDash(item.getSlug()));
        lines.add("Author: " + valueOrDash(resolveUserName(item.getAuthor())) + " (@" + item.getAuthor().getUsername() + ")");
        lines.add("Category: " + valueOrDash(resolveCategory(item.getCategory())));
        lines.add("Content: " + valueOrDash(item.getContent()));
        lines.add("Tags: " + valueOrDash(item.getTags()));
        lines.add("Cover image: " + valueOrDash(item.getCoverImage()));
        lines.add("Visibility: " + valueOrDash(item.getVisibility()));
        lines.add("Active: " + item.isActive());
        lines.add("Like count: " + item.getLikeCount());
        lines.add("Comment count: " + item.getCommentCount());
        lines.add("Save count: " + item.getSaveCount());
        lines.add("Share count: " + item.getShareCount());
        lines.add("Created at: " + valueOrDash(item.getCreatedAt()));
        lines.add("Updated at: " + valueOrDash(item.getUpdatedAt()));
        lines.add("Deleted at: " + valueOrDash(item.getDeletedAt()));
        lines.add("Deleted by: " + valueOrDash(item.getDeletedBy()));
        lines.add("");
    }

    private void appendReport(List<String> lines, Report report) {
        lines.add("------------------------------------------------------------");
        lines.add("Report #" + report.getId());
        lines.add("Reporter: " + valueOrDash(resolveUserName(report.getReporter())) + " (@" + report.getReporter().getUsername() + ")");
        lines.add("Content reference: " + valueOrDash(report.getContentType()) + " #" + valueOrDash(report.getContentId()));
        lines.add("Reason: " + valueOrDash(report.getReason()));
        lines.add("Description: " + valueOrDash(report.getDescription()));
        lines.add("Status: " + valueOrDash(report.getStatus()));
        lines.add("Admin note: " + valueOrDash(report.getAdminNote()));
        lines.add("Resolved by: " + valueOrDash(report.getResolvedBy() != null ? "@" + report.getResolvedBy().getUsername() : null));
        lines.add("Resolved at: " + valueOrDash(report.getResolvedAt()));
        lines.add("Created at: " + valueOrDash(report.getCreatedAt()));
        lines.add("Updated at: " + valueOrDash(report.getUpdatedAt()));
        lines.add("");
    }

    private void appendWarning(List<String> lines, Warning warning) {
        lines.add("------------------------------------------------------------");
        lines.add("Warning #" + warning.getId());
        lines.add("Target user: " + valueOrDash(resolveUserName(warning.getTargetUser())) + " (@" + warning.getTargetUser().getUsername() + ")");
        lines.add("Related content: " + valueOrDash(warning.getContentType()) + " #" + valueOrDash(warning.getContentId()));
        lines.add("Title: " + valueOrDash(warning.getTitle()));
        lines.add("Message: " + valueOrDash(warning.getMessage()));
        lines.add("Reason: " + valueOrDash(warning.getReason()));
        lines.add("Status: " + valueOrDash(warning.getStatus()));
        lines.add("Acknowledged at: " + valueOrDash(warning.getAcknowledgedAt()));
        lines.add("Created at: " + valueOrDash(warning.getCreatedAt()));
        lines.add("Updated at: " + valueOrDash(warning.getUpdatedAt()));
        lines.add("");
    }

    private String resolveUserName(User user) {
        if (user == null) {
            return "-";
        }
        UserProfile profile = user.getProfile();
        if (profile != null && profile.getFullName() != null && !profile.getFullName().isBlank()) {
            return profile.getFullName();
        }
        return user.getUsername();
    }

    private String resolveCategory(Category category) {
        if (category == null) {
            return "-";
        }
        return category.getName() + " (#" + category.getId() + ")";
    }

    private String valueOrDash(Object value) {
        if (value == null) {
            return "-";
        }
        String text = value.toString().trim();
        return text.isEmpty() ? "-" : text;
    }

    private record ExportPayload(String title, List<String> lines) {}
}
