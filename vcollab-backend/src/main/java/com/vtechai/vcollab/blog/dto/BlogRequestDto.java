package com.vtechai.vcollab.blog.dto;

import com.vtechai.vcollab.enums.Visibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class BlogRequestDto {
    @NotBlank
    private String title;

    private String coverImage;

    @NotBlank
    private String content;

    private Long categoryId;

    private List<String> tags;

    private List<BlogMediaDto> media;

    @NotNull
    private Visibility visibility;

    private boolean active = true;
}
