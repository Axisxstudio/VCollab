import { z } from "zod";

export const visibilitySchema = z.enum(["PUBLIC", "PRIVATE", "CONNECTIONS"]);
export const discoverySortSchema = z.enum(["NEWEST", "RECENTLY_UPDATED", "POPULAR"]).default("NEWEST");

export const contentSearchSchema = z.object({
  search: z.string().trim().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  tag: z.string().trim().optional(),
  owner: z.string().trim().optional(),
  fromDate: z.string().trim().optional(),
  toDate: z.string().trim().optional(),
  sort: discoverySortSchema,
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().positive().max(100).default(20),
});

export const projectRequestSchema = z.object({
  title: z.string().trim().min(1).max(500),
  shortDesc: z.string().trim().max(1000).nullable().optional(),
  fullDesc: z.string().nullable().optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
  githubUrl: z.string().nullable().optional(),
  demoUrl: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  media: z.array(z.unknown()).default([]),
  visibility: visibilitySchema,
  youtubeUrl: z.string().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
  courseUrl: z.string().nullable().optional(),
  active: z.boolean().default(true),
});

export const postRequestSchema = z.object({
  content: z.string().trim().min(1),
  categoryId: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string()).default([]),
  media: z.array(z.unknown()).default([]),
  postType: z.enum(["TEXT", "IMAGE", "VIDEO", "LINK", "POLL"]).default("TEXT"),
  visibility: visibilitySchema,
  active: z.boolean().default(true),
});

export const blogRequestSchema = z.object({
  title: z.string().trim().min(1),
  coverImage: z.string().nullable().optional(),
  content: z.string().trim().min(1),
  categoryId: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string()).default([]),
  media: z.array(z.unknown()).default([]),
  visibility: visibilitySchema,
  active: z.boolean().default(true),
});

export const adminContentSearchSchema = contentSearchSchema.extend({
  visibility: visibilitySchema.optional(),
  active: z
    .string()
    .optional()
    .transform((value) => value === undefined ? undefined : value.toLowerCase() === "true"),
  deleted: z
    .string()
    .optional()
    .transform((value) => value?.toLowerCase() === "true"),
});

export const adminModerationSchema = z.object({
  visibility: visibilitySchema.optional(),
  active: z.boolean().optional(),
});
