import { describe, expect, it } from "vitest";
import {
  projectRequestCreateSchema,
  projectRequestStatusSchema,
} from "../schemas";

describe("project request schemas", () => {
  it("validates create payloads", () => {
    expect(projectRequestCreateSchema.parse({ projectId: 5 })).toEqual({
      projectId: 5,
    });
  });

  it("rejects unknown statuses", () => {
    expect(() =>
      projectRequestStatusSchema.parse({ status: "DONE" }),
    ).toThrow();
  });
});
