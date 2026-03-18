import { z } from "zod";
import { roles } from "../config/constants";

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Username or email is required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const registerSchema = z.object({
  fullName: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum([
    roles.STUDENT,
    roles.INDUSTRIAL_EXPERT,
    roles.SOFTWARE_ENGINEER
  ])
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(6),
  password: z.string().min(8)
});
