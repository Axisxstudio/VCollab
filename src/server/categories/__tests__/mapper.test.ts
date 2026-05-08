import { describe, expect, it } from "vitest";
import { mapCategory, slugifyCategory } from "../mapper";

describe("category mapper", () => {
  it("maps Supabase category rows to Spring-compatible responses", () => {
    expect(mapCategory({
      id: 7,
      name: "Learning Notes",
      slug: "learning-notes",
      type: "BLOG",
      is_system_default: true,
      is_active: false,
    })).toEqual({
      id: 7,
      name: "Learning Notes",
      slug: "learning-notes",
      type: "BLOG",
      systemDefault: true,
      active: false,
    });
  });

  it("generates Spring-style slugs", () => {
    expect(slugifyCategory("  Final Year Projects!  ")).toBe("final-year-projects");
  });
});
