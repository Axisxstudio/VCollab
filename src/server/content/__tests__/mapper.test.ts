import { describe, expect, it } from "vitest";
import { mapAdminContent, mapBlog, mapPost, mapProject, parseList, slugify } from "../mapper";

const base = {
  id: 11,
  visibility: "PUBLIC",
  is_active: true,
  like_count: 1,
  comment_count: 2,
  save_count: 3,
  share_count: 4,
  created_at: "2026-05-07T00:00:00.000Z",
  updated_at: null,
  category: { id: 5, name: "Learning Notes" },
  author: { id: 6, username: "author", user_profiles: { full_name: "Author", profile_image: null, education_type: "UNDERGRADUATE" } },
  owner: { id: 7, username: "owner", user_profiles: { full_name: "Owner", profile_image: null, education_type: "UNDERGRADUATE" } },
};

describe("content mapper", () => {
  it("parses JSON and CSV list fields", () => {
    expect(parseList("[\"next\",\"supabase\"]")).toEqual(["next", "supabase"]);
    expect(parseList("next, supabase")).toEqual(["next", "supabase"]);
  });

  it("maps public content responses", () => {
    expect(mapProject({ ...base, title: "Project", slug: "project", tags: "[\"tag\"]", tech_stack: "[\"ts\"]" }).techStack).toEqual(["ts"]);
    expect(mapPost({ ...base, content: "Post", post_type: "TEXT", tags: "news" }).author.fullName).toBe("Author");
    expect(mapBlog({ ...base, title: "Blog", slug: "blog", content: "Body", tags: null }).title).toBe("Blog");
  });

  it("maps admin summaries", () => {
    const summary = mapAdminContent({ ...base, title: "Project", short_desc: "Short", tags: "a,b" }, "project");
    expect(summary).toMatchObject({ contentType: "PROJECT", title: "Project", ownerUsername: "owner" });
  });

  it("slugifies titles", () => {
    expect(slugify("My Final Project!")).toBe("my-final-project");
  });
});
