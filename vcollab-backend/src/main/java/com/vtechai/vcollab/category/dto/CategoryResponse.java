package com.vtechai.vcollab.category.dto;

import com.vtechai.vcollab.enums.CategoryType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryResponse {
    private Long id;
    private String name;
    private String slug;
    private CategoryType type;
    private boolean systemDefault;
    private boolean active;
}
