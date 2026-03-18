package com.vtechai.vcollab.cms.entity;

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

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cms_blocks")
public class CmsBlock extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "section_key", nullable = false, length = 100)
    private String sectionKey;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 400)
    private String subtitle;

    @Column(name = "body", columnDefinition = "LONGTEXT", nullable = false)
    private String body;

    @Column(length = 120)
    private String badge;

    @Column(name = "cta_label", length = 120)
    private String ctaLabel;

    @Column(name = "cta_url", length = 400)
    private String ctaUrl;

    @Column(name = "theme_tone", length = 60)
    private String themeTone;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "is_public_visible", nullable = false)
    private boolean publicVisible = true;
}
