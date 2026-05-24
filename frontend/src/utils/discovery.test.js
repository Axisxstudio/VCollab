import { test, assert } from "vitest";
import {
  buildDiscoveryParams,
  buildDiscoveryQueryKey,
  formatRole,
  getProfilePath,
  truncateText
} from "./discovery.js";

test("buildDiscoveryParams keeps meaningful filters and omits empty values", () => {
  const params = buildDiscoveryParams(
    {
      search: "  react  ",
      categoryId: 4,
      tag: " ui ",
      owner: "",
      fromDate: "2026-03-01",
      toDate: "",
      sort: "MOST_LIKED",
      query: "  student  ",
      role: "STUDENT"
    },
    2,
    12
  );

  assert.deepEqual(params, {
    page: 2,
    size: 12,
    search: "react",
    categoryId: 4,
    tag: "ui",
    fromDate: "2026-03-01",
    sort: "MOST_LIKED",
    query: "student",
    role: "STUDENT"
  });
});

test("buildDiscoveryQueryKey and helpers format user-facing values consistently", () => {
  assert.deepEqual(
    buildDiscoveryQueryKey(
      "projects",
      {
        search: "iot",
        categoryId: 3,
        tag: "hardware",
        owner: "mentor",
        fromDate: "2026-01-01",
        toDate: "2026-01-31",
        sort: "NEWEST",
        query: "",
        role: ""
      },
      1
    ),
    ["projects", "iot", 3, "hardware", "mentor", "2026-01-01", "2026-01-31", "NEWEST", "", "", 1]
  );

  assert.equal(formatRole("SOFTWARE_ENGINEER"), "Software Engineer");
  assert.equal(getProfilePath("student-builder"), "/profile/student-builder");
  assert.equal(truncateText("VCollab", 20), "VCollab");
  assert.equal(truncateText("A".repeat(10), 5), "AAAAA...");
});
