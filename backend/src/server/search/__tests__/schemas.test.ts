import { describe, expect, it } from "vitest";
import { searchSchema } from "../schemas";

describe("search schema", () => {
  it("defaults size to the Spring default", () => {
    expect(searchSchema.parse({ query: "react" })).toEqual({
      query: "react",
      size: 4,
    });
  });
});
