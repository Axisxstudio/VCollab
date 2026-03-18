package com.vtechai.vcollab.tagging;

import com.vtechai.vcollab.tagging.entity.SystemTag;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemTagRepository extends JpaRepository<SystemTag, Long> {

    @Query("SELECT t FROM SystemTag t WHERE LOWER(t.tagName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(t.label) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY t.tagName ASC")
    List<SystemTag> searchByNameOrLabel(@Param("q") String q);
}
