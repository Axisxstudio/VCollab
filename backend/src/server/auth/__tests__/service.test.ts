import { describe, expect, it } from "vitest";
import { bearerTokenFromRequest } from "../service";

describe("bearerTokenFromRequest", () => {
  it("extracts a bearer token", () => {
    const request = new Request("http://localhost/api", {
      headers: {
        authorization: "Bearer token-value",
      },
    });

    expect(bearerTokenFromRequest(request)).toBe("token-value");
  });

  it("throws 401 when the token is missing", () => {
    const request = new Request("http://localhost/api");

    expect(() => bearerTokenFromRequest(request)).toThrow("Not authenticated");
  });
});
