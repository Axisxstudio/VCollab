import { describe, expect, it } from "vitest";
import { POST as registerPost } from "../register/route";
import { GET as meGet } from "../me/route";

describe("auth route behavior", () => {
  it("rejects super admin self registration before calling Supabase", async () => {
    const response = await registerPost(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Admin User",
          username: "admin",
          email: "admin@example.com",
          password: "secret123",
          role: "SUPER_ADMIN",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 401 for /me without a bearer token", async () => {
    const response = await meGet(
      new Request("http://localhost/api/v1/auth/me"),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });
});
