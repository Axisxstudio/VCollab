import { z } from "zod";

export const categoryTypeSchema = z.enum(["ALL", "PROJECT", "POST", "BLOG"]);

export const categoryRequestSchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: categoryTypeSchema,
});

export const categoryListQuerySchema = z.object({
  type: categoryTypeSchema.optional(),
});

export const categoryToggleQuerySchema = z.object({
  active: z
    .string()
    .transform((value) => value.toLowerCase() === "true"),
});
