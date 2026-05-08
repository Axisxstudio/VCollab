import { z } from "zod";

export const conversationCreateSchema = z.object({
  userId: z.number().int().positive(),
});

export const messageCreateSchema = z.object({
  conversationId: z.number().int().positive(),
  content: z.string().nullable().optional(),
  attachmentUrl: z.string().nullable().optional(),
});

export const messageUpdateSchema = z.object({
  content: z.string().nullable().optional(),
});

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  size: z.coerce.number().int().min(1).max(100).optional().default(20),
});
