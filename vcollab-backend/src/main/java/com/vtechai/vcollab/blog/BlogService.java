package com.vtechai.vcollab.blog;

import com.vtechai.vcollab.blog.dto.BlogRequestDto;
import com.vtechai.vcollab.blog.dto.BlogResponse;
import com.vtechai.vcollab.enums.DiscoverySort;
import com.vtechai.vcollab.security.UserPrincipal;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BlogService {
    Page<BlogResponse> listPublic(Pageable pageable);
    Page<BlogResponse> searchPublic(
        String search,
        Long categoryId,
        String tag,
        String owner,
        LocalDate fromDate,
        LocalDate toDate,
        DiscoverySort sort,
        Pageable pageable
    );
    Page<BlogResponse> listByUsername(String username, UserPrincipal principal, Pageable pageable);
    BlogResponse getById(Long id, UserPrincipal principal);
    BlogResponse create(BlogRequestDto request, UserPrincipal principal);
    BlogResponse update(Long id, BlogRequestDto request, UserPrincipal principal);
    void softDelete(Long id, UserPrincipal principal);
}
