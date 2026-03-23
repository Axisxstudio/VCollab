package com.vtechai.vcollab.project;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vtechai.vcollab.category.CategoryRepository;
import com.vtechai.vcollab.category.entity.Category;
import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.DiscoverySort;
import com.vtechai.vcollab.enums.Role;
import com.vtechai.vcollab.enums.TargetType;
import com.vtechai.vcollab.enums.Visibility;
import com.vtechai.vcollab.exception.ForbiddenException;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.project.dto.ProjectMediaDto;
import com.vtechai.vcollab.project.dto.ProjectRequestDto;
import com.vtechai.vcollab.project.dto.ProjectResponse;
import com.vtechai.vcollab.project.entity.Project;
import com.vtechai.vcollab.project.entity.ProjectMedia;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.targeting.ContentTargetingRepository;
import com.vtechai.vcollab.targeting.entity.ContentTargeting;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import com.vtechai.vcollab.notification.MentionService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectServiceImpl implements ProjectService {
    private final ProjectRepository projectRepository;
    private final ProjectMediaRepository projectMediaRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ContentTargetingRepository contentTargetingRepository;
    private final ObjectMapper objectMapper;
    private final MentionService mentionService;

    @Override
    public Page<ProjectResponse> listPublic(Pageable pageable) {
        return searchPublic(null, null, null, null, null, null, DiscoverySort.NEWEST, pageable);
    }

    @Override
    public Page<ProjectResponse> searchPublic(
        String search,
        Long categoryId,
        String tag,
        String owner,
        LocalDate fromDate,
        LocalDate toDate,
        DiscoverySort sort,
        Pageable pageable
    ) {
        return projectRepository.searchPublic(
            normalize(search),
            categoryId,
            normalize(tag),
            normalize(owner),
            toStartOfDay(fromDate),
            toEndOfDay(toDate),
            buildPageable(pageable, sort)
        ).map(this::toResponse);
    }

    @Override
    public Page<ProjectResponse> listByUsername(String username, UserPrincipal principal, Pageable pageable) {
        User owner = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (owner.getDeletedAt() != null) {
            throw new ResourceNotFoundException("User not found");
        }
        if (principal != null && owner.getId().equals(principal.getId())) {
            return projectRepository.findByOwnerAndDeletedAtIsNull(owner, pageable).map(this::toResponse);
        }
        return projectRepository
            .findByOwnerUsernameAndVisibilityAndDeletedAtIsNull(username, Visibility.PUBLIC, pageable)
            .map(this::toResponse);
    }

    @Override
    public ProjectResponse getById(Long id, UserPrincipal principal) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (project.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Project not found");
        }
        if (!canView(project, principal)) {
            throw new ForbiddenException("Not allowed to view this project");
        }
        return toResponse(project);
    }

    @Override
    @Transactional
    public ProjectResponse create(ProjectRequestDto request, UserPrincipal principal) {
        User owner = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }

        Project project = Project.builder()
            .owner(owner)
            .category(category)
            .title(request.getTitle())
            .slug(generateSlug(request.getTitle()))
            .shortDesc(request.getShortDesc())
            .fullDesc(request.getFullDesc())
            .techStack(serializeList(request.getTechStack()))
            .tags(serializeList(request.getTags()))
            .githubUrl(request.getGithubUrl())
            .demoUrl(request.getDemoUrl())
            .youtubeUrl(request.getYoutubeUrl())
            .pdfUrl(request.getPdfUrl())
            .courseUrl(request.getCourseUrl())
            .thumbnail(request.getThumbnail())
            .visibility(request.getVisibility())
            .active(request.isActive())
            .build();

        Project saved = projectRepository.save(project);

        if (request.getMedia() != null && !request.getMedia().isEmpty()) {
            List<ProjectMedia> media = request.getMedia().stream()
                .map(dto -> toEntity(saved, dto))
                .collect(Collectors.toList());
            projectMediaRepository.saveAll(media);
        }

        // Process mentions in description
        mentionService.processMentions(saved.getFullDesc(), principal.getId(), ContentType.PROJECT, saved.getId());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public ProjectResponse update(Long id, ProjectRequestDto request, UserPrincipal principal) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (!project.getOwner().getId().equals(principal.getId())) {
            throw new ForbiddenException("Not allowed to update this project");
        }

        if (request.getTitle() != null) {
            project.setTitle(request.getTitle());
            project.setSlug(generateSlug(request.getTitle()));
        }
        project.setShortDesc(request.getShortDesc());
        project.setFullDesc(request.getFullDesc());
        project.setTechStack(serializeList(request.getTechStack()));
        project.setTags(serializeList(request.getTags()));
        project.setGithubUrl(request.getGithubUrl());
        project.setDemoUrl(request.getDemoUrl());
        project.setYoutubeUrl(request.getYoutubeUrl());
        project.setPdfUrl(request.getPdfUrl());
        project.setCourseUrl(request.getCourseUrl());
        project.setThumbnail(request.getThumbnail());
        project.setVisibility(request.getVisibility());
        project.setActive(request.isActive());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            project.setCategory(category);
        }

        Project saved = projectRepository.save(project);

        projectMediaRepository.deleteByProjectId(saved.getId());
        if (request.getMedia() != null && !request.getMedia().isEmpty()) {
            List<ProjectMedia> media = request.getMedia().stream()
                .map(dto -> toEntity(saved, dto))
                .collect(Collectors.toList());
            projectMediaRepository.saveAll(media);
        }

        // Process mentions in description on update
        mentionService.processMentions(saved.getFullDesc(), principal.getId(), ContentType.PROJECT, saved.getId());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void softDelete(Long id, UserPrincipal principal) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (!project.getOwner().getId().equals(principal.getId())) {
            throw new ForbiddenException("Not allowed to delete this project");
        }
        project.setDeletedAt(Instant.now());
        project.setDeletedBy(principal.getId());
        projectRepository.save(project);
    }

    private boolean canView(Project project, UserPrincipal principal) {
        boolean isOwner = principal != null && project.getOwner().getId().equals(principal.getId());
        boolean isAdmin = principal != null && principal.getRole() == Role.SUPER_ADMIN;
        if (isOwner || isAdmin) {
            return true;
        }
        return project.getVisibility() == Visibility.PUBLIC && project.isActive();
    }

    private Pageable buildPageable(Pageable pageable, DiscoverySort sort) {
        int page = pageable != null && pageable.isPaged() ? pageable.getPageNumber() : 0;
        int size = pageable != null && pageable.isPaged() ? pageable.getPageSize() : 20;
        DiscoverySort appliedSort = sort != null ? sort : DiscoverySort.NEWEST;
        return PageRequest.of(page, size, appliedSort.toSort());
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private Instant toStartOfDay(LocalDate value) {
        return value == null ? null : value.atStartOfDay().toInstant(ZoneOffset.UTC);
    }

    private Instant toEndOfDay(LocalDate value) {
        return value == null ? null : value.plusDays(1).atStartOfDay().minusNanos(1).toInstant(ZoneOffset.UTC);
    }

    private ProjectMedia toEntity(Project project, ProjectMediaDto dto) {
        return ProjectMedia.builder()
            .project(project)
            .url(dto.getUrl())
            .mediaType(dto.getMediaType())
            .fileName(dto.getFileName())
            .fileSize(dto.getFileSize())
            .sortOrder(dto.getSortOrder())
            .build();
    }

    private ProjectResponse toResponse(Project project) {
        List<ProjectMediaDto> media = projectMediaRepository.findByProjectIdOrderBySortOrderAscIdAsc(project.getId()).stream()
            .map(pm -> {
                ProjectMediaDto dto = new ProjectMediaDto();
                dto.setUrl(pm.getUrl());
                dto.setMediaType(pm.getMediaType());
                dto.setFileName(pm.getFileName());
                dto.setFileSize(pm.getFileSize());
                dto.setSortOrder(pm.getSortOrder());
                return dto;
            }).collect(Collectors.toList());

        ProjectResponse.CategorySummary category = null;
        if (project.getCategory() != null) {
            category = ProjectResponse.CategorySummary.builder()
                .id(project.getCategory().getId())
                .name(project.getCategory().getName())
                .build();
        }

        ProjectResponse.OwnerSummary owner = ProjectResponse.OwnerSummary.builder()
            .id(project.getOwner().getId())
            .username(project.getOwner().getUsername())
            .fullName(project.getOwner().getProfile() != null ? project.getOwner().getProfile().getFullName() : null)
            .profileImage(project.getOwner().getProfile() != null ? project.getOwner().getProfile().getProfileImage() : null)
            .educationType(
                project.getOwner().getProfile() != null && project.getOwner().getProfile().getEducationType() != null
                    ? project.getOwner().getProfile().getEducationType().name()
                    : null
            )
            .build();

        return ProjectResponse.builder()
            .id(project.getId())
            .title(project.getTitle())
            .slug(project.getSlug())
            .shortDesc(project.getShortDesc())
            .fullDesc(project.getFullDesc())
            .thumbnail(project.getThumbnail())
            .tags(deserializeList(project.getTags()))
            .techStack(deserializeList(project.getTechStack()))
            .githubUrl(canExposeExternalLinks() ? project.getGithubUrl() : null)
            .demoUrl(canExposeExternalLinks() ? project.getDemoUrl() : null)
            .youtubeUrl(canExposeExternalLinks() ? project.getYoutubeUrl() : null)
            .pdfUrl(canExposeExternalLinks() ? project.getPdfUrl() : null)
            .courseUrl(canExposeExternalLinks() ? project.getCourseUrl() : null)
            .targetType(resolveTargetType(project.getId()))
            .hasGithubUrl(hasText(project.getGithubUrl()))
            .hasDemoUrl(hasText(project.getDemoUrl()))
            .hasYoutubeUrl(hasText(project.getYoutubeUrl()))
            .hasPdfUrl(hasText(project.getPdfUrl()))
            .hasCourseUrl(hasText(project.getCourseUrl()))
            .visibility(project.getVisibility())
            .active(project.isActive())
            .likeCount(project.getLikeCount())
            .commentCount(project.getCommentCount())
            .saveCount(project.getSaveCount())
            .shareCount(project.getShareCount())
            .viewCount(project.getViewCount())
            .category(category)
            .owner(owner)
            .media(media)
            .createdAt(project.getCreatedAt())
            .updatedAt(project.getUpdatedAt())
            .build();
    }

    private TargetType resolveTargetType(Long contentId) {
        return contentTargetingRepository.findByContentIdAndContentType(contentId, ContentType.PROJECT)
            .map(ContentTargeting::getTargetType)
            .orElse(TargetType.ALL);
    }

    private boolean canExposeExternalLinks() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null
            && authentication.isAuthenticated()
            && !(authentication instanceof AnonymousAuthenticationToken);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String serializeList(List<String> items) {
        if (items == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(items);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    private List<String> deserializeList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException ex) {
            return Collections.emptyList();
        }
    }

    private String generateSlug(String title) {
        String slug = title.toLowerCase(Locale.ROOT).trim();
        slug = slug.replaceAll("[^a-z0-9\\s-]", "");
        slug = slug.replaceAll("\\s+", "-");
        return slug + "-" + System.currentTimeMillis();
    }
}
