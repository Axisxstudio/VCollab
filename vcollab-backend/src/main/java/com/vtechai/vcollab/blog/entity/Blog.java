package com.vtechai.vcollab.blog.entity;

import com.vtechai.vcollab.category.entity.Category;
import com.vtechai.vcollab.common.BaseEntity;
import com.vtechai.vcollab.enums.Visibility;
import com.vtechai.vcollab.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "blogs")
public class Blog extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, length = 520)
    private String slug;

    @Column(name = "cover_image")
    private String coverImage;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    @Column(name = "tags", columnDefinition = "TEXT")
    private String tags;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Visibility visibility = Visibility.PUBLIC;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "like_count", nullable = false)
    private int likeCount = 0;

    @Column(name = "comment_count", nullable = false)
    private int commentCount = 0;

    @Column(name = "save_count", nullable = false)
    private int saveCount = 0;

    @Column(name = "share_count", nullable = false)
    private int shareCount = 0;
}
