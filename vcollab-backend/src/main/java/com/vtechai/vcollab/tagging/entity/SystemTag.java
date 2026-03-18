package com.vtechai.vcollab.tagging.entity;

import com.vtechai.vcollab.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * System-generated or user-created tags that can be used as @mentions.
 * System tags are auto-generated from user profile metadata.
 * Examples: @school_Grade10, @1styear_1stsem, @SLIIT
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "system_tags")
public class SystemTag extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The @handle (without the @), e.g. "1styear_1stsem", "school_Grade10", "SLIIT" */
    @Column(name = "tag_name", unique = true, nullable = false)
    private String tagName;

    /** USER (for @username) or SYSTEM (for auto-generated audience tags) */
    @Column(name = "tag_type", nullable = false)
    private String tagType;

    /** Human-readable label shown in suggestions */
    @Column(name = "label")
    private String label;

    /**
     * Serialized attribute mapping for personalization engine.
     * E.g. "education_type=UNIVERSITY&year=1&semester=1"
     */
    @Column(name = "mapped_attribute", columnDefinition = "TEXT")
    private String mappedAttribute;

    /** Optional: Category icon name (for frontend rendering) */
    @Column(name = "icon")
    private String icon;
}
