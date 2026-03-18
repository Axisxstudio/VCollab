package com.vtechai.vcollab.interaction;

import com.vtechai.vcollab.blog.BlogRepository;
import com.vtechai.vcollab.blog.entity.Blog;
import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.post.PostRepository;
import com.vtechai.vcollab.post.entity.Post;
import com.vtechai.vcollab.project.ProjectRepository;
import com.vtechai.vcollab.project.entity.Project;
import com.vtechai.vcollab.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ContentCounterService {
    private final ProjectRepository projectRepository;
    private final PostRepository postRepository;
    private final BlogRepository blogRepository;

    public void assertContentExists(ContentType type, Long id) {
        switch (type) {
            case PROJECT -> getProject(id);
            case POST -> getPost(id);
            case BLOG -> getBlog(id);
            default -> throw new ResourceNotFoundException("Content not found");
        }
    }

    public User getContentOwner(ContentType type, Long id) {
        return switch (type) {
            case PROJECT -> getProject(id).getOwner();
            case POST -> getPost(id).getAuthor();
            case BLOG -> getBlog(id).getAuthor();
            default -> throw new ResourceNotFoundException("Content not found");
        };
    }

    public void updateLikeCount(ContentType type, Long id, int delta) {
        switch (type) {
            case PROJECT -> {
                Project project = getProject(id);
                project.setLikeCount(safeIncrement(project.getLikeCount(), delta));
                projectRepository.save(project);
            }
            case POST -> {
                Post post = getPost(id);
                post.setLikeCount(safeIncrement(post.getLikeCount(), delta));
                postRepository.save(post);
            }
            case BLOG -> {
                Blog blog = getBlog(id);
                blog.setLikeCount(safeIncrement(blog.getLikeCount(), delta));
                blogRepository.save(blog);
            }
            default -> throw new ResourceNotFoundException("Content not found");
        }
    }

    public void updateSaveCount(ContentType type, Long id, int delta) {
        switch (type) {
            case PROJECT -> {
                Project project = getProject(id);
                project.setSaveCount(safeIncrement(project.getSaveCount(), delta));
                projectRepository.save(project);
            }
            case POST -> {
                Post post = getPost(id);
                post.setSaveCount(safeIncrement(post.getSaveCount(), delta));
                postRepository.save(post);
            }
            case BLOG -> {
                Blog blog = getBlog(id);
                blog.setSaveCount(safeIncrement(blog.getSaveCount(), delta));
                blogRepository.save(blog);
            }
            default -> throw new ResourceNotFoundException("Content not found");
        }
    }

    public void updateShareCount(ContentType type, Long id, int delta) {
        switch (type) {
            case PROJECT -> {
                Project project = getProject(id);
                project.setShareCount(safeIncrement(project.getShareCount(), delta));
                projectRepository.save(project);
            }
            case POST -> {
                Post post = getPost(id);
                post.setShareCount(safeIncrement(post.getShareCount(), delta));
                postRepository.save(post);
            }
            case BLOG -> {
                Blog blog = getBlog(id);
                blog.setShareCount(safeIncrement(blog.getShareCount(), delta));
                blogRepository.save(blog);
            }
            default -> throw new ResourceNotFoundException("Content not found");
        }
    }

    public void updateCommentCount(ContentType type, Long id, int delta) {
        switch (type) {
            case PROJECT -> {
                Project project = getProject(id);
                project.setCommentCount(safeIncrement(project.getCommentCount(), delta));
                projectRepository.save(project);
            }
            case POST -> {
                Post post = getPost(id);
                post.setCommentCount(safeIncrement(post.getCommentCount(), delta));
                postRepository.save(post);
            }
            case BLOG -> {
                Blog blog = getBlog(id);
                blog.setCommentCount(safeIncrement(blog.getCommentCount(), delta));
                blogRepository.save(blog);
            }
            default -> throw new ResourceNotFoundException("Content not found");
        }
    }

    private Project getProject(Long id) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (project.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Project not found");
        }
        return project;
    }

    private Post getPost(Long id) {
        Post post = postRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        if (post.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Post not found");
        }
        return post;
    }

    private Blog getBlog(Long id) {
        Blog blog = blogRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));
        if (blog.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Blog not found");
        }
        return blog;
    }

    private int safeIncrement(int current, int delta) {
        int updated = current + delta;
        return Math.max(updated, 0);
    }
}
