package com.vtechai.vcollab.category;

import com.vtechai.vcollab.category.dto.CategoryRequest;
import com.vtechai.vcollab.category.dto.CategoryResponse;
import com.vtechai.vcollab.category.entity.Category;
import com.vtechai.vcollab.enums.CategoryType;
import com.vtechai.vcollab.exception.DuplicateResourceException;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.UserRepository;
import com.vtechai.vcollab.user.entity.User;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Override
    public List<CategoryResponse> listCategories(CategoryType type) {
        List<Category> categories;
        if (type == null) {
            categories = categoryRepository.findByActiveTrue();
        } else {
            categories = categoryRepository.findByActiveTrueAndTypeIn(List.of(type, CategoryType.ALL));
        }
        return categories.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public CategoryResponse createCategory(CategoryRequest request, UserPrincipal principal) {
        if (categoryRepository.existsByNameIgnoreCaseAndType(request.getName(), request.getType())) {
            throw new DuplicateResourceException("Category already exists");
        }
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Category category = Category.builder()
            .name(request.getName())
            .slug(generateSlug(request.getName()))
            .type(request.getType())
            .systemDefault(false)
            .active(true)
            .createdBy(user)
            .build();

        Category saved = categoryRepository.save(category);
        return toResponse(saved);
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        if (!category.getName().equalsIgnoreCase(request.getName())
            && categoryRepository.existsByNameIgnoreCaseAndType(request.getName(), request.getType())) {
            throw new DuplicateResourceException("Category already exists");
        }

        category.setName(request.getName());
        category.setSlug(generateSlug(request.getName()));
        category.setType(request.getType());
        Category saved = categoryRepository.save(category);
        return toResponse(saved);
    }

    @Override
    public CategoryResponse toggleCategory(Long id, boolean active) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        category.setActive(active);
        Category saved = categoryRepository.save(category);
        return toResponse(saved);
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

    private String generateSlug(String name) {
        String slug = name.toLowerCase(Locale.ROOT).trim();
        slug = slug.replaceAll("[^a-z0-9\\s-]", "");
        slug = slug.replaceAll("\\s+", "-");
        return slug;
    }
}
