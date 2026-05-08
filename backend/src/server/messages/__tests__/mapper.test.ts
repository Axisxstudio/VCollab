import { describe, expect, it } from "vitest";
import { mapMessage, userSummary } from "../mapper";
import type { MessageRow } from "../types";

describe("message mapper", () => {
  it("maps sender summaries from nested profile rows", () => {
    expect(
      userSummary({
        id: 4,
        username: "sender",
        user_profiles: {
          full_name: "Sender User",
          profile_image: "/uploads/profile/s.png",
        },
      }),
    ).toEqual({
      id: 4,
      username: "sender",
      fullName: "Sender User",
      profileImage: "/uploads/profile/s.png",
    });
  });

  it("matches the Spring message response shape", () => {
    const row: MessageRow = {
      id: 8,
      conversation_id: 2,
      content: "Hello",
      message_type: "TEXT",
      attachment_url: null,
      created_at: "2026-05-07T00:00:00.000Z",
      delivered_at: null,
      read_at: null,
      sender_id: 4,
      sender: {
        id: 4,
        username: "sender",
        user_profiles: null,
      },
    };

    expect(mapMessage(row)).toEqual({
      id: 8,
      conversationId: 2,
      content: "Hello",
      messageType: "TEXT",
      attachmentUrl: null,
      createdAt: "2026-05-07T00:00:00.000Z",
      deliveredAt: null,
      readAt: null,
      sender: {
        id: 4,
        username: "sender",
        fullName: null,
        profileImage: null,
      },
    });
  });
});
