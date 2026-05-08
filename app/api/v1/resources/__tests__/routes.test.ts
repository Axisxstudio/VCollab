import { describe, expect, it } from "vitest";
import { GET as myDashboardGet } from "../mine/dashboard/route";

describe("resource route behavior", () => {
  it("returns 401 for my dashboard without a bearer token", async () => {
    const response = await myDashboardGet(new Request("http://localhost/api/v1/resources/mine/dashboard"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });
});
