package com.vtechai.vcollab.cms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CmsBlockRequest {
    @NotBlank
    @Size(max = 100)
    private String sectionKey;

    @NotBlank
    @Size(max = 200)
    private String title;

    @Size(max = 400)
    private String subtitle;

    @NotBlank
    private String body;

    @Size(max = 120)
    private String badge;

    @Size(max = 120)
    private String ctaLabel;

    @Size(max = 400)
    private String ctaUrl;

    @Size(max = 60)
    private String themeTone;

    @NotNull
    private Integer displayOrder;

    @NotNull
    private Boolean active;

    @NotNull
    private Boolean publicVisible;
}
