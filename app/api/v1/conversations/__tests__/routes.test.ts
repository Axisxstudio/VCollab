import { describe, expect, it } from "vitest";
import { GET as listGet } from "../route";

describe("conversation route behavior", () => {
  it("returns 401 for list without a bearer token", async () => {
    const response = await listGet(
      new Request("http://localhost/api/v1/conversations"),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });
});
