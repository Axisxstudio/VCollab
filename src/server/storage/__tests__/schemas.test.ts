import { describe, expect, it } from "vitest";
import { signedUrlSchema } from "../schemas";

describe("signed URL schema", () => {
  it("defaults expiry to one hour", () => {
    expect(signedUrlSchema.parse({ bucket: "academic-resources", path: "1/a.pdf" })).toEqual({
      bucket: "academic-resources",
      path: "1/a.pdf",
      expiresIn: 3600,
    });
  });

  it("caps expiry at one day", () => {
    expect(() =>
      signedUrlSchema.parse({ bucket: "academic-resources", path: "1/a.pdf", expiresIn: 90000 }),
    ).toThrow();
  });
});
