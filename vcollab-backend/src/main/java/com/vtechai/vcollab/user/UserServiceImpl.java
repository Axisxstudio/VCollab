package com.vtechai.vcollab.user;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vtechai.vcollab.enums.MediaType;
import com.vtechai.vcollab.enums.Role;
import com.vtechai.vcollab.exception.ResourceNotFoundException;
import com.vtechai.vcollab.media.MediaService;
import com.vtechai.vcollab.media.dto.MediaUploadResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import com.vtechai.vcollab.user.dto.ProfileUpdateRequest;
import com.vtechai.vcollab.user.dto.PublicProfileResponse;
import com.vtechai.vcollab.user.dto.UserProfileResponse;
import com.vtechai.vcollab.user.entity.User;
import com.vtechai.vcollab.user.entity.UserProfile;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final MediaService mediaService;
    private final ObjectMapper objectMapper;

    @Override
    public Page<PublicProfileResponse> searchPublicProfiles(String query, Role role, Pageable pageable) {
        return userRepository.searchPublicUsers(normalize(query), role, pageable)
            .map(user -> toPublicProfile(user, snapshotProfile(user)));
    }

    @Override
    public PublicProfileResponse getPublicProfile(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getDeletedAt() != null || !user.isActive() || user.isSuspended()) {
            throw new ResourceNotFoundException("User not found");
        }
        return toPublicProfile(user, snapshotProfile(user));
    }

    @Override
    public UserProfileResponse getMyProfile(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserProfile profile = ensureProfile(user);
        return toMyProfile(user, profile);
    }

    @Override
    public UserProfileResponse updateMyProfile(UserPrincipal principal, ProfileUpdateRequest request) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserProfile profile = ensureProfile(user);

        if (request.getRole() != null) {
            user.setRole(request.getRole());
            userRepository.save(user);
        }
        if (request.getFullName() != null) {
            profile.setFullName(request.getFullName());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }
        if (request.getDepartment() != null) {
            profile.setDepartment(request.getDepartment());
        }
        if (request.getYearOfStudy() != null) {
            profile.setYearOfStudy(request.getYearOfStudy());
        }
        if (request.getInstitution() != null) {
            profile.setInstitution(request.getInstitution());
        }
        if (request.getSkills() != null) {
            profile.setSkills(serializeSkills(request.getSkills()));
        }
        if (request.getGithubUrl() != null) {
            profile.setGithubUrl(request.getGithubUrl());
        }
        if (request.getLinkedinUrl() != null) {
            profile.setLinkedinUrl(request.getLinkedinUrl());
        }
        if (request.getWebsiteUrl() != null) {
            profile.setWebsiteUrl(request.getWebsiteUrl());
        }

        // ─── New Profiling Fields ─────────────────────────────────────────────
        if (request.getDob() != null) {
            profile.setDob(request.getDob());
        }
        if (request.getEducationType() != null) {
            profile.setEducationType(request.getEducationType());
        }
        if (request.getInstitutionName() != null) {
            profile.setInstitutionName(request.getInstitutionName());
        }
        if (request.getGrade() != null) {
            profile.setGrade(request.getGrade());
        }
        if (request.getAcademicYear() != null) {
            profile.setAcademicYear(request.getAcademicYear());
        }
        if (request.getSemester() != null) {
            profile.setSemester(request.getSemester());
        }
        if (request.getFaculty() != null) {
            profile.setFaculty(request.getFaculty());
        }

        userProfileRepository.save(profile);
        return toMyProfile(user, profile);
    }

    @Override
    public UserProfileResponse updateProfileImage(UserPrincipal principal, MultipartFile file) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserProfile profile = ensureProfile(user);

        MediaUploadResponse upload = mediaService.upload(file, "profile", MediaType.IMAGE);
        profile.setProfileImage(upload.getUrl());
        userProfileRepository.save(profile);
        return toMyProfile(user, profile);
    }

    @Override
    public UserProfileResponse updateCoverImage(UserPrincipal principal, MultipartFile file) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserProfile profile = ensureProfile(user);

        MediaUploadResponse upload = mediaService.upload(file, "cover", MediaType.IMAGE);
        profile.setCoverImage(upload.getUrl());
        userProfileRepository.save(profile);
        return toMyProfile(user, profile);
    }

    private UserProfile ensureProfile(User user) {
        if (user.getProfile() != null) {
            return user.getProfile();
        }
        UserProfile profile = UserProfile.builder()
            .user(user)
            .fullName(user.getUsername())
            .build();
        return userProfileRepository.save(profile);
    }

    private UserProfile snapshotProfile(User user) {
        if (user.getProfile() != null) {
            return user.getProfile();
        }
        return UserProfile.builder()
            .fullName(user.getUsername())
            .build();
    }

    private UserProfileResponse toMyProfile(User user, UserProfile profile) {
        return UserProfileResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole())
            .fullName(profile.getFullName())
            .bio(profile.getBio())
            .profileImage(profile.getProfileImage())
            .coverImage(profile.getCoverImage())
            .department(profile.getDepartment())
            .yearOfStudy(profile.getYearOfStudy())
            .institution(profile.getInstitution())
            .skills(deserializeSkills(profile.getSkills()))
            .githubUrl(profile.getGithubUrl())
            .linkedinUrl(profile.getLinkedinUrl())
            .websiteUrl(profile.getWebsiteUrl())
            .followerCount(profile.getFollowerCount())
            .followingCount(profile.getFollowingCount())
            .projectCount(profile.getProjectCount())
            .postCount(profile.getPostCount())
            .blogCount(profile.getBlogCount())
            .joinedAt(user.getCreatedAt())
            // ─── New Profiling Fields ─────────────────────────────────────────
            .dob(profile.getDob())
            .educationType(profile.getEducationType())
            .institutionName(profile.getInstitutionName())
            .grade(profile.getGrade())
            .academicYear(profile.getAcademicYear())
            .semester(profile.getSemester())
            .faculty(profile.getFaculty())
            .build();
    }

    private PublicProfileResponse toPublicProfile(User user, UserProfile profile) {
        return PublicProfileResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .role(user.getRole())
            .fullName(profile.getFullName())
            .bio(profile.getBio())
            .profileImage(profile.getProfileImage())
            .coverImage(profile.getCoverImage())
            .department(profile.getDepartment())
            .yearOfStudy(profile.getYearOfStudy())
            .institution(profile.getInstitution())
            .skills(deserializeSkills(profile.getSkills()))
            .githubUrl(profile.getGithubUrl())
            .linkedinUrl(profile.getLinkedinUrl())
            .websiteUrl(profile.getWebsiteUrl())
            .followerCount(profile.getFollowerCount())
            .followingCount(profile.getFollowingCount())
            .projectCount(profile.getProjectCount())
            .postCount(profile.getPostCount())
            .blogCount(profile.getBlogCount())
            .joinedAt(user.getCreatedAt())
            // ─── New Profiling Fields ─────────────────────────────────────────
            .educationType(profile.getEducationType())
            .institutionName(profile.getInstitutionName())
            .grade(profile.getGrade())
            .academicYear(profile.getAcademicYear())
            .semester(profile.getSemester())
            .faculty(profile.getFaculty())
            .build();
    }

    private String serializeSkills(List<String> skills) {
        if (skills == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(skills);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    private List<String> deserializeSkills(String skills) {
        if (skills == null || skills.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(skills, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException ex) {
            return Collections.emptyList();
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
