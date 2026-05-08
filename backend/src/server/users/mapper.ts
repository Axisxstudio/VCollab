import type {
  ProfileRow,
  PublicProfileResponse,
  UserProfileResponse,
  UserProfileRow,
} from "./types";

function firstProfile(row: UserProfileRow): ProfileRow {
  const profile = Array.isArray(row.user_profiles)
    ? row.user_profiles[0]
    : row.user_profiles;

  return (
    profile ?? {
      full_name: row.username,
      bio: null,
      profile_image: null,
      cover_image: null,
      department: null,
      year_of_study: null,
      institution: null,
      skills: null,
      github_url: null,
      linkedin_url: null,
      website_url: null,
      follower_count: 0,
      following_count: 0,
      project_count: 0,
      post_count: 0,
      blog_count: 0,
      dob: null,
      education_type: null,
      institution_name: null,
      grade: null,
      academic_year: null,
      semester: null,
      faculty: null,
    }
  );
}

export function parseSkills(rawSkills: string | null): string[] {
  if (!rawSkills?.trim()) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(rawSkills);
    return Array.isArray(parsed)
      ? parsed.filter((skill): skill is string => typeof skill === "string")
      : [];
  } catch {
    return [];
  }
}

export function mapPublicProfile(row: UserProfileRow): PublicProfileResponse {
  const profile = firstProfile(row);

  return {
    id: row.id,
    username: row.username,
    role: row.role,
    fullName: profile.full_name,
    bio: profile.bio,
    profileImage: profile.profile_image,
    coverImage: profile.cover_image,
    department: profile.department,
    yearOfStudy: profile.year_of_study,
    institution: profile.institution,
    skills: parseSkills(profile.skills),
    githubUrl: profile.github_url,
    linkedinUrl: profile.linkedin_url,
    websiteUrl: profile.website_url,
    followerCount: profile.follower_count,
    followingCount: profile.following_count,
    projectCount: profile.project_count,
    postCount: profile.post_count,
    blogCount: profile.blog_count,
    joinedAt: row.created_at,
    educationType: profile.education_type,
    institutionName: profile.institution_name,
    grade: profile.grade,
    academicYear: profile.academic_year,
    semester: profile.semester,
    faculty: profile.faculty,
  };
}

export function mapMyProfile(row: UserProfileRow): UserProfileResponse {
  const profile = firstProfile(row);

  return {
    ...mapPublicProfile(row),
    email: row.email,
    dob: profile.dob,
  };
}
