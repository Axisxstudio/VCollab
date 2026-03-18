package com.vtechai.vcollab.user.dto;

import com.vtechai.vcollab.enums.EducationType;
import com.vtechai.vcollab.enums.Role;
import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PublicProfileResponse {
    private Long id;
    private String username;
    private Role role;
    private String fullName;
    private String bio;
    private String profileImage;
    private String coverImage;
    private String department;
    private String yearOfStudy;
    private String institution;
    private List<String> skills;
    private String githubUrl;
    private String linkedinUrl;
    private String websiteUrl;
    private int followerCount;
    private int followingCount;
    private int projectCount;
    private int postCount;
    private int blogCount;
    private Instant joinedAt;

    // ─── New Profiling Fields (public) ───────────────────────────────────────
    private EducationType educationType;
    private String institutionName;
    private String grade;
    private String academicYear;
    private String semester;
    private String faculty;
}
