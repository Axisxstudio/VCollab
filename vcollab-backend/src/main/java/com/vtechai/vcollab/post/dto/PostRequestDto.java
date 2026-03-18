package com.vtechai.vcollab.post.dto;

import com.vtechai.vcollab.enums.PostType;
import com.vtechai.vcollab.enums.Visibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class PostRequestDto {
    @NotBlank
    private String content;

    private Long categoryId;

    private List<String> tags;

    private List<PostMediaDto> media;

    @NotNull
    private PostType postType;

    @NotNull
    private Visibility visibility;

    private boolean active = true;
}
