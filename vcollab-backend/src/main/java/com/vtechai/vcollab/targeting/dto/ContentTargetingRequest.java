package com.vtechai.vcollab.targeting.dto;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.TargetType;
import lombok.Data;

/**
 * Request payload for setting audience targeting on content.
 */
@Data
public class ContentTargetingRequest {
    private Long contentId;
    private ContentType contentType;
    private TargetType targetType = TargetType.ALL;
    private String grade;
    private String academicYear;
    private String semester;
    private String faculty;
    private String institutionName;
}
