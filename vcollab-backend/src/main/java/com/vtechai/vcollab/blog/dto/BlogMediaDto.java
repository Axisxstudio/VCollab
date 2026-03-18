package com.vtechai.vcollab.blog.dto;

import com.vtechai.vcollab.enums.MediaType;
import lombok.Data;

@Data
public class BlogMediaDto {
    private String url;
    private MediaType mediaType;
    private int sortOrder;
}
