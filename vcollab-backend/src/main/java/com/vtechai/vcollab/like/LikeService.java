package com.vtechai.vcollab.like;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.like.dto.LikeRequest;
import com.vtechai.vcollab.security.UserPrincipal;

public interface LikeService {
    void like(LikeRequest request, UserPrincipal principal);
    void unlike(ContentType contentType, Long contentId, UserPrincipal principal);
    boolean isLiked(ContentType contentType, Long contentId, UserPrincipal principal);
}
