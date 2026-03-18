package com.vtechai.vcollab.user.dto;

import com.vtechai.vcollab.enums.EducationType;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import com.vtechai.vcollab.enums.Role;
import java.util.List;
import lombok.Data;

@Data
public class ProfileUpdateRequest {
    @Size(max = 255)
    private String fullName;

    private String bio;
    private Role role;
    private String department;
    private String yearOfStudy;
    private String institution;
    private List<String> skills;
    private String githubUrl;
    private String linkedinUrl;
    private String websiteUrl;

    // ─── New Profiling Fields ─────────────────────────────────────────────────
    private LocalDate dob;
    private EducationType educationType;
    private String institutionName;
    private String grade;
    private String academicYear;
    private String semester;
    private String faculty;
}
