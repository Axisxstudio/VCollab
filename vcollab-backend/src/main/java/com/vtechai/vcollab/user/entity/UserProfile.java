package com.vtechai.vcollab.user.entity;

import com.vtechai.vcollab.common.BaseEntity;
import com.vtechai.vcollab.enums.EducationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
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
@Table(name = "user_profiles")
public class UserProfile extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "profile_image")
    private String profileImage;

    @Column(name = "cover_image")
    private String coverImage;

    @Column(name = "department")
    private String department;

    @Column(name = "year_of_study")
    private String yearOfStudy;

    @Column(name = "institution")
    private String institution;

    @Column(name = "skills", columnDefinition = "TEXT")
    private String skills;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "website_url")
    private String websiteUrl;

    @Builder.Default
    @Column(name = "follower_count", nullable = false)
    private int followerCount = 0;

    @Builder.Default
    @Column(name = "following_count", nullable = false)
    private int followingCount = 0;

    @Builder.Default
    @Column(name = "project_count", nullable = false)
    private int projectCount = 0;

    @Builder.Default
    @Column(name = "post_count", nullable = false)
    private int postCount = 0;

    @Builder.Default
    @Column(name = "blog_count", nullable = false)
    private int blogCount = 0;

    // ─── New Profiling Fields ─────────────────────────────────────────────────

    @Column(name = "dob")
    private LocalDate dob;

    @Enumerated(EnumType.STRING)
    @Column(name = "education_type")
    private EducationType educationType;

    @Column(name = "institution_name")
    private String institutionName;

    /** School: Grade 1–10, OL, AL */
    @Column(name = "grade")
    private String grade;

    /** University: Year 1–4 */
    @Column(name = "academic_year")
    private String academicYear;

    /** University: Semester 1–2 */
    @Column(name = "semester")
    private String semester;

    /** University: Faculty / Department */
    @Column(name = "faculty")
    private String faculty;

    @Builder.Default
    @Column(name = "is_private", nullable = false)
    private boolean isPrivate = false;

    @Builder.Default
    @Column(name = "open_messaging", nullable = false)
    private boolean openMessaging = false;
}
