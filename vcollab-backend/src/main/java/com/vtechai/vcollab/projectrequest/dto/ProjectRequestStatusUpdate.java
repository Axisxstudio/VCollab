package com.vtechai.vcollab.projectrequest.dto;

import com.vtechai.vcollab.enums.ProjectRequestStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProjectRequestStatusUpdate {
    @NotNull
    private ProjectRequestStatus status;
}
