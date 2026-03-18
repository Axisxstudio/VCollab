package com.vtechai.vcollab.comment;

import com.vtechai.vcollab.comment.entity.Comment;
import com.vtechai.vcollab.enums.ContentType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByContentTypeAndContentIdAndDeletedAtIsNullOrderByCreatedAtAsc(
        ContentType contentType,
        Long contentId
    );

    Optional<Comment> findByIdAndDeletedAtIsNull(Long id);
    Page<Comment> findByDeletedAtIsNotNullOrderByDeletedAtDesc(Pageable pageable);
}
