import { z } from "zod";
import { folderTypes, resourceFileTypes, resourceVisibilities } from "./types";

export const resourceSearchSchema = z.object({
  search: z.string().optional(),
  institution: z.string().optional(),
  academicYear: z.string().optional(),
  semester: z.string().optional(),
  category: z.string().optional(),
  module: z.string().optional(),
  resourceType: z.enum(resourceFileTypes).optional(),
  uploader: z.string().optional(),
  fileName: z.string().optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  size: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const folderIdQuerySchema = z.object({
  folderId: z.coerce.number().int().positive().optional(),
});

export const createFolderSchema = z.object({
  parentId: z.number().int().positive(),
  categoryId: z.number().int().positive().nullable().optional(),
  name: z.string().trim().min(1),
  folderType: z.enum(folderTypes),
  visibility: z.enum(resourceVisibilities).optional(),
  sortOrder: z.number().int().optional(),
});

export const ensurePathSchema = z.object({
  semesterFolderId: z.number().int().positive(),
  categoryId: z.number().int().positive().nullable().optional(),
  categoryName: z.string().nullable().optional(),
  moduleName: z.string().nullable().optional(),
  subCategoryName: z.string().nullable().optional(),
  visibility: z.enum(resourceVisibilities).optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().trim().min(1).optional(),
  visibility: z.enum(resourceVisibilities).optional(),
  active: z.boolean().optional(),
});

export const updateFileSchema = z.object({
  folderId: z.number().int().positive().optional(),
  displayName: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  visibility: z.enum(resourceVisibilities).optional(),
  allowDownload: z.boolean().optional(),
  active: z.boolean().optional(),
  subjectCode: z.string().nullable().optional(),
  academicBatch: z.string().nullable().optional(),
  lecturerName: z.string().nullable().optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const adminModerationSchema = z.object({
  visibility: z.enum(resourceVisibilities).optional(),
  active: z.boolean().optional(),
  allowDownload: z.boolean().optional(),
});
