import { describe, expect, it } from "vitest";
import { mapLandingProject } from "../mapper";

describe("landing mapper", () => {
  it("maps public project rows to landing project responses", () => {
    const mapped = mapLandingProject({
      id: 3,
      title: "Smart Attendance",
      slug: "smart-attendance",
      short_desc: "RFID attendance",
      full_desc: null,
      thumbnail: null,
      tech_stack: "[\"Next.js\",\"Supabase\"]",
      tags: "iot, attendance",
      github_url: "https://github.com/example/project",
      demo_url: null,
      youtube_url: null,
      pdf_url: null,
      course_url: null,
      visibility: "PUBLIC",
      is_active: true,
      like_count: 2,
      comment_count: 1,
      save_count: 0,
      share_count: 0,
      view_count: 10,
      created_at: "2026-05-07T00:00:00.000Z",
      updated_at: null,
      category: { id: 4, name: "4th Year" },
      owner: {
        id: 9,
        username: "student",
        user_profiles: { full_name: "Student One", profile_image: null, education_type: "UNDERGRADUATE" },
      },
    });

    expect(mapped.techStack).toEqual(["Next.js", "Supabase"]);
    expect(mapped.tags).toEqual(["iot", "attendance"]);
    expect(mapped.hasGithubUrl).toBe(true);
    expect(mapped.owner.fullName).toBe("Student One");
  });
});
