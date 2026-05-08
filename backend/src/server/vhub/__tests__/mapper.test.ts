import { describe, expect, it } from "vitest";
import { bodyPreview, mapReply, mapSettings, mapThread } from "../mapper";

describe("vhub mapper", () => {
  it("creates compact body previews", () => {
    expect(bodyPreview("short")).toBe("short");
    expect(bodyPreview("a".repeat(200))).toHaveLength(180);
  });

  it("maps thread response fields", () => {
    expect(
      mapThread({
        id: 1,
        title: "Help",
        body: "Need help",
        thread_type: "HELP",
        status: "OPEN",
        tags: "[\"react\"]",
        is_locked: false,
        is_hidden: false,
        best_reply_id: null,
        reply_count: 0,
        participant_count: 1,
        view_count: 2,
        last_activity_at: "now",
        created_at: "now",
        updated_at: null,
        author_id: 7,
        author: { id: 7, username: "student", user_profiles: null },
      }, 7),
    ).toMatchObject({
      id: 1,
      threadType: "HELP",
      tags: ["react"],
      currentUserCanEdit: true,
    });
  });

  it("maps replies and settings", () => {
    expect(mapReply({ id: 2, thread_id: 1, body: "Answer", is_best_answer: true, is_hidden: false, created_at: "now", updated_at: null, author_id: null, guest_name: "Guest" })).toMatchObject({
      bestAnswer: true,
      author: { guest: true, displayName: "Guest" },
    });
    expect(mapSettings({ feature_key: "V_HUB", mode: "ENABLED", config_json: { allowGuestView: true } })).toMatchObject({
      featureKey: "V_HUB",
      mode: "ENABLED",
      allowGuestView: true,
      maxTitleLength: 180,
    });
  });
});
