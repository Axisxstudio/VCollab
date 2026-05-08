export const folderTypes = [
  "INSTITUTION",
  "ACADEMIC_YEAR",
  "SEMESTER",
  "CONTRIBUTOR",
  "CATEGORY",
  "MODULE",
  "SUBCATEGORY",
  "CUSTOM",
] as const;

export const resourceFileTypes = [
  "PDF",
  "DOC",
  "DOCX",
  "PPT",
  "PPTX",
  "JPG",
  "JPEG",
  "PNG",
  "WEBP",
  "ZIP",
  "TXT",
  "OTHER",
] as const;

export const resourceVisibilities = ["PUBLIC", "INSTITUTION_ONLY", "PRIVATE"] as const;

export type ResourceFolderType = (typeof folderTypes)[number];
export type ResourceFileType = (typeof resourceFileTypes)[number];
export type ResourceVisibility = (typeof resourceVisibilities)[number];

export type ResourceCategoryResponse = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  active: boolean;
};

export type ResourceUploaderResponse = {
  id: number;
  username: string;
  fullName: string | null;
  profileImage: string | null;
  institution: string | null;
  resourceCount: number;
  categoriesContributed: number;
};
