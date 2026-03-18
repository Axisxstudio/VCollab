package com.vtechai.vcollab.targeting.entity;

import com.vtechai.vcollab.common.BaseEntity;
import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.enums.TargetType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Stores audience targeting criteria for any piece of content (Post, Blog, Project).
 * content_id + content_type composite uniquely identifies the related content.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "content_targeting")
public class ContentTargeting extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID of the related content (post_id / blog_id / project_id) */
    @Column(name = "content_id", nullable = false)
    private Long contentId;

    /** Discriminator: POST, BLOG, PROJECT */
    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false)
    private ContentType contentType;

    /** Broad targeting scope */
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    private TargetType targetType = TargetType.ALL;

    /** School targeting: e.g. "Grade 10", "OL", "AL" */
    @Column(name = "grade")
    private String grade;

    /** University targeting: e.g. "Year 1" */
    @Column(name = "academic_year")
    private String academicYear;

    /** University targeting: e.g. "Semester 1" */
    @Column(name = "semester")
    private String semester;

    /** University targeting: e.g. "Computer Science" */
    @Column(name = "faculty")
    private String faculty;

    /** Institution-specific targeting: e.g. "SLIIT", "Colombo University" */
    @Column(name = "institution_name")
    private String institutionName;
}
