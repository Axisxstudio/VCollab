package com.vtechai.vcollab.project.dto;

import com.vtechai.vcollab.enums.Visibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class ProjectRequestDto {
    @NotBlank
    @Size(max = 500)
    private String title;

    @Size(max = 1000)
    private String shortDesc;

    private String fullDesc;

    private Long categoryId;

    private List<String> tags;

    private List<String> techStack;

    private String githubUrl;

    private String demoUrl;

    private String thumbnail;

    private List<ProjectMediaDto> media;

    @NotNull
    private Visibility visibility;

    private String youtubeUrl;

    private String pdfUrl;

    private String courseUrl;

    private boolean active = true;
}
