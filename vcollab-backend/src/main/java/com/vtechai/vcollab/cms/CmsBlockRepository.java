package com.vtechai.vcollab.cms;

import com.vtechai.vcollab.cms.entity.CmsBlock;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CmsBlockRepository extends JpaRepository<CmsBlock, Long> {
    @Query("""
        select block from CmsBlock block
        where block.deletedAt is null
          and (:sectionKey is null or lower(block.sectionKey) = lower(:sectionKey))
          and (:active is null or block.active = :active)
          and (:publicVisible is null or block.publicVisible = :publicVisible)
          and (
            :search is null
            or lower(block.sectionKey) like lower(concat('%', :search, '%'))
            or lower(block.title) like lower(concat('%', :search, '%'))
            or lower(coalesce(block.subtitle, '')) like lower(concat('%', :search, '%'))
            or lower(coalesce(block.body, '')) like lower(concat('%', :search, '%'))
          )
        """)
    Page<CmsBlock> searchAdmin(
        @Param("sectionKey") String sectionKey,
        @Param("active") Boolean active,
        @Param("publicVisible") Boolean publicVisible,
        @Param("search") String search,
        Pageable pageable
    );

    @Query("""
        select block from CmsBlock block
        where block.deletedAt is null
          and block.active = true
          and block.publicVisible = true
          and (:sectionKey is null or lower(block.sectionKey) = lower(:sectionKey))
        order by block.displayOrder asc, block.createdAt asc
        """)
    List<CmsBlock> listPublic(@Param("sectionKey") String sectionKey);
}
