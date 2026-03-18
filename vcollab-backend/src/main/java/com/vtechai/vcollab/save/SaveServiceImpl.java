package com.vtechai.vcollab.save;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vtechai.vcollab.blog.BlogMediaRepository;
import com.vtechai.vcollab.blog.BlogRepository;
import com.vtechai.vcollab.blog.entity.Blog;
import com.vtechai.vcollab.category.entity.Category;
import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.FeedEventType;
import com.vtechai.vcollab.enums.MediaType;
import com.vtechai.vcollab.enums.Visibility;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.interaction.ContentCounterService;
import com.vtechai.vcollab.post.PostMediaRepository;
import com.vtechai.vcollab.post.PostRepository;
import com.vtechai.vcollab.post.entity.Post;
import com.vtechai.vcollab.project.ProjectMediaRepository;
import com.vtechai.vcollab.project.ProjectRepository;
import com.vtechai.vcollab.project.entity.Project;
import com.vtechai.vcollab.realtime.FeedEvent;
import com.vtechai.vcollab.realtime.FeedPublisher;
import com.vtechai.vcollab.save.dto.SavedContentResponse;
import com.vtechai.vcollab.save.dto.SavedItemResponse;
import com.vtechai.vcollab.save.dto.SaveRequest;
import com.vtechai.vcollab.save.entity.Save;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SaveServiceImpl implements SaveService {
    private final SaveRepository saveRepository;
    private final UserRepository userRepository;
    private final ContentCounterService contentCounterService;
    private final FeedPublisher feedPublisher;
    private final ProjectRepository projectRepository;
    private final ProjectMediaRepository projectMediaRepository;
    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final BlogRepository blogRepository;
    private final BlogMediaRepository blogMediaRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void save(SaveRequest request, UserPrincipal principal) {
        contentCounterService.assertContentExists(request.getContentType(), request.getContentId());
        boolean exists = saveRepository.existsByUserIdAndContentTypeAndContentId(
            principal.getId(),
            request.getContentType(),
            request.getContentId()
        );
        if (exists) {
            return;
        }
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Save save = Save.builder()
            .user(user)
            .contentType(request.getContentType())
            .contentId(request.getContentId())
            .build();
        saveRepository.save(save);
        contentCounterService.updateSaveCount(request.getContentType(), request.getContentId(), 1);

        feedPublisher.publish(FeedEvent.builder()
            .eventType(FeedEventType.SAVE_CREATED)
            .contentType(request.getContentType())
            .contentId(request.getContentId())
            .actorId(principal.getId())
            .actorName(user.getUsername())
            .createdAt(Instant.now())
            .build());
    }

    @Override
    @Transactional
    public void unsave(ContentType contentType, Long contentId, UserPrincipal principal) {
        Save save = saveRepository.findByUserIdAndContentTypeAndContentId(principal.getId(), contentType, contentId)
            .orElse(null);
        if (save == null) {
            return;
        }
        saveRepository.delete(save);
        contentCounterService.updateSaveCount(contentType, contentId, -1);

        feedPublisher.publish(FeedEvent.builder()
            .eventType(FeedEventType.SAVE_REMOVED)
            .contentType(contentType)
            .contentId(contentId)
            .actorId(principal.getId())
            .actorName(save.getUser().getUsername())
            .createdAt(Instant.now())
            .build());
    }

    @Override
    public boolean isSaved(ContentType contentType, Long contentId, UserPrincipal principal) {
        return saveRepository.existsByUserIdAndContentTypeAndContentId(principal.getId(), contentType, contentId);
    }

    @Override
    public SavedContentResponse listSaved(UserPrincipal principal) {
        List<SavedItemResponse> items = saveRepository.findByUserIdOrderByCreatedAtDesc(principal.getId()).stream()
            .map(save -> mapSavedItem(save, principal))
            .flatMap(Optional::stream)
            .toList();

        return SavedContentResponse.builder()
            .itemCount(items.size())
            .items(items)
            .build();
    }

    private Optional<SavedItemResponse> mapSavedItem(Save save, UserPrincipal principal) {
        if (save.getContentType() == ContentType.PROJECT) {
            return projectRepository.findById(save.getContentId())
                .filter(project -> project.getDeletedAt() == null)
                .filter(project -> canView(project, principal))
                .map(project -> toSavedProject(save, project));
        }
        if (save.getContentType() == ContentType.POST) {
            return postRepository.findById(save.getContentId())
                .filter(post -> post.getDeletedAt() == null)
                .filter(post -> canView(post, principal))
                .map(post -> toSavedPost(save, post));
        }
        if (save.getContentType() == ContentType.BLOG) {
            return blogRepository.findById(save.getContentId())
                .filter(blog -> blog.getDeletedAt() == null)
                .filter(blog -> canView(blog, principal))
                .map(blog -> toSavedBlog(save, blog));
        }
        return Optional.empty();
    }

    private SavedItemResponse toSavedProject(Save save, Project project) {
        List<SavedItemResponse.MediaSummary> media = buildProjectMedia(project);
        MediaPreview preview = media.isEmpty()
            ? MediaPreview.empty()
            : new MediaPreview(media.get(0).getUrl(), media.get(0).getMediaType());

        return baseBuilder(save)
            .contentType(ContentType.PROJECT)
            .contentId(project.getId())
            .title(project.getTitle())
            .excerpt(truncate(firstNonBlank(project.getShortDesc(), project.getFullDesc()), 220))
            .previewMediaUrl(preview.url)
            .previewMediaType(preview.mediaType)
            .media(media)
            .githubUrl(project.getGithubUrl())
            .demoUrl(project.getDemoUrl())
            .likeCount(project.getLikeCount())
            .commentCount(project.getCommentCount())
            .saveCount(project.getSaveCount())
            .shareCount(project.getShareCount())
            .category(toCategorySummary(project.getCategory()))
            .author(toAuthorSummary(project.getOwner()))
            .tags(deserializeList(project.getTags()))
            .createdAt(project.getCreatedAt())
            .updatedAt(project.getUpdatedAt())
            .build();
    }

    private SavedItemResponse toSavedPost(Save save, Post post) {
        List<SavedItemResponse.MediaSummary> media = buildPostMedia(post);
        MediaPreview preview = media.isEmpty()
            ? MediaPreview.empty()
            : new MediaPreview(media.get(0).getUrl(), media.get(0).getMediaType());

        return baseBuilder(save)
            .contentType(ContentType.POST)
            .contentId(post.getId())
            .title(null)
            .excerpt(truncate(post.getContent(), 240))
            .previewMediaUrl(preview.url)
            .previewMediaType(preview.mediaType)
            .media(media)
            .postType(post.getPostType())
            .likeCount(post.getLikeCount())
            .commentCount(post.getCommentCount())
            .saveCount(post.getSaveCount())
            .shareCount(post.getShareCount())
            .category(toCategorySummary(post.getCategory()))
            .author(toAuthorSummary(post.getAuthor()))
            .tags(deserializeList(post.getTags()))
            .createdAt(post.getCreatedAt())
            .updatedAt(post.getUpdatedAt())
            .build();
    }

    private SavedItemResponse toSavedBlog(Save save, Blog blog) {
        List<SavedItemResponse.MediaSummary> media = buildBlogMedia(blog);
        MediaPreview preview = media.isEmpty()
            ? MediaPreview.empty()
            : new MediaPreview(media.get(0).getUrl(), media.get(0).getMediaType());

        return baseBuilder(save)
            .contentType(ContentType.BLOG)
            .contentId(blog.getId())
            .title(blog.getTitle())
            .excerpt(truncate(blog.getContent(), 220))
            .previewMediaUrl(preview.url)
            .previewMediaType(preview.mediaType)
            .media(media)
            .likeCount(blog.getLikeCount())
            .commentCount(blog.getCommentCount())
            .saveCount(blog.getSaveCount())
            .shareCount(blog.getShareCount())
            .category(toCategorySummary(blog.getCategory()))
            .author(toAuthorSummary(blog.getAuthor()))
            .tags(deserializeList(blog.getTags()))
            .createdAt(blog.getCreatedAt())
            .updatedAt(blog.getUpdatedAt())
            .build();
    }

    private SavedItemResponse.SavedItemResponseBuilder baseBuilder(Save save) {
        return SavedItemResponse.builder()
            .saveId(save.getId())
            .savedAt(save.getCreatedAt());
    }

    private boolean canView(Project project, UserPrincipal principal) {
        boolean isOwner = principal != null && project.getOwner().getId().equals(principal.getId());
        if (isOwner) {
            return true;
        }
        return project.getVisibility() == Visibility.PUBLIC && project.isActive();
    }

    private boolean canView(Post post, UserPrincipal principal) {
        boolean isOwner = principal != null && post.getAuthor().getId().equals(principal.getId());
        if (isOwner) {
            return true;
        }
        return post.getVisibility() == Visibility.PUBLIC && post.isActive();
    }

    private boolean canView(Blog blog, UserPrincipal principal) {
        boolean isOwner = principal != null && blog.getAuthor().getId().equals(principal.getId());
        if (isOwner) {
            return true;
        }
        return blog.getVisibility() == Visibility.PUBLIC && blog.isActive();
    }

    private SavedItemResponse.CategorySummary toCategorySummary(Category category) {
        if (category == null) {
            return null;
        }
        return SavedItemResponse.CategorySummary.builder()
            .id(category.getId())
            .name(category.getName())
            .build();
    }

    private SavedItemResponse.AuthorSummary toAuthorSummary(User user) {
        return SavedItemResponse.AuthorSummary.builder()
            .id(user.getId())
            .username(user.getUsername())
            .fullName(user.getProfile() != null ? user.getProfile().getFullName() : null)
            .profileImage(user.getProfile() != null ? user.getProfile().getProfileImage() : null)
            .build();
    }

    private List<SavedItemResponse.MediaSummary> buildProjectMedia(Project project) {
        List<SavedItemResponse.MediaSummary> items = new ArrayList<>();
        if (project.getThumbnail() != null && !project.getThumbnail().isBlank()) {
            items.add(SavedItemResponse.MediaSummary.builder()
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
                SavedItemResponse.MediaSummary.builder()
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

    private List<SavedItemResponse.MediaSummary> buildPostMedia(Post post) {
        List<SavedItemResponse.MediaSummary> items = new ArrayList<>();
        postMediaRepository.findByPostIdOrderBySortOrderAscIdAsc(post.getId()).forEach(media ->
            addMediaIfAbsent(
                items,
                SavedItemResponse.MediaSummary.builder()
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

    private List<SavedItemResponse.MediaSummary> buildBlogMedia(Blog blog) {
        List<SavedItemResponse.MediaSummary> items = new ArrayList<>();
        if (blog.getCoverImage() != null && !blog.getCoverImage().isBlank()) {
            items.add(SavedItemResponse.MediaSummary.builder()
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
                SavedItemResponse.MediaSummary.builder()
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

    private void addMediaIfAbsent(List<SavedItemResponse.MediaSummary> items, SavedItemResponse.MediaSummary candidate) {
        boolean exists = items.stream().anyMatch(item -> item.getUrl().equals(candidate.getUrl()));
        if (!exists) {
            items.add(candidate);
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
