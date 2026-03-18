import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(2).optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  role: z.string().optional().or(z.literal("")),
  department: z.string().optional().or(z.literal("")),
  yearOfStudy: z.string().optional().or(z.literal("")),
  institution: z.string().optional().or(z.literal("")),
  skills: z.string().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),

  // ─── New Profiling Fields ──────────────────────────────────────────────────
  dob: z.string().optional().or(z.literal("")),
  educationType: z.enum(["SCHOOL", "UNIVERSITY"]).optional().or(z.literal("")),
  institutionName: z.string().optional().or(z.literal("")),
  grade: z.string().optional().or(z.literal("")),
  academicYear: z.string().optional().or(z.literal("")),
  semester: z.string().optional().or(z.literal("")),
  faculty: z.string().optional().or(z.literal(""))
});
