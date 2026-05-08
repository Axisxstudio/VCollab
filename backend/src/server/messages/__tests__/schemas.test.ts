import { describe, expect, it } from "vitest";
import {
  conversationCreateSchema,
  messageCreateSchema,
  pageQuerySchema,
} from "../schemas";

describe("message schemas", () => {
  it("validates conversation creation", () => {
    expect(conversationCreateSchema.parse({ userId: 2 })).toEqual({ userId: 2 });
  });

  it("accepts text-only messages", () => {
    expect(messageCreateSchema.parse({ conversationId: 1, content: "Hi" })).toEqual({
      conversationId: 1,
      content: "Hi",
    });
  });

  it("defaults page query values", () => {
    expect(pageQuerySchema.parse({})).toEqual({ page: 0, size: 20 });
  });
});
