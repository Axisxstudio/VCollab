import { z } from "zod";

export const searchSchema = z.object({
  query: z.string().trim().optional(),
  size: z.coerce.number().int().optional().default(4),
});
