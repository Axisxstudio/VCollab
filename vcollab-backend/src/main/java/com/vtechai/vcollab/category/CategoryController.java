package com.vtechai.vcollab.category;

import com.vtechai.vcollab.audit.AuditLogService;
import com.vtechai.vcollab.category.dto.CategoryRequest;
import com.vtechai.vcollab.category.dto.CategoryResponse;
import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.CategoryType;
import com.vtechai.vcollab.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CategoryController {
    private final AuditLogService auditLogService;
    private final CategoryService categoryService;

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> listCategories(
        @RequestParam(value = "type", required = false) CategoryType type
    ) {
        List<CategoryResponse> categories = categoryService.listCategories(type);
        return ResponseEntity.ok(ApiResponse.ok("Categories", categories));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CategoryRequest request
    ) {
        CategoryResponse response = categoryService.createCategory(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Category created", response));
    }

    @PatchMapping("/admin/categories/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CategoryRequest request
    ) {
        CategoryResponse response = categoryService.updateCategory(id, request);
        auditLogService.record(
            principal.getId(),
            "CATEGORY",
            "UPDATED",
            "CATEGORY",
            response.getId(),
            "Updated category " + response.getName(),
            "type=" + response.getType()
        );
        return ResponseEntity.ok(ApiResponse.ok("Category updated", response));
    }

    @PatchMapping("/admin/categories/{id}/toggle")
    public ResponseEntity<ApiResponse<CategoryResponse>> toggleCategory(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam boolean active
    ) {
        CategoryResponse response = categoryService.toggleCategory(id, active);
        auditLogService.record(
            principal.getId(),
            "CATEGORY",
            "TOGGLED",
            "CATEGORY",
            response.getId(),
            (active ? "Activated " : "Deactivated ") + "category " + response.getName(),
            null
        );
        return ResponseEntity.ok(ApiResponse.ok("Category toggled", response));
    }
}
