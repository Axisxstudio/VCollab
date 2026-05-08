import { describe, expect, it } from "vitest";
import { mapProjectRequest } from "../mapper";
import type { ProjectRequestRow } from "../types";

describe("mapProjectRequest", () => {
  it("matches the Spring response shape", () => {
    const row: ProjectRequestRow = {
      id: 3,
      status: "PENDING",
      message: "Can I join?",
      created_at: "2026-05-07T00:00:00.000Z",
      updated_at: null,
      responded_at: null,
      projects: {
        id: 9,
        title: "AI Tutor",
        thumbnail: "/uploads/project/a.png",
        slug: "ai-tutor",
      },
      requester: {
        id: 1,
        username: "student",
        user_profiles: {
          full_name: "Student User",
          profile_image: null,
        },
      },
      owner: {
        id: 2,
        username: "owner",
        user_profiles: {
          full_name: "Owner User",
          profile_image: "/uploads/profile/o.png",
        },
      },
    };

    expect(mapProjectRequest(row)).toEqual({
      id: 3,
      status: "PENDING",
      message: "Can I join?",
      project: {
        id: 9,
        title: "AI Tutor",
        thumbnail: "/uploads/project/a.png",
        slug: "ai-tutor",
      },
      requester: {
        id: 1,
        username: "student",
        fullName: "Student User",
        profileImage: null,
      },
      owner: {
        id: 2,
        username: "owner",
        fullName: "Owner User",
        profileImage: "/uploads/profile/o.png",
      },
      createdAt: "2026-05-07T00:00:00.000Z",
      updatedAt: null,
      respondedAt: null,
    });
  });
});
