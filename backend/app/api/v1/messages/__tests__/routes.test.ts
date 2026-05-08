import { describe, expect, it } from "vitest";
import { POST as sendPost } from "../route";

describe("message route behavior", () => {
  it("returns 401 for send without a bearer token after validation", async () => {
    const response = await sendPost(
      new Request("http://localhost/api/v1/messages", {
        method: "POST",
        body: JSON.stringify({
          conversationId: 1,
          content: "Hello",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });
});
