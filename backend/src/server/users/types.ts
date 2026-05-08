import type { Role } from "@/server/auth/types";

export type EducationType = "SCHOOL" | "UNIVERSITY";

export type ProfileRow = {
  full_name: string;
  bio: string | null;
  profile_image: string | null;
  cover_image: string | null;
  department: string | null;
  year_of_study: string | null;
  institution: string | null;
  skills: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  follower_count: number;
  following_count: number;
  project_count: number;
  post_count: number;
  blog_count: number;
  dob: string | null;
  education_type: EducationType | null;
  institution_name: string | null;
  grade: string | null;
  academic_year: string | null;
  semester: string | null;
  faculty: string | null;
};

export type UserProfileRow = {
  id: number;
  username: string;
  email: string;
  role: Role;
  created_at: string;
  is_active: boolean;
  is_suspended: boolean;
  user_profiles: ProfileRow | ProfileRow[] | null;
};

export type PublicProfileResponse = {
  id: number;
  username: string;
  role: Role;
  fullName: string;
  bio: string | null;
  profileImage: string | null;
  coverImage: string | null;
  department: string | null;
  yearOfStudy: string | null;
  institution: string | null;
  skills: string[];
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  followerCount: number;
  followingCount: number;
  projectCount: number;
  postCount: number;
  blogCount: number;
  joinedAt: string;
  educationType: EducationType | null;
  institutionName: string | null;
  grade: string | null;
  academicYear: string | null;
  semester: string | null;
  faculty: string | null;
};

export type UserProfileResponse = PublicProfileResponse & {
  email: string;
  dob: string | null;
};
