package com.vtechai.vcollab.post.dto;

import com.vtechai.vcollab.enums.MediaType;
import lombok.Data;

@Data
public class PostMediaDto {
    private String url;
    private MediaType mediaType;
    private int sortOrder;
}
