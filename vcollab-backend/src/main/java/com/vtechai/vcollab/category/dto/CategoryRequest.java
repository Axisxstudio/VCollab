package com.vtechai.vcollab.category.dto;

import com.vtechai.vcollab.enums.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CategoryRequest {
    @NotBlank
    private String name;

    @NotNull
    private CategoryType type;
}
