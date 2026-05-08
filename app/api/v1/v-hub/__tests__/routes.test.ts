import { describe, expect, it } from "vitest";
import { POST as createThreadPost } from "../threads/route";

describe("vhub route behavior", () => {
  it("rejects invalid thread creation before Supabase work", async () => {
    const response = await createThreadPost(
      new Request("http://localhost/api/v1/v-hub/threads", {
        method: "POST",
        body: JSON.stringify({ title: "", body: "", threadType: "HELP" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });
});
