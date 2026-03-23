package com.vtechai.vcollab.comment.dto;

import com.vtechai.vcollab.enums.ContentType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CommentRequest {
    @NotNull
    private ContentType contentType;

    @NotNull
    private Long contentId;

    private String content;

    private String imageUrl;

    private Long parentId;
}
