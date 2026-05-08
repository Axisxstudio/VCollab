import { z } from "zod";

export const threadTypes = ["HELP", "QUESTION", "DISCUSSION"] as const;
export const threadStatuses = ["OPEN", "SOLVED"] as const;
export const featureModes = ["DISABLED", "READ_ONLY", "ENABLED"] as const;

export const threadListSchema = z.object({
  q: z.string().optional(),
  type: z.enum(threadTypes).optional(),
  status: z.enum(threadStatuses).optional(),
  mine: z.coerce.boolean().optional().default(false),
  hidden: z.coerce.boolean().optional(),
  locked: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  size: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const createThreadSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  threadType: z.enum(threadTypes),
  tags: z.array(z.string()).optional(),
  guestName: z.string().trim().optional(),
  guestEmail: z.string().trim().email().optional(),
});

export const createReplySchema = z.object({
  body: z.string().trim().min(1),
  guestName: z.string().trim().optional(),
  guestEmail: z.string().trim().email().optional(),
});

export const solveSchema = z.object({
  bestReplyId: z.number().int().positive(),
});

export const moderationSchema = z.object({
  value: z.boolean(),
  note: z.string().optional(),
});

export const settingsUpdateSchema = z.object({
  mode: z.enum(featureModes),
  allowGuestView: z.boolean().optional(),
  allowAttachments: z.boolean().optional(),
  maxTitleLength: z.number().int().positive().optional(),
  maxBodyLength: z.number().int().positive().optional(),
  rateLimitPerHour: z.number().int().positive().optional(),
});
