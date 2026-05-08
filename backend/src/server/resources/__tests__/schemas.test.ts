import { describe, expect, it } from "vitest";
import { createFolderSchema, resourceSearchSchema } from "../schemas";

describe("resource schemas", () => {
  it("defaults search pagination", () => {
    expect(resourceSearchSchema.parse({})).toMatchObject({ page: 0, size: 20 });
  });

  it("validates folder creation", () => {
    expect(createFolderSchema.parse({ parentId: 1, name: "Module", folderType: "MODULE" })).toMatchObject({
      parentId: 1,
      name: "Module",
      folderType: "MODULE",
    });
  });
});
