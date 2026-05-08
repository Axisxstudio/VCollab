import { describe, expect, it } from "vitest";
import { GET as getMyProfile } from "../me/profile/route";

describe("user route behavior", () => {
  it("returns 401 for my profile without a bearer token", async () => {
    const response = await getMyProfile(
      new Request("http://localhost/api/v1/users/me/profile"),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });
});
