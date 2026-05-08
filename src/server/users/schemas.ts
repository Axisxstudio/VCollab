import { z } from "zod";
import { roles } from "@/server/auth/types";

const publicRoles = roles.filter((role) => role !== "SUPER_ADMIN") as [
  "STUDENT",
  "INDUSTRIAL_EXPERT",
  "SOFTWARE_ENGINEER",
];

export const discoverUsersSchema = z.object({
  query: z.string().trim().optional(),
  role: z.enum(publicRoles).optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  size: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().max(255).nullable().optional(),
  bio: z.string().nullable().optional(),
  role: z.enum(publicRoles).optional(),
  department: z.string().nullable().optional(),
  yearOfStudy: z.string().nullable().optional(),
  institution: z.string().nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  githubUrl: z.string().nullable().optional(),
  linkedinUrl: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  dob: z.string().date().nullable().optional(),
  educationType: z.enum(["SCHOOL", "UNIVERSITY"]).nullable().optional(),
  institutionName: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  academicYear: z.string().nullable().optional(),
  semester: z.string().nullable().optional(),
  faculty: z.string().nullable().optional(),
});
