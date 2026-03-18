package com.vtechai.vcollab.post;

import com.vtechai.vcollab.post.entity.PostMedia;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostMediaRepository extends JpaRepository<PostMedia, Long> {
    List<PostMedia> findByPostIdOrderBySortOrderAscIdAsc(Long postId);
    void deleteByPostId(Long postId);
}
