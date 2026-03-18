package com.vtechai.vcollab.project.dto;

import com.vtechai.vcollab.enums.MediaType;
import lombok.Data;

@Data
public class ProjectMediaDto {
    private String url;
    private MediaType mediaType;
    private String fileName;
    private Long fileSize;
    private int sortOrder;
}
