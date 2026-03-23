package com.vtechai.vcollab.post;

import com.vtechai.vcollab.notification.MentionService;
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
import com.vtechai.vcollab.post.dto.PostMediaDto;
import com.vtechai.vcollab.post.dto.PostRequestDto;
import com.vtechai.vcollab.post.dto.PostResponse;
import com.vtechai.vcollab.post.entity.Post;
import com.vtechai.vcollab.post.entity.PostMedia;
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
public class PostServiceImpl implements PostService {
    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ContentTargetingRepository contentTargetingRepository;
    private final ObjectMapper objectMapper;
    private final MentionService mentionService;

    @Override
    public Page<PostResponse> listPublic(Pageable pageable) {
        return searchPublic(null, null, null, null, null, null, DiscoverySort.NEWEST, pageable);
    }

    @Override
    public Page<PostResponse> searchPublic(
        String search,
        Long categoryId,
        String tag,
        String owner,
        LocalDate fromDate,
        LocalDate toDate,
        DiscoverySort sort,
        Pageable pageable
    ) {
        return postRepository.searchPublic(
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
    public Page<PostResponse> listByUsername(String username, UserPrincipal principal, Pageable pageable) {
        User author = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (author.getDeletedAt() != null) {
            throw new ResourceNotFoundException("User not found");
        }
        if (principal != null && author.getId().equals(principal.getId())) {
            return postRepository.findByAuthorAndDeletedAtIsNull(author, pageable).map(this::toResponse);
        }
        return postRepository
            .findByAuthorUsernameAndVisibilityAndDeletedAtIsNull(username, Visibility.PUBLIC, pageable)
            .map(this::toResponse);
    }

    @Override
    public PostResponse getById(Long id, UserPrincipal principal) {
        Post post = postRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        if (post.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Post not found");
        }
        if (!canView(post, principal)) {
            throw new ForbiddenException("Not allowed to view this post");
        }
        return toResponse(post);
    }

    @Override
    @Transactional
    public PostResponse create(PostRequestDto request, UserPrincipal principal) {
        User author = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }

        Post post = Post.builder()
            .author(author)
            .category(category)
            .content(request.getContent())
            .postType(request.getPostType())
            .tags(serializeList(request.getTags()))
            .visibility(request.getVisibility())
            .active(request.isActive())
            .build();

        Post saved = postRepository.save(post);

        if (request.getMedia() != null && !request.getMedia().isEmpty()) {
            List<PostMedia> media = request.getMedia().stream()
                .map(dto -> toEntity(saved, dto))
                .collect(Collectors.toList());
            postMediaRepository.saveAll(media);
        }

        // Process mentions in post content
        mentionService.processMentions(saved.getContent(), principal.getId(), ContentType.POST, saved.getId());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public PostResponse update(Long id, PostRequestDto request, UserPrincipal principal) {
        Post post = postRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        if (!post.getAuthor().getId().equals(principal.getId())) {
            throw new ForbiddenException("Not allowed to update this post");
        }

        post.setContent(request.getContent());
        post.setPostType(request.getPostType());
        post.setTags(serializeList(request.getTags()));
        post.setVisibility(request.getVisibility());
        post.setActive(request.isActive());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            post.setCategory(category);
        }

        Post saved = postRepository.save(post);
        postMediaRepository.deleteByPostId(saved.getId());
        if (request.getMedia() != null && !request.getMedia().isEmpty()) {
            List<PostMedia> media = request.getMedia().stream()
                .map(dto -> toEntity(saved, dto))
                .collect(Collectors.toList());
            postMediaRepository.saveAll(media);
        }

        // Process mentions on update
        mentionService.processMentions(saved.getContent(), principal.getId(), ContentType.POST, saved.getId());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void softDelete(Long id, UserPrincipal principal) {
        Post post = postRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        if (!post.getAuthor().getId().equals(principal.getId())) {
            throw new ForbiddenException("Not allowed to delete this post");
        }
        post.setDeletedAt(Instant.now());
        post.setDeletedBy(principal.getId());
        postRepository.save(post);
    }

    private boolean canView(Post post, UserPrincipal principal) {
        boolean isOwner = principal != null && post.getAuthor().getId().equals(principal.getId());
        boolean isAdmin = principal != null && principal.getRole() == Role.SUPER_ADMIN;
        if (isOwner || isAdmin) {
            return true;
        }
        return post.getVisibility() == Visibility.PUBLIC && post.isActive();
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

    private PostMedia toEntity(Post post, PostMediaDto dto) {
        return PostMedia.builder()
            .post(post)
            .url(dto.getUrl())
            .mediaType(dto.getMediaType())
            .sortOrder(dto.getSortOrder())
            .build();
    }

    private PostResponse toResponse(Post post) {
        List<PostMediaDto> media = postMediaRepository.findByPostIdOrderBySortOrderAscIdAsc(post.getId()).stream()
            .map(pm -> {
                PostMediaDto dto = new PostMediaDto();
                dto.setUrl(pm.getUrl());
                dto.setMediaType(pm.getMediaType());
                dto.setSortOrder(pm.getSortOrder());
                return dto;
            }).collect(Collectors.toList());

        PostResponse.CategorySummary category = null;
        if (post.getCategory() != null) {
            category = PostResponse.CategorySummary.builder()
                .id(post.getCategory().getId())
                .name(post.getCategory().getName())
                .build();
        }

        PostResponse.AuthorSummary author = PostResponse.AuthorSummary.builder()
            .id(post.getAuthor().getId())
            .username(post.getAuthor().getUsername())
            .fullName(post.getAuthor().getProfile() != null ? post.getAuthor().getProfile().getFullName() : null)
            .profileImage(post.getAuthor().getProfile() != null ? post.getAuthor().getProfile().getProfileImage() : null)
            .educationType(
                post.getAuthor().getProfile() != null && post.getAuthor().getProfile().getEducationType() != null
                    ? post.getAuthor().getProfile().getEducationType().name()
                    : null
            )
            .build();

        return PostResponse.builder()
            .id(post.getId())
            .content(post.getContent())
            .postType(post.getPostType())
            .targetType(resolveTargetType(post.getId()))
            .visibility(post.getVisibility())
            .active(post.isActive())
            .tags(deserializeList(post.getTags()))
            .likeCount(post.getLikeCount())
            .commentCount(post.getCommentCount())
            .saveCount(post.getSaveCount())
            .shareCount(post.getShareCount())
            .category(category)
            .author(author)
            .media(media)
            .createdAt(post.getCreatedAt())
            .updatedAt(post.getUpdatedAt())
            .build();
    }

    private TargetType resolveTargetType(Long contentId) {
        return contentTargetingRepository.findByContentIdAndContentType(contentId, ContentType.POST)
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
}
