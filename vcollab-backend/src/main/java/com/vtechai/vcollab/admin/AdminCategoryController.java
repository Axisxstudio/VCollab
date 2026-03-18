package com.vtechai.vcollab.admin;

import com.vtechai.vcollab.category.CategoryRepository;
import com.vtechai.vcollab.category.dto.CategoryResponse;
import com.vtechai.vcollab.category.entity.Category;
import com.vtechai.vcollab.common.ApiResponse;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {
    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> listAll() {
        List<CategoryResponse> categories = categoryRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok("All categories", categories));
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
            .id(category.getId())
            .name(category.getName())
            .slug(category.getSlug())
            .type(category.getType())
            .systemDefault(category.isSystemDefault())
            .active(category.isActive())
            .build();
    }
}
