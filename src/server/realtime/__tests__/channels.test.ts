import { describe, expect, it } from "vitest";
import {
  conversationChannel,
  feedChannel,
  presenceChannel,
  realtimeEvents,
  userChannel,
  vhubFeedChannel,
  vhubThreadChannel,
} from "../channels";

describe("realtime channel contract", () => {
  it("maps legacy STOMP destinations to stable Supabase channels", () => {
    expect(feedChannel()).toBe("vcollab:feed");
    expect(userChannel(7)).toBe("vcollab:user:7");
    expect(conversationChannel(9)).toBe("vcollab:conversation:9");
    expect(presenceChannel()).toBe("vcollab:presence");
    expect(vhubFeedChannel()).toBe("vcollab:vhub:feed");
    expect(vhubThreadChannel(3)).toBe("vcollab:vhub:thread:3");
    expect(realtimeEvents.typing).toBe("conversation.typing");
  });
});
