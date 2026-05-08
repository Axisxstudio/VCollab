import { z } from "zod";

export const cmsBlockRequestSchema = z.object({
  sectionKey: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().max(400).nullable().optional(),
  body: z.string().trim().min(1),
  badge: z.string().trim().max(120).nullable().optional(),
  ctaLabel: z.string().trim().max(120).nullable().optional(),
  ctaUrl: z.string().trim().max(400).nullable().optional(),
  themeTone: z.string().trim().max(60).nullable().optional(),
  displayOrder: z.number().int(),
  active: z.boolean(),
  publicVisible: z.boolean(),
});

export const cmsBlockListQuerySchema = z.object({
  sectionKey: z.string().trim().optional(),
  active: z
    .string()
    .optional()
    .transform((value) => value === undefined ? undefined : value.toLowerCase() === "true"),
  publicVisible: z
    .string()
    .optional()
    .transform((value) => value === undefined ? undefined : value.toLowerCase() === "true"),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().positive().max(100).default(20),
});
