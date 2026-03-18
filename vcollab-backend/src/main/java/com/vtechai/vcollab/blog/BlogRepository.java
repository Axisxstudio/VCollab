package com.vtechai.vcollab.blog;

import com.vtechai.vcollab.blog.entity.Blog;
import com.vtechai.vcollab.enums.Visibility;
import com.vtechai.vcollab.user.entity.User;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BlogRepository extends JpaRepository<Blog, Long> {
    @Query("""
        select b from Blog b
        left join b.category category
        left join b.author author
        left join author.profile profile
        where b.deletedAt is null
          and b.visibility = com.vtechai.vcollab.enums.Visibility.PUBLIC
          and (
            :search is null
            or lower(b.title) like lower(concat('%', :search, '%'))
            or lower(coalesce(b.content, '')) like lower(concat('%', :search, '%'))
            or lower(author.username) like lower(concat('%', :search, '%'))
            or lower(coalesce(profile.fullName, '')) like lower(concat('%', :search, '%'))
          )
          and (:categoryId is null or category.id = :categoryId)
          and (:tag is null or lower(coalesce(b.tags, '')) like lower(concat('%', :tag, '%')))
          and (
            :ownerFilter is null
            or lower(author.username) like lower(concat('%', :ownerFilter, '%'))
            or lower(coalesce(profile.fullName, '')) like lower(concat('%', :ownerFilter, '%'))
          )
          and (:fromDate is null or b.createdAt >= :fromDate)
          and (:toDate is null or b.createdAt <= :toDate)
        """)
    Page<Blog> searchPublic(
        @Param("search") String search,
        @Param("categoryId") Long categoryId,
        @Param("tag") String tag,
        @Param("ownerFilter") String ownerFilter,
        @Param("fromDate") Instant fromDate,
        @Param("toDate") Instant toDate,
        Pageable pageable
    );

    @Query("""
        select b from Blog b
        left join b.category category
        left join b.author author
        left join author.profile profile
        where (
            (:deleted = true and b.deletedAt is not null)
            or (:deleted = false and b.deletedAt is null)
        )
          and (
            :search is null
            or lower(b.title) like lower(concat('%', :search, '%'))
            or lower(coalesce(b.content, '')) like lower(concat('%', :search, '%'))
            or lower(author.username) like lower(concat('%', :search, '%'))
            or lower(coalesce(profile.fullName, '')) like lower(concat('%', :search, '%'))
          )
          and (:categoryId is null or category.id = :categoryId)
          and (
            :ownerFilter is null
            or lower(author.username) like lower(concat('%', :ownerFilter, '%'))
            or lower(coalesce(profile.fullName, '')) like lower(concat('%', :ownerFilter, '%'))
          )
          and (:visibility is null or b.visibility = :visibility)
          and (:active is null or b.active = :active)
        """)
    Page<Blog> searchAdmin(
        @Param("search") String search,
        @Param("categoryId") Long categoryId,
        @Param("ownerFilter") String ownerFilter,
        @Param("visibility") Visibility visibility,
        @Param("active") Boolean active,
        @Param("deleted") boolean deleted,
        Pageable pageable
    );

    long countByDeletedAtIsNull();

    Page<Blog> findByVisibilityAndActiveTrueAndDeletedAtIsNull(Visibility visibility, Pageable pageable);
    Page<Blog> findByAuthorUsernameAndVisibilityAndDeletedAtIsNull(
        String username,
        Visibility visibility,
        Pageable pageable
    );
    Page<Blog> findByAuthorAndDeletedAtIsNull(User author, Pageable pageable);
    List<Blog> findByAuthorIdInAndVisibilityAndActiveTrueAndDeletedAtIsNull(
        List<Long> authorIds,
        Visibility visibility,
        Pageable pageable
    );
}
