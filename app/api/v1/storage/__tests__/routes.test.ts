import { describe, expect, it } from "vitest";
import { POST as signedUrlPost } from "../signed-url/route";

describe("storage signed URL route", () => {
  it("requires authentication after validating payload", async () => {
    const response = await signedUrlPost(
      new Request("http://localhost/api/v1/storage/signed-url", {
        method: "POST",
        body: JSON.stringify({
          bucket: "academic-resources",
          path: "1/file.pdf",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });
});
