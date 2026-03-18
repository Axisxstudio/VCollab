package com.vtechai.vcollab.search;

import com.vtechai.vcollab.blog.BlogService;
import com.vtechai.vcollab.blog.dto.BlogResponse;
import com.vtechai.vcollab.enums.DiscoverySort;
import com.vtechai.vcollab.post.PostService;
import com.vtechai.vcollab.post.dto.PostResponse;
import com.vtechai.vcollab.project.ProjectService;
import com.vtechai.vcollab.project.dto.ProjectResponse;
import com.vtechai.vcollab.search.dto.SearchResponse;
import com.vtechai.vcollab.user.UserService;
import com.vtechai.vcollab.user.dto.PublicProfileResponse;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SearchServiceImpl implements SearchService {
    private static final int DEFAULT_SIZE = 4;
    private static final int MAX_SIZE = 8;

    private final UserService userService;
    private final ProjectService projectService;
    private final PostService postService;
    private final BlogService blogService;

    @Override
    public SearchResponse search(String query, int size) {
        String normalizedQuery = trimToNull(query);
        int normalizedSize = normalizeSize(size);

        if (normalizedQuery == null) {
            return emptyResponse(normalizedSize);
        }

        Page<PublicProfileResponse> users = userService.searchPublicProfiles(
            normalizedQuery,
            null,
            PageRequest.of(0, normalizedSize, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        Page<ProjectResponse> projects = projectService.searchPublic(
            normalizedQuery,
            null,
            null,
            null,
            null,
            null,
            DiscoverySort.NEWEST,
            PageRequest.of(0, normalizedSize)
        );
        Page<PostResponse> posts = postService.searchPublic(
            normalizedQuery,
            null,
            null,
            null,
            null,
            null,
            DiscoverySort.NEWEST,
            PageRequest.of(0, normalizedSize)
        );
        Page<BlogResponse> blogs = blogService.searchPublic(
            normalizedQuery,
            null,
            null,
            null,
            null,
            null,
            DiscoverySort.NEWEST,
            PageRequest.of(0, normalizedSize)
        );

        long totalResults = users.getTotalElements()
            + projects.getTotalElements()
            + posts.getTotalElements()
            + blogs.getTotalElements();

        return SearchResponse.builder()
            .query(normalizedQuery)
            .requestedSize(normalizedSize)
            .stats(SearchResponse.SearchStats.builder()
                .totalResults(totalResults)
                .userCount(users.getTotalElements())
                .projectCount(projects.getTotalElements())
                .postCount(posts.getTotalElements())
                .blogCount(blogs.getTotalElements())
                .build())
            .users(users.getContent())
            .projects(projects.getContent())
            .posts(posts.getContent())
            .blogs(blogs.getContent())
            .build();
    }

    private SearchResponse emptyResponse(int requestedSize) {
        return SearchResponse.builder()
            .query("")
            .requestedSize(requestedSize)
            .stats(SearchResponse.SearchStats.builder()
                .totalResults(0)
                .userCount(0)
                .projectCount(0)
                .postCount(0)
                .blogCount(0)
                .build())
            .users(emptyList())
            .projects(emptyList())
            .posts(emptyList())
            .blogs(emptyList())
            .build();
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return DEFAULT_SIZE;
        }
        return Math.min(size, MAX_SIZE);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private <T> List<T> emptyList() {
        return Collections.emptyList();
    }
}
