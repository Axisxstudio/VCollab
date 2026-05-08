import { routes } from "../config/routes.js";
import { formatTimeAgo } from "./date.js";

export const DISCOVERY_SORT_OPTIONS = [
  { value: "NEWEST", label: "Newest" },
  { value: "OLDEST", label: "Oldest" },
  { value: "MOST_LIKED", label: "Most liked" },
  { value: "MOST_COMMENTED", label: "Most commented" }
];

export const ROLE_FILTER_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "STUDENT", label: "Students" },
  { value: "INDUSTRIAL_EXPERT", label: "Industrial experts" },
  { value: "SOFTWARE_ENGINEER", label: "Software engineers" }
];

export function createInitialDiscoveryFilters(overrides = {}) {
  return {
    search: "",
    categoryId: "",
    tag: "",
    owner: "",
    fromDate: "",
    toDate: "",
    sort: "NEWEST",
    ...overrides
  };
}

export function buildDiscoveryParams(filters = {}, page = 0, size = 9) {
  const params = { page, size };

  if (filters.search?.trim()) params.search = filters.search.trim();
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.tag?.trim()) params.tag = filters.tag.trim();
  if (filters.owner?.trim()) params.owner = filters.owner.trim();
  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  if (filters.sort) params.sort = filters.sort;
  if (filters.query?.trim()) params.query = filters.query.trim();
  if (filters.role) params.role = filters.role;

  return params;
}

export function buildDiscoveryQueryKey(baseKey, filters, page = 0) {
  return [
    baseKey,
    filters.search || "",
    filters.categoryId || "",
    filters.tag || "",
    filters.owner || "",
    filters.fromDate || "",
    filters.toDate || "",
    filters.sort || "NEWEST",
    filters.query || "",
    filters.role || "",
    page
  ];
}

export function formatDate(value) {
  return formatTimeAgo(value);
}

export function truncateText(value, maxLength = 160) {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

export function buildShareUrl(path) {
  if (!path) return "";
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

export function getProfilePath(username) {
  if (!username) return routes.home;
  return routes.profile.replace(":username", username);
}

export function formatRole(role) {
  if (!role) return "Contributor";
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
