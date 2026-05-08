import { describe, expect, it } from "vitest";
import { GET } from "../unread-count/route";

describe("notification routes", () => {
  it("requires authentication for unread count", async () => {
    const response = await GET(new Request("http://localhost/api/v1/notifications/unread-count"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });
});
