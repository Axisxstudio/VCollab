package com.vtechai.vcollab.category;

import com.vtechai.vcollab.category.dto.CategoryRequest;
import com.vtechai.vcollab.category.dto.CategoryResponse;
import com.vtechai.vcollab.enums.CategoryType;
import com.vtechai.vcollab.security.UserPrincipal;
import java.util.List;

public interface CategoryService {
    List<CategoryResponse> listCategories(CategoryType type);
    CategoryResponse createCategory(CategoryRequest request, UserPrincipal principal);
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    CategoryResponse toggleCategory(Long id, boolean active);
}
