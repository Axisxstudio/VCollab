package com.vtechai.vcollab.projectrequest.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProjectRequestCreate {
    @NotNull
    private Long projectId;

    private String message;
}
