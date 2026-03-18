package com.vtechai.vcollab.targeting.dto;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.TargetType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContentTargetingResponse {
    private Long id;
    private Long contentId;
    private ContentType contentType;
    private TargetType targetType;
    private String grade;
    private String academicYear;
    private String semester;
    private String faculty;
    private String institutionName;
}
