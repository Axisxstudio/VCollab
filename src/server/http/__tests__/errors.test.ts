import { describe, expect, it } from "vitest";
import { forbidden, HttpError, unauthorized } from "../errors";

describe("http errors", () => {
  it("creates unauthorized errors with Spring-compatible status", () => {
    const error = unauthorized();

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(401);
    expect(error.message).toBe("Not authenticated");
  });

  it("creates forbidden errors with status 403", () => {
    const error = forbidden("Nope");

    expect(error.status).toBe(403);
    expect(error.message).toBe("Nope");
  });
});
