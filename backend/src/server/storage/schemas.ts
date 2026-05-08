import { z } from "zod";

export const signedUrlSchema = z.object({
  bucket: z.enum(["profile-media", "content-media", "message-attachments", "academic-resources"]),
  path: z.string().trim().min(1),
  expiresIn: z.number().int().positive().max(86400).optional().default(3600),
});
