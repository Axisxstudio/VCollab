/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ResourceCategoryResponse, ResourceUploaderResponse } from "./types";

type Profile = {
  full_name: string | null;
  profile_image: string | null;
  institution: string | null;
};

type UserRow = {
  id: number;
  username: string;
  user_profiles: Profile | Profile[] | null;
};

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseTags(tagsText: string | null): string[] {
  if (!tagsText?.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(tagsText);
    if (Array.isArray(parsed)) {
      return parsed.filter((tag): tag is string => typeof tag === "string");
    }
  } catch {
    return tagsText.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function profile(user: UserRow | null | undefined): Profile | null {
  if (!user) return null;
  return Array.isArray(user.user_profiles) ? user.user_profiles[0] ?? null : user.user_profiles;
}

export function mapUploader(user: UserRow | null | undefined): ResourceUploaderResponse | null {
  if (!user) return null;
  const rawProfile = profile(user);
  return {
    id: user.id,
    username: user.username,
    fullName: rawProfile?.full_name ?? null,
    profileImage: rawProfile?.profile_image ?? null,
    institution: rawProfile?.institution ?? null,
    resourceCount: 0,
    categoriesContributed: 0,
  };
}

export function mapCategory(row: {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  active: boolean;
}): ResourceCategoryResponse {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    sortOrder: row.sort_order,
    active: row.active,
  };
}

export function mapFolder(row: any) {
  return {
    id: row.id,
    name: row.name,
    folderType: row.folder_type,
    visibility: row.visibility,
    active: row.active,
    depth: row.depth,
    institutionName: row.institution_name,
    academicYearLabel: row.academic_year_label,
    semesterLabel: row.semester_label,
    moduleName: row.module_name,
    resourceCount: Number(row.resource_count ?? 0),
    childFolderCount: Number(row.child_folder_count ?? 0),
    uploader: mapUploader(row.owner),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFile(row: any) {
  return {
    id: row.id,
    folderId: row.folder_id,
    displayName: row.display_name,
    originalFileName: row.original_file_name,
    publicUrl: row.public_url,
    mimeType: row.mime_type,
    extension: row.extension,
    resourceType: row.resource_type,
    fileSize: row.file_size,
    visibility: row.visibility,
    active: row.active,
    allowDownload: row.allow_download,
    institutionName: row.institution_name,
    academicYearLabel: row.academic_year_label,
    semesterLabel: row.semester_label,
    categoryName: row.category_name,
    moduleName: row.module_name,
    subCategoryName: row.sub_category_name,
    subjectCode: row.subject_code,
    academicBatch: row.academic_batch,
    lecturerName: row.lecturer_name,
    description: row.description,
    tags: parseTags(row.tags_text),
    viewCount: row.view_count,
    downloadCount: row.download_count,
    uploader: mapUploader(row.owner),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
