import { describe, expect, it } from "vitest";
import { GET } from "../summary/route";

describe("admin dashboard routes", () => {
  it("requires authentication for dashboard summary", async () => {
    const response = await GET(new Request("http://localhost/api/v1/admin/dashboard/summary"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });
});
