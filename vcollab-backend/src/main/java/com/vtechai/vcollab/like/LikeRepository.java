package com.vtechai.vcollab.like;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.like.entity.Like;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findByUserIdAndContentTypeAndContentId(Long userId, ContentType contentType, Long contentId);
    boolean existsByUserIdAndContentTypeAndContentId(Long userId, ContentType contentType, Long contentId);
}
