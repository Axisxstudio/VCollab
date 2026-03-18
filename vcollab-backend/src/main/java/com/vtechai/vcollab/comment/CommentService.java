package com.vtechai.vcollab.comment;

import com.vtechai.vcollab.comment.dto.CommentRequest;
import com.vtechai.vcollab.comment.dto.CommentResponse;
import com.vtechai.vcollab.comment.dto.CommentUpdateRequest;
import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.security.UserPrincipal;
import java.util.List;

public interface CommentService {
    List<CommentResponse> listByContent(ContentType contentType, Long contentId);
    CommentResponse create(CommentRequest request, UserPrincipal principal);
    CommentResponse update(Long id, CommentUpdateRequest request, UserPrincipal principal);
    void delete(Long id, UserPrincipal principal);
}
