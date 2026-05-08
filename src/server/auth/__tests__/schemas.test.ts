import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "../schemas";

describe("auth schemas", () => {
  it("accepts legacy email alias for login identifier", () => {
    const parsed = loginSchema.parse({
      email: "student@example.com",
      password: "secret123",
    });

    expect(parsed).toEqual({
      identifier: "student@example.com",
      password: "secret123",
    });
  });

  it("accepts legacy username alias for login identifier", () => {
    const parsed = loginSchema.parse({
      username: "student_one",
      password: "secret123",
    });

    expect(parsed.identifier).toBe("student_one");
  });

  it("blocks super admin self registration", () => {
    expect(() =>
      registerSchema.parse({
        fullName: "Admin User",
        username: "admin",
        email: "admin@example.com",
        password: "secret123",
        role: "SUPER_ADMIN",
      }),
    ).toThrow();
  });
});
