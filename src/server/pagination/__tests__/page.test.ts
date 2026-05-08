import { describe, expect, it } from "vitest";
import { pageBounds, toPageResponse } from "../page";

describe("pagination compatibility", () => {
  it("creates Spring Data compatible page metadata", () => {
    const page = toPageResponse(["a", "b"], 12, 1, 10);

    expect(page).toMatchObject({
      content: ["a", "b"],
      totalElements: 12,
      totalPages: 2,
      number: 1,
      size: 10,
      first: false,
      last: true,
      numberOfElements: 2,
      empty: false,
    });
  });

  it("normalizes bounds and caps large sizes", () => {
    expect(pageBounds(-1, 500)).toEqual({
      page: 0,
      size: 100,
      from: 0,
      to: 99,
    });
  });
});
