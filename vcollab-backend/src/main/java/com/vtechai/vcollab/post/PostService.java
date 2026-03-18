package com.vtechai.vcollab.post;

import com.vtechai.vcollab.enums.DiscoverySort;
import com.vtechai.vcollab.post.dto.PostRequestDto;
import com.vtechai.vcollab.post.dto.PostResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PostService {
    Page<PostResponse> listPublic(Pageable pageable);
    Page<PostResponse> searchPublic(
        String search,
        Long categoryId,
        String tag,
        String owner,
        LocalDate fromDate,
        LocalDate toDate,
        DiscoverySort sort,
        Pageable pageable
    );
    Page<PostResponse> listByUsername(String username, UserPrincipal principal, Pageable pageable);
    PostResponse getById(Long id, UserPrincipal principal);
    PostResponse create(PostRequestDto request, UserPrincipal principal);
    PostResponse update(Long id, PostRequestDto request, UserPrincipal principal);
    void softDelete(Long id, UserPrincipal principal);
}
