package com.vtechai.vcollab.blog;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vtechai.vcollab.blog.dto.BlogMediaDto;
import com.vtechai.vcollab.blog.dto.BlogRequestDto;
import com.vtechai.vcollab.blog.dto.BlogResponse;
import com.vtechai.vcollab.blog.entity.Blog;
import com.vtechai.vcollab.blog.entity.BlogMedia;
import com.vtechai.vcollab.category.CategoryRepository;
import com.vtechai.vcollab.category.entity.Category;
import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.DiscoverySort;
import com.vtechai.vcollab.enums.Role;
import com.vtechai.vcollab.enums.TargetType;
import com.vtechai.vcollab.enums.Visibility;
import com.vtechai.vcollab.exception.ForbiddenException;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BlogServiceImpl implements BlogService {
    private final BlogRepository blogRepository;
    private final BlogMediaRepository blogMediaRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ContentTargetingRepository contentTargetingRepository;
    private final ObjectMapper objectMapper;

    @Override
    public Page<BlogResponse> listPublic(Pageable pageable) {
        return searchPublic(null, null, null, null, null, null, DiscoverySort.NEWEST, pageable);
    }

    @Override
    public Page<BlogResponse> searchPublic(
        String search,
        Long categoryId,
        String tag,
        String owner,
        LocalDate fromDate,
        LocalDate toDate,
        DiscoverySort sort,
        Pageable pageable
    ) {
        return blogRepository.searchPublic(
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
    public Page<BlogResponse> listByUsername(String username, UserPrincipal principal, Pageable pageable) {
        User author = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (author.getDeletedAt() != null) {
            throw new ResourceNotFoundException("User not found");
        }
        if (principal != null && author.getId().equals(principal.getId())) {
            return blogRepository.findByAuthorAndDeletedAtIsNull(author, pageable).map(this::toResponse);
        }
        return blogRepository
            .findByAuthorUsernameAndVisibilityAndDeletedAtIsNull(username, Visibility.PUBLIC, pageable)
            .map(this::toResponse);
    }

    @Override
    public BlogResponse getById(Long id, UserPrincipal principal) {
        Blog blog = blogRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));
        if (blog.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Blog not found");
        }
        if (!canView(blog, principal)) {
            throw new ForbiddenException("Not allowed to view this blog");
        }
        return toResponse(blog);
    }

    @Override
    @Transactional
    public BlogResponse create(BlogRequestDto request, UserPrincipal principal) {
        User author = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }

        Blog blog = Blog.builder()
            .author(author)
            .category(category)
            .title(request.getTitle())
            .slug(generateSlug(request.getTitle()))
            .coverImage(request.getCoverImage())
            .content(request.getContent())
            .tags(serializeList(request.getTags()))
            .visibility(request.getVisibility())
            .active(request.isActive())
            .build();

        Blog saved = blogRepository.save(blog);
        if (request.getMedia() != null && !request.getMedia().isEmpty()) {
            List<BlogMedia> media = request.getMedia().stream()
                .map(dto -> toEntity(saved, dto))
                .collect(Collectors.toList());
            blogMediaRepository.saveAll(media);
        }
        return toResponse(saved);
    }

    @Override
    @Transactional
    public BlogResponse update(Long id, BlogRequestDto request, UserPrincipal principal) {
        Blog blog = blogRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));
        if (!blog.getAuthor().getId().equals(principal.getId())) {
            throw new ForbiddenException("Not allowed to update this blog");
        }

        blog.setTitle(request.getTitle());
        blog.setSlug(generateSlug(request.getTitle()));
        blog.setCoverImage(request.getCoverImage());
        blog.setContent(request.getContent());
        blog.setTags(serializeList(request.getTags()));
        blog.setVisibility(request.getVisibility());
        blog.setActive(request.isActive());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            blog.setCategory(category);
        }

        Blog saved = blogRepository.save(blog);
        blogMediaRepository.deleteByBlogId(saved.getId());
        if (request.getMedia() != null && !request.getMedia().isEmpty()) {
            List<BlogMedia> media = request.getMedia().stream()
                .map(dto -> toEntity(saved, dto))
                .collect(Collectors.toList());
            blogMediaRepository.saveAll(media);
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void softDelete(Long id, UserPrincipal principal) {
        Blog blog = blogRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));
        if (!blog.getAuthor().getId().equals(principal.getId())) {
            throw new ForbiddenException("Not allowed to delete this blog");
        }
        blog.setDeletedAt(Instant.now());
        blog.setDeletedBy(principal.getId());
        blogRepository.save(blog);
    }

    private boolean canView(Blog blog, UserPrincipal principal) {
        boolean isOwner = principal != null && blog.getAuthor().getId().equals(principal.getId());
        boolean isAdmin = principal != null && principal.getRole() == Role.SUPER_ADMIN;
        if (isOwner || isAdmin) {
            return true;
        }
        return blog.getVisibility() == Visibility.PUBLIC && blog.isActive();
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

    private BlogMedia toEntity(Blog blog, BlogMediaDto dto) {
        return BlogMedia.builder()
            .blog(blog)
            .url(dto.getUrl())
            .mediaType(dto.getMediaType())
            .sortOrder(dto.getSortOrder())
            .build();
    }

    private BlogResponse toResponse(Blog blog) {
        List<BlogMediaDto> media = blogMediaRepository.findByBlogIdOrderBySortOrderAscIdAsc(blog.getId()).stream()
            .map(bm -> {
                BlogMediaDto dto = new BlogMediaDto();
                dto.setUrl(bm.getUrl());
                dto.setMediaType(bm.getMediaType());
                dto.setSortOrder(bm.getSortOrder());
                return dto;
            }).collect(Collectors.toList());

        BlogResponse.CategorySummary category = null;
        if (blog.getCategory() != null) {
            category = BlogResponse.CategorySummary.builder()
                .id(blog.getCategory().getId())
                .name(blog.getCategory().getName())
                .build();
        }

        BlogResponse.AuthorSummary author = BlogResponse.AuthorSummary.builder()
            .id(blog.getAuthor().getId())
            .username(blog.getAuthor().getUsername())
            .fullName(blog.getAuthor().getProfile() != null ? blog.getAuthor().getProfile().getFullName() : null)
            .profileImage(blog.getAuthor().getProfile() != null ? blog.getAuthor().getProfile().getProfileImage() : null)
            .educationType(
                blog.getAuthor().getProfile() != null && blog.getAuthor().getProfile().getEducationType() != null
                    ? blog.getAuthor().getProfile().getEducationType().name()
                    : null
            )
            .build();

        return BlogResponse.builder()
            .id(blog.getId())
            .title(blog.getTitle())
            .slug(blog.getSlug())
            .coverImage(blog.getCoverImage())
            .content(blog.getContent())
            .targetType(resolveTargetType(blog.getId()))
            .visibility(blog.getVisibility())
            .active(blog.isActive())
            .tags(deserializeList(blog.getTags()))
            .likeCount(blog.getLikeCount())
            .commentCount(blog.getCommentCount())
            .saveCount(blog.getSaveCount())
            .shareCount(blog.getShareCount())
            .category(category)
            .author(author)
            .media(media)
            .createdAt(blog.getCreatedAt())
            .updatedAt(blog.getUpdatedAt())
            .build();
    }

    private TargetType resolveTargetType(Long contentId) {
        return contentTargetingRepository.findByContentIdAndContentType(contentId, ContentType.BLOG)
            .map(ContentTargeting::getTargetType)
            .orElse(TargetType.ALL);
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
