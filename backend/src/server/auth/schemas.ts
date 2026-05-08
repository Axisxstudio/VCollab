import { z } from "zod";
import { roles } from "./types";

const publicRoles = roles.filter((role) => role !== "SUPER_ADMIN") as [
  "STUDENT",
  "INDUSTRIAL_EXPERT",
  "SOFTWARE_ENGINEER",
];

export const loginSchema = z
  .object({
    identifier: z.string().optional(),
    email: z.string().optional(),
    username: z.string().optional(),
    password: z.string().min(1),
  })
  .transform((input) => ({
    identifier: (input.identifier ?? input.email ?? input.username ?? "").trim(),
    password: input.password,
  }))
  .pipe(
    z.object({
      identifier: z.string().min(1, "Username or email is required"),
      password: z.string().min(1, "Password is required"),
    }),
  );

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  username: z.string().trim().min(3).max(30),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  role: z.enum(publicRoles),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(8).max(72),
});

export const checkUsernameSchema = z.object({
  username: z.string().trim().min(1),
});
