package com.vtechai.vcollab.category;

import com.vtechai.vcollab.category.entity.Category;
import com.vtechai.vcollab.enums.CategoryType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByNameIgnoreCaseAndType(String name, CategoryType type);
    List<Category> findByActiveTrue();
    List<Category> findByActiveTrueAndTypeIn(List<CategoryType> types);
}
