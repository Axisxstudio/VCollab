import { describe, expect, it } from "vitest";
import { mapCategory, mapFile, mapFolder, parseTags, slugify } from "../mapper";

describe("resource mapper", () => {
  it("slugifies names for folder/category compatibility", () => {
    expect(slugify("Lecture Slides 2026!")).toBe("lecture-slides-2026");
  });

  it("parses json and comma separated tags", () => {
    expect(parseTags("[\"AI\",\"ML\"]")).toEqual(["AI", "ML"]);
    expect(parseTags("AI, ML")).toEqual(["AI", "ML"]);
  });

  it("maps category fields to Spring DTO names", () => {
    expect(
      mapCategory({
        id: 1,
        name: "Notes",
        slug: "notes",
        description: null,
        icon: "NotebookPen",
        sort_order: 1,
        active: true,
      }),
    ).toEqual({
      id: 1,
      name: "Notes",
      slug: "notes",
      description: null,
      icon: "NotebookPen",
      sortOrder: 1,
      active: true,
    });
  });

  it("maps folder and file summaries", () => {
    expect(mapFolder({ id: 1, name: "SLIIT", folder_type: "INSTITUTION", visibility: "PUBLIC", active: true, depth: 0, created_at: "now", updated_at: null })).toMatchObject({
      id: 1,
      folderType: "INSTITUTION",
    });
    expect(mapFile({ id: 2, folder_id: 1, display_name: "Paper", original_file_name: "p.pdf", public_url: "url", mime_type: "application/pdf", extension: "pdf", resource_type: "PDF", file_size: 10, visibility: "PUBLIC", active: true, allow_download: true, tags_text: "[\"exam\"]", view_count: 0, download_count: 0, created_at: "now", updated_at: null })).toMatchObject({
      id: 2,
      folderId: 1,
      tags: ["exam"],
    });
  });
});
