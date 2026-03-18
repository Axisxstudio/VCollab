package com.vtechai.vcollab.blog;

import com.vtechai.vcollab.blog.entity.BlogMedia;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlogMediaRepository extends JpaRepository<BlogMedia, Long> {
    List<BlogMedia> findByBlogIdOrderBySortOrderAscIdAsc(Long blogId);
    void deleteByBlogId(Long blogId);
}
