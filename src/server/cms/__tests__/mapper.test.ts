import { describe, expect, it } from "vitest";
import { mapCmsBlock, normalizeSectionKey, trimToNull } from "../mapper";

describe("cms mapper", () => {
  it("maps CMS block rows to the compatibility response", () => {
    expect(mapCmsBlock({
      id: 1,
      section_key: "LANDING_INFO",
      title: "Title",
      subtitle: null,
      body: "Body",
      badge: "Badge",
      cta_label: "Read",
      cta_url: "/about",
      theme_tone: "surface",
      display_order: 2,
      is_active: true,
      is_public_visible: false,
      created_at: "2026-05-07T00:00:00.000Z",
      updated_at: null,
    })).toMatchObject({
      id: 1,
      sectionKey: "LANDING_INFO",
      displayOrder: 2,
      active: true,
      publicVisible: false,
    });
  });

  it("normalizes CMS request helpers", () => {
    expect(normalizeSectionKey("footer note")).toBe("FOOTER_NOTE");
    expect(trimToNull("   ")).toBeNull();
  });
});
