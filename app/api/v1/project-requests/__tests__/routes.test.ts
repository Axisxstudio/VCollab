import { describe, expect, it } from "vitest";
import { GET as sentGet } from "../sent/route";

describe("project request route behavior", () => {
  it("returns 401 for sent requests without a bearer token", async () => {
    const response = await sentGet(
      new Request("http://localhost/api/v1/project-requests/sent"),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });
});
