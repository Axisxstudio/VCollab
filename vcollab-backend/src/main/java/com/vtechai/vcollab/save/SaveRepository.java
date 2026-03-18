package com.vtechai.vcollab.save;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.save.entity.Save;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SaveRepository extends JpaRepository<Save, Long> {
    Optional<Save> findByUserIdAndContentTypeAndContentId(Long userId, ContentType contentType, Long contentId);
    boolean existsByUserIdAndContentTypeAndContentId(Long userId, ContentType contentType, Long contentId);
    List<Save> findByUserIdOrderByCreatedAtDesc(Long userId);
}
