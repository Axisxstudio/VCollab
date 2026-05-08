import { describe, expect, it } from "vitest";
import { mapUserResponse } from "../mapper";
import type { AppUserRow } from "../types";

describe("mapUserResponse", () => {
  it("matches the Spring auth user response shape", () => {
    const row: AppUserRow = {
      id: 7,
      auth_user_id: "00000000-0000-0000-0000-000000000001",
      email: "student@example.com",
      username: "student",
      role: "STUDENT",
      is_active: true,
      is_suspended: false,
      user_profiles: {
        full_name: "Student User",
        profile_image: "/uploads/profile/avatar.png",
        education_type: "UNIVERSITY",
      },
    };

    expect(mapUserResponse(row)).toEqual({
      id: 7,
      username: "student",
      email: "student@example.com",
      role: "STUDENT",
      fullName: "Student User",
      profileImage: "/uploads/profile/avatar.png",
      educationType: "UNIVERSITY",
    });
  });
});
