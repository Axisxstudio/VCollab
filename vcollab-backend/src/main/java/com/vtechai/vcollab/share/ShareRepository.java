package com.vtechai.vcollab.share;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.share.entity.Share;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShareRepository extends JpaRepository<Share, Long> {
    Optional<Share> findByUserIdAndContentTypeAndContentId(Long userId, ContentType contentType, Long contentId);
    boolean existsByUserIdAndContentTypeAndContentId(Long userId, ContentType contentType, Long contentId);
}
