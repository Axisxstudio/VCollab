import { z } from "zod";

export const projectRequestCreateSchema = z.object({
  projectId: z.number().int().positive(),
  message: z.string().nullable().optional(),
});

export const projectRequestStatusSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]),
});
