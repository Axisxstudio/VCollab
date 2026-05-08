import { describe, expect, it } from "vitest";
import { mapMyProfile, mapPublicProfile, parseSkills } from "../mapper";
import type { UserProfileRow } from "../types";

const row: UserProfileRow = {
  id: 11,
  username: "student",
  email: "student@example.com",
  role: "STUDENT",
  created_at: "2026-05-07T00:00:00.000Z",
  is_active: true,
  is_suspended: false,
  user_profiles: {
    full_name: "Student User",
    bio: "Builder",
    profile_image: "/uploads/profile/a.png",
    cover_image: "/uploads/cover/b.png",
    department: "Computing",
    year_of_study: "2nd Year",
    institution: "SLIIT",
    skills: "[\"React\",\"Spring\"]",
    github_url: "https://github.com/student",
    linkedin_url: null,
    website_url: null,
    follower_count: 2,
    following_count: 3,
    project_count: 4,
    post_count: 5,
    blog_count: 6,
    dob: "2000-01-01",
    education_type: "UNIVERSITY",
    institution_name: "SLIIT",
    grade: null,
    academic_year: "2nd Year",
    semester: "1st Semester",
    faculty: "Computing",
  },
};

describe("profile mapper", () => {
  it("parses serialized Spring skills safely", () => {
    expect(parseSkills("[\"A\",\"B\"]")).toEqual(["A", "B"]);
    expect(parseSkills("not json")).toEqual([]);
  });

  it("maps public profile without email or dob", () => {
    const profile = mapPublicProfile(row);

    expect(profile).toMatchObject({
      id: 11,
      username: "student",
      fullName: "Student User",
      skills: ["React", "Spring"],
      educationType: "UNIVERSITY",
    });
    expect("email" in profile).toBe(false);
    expect("dob" in profile).toBe(false);
  });

  it("maps my profile with private fields", () => {
    expect(mapMyProfile(row)).toMatchObject({
      email: "student@example.com",
      dob: "2000-01-01",
    });
  });
});
