package com.vtechai.vcollab.targeting;

import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.targeting.entity.ContentTargeting;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ContentTargetingRepository extends JpaRepository<ContentTargeting, Long> {
    Optional<ContentTargeting> findByContentIdAndContentType(Long contentId, ContentType contentType);
    void deleteByContentIdAndContentType(Long contentId, ContentType contentType);

    @Query("SELECT c FROM ContentTargeting c WHERE " +
           "(c.grade IS NOT NULL AND c.grade = :grade) OR " +
           "(c.academicYear IS NOT NULL AND c.academicYear = :academicYear) OR " +
           "(c.faculty IS NOT NULL AND c.faculty = :faculty) OR " +
           "(c.institutionName IS NOT NULL AND c.institutionName = :institutionName)")
    List<ContentTargeting> findMatchingTargeting(
            @Param("grade") String grade,
            @Param("academicYear") String academicYear,
            @Param("faculty") String faculty,
            @Param("institutionName") String institutionName
    );
}
