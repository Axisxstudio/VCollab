package com.vtechai.vcollab.feed;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vtechai.vcollab.blog.BlogMediaRepository;
import com.vtechai.vcollab.blog.BlogRepository;
import com.vtechai.vcollab.blog.entity.Blog;
import com.vtechai.vcollab.category.entity.Category;
import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.EducationType;
import com.vtechai.vcollab.enums.MediaType;
import com.vtechai.vcollab.enums.TargetType;
import com.vtechai.vcollab.enums.Visibility;
import com.vtechai.vcollab.feed.dto.FeedItemResponse;
import com.vtechai.vcollab.feed.dto.FeedResponse;
import com.vtechai.vcollab.follow.FollowRepository;
import com.vtechai.vcollab.post.PostMediaRepository;
import com.vtechai.vcollab.post.PostRepository;
import com.vtechai.vcollab.post.entity.Post;
import com.vtechai.vcollab.project.ProjectMediaRepository;
import com.vtechai.vcollab.project.ProjectRepository;
import com.vtechai.vcollab.project.entity.Project;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import com.vtechai.vcollab.user.entity.UserProfile;
import com.vtechai.vcollab.targeting.ContentTargetingRepository;
import com.vtechai.vcollab.targeting.entity.ContentTargeting;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedServiceImpl implements FeedService {
    private static final int DEFAULT_SIZE = 9;
    private static final int MAX_SIZE = 18;
    private static final Comparator<FeedItemResponse> FEED_COMPARATOR =
        Comparator.comparing(FeedItemResponse::isPrioritized)
            .reversed()
            .thenComparing(FeedItemResponse::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(FeedItemResponse::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder()));

    private final ProjectRepository projectRepository;
    private final ProjectMediaRepository projectMediaRepository;
    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final BlogRepository blogRepository;
    private final BlogMediaRepository blogMediaRepository;
    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final ContentTargetingRepository contentTargetingRepository;
    private final ObjectMapper objectMapper;

    @Override
    public FeedResponse getFeed(UserPrincipal principal, FeedScope scope, int size, boolean includeSchool) {
        int normalizedSize = normalizeSize(size);
        List<Long> followedIds = followRepository.findByFollowerIdOrderByCreatedAtDesc(principal.getId()).stream()
            .map(follow -> follow.getFollowing().getId())
            .distinct()
            .collect(Collectors.toList());
        User currentUser = userRepository.findById(principal.getId()).orElse(null);
        boolean hideSchoolContent = shouldHideSchoolContent(currentUser, includeSchool);

        List<FeedItemResponse> items = scope == FeedScope.FOLLOWING
            ? buildFollowingFeed(followedIds, normalizedSize, hideSchoolContent)
            : buildForYouFeed(principal.getId(), followedIds, normalizedSize, hideSchoolContent);

        return FeedResponse.builder()
            .scope(scope)
            .requestedSize(normalizedSize)
            .itemCount(items.size())
            .followingCount(followedIds.size())
            .personalizedItemCount(items.stream().filter(FeedItemResponse::isPrioritized).count())
            .stats(buildStats(items))
            .items(items)
            .build();
    }

    private List<FeedItemResponse> buildForYouFeed(Long currentUserId, List<Long> followedIds, int size, boolean hideSchoolContent) {
        Set<Long> prioritizedUserIds = new LinkedHashSet<>();
        prioritizedUserIds.add(currentUserId);
        prioritizedUserIds.addAll(followedIds);

        List<FeedItemResponse> items = new ArrayList<>();
        
        User currUser = userRepository.findById(currentUserId).orElse(null);
        if (currUser != null && currUser.getProfile() != null) {
            UserProfile p = currUser.getProfile();
            List<ContentTargeting> targetings = contentTargetingRepository.findMatchingTargeting(
                p.getGrade(), p.getAcademicYear(), p.getFaculty(), p.getInstitutionName()
            );
            if (!targetings.isEmpty()) {
                List<Long> projIds = targetings.stream().filter(t -> t.getContentType() == ContentType.PROJECT).map(ContentTargeting::getContentId).collect(Collectors.toList());
                List<Long> postIds = targetings.stream().filter(t -> t.getContentType() == ContentType.POST).map(ContentTargeting::getContentId).collect(Collectors.toList());
                List<Long> blogIds = targetings.stream().filter(t -> t.getContentType() == ContentType.BLOG).map(ContentTargeting::getContentId).collect(Collectors.toList());
                
                if (!projIds.isEmpty()) {
                    items.addAll(projectRepository.findAllById(projIds).stream()
                        .filter(i -> i.getVisibility() == Visibility.PUBLIC && i.isActive() && i.getDeletedAt() == null)
                        .map(i -> toProjectFeedItem(i, true)).collect(Collectors.toList()));
                }
                if (!postIds.isEmpty()) {
                    items.addAll(postRepository.findAllById(postIds).stream()
                        .filter(i -> i.getVisibility() == Visibility.PUBLIC && i.isActive() && i.getDeletedAt() == null)
                        .map(i -> toPostFeedItem(i, true)).collect(Collectors.toList()));
                }
                if (!blogIds.isEmpty()) {
                    items.addAll(blogRepository.findAllById(blogIds).stream()
                        .filter(i -> i.getVisibility() == Visibility.PUBLIC && i.isActive() && i.getDeletedAt() == null)
                        .map(i -> toBlogFeedItem(i, true)).collect(Collectors.toList()));
                }
            }
        }

        items.addAll(fetchTargetedItems(new ArrayList<>(prioritizedUserIds), Math.max(size * 2, size), true));
        items.addAll(fetchPublicItems(Math.max(size * 3, size), prioritizedUserIds));
        return finalizeFeedItems(items, size, hideSchoolContent);
    }

    private List<FeedItemResponse> buildFollowingFeed(List<Long> followedIds, int size, boolean hideSchoolContent) {
        if (followedIds.isEmpty()) {
            return Collections.emptyList();
        }
        return finalizeFeedItems(fetchTargetedItems(followedIds, Math.max(size * 3, size), true), size, hideSchoolContent);
    }

    private List<FeedItemResponse> fetchTargetedItems(List<Long> userIds, int limit, boolean prioritized) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyList();
        }

        Pageable pageable = buildPageable(limit);
        List<FeedItemResponse> items = new ArrayList<>();
        items.addAll(projectRepository
            .findByOwnerIdInAndVisibilityAndActiveTrueAndDeletedAtIsNull(userIds, Visibility.PUBLIC, pageable)
            .stream()
            .map(project -> toProjectFeedItem(project, prioritized))
            .collect(Collectors.toList()));
        items.addAll(postRepository
            .findByAuthorIdInAndVisibilityAndActiveTrueAndDeletedAtIsNull(userIds, Visibility.PUBLIC, pageable)
            .stream()
            .map(post -> toPostFeedItem(post, prioritized))
            .collect(Collectors.toList()));
        items.addAll(blogRepository
            .findByAuthorIdInAndVisibilityAndActiveTrueAndDeletedAtIsNull(userIds, Visibility.PUBLIC, pageable)
            .stream()
            .map(blog -> toBlogFeedItem(blog, prioritized))
            .collect(Collectors.toList()));
        return sortItems(items);
    }

    private List<FeedItemResponse> fetchPublicItems(int limit, Set<Long> prioritizedUserIds) {
        Pageable pageable = buildPageable(limit);
        List<FeedItemResponse> items = new ArrayList<>();
        items.addAll(projectRepository
            .findByVisibilityAndActiveTrueAndDeletedAtIsNull(Visibility.PUBLIC, pageable)
            .getContent()
            .stream()
            .map(project -> toProjectFeedItem(project, prioritizedUserIds.contains(project.getOwner().getId())))
            .collect(Collectors.toList()));
        items.addAll(postRepository
            .findByVisibilityAndActiveTrueAndDeletedAtIsNull(Visibility.PUBLIC, pageable)
            .getContent()
            .stream()
            .map(post -> toPostFeedItem(post, prioritizedUserIds.contains(post.getAuthor().getId())))
            .collect(Collectors.toList()));
        items.addAll(blogRepository
            .findByVisibilityAndActiveTrueAndDeletedAtIsNull(Visibility.PUBLIC, pageable)
            .getContent()
            .stream()
            .map(blog -> toBlogFeedItem(blog, prioritizedUserIds.contains(blog.getAuthor().getId())))
            .collect(Collectors.toList()));
        return sortItems(items);
    }

    private FeedItemResponse toProjectFeedItem(Project project, boolean prioritized) {
        List<FeedItemResponse.MediaSummary> media = buildProjectMedia(project);
        MediaPreview preview = media.isEmpty()
            ? MediaPreview.empty()
            : new MediaPreview(media.get(0).getUrl(), media.get(0).getMediaType());
        return FeedItemResponse.builder()
            .contentType(ContentType.PROJECT)
            .id(project.getId())
            .title(project.getTitle())
            .excerpt(truncate(firstNonBlank(project.getShortDesc(), project.getFullDesc()), 220))
            .previewMediaUrl(preview.url)
            .previewMediaType(preview.mediaType)
            .media(media)
            .githubUrl(project.getGithubUrl())
            .demoUrl(project.getDemoUrl())
            .prioritized(prioritized)
            .likeCount(project.getLikeCount())
            .commentCount(project.getCommentCount())
            .saveCount(project.getSaveCount())
            .shareCount(project.getShareCount())
            .category(toCategorySummary(project.getCategory()))
            .author(toAuthorSummary(project.getOwner()))
            .tags(deserializeList(project.getTags()))
            .targetType(getTargetType(project.getId(), ContentType.PROJECT))
            .createdAt(project.getCreatedAt())
            .updatedAt(project.getUpdatedAt())
            .build();
    }

    private FeedItemResponse toPostFeedItem(Post post, boolean prioritized) {
        List<FeedItemResponse.MediaSummary> media = buildPostMedia(post);
        MediaPreview preview = media.isEmpty()
            ? MediaPreview.empty()
            : new MediaPreview(media.get(0).getUrl(), media.get(0).getMediaType());
        return FeedItemResponse.builder()
            .contentType(ContentType.POST)
            .id(post.getId())
            .title(null)
            .excerpt(truncate(post.getContent(), 260))
            .previewMediaUrl(preview.url)
            .previewMediaType(preview.mediaType)
            .media(media)
            .postType(post.getPostType())
            .prioritized(prioritized)
            .likeCount(post.getLikeCount())
            .commentCount(post.getCommentCount())
            .saveCount(post.getSaveCount())
            .shareCount(post.getShareCount())
            .category(toCategorySummary(post.getCategory()))
            .author(toAuthorSummary(post.getAuthor()))
            .tags(deserializeList(post.getTags()))
            .targetType(getTargetType(post.getId(), ContentType.POST))
            .createdAt(post.getCreatedAt())
            .updatedAt(post.getUpdatedAt())
            .build();
    }

    private FeedItemResponse toBlogFeedItem(Blog blog, boolean prioritized) {
        List<FeedItemResponse.MediaSummary> media = buildBlogMedia(blog);
        MediaPreview preview = media.isEmpty()
            ? MediaPreview.empty()
            : new MediaPreview(media.get(0).getUrl(), media.get(0).getMediaType());
        return FeedItemResponse.builder()
            .contentType(ContentType.BLOG)
            .id(blog.getId())
            .title(blog.getTitle())
            .excerpt(truncate(blog.getContent(), 240))
            .previewMediaUrl(preview.url)
            .previewMediaType(preview.mediaType)
            .media(media)
            .prioritized(prioritized)
            .likeCount(blog.getLikeCount())
            .commentCount(blog.getCommentCount())
            .saveCount(blog.getSaveCount())
            .shareCount(blog.getShareCount())
            .category(toCategorySummary(blog.getCategory()))
            .author(toAuthorSummary(blog.getAuthor()))
            .tags(deserializeList(blog.getTags()))
            .targetType(getTargetType(blog.getId(), ContentType.BLOG))
            .createdAt(blog.getCreatedAt())
            .updatedAt(blog.getUpdatedAt())
            .build();
    }

    private List<FeedItemResponse.MediaSummary> buildProjectMedia(Project project) {
        List<FeedItemResponse.MediaSummary> items = new ArrayList<>();
        if (project.getThumbnail() != null && !project.getThumbnail().isBlank()) {
            items.add(FeedItemResponse.MediaSummary.builder()
                .url(project.getThumbnail())
                .mediaType(MediaType.IMAGE)
                .label("Project cover")
                .fileName(null)
                .sortOrder(-1)
                .build());
        }
        projectMediaRepository.findByProjectIdOrderBySortOrderAscIdAsc(project.getId()).forEach(media ->
            addMediaIfAbsent(
                items,
                FeedItemResponse.MediaSummary.builder()
                    .url(media.getUrl())
                    .mediaType(media.getMediaType())
                    .label(media.getFileName() != null ? media.getFileName() : "Project media")
                    .fileName(media.getFileName())
                    .sortOrder(media.getSortOrder())
                    .build()
            )
        );
        return items;
    }

    private List<FeedItemResponse.MediaSummary> buildPostMedia(Post post) {
        List<FeedItemResponse.MediaSummary> items = new ArrayList<>();
        postMediaRepository.findByPostIdOrderBySortOrderAscIdAsc(post.getId()).forEach(media ->
            addMediaIfAbsent(
                items,
                FeedItemResponse.MediaSummary.builder()
                    .url(media.getUrl())
                    .mediaType(media.getMediaType())
                    .label("Post media")
                    .fileName(null)
                    .sortOrder(media.getSortOrder())
                    .build()
            )
        );
        return items;
    }

    private List<FeedItemResponse.MediaSummary> buildBlogMedia(Blog blog) {
        List<FeedItemResponse.MediaSummary> items = new ArrayList<>();
        if (blog.getCoverImage() != null && !blog.getCoverImage().isBlank()) {
            items.add(FeedItemResponse.MediaSummary.builder()
                .url(blog.getCoverImage())
                .mediaType(MediaType.IMAGE)
                .label("Blog cover")
                .fileName(null)
                .sortOrder(-1)
                .build());
        }
        blogMediaRepository.findByBlogIdOrderBySortOrderAscIdAsc(blog.getId()).forEach(media ->
            addMediaIfAbsent(
                items,
                FeedItemResponse.MediaSummary.builder()
                    .url(media.getUrl())
                    .mediaType(media.getMediaType())
                    .label("Blog media")
                    .fileName(null)
                    .sortOrder(media.getSortOrder())
                    .build()
            )
        );
        return items;
    }

    private void addMediaIfAbsent(List<FeedItemResponse.MediaSummary> items, FeedItemResponse.MediaSummary candidate) {
        boolean exists = items.stream().anyMatch(item -> item.getUrl().equals(candidate.getUrl()));
        if (!exists) {
            items.add(candidate);
        }
    }

    private com.vtechai.vcollab.enums.TargetType getTargetType(Long contentId, ContentType contentType) {
        return contentTargetingRepository.findByContentIdAndContentType(contentId, contentType)
            .map(ContentTargeting::getTargetType)
            .orElse(com.vtechai.vcollab.enums.TargetType.ALL);
    }

    private FeedItemResponse.CategorySummary toCategorySummary(Category category) {
        if (category == null) {
            return null;
        }
        return FeedItemResponse.CategorySummary.builder()
            .id(category.getId())
            .name(category.getName())
            .build();
    }

    private FeedItemResponse.AuthorSummary toAuthorSummary(User user) {
        String fullName = null;
        String profileImage = null;
        String educationTypeStr = null;
        if (user.getProfile() != null) {
            fullName = user.getProfile().getFullName();
            profileImage = user.getProfile().getProfileImage();
            educationTypeStr = user.getProfile().getEducationType() != null ? user.getProfile().getEducationType().name() : null;
        }
        return FeedItemResponse.AuthorSummary.builder()
            .id(user.getId())
            .username(user.getUsername())
            .fullName(fullName)
            .profileImage(profileImage)
            .educationType(educationTypeStr) // Assuming FeedItemResponse.AuthorSummary has an educationType field
            .build();
    }

    private FeedResponse.FeedStats buildStats(List<FeedItemResponse> items) {
        int projectCount = 0;
        int postCount = 0;
        int blogCount = 0;

        for (FeedItemResponse item : items) {
            if (item.getContentType() == ContentType.PROJECT) {
                projectCount++;
            } else if (item.getContentType() == ContentType.POST) {
                postCount++;
            } else if (item.getContentType() == ContentType.BLOG) {
                blogCount++;
            }
        }

        return FeedResponse.FeedStats.builder()
            .projectCount(projectCount)
            .postCount(postCount)
            .blogCount(blogCount)
            .build();
    }

    private boolean shouldHideSchoolContent(User currentUser, boolean includeSchool) {
        if (includeSchool || currentUser == null || currentUser.getProfile() == null) {
            return false;
        }
        return currentUser.getProfile().getEducationType() == EducationType.UNIVERSITY;
    }

    private List<FeedItemResponse> finalizeFeedItems(List<FeedItemResponse> items, int limit, boolean hideSchoolContent) {
        if (!hideSchoolContent) {
            return dedupeAndLimit(items, limit);
        }

        return dedupeAndLimit(
            items.stream()
                .filter(this::isVisibleWhenSchoolContentHidden)
                .collect(Collectors.toList()),
            limit
        );
    }

    private boolean isVisibleWhenSchoolContentHidden(FeedItemResponse item) {
        if (item == null) {
            return false;
        }

        boolean schoolTargeted = item.getTargetType() == TargetType.SCHOOL;
        boolean schoolAuthored = item.getAuthor() != null
            && EducationType.SCHOOL.name().equalsIgnoreCase(item.getAuthor().getEducationType());

        return !schoolTargeted && !schoolAuthored;
    }

    private List<FeedItemResponse> dedupeAndLimit(List<FeedItemResponse> items, int limit) {
        Map<String, FeedItemResponse> unique = new LinkedHashMap<>();
        for (FeedItemResponse item : sortItems(items)) {
            unique.putIfAbsent(item.getContentType().name() + ":" + item.getId(), item);
            if (unique.size() >= limit) {
                break;
            }
        }
        return new ArrayList<>(unique.values());
    }

    private List<FeedItemResponse> sortItems(List<FeedItemResponse> items) {
        return items.stream()
            .sorted(FEED_COMPARATOR)
            .collect(Collectors.toList());
    }

    private Pageable buildPageable(int limit) {
        return PageRequest.of(0, Math.max(limit, 1), Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return DEFAULT_SIZE;
        }
        return Math.min(size, MAX_SIZE);
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

    private String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary;
        }
        return fallback;
    }

    private String stripHtml(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value
            .replaceAll("<[^>]+>", " ")
            .replaceAll("\\s+", " ")
            .trim();
    }

    private String truncate(String value, int maxLength) {
        String plainValue = stripHtml(value);
        if (plainValue.isBlank()) {
            return "";
        }
        if (plainValue.length() <= maxLength) {
            return plainValue;
        }
        return plainValue.substring(0, maxLength - 3).trim() + "...";
    }

    private static class MediaPreview {
        private final String url;
        private final MediaType mediaType;

        private MediaPreview(String url, MediaType mediaType) {
            this.url = url;
            this.mediaType = mediaType;
        }

        private static MediaPreview empty() {
            return new MediaPreview(null, null);
        }
    }
}
