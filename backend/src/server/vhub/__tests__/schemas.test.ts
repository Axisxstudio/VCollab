import { describe, expect, it } from "vitest";
import { createThreadSchema, settingsUpdateSchema, threadListSchema } from "../schemas";

describe("vhub schemas", () => {
  it("defaults thread pagination", () => {
    expect(threadListSchema.parse({})).toMatchObject({ page: 0, size: 20, mine: false });
  });

  it("validates thread creation", () => {
    expect(createThreadSchema.parse({ title: "Q", body: "B", threadType: "QUESTION" })).toMatchObject({
      threadType: "QUESTION",
    });
  });

  it("validates settings updates", () => {
    expect(settingsUpdateSchema.parse({ mode: "ENABLED" })).toEqual({ mode: "ENABLED" });
  });
});
