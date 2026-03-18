package com.vtechai.vcollab.media.dto;

import com.vtechai.vcollab.enums.MediaType;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MediaUploadResponse {
    private String url;
    private String fileName;
    private long size;
    private MediaType mediaType;
}
