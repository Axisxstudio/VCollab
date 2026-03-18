package com.vtechai.vcollab.comment;

import com.vtechai.vcollab.comment.dto.CommentRequest;
import com.vtechai.vcollab.comment.dto.CommentResponse;
import com.vtechai.vcollab.comment.dto.CommentUpdateRequest;
import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommentResponse>>> list(
        @RequestParam ContentType contentType,
        @RequestParam Long contentId
    ) {
        List<CommentResponse> comments = commentService.listByContent(contentType, contentId);
        return ResponseEntity.ok(ApiResponse.ok("Comments", comments));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> create(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CommentRequest request
    ) {
        CommentResponse response = commentService.create(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Comment created", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CommentResponse>> update(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CommentUpdateRequest request
    ) {
        CommentResponse response = commentService.update(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Comment updated", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        commentService.delete(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Comment deleted", null));
    }
}
