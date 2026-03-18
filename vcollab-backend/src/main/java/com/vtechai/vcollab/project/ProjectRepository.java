package com.vtechai.vcollab.project;

import com.vtechai.vcollab.enums.Visibility;
import com.vtechai.vcollab.project.entity.Project;
import com.vtechai.vcollab.user.entity.User;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    @Query("""
        select p from Project p
        left join p.category category
        left join p.owner owner
        left join owner.profile profile
        where p.deletedAt is null
          and p.visibility = com.vtechai.vcollab.enums.Visibility.PUBLIC
          and (
            :search is null
            or lower(p.title) like lower(concat('%', :search, '%'))
            or lower(coalesce(p.shortDesc, '')) like lower(concat('%', :search, '%'))
            or lower(coalesce(p.fullDesc, '')) like lower(concat('%', :search, '%'))
            or lower(owner.username) like lower(concat('%', :search, '%'))
            or lower(coalesce(profile.fullName, '')) like lower(concat('%', :search, '%'))
          )
          and (:categoryId is null or category.id = :categoryId)
          and (:tag is null or lower(coalesce(p.tags, '')) like lower(concat('%', :tag, '%')))
          and (
            :ownerFilter is null
            or lower(owner.username) like lower(concat('%', :ownerFilter, '%'))
            or lower(coalesce(profile.fullName, '')) like lower(concat('%', :ownerFilter, '%'))
          )
          and (:fromDate is null or p.createdAt >= :fromDate)
          and (:toDate is null or p.createdAt <= :toDate)
        """)
    Page<Project> searchPublic(
        @Param("search") String search,
        @Param("categoryId") Long categoryId,
        @Param("tag") String tag,
        @Param("ownerFilter") String ownerFilter,
        @Param("fromDate") Instant fromDate,
        @Param("toDate") Instant toDate,
        Pageable pageable
    );

    @Query("""
        select p from Project p
        left join p.category category
        left join p.owner owner
        left join owner.profile profile
        where (
            (:deleted = true and p.deletedAt is not null)
            or (:deleted = false and p.deletedAt is null)
        )
          and (
            :search is null
            or lower(p.title) like lower(concat('%', :search, '%'))
            or lower(coalesce(p.shortDesc, '')) like lower(concat('%', :search, '%'))
            or lower(coalesce(p.fullDesc, '')) like lower(concat('%', :search, '%'))
            or lower(owner.username) like lower(concat('%', :search, '%'))
            or lower(coalesce(profile.fullName, '')) like lower(concat('%', :search, '%'))
          )
          and (:categoryId is null or category.id = :categoryId)
          and (
            :ownerFilter is null
            or lower(owner.username) like lower(concat('%', :ownerFilter, '%'))
            or lower(coalesce(profile.fullName, '')) like lower(concat('%', :ownerFilter, '%'))
          )
          and (:visibility is null or p.visibility = :visibility)
          and (:active is null or p.active = :active)
        """)
    Page<Project> searchAdmin(
        @Param("search") String search,
        @Param("categoryId") Long categoryId,
        @Param("ownerFilter") String ownerFilter,
        @Param("visibility") Visibility visibility,
        @Param("active") Boolean active,
        @Param("deleted") boolean deleted,
        Pageable pageable
    );

    long countByDeletedAtIsNull();

    Page<Project> findByVisibilityAndActiveTrueAndDeletedAtIsNull(Visibility visibility, Pageable pageable);
    Page<Project> findByOwnerUsernameAndVisibilityAndDeletedAtIsNull(
        String username,
        Visibility visibility,
        Pageable pageable
    );
    List<Project> findByOwnerIdInAndVisibilityAndActiveTrueAndDeletedAtIsNull(
        List<Long> ownerIds,
        Visibility visibility,
        Pageable pageable
    );
    Page<Project> findByOwnerAndDeletedAtIsNull(User owner, Pageable pageable);
    List<Project> findByDeletedAtIsNull();
}
