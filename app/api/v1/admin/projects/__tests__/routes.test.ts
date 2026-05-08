import { describe, expect, it } from "vitest";
import { GET } from "../route";

describe("admin project routes", () => {
  it("requires authentication for admin listing", async () => {
    const response = await GET(new Request("http://localhost/api/v1/admin/projects"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });
});
