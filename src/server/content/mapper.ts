export type ContentKind = "project" | "post" | "blog";

type ProfileRow = {
  full_name?: string | null;
  profile_image?: string | null;
  education_type?: string | null;
};

type UserSummaryRow = {
  id?: number;
  username?: string;
  user_profiles?: ProfileRow | ProfileRow[] | null;
} | null;

type CategoryRow = {
  id?: number;
  name?: string;
} | null;

type MediaRow = {
  id?: number;
  url?: string | null;
  media_type?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  sort_order?: number | null;
};

export type ContentRow = {
  id: number;
  title?: string | null;
  slug?: string | null;
  short_desc?: string | null;
  full_desc?: string | null;
  thumbnail?: string | null;
  tech_stack?: string | null;
  tags?: string | null;
  github_url?: string | null;
  demo_url?: string | null;
  youtube_url?: string | null;
  pdf_url?: string | null;
  course_url?: string | null;
  cover_image?: string | null;
  content?: string | null;
  post_type?: string | null;
  visibility: string;
  is_active: boolean;
  like_count: number;
  comment_count: number;
  save_count: number;
  share_count: number;
  view_count?: number;
  created_at: string;
  updated_at: string | null;
  deleted_at?: string | null;
  deleted_by?: number | null;
  category?: CategoryRow;
  owner?: UserSummaryRow;
  author?: UserSummaryRow;
  project_media?: MediaRow[] | null;
  post_media?: MediaRow[] | null;
  blog_media?: MediaRow[] | null;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function parseList(value?: string | null): string[] {
  if (!value?.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

function userSummary(user: UserSummaryRow) {
  const raw = Array.isArray(user?.user_profiles)
    ? user.user_profiles[0]
    : user?.user_profiles;

  return {
    id: user?.id ?? 0,
    username: user?.username ?? "",
    fullName: raw?.full_name ?? null,
    profileImage: raw?.profile_image ?? null,
    educationType: raw?.education_type ?? null,
  };
}

function categorySummary(row?: CategoryRow) {
  return row?.id ? { id: row.id, name: row.name ?? "" } : null;
}

function mediaItems(rows?: MediaRow[] | null) {
  return (rows ?? [])
    .slice()
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((row) => ({
      id: row.id ?? 0,
      url: row.url ?? "",
      mediaType: row.media_type ?? "IMAGE",
      fileName: row.file_name ?? null,
      fileSize: row.file_size ?? null,
      sortOrder: row.sort_order ?? 0,
    }));
}

export function mapProject(row: ContentRow) {
  return {
    id: row.id,
    title: row.title ?? "",
    slug: row.slug ?? "",
    shortDesc: row.short_desc ?? null,
    fullDesc: row.full_desc ?? null,
    thumbnail: row.thumbnail ?? null,
    tags: parseList(row.tags),
    techStack: parseList(row.tech_stack),
    githubUrl: row.github_url ?? null,
    demoUrl: row.demo_url ?? null,
    targetType: "ALL",
    hasGithubUrl: Boolean(row.github_url),
    hasDemoUrl: Boolean(row.demo_url),
    youtubeUrl: row.youtube_url ?? null,
    pdfUrl: row.pdf_url ?? null,
    courseUrl: row.course_url ?? null,
    hasYoutubeUrl: Boolean(row.youtube_url),
    hasPdfUrl: Boolean(row.pdf_url),
    hasCourseUrl: Boolean(row.course_url),
    visibility: row.visibility,
    active: row.is_active,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    saveCount: row.save_count,
    shareCount: row.share_count,
    viewCount: row.view_count ?? 0,
    category: categorySummary(row.category),
    owner: userSummary(row.owner ?? null),
    media: mediaItems(row.project_media),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPost(row: ContentRow) {
  return {
    id: row.id,
    content: row.content ?? "",
    postType: row.post_type ?? "TEXT",
    targetType: "ALL",
    visibility: row.visibility,
    active: row.is_active,
    tags: parseList(row.tags),
    likeCount: row.like_count,
    commentCount: row.comment_count,
    saveCount: row.save_count,
    shareCount: row.share_count,
    category: categorySummary(row.category),
    author: userSummary(row.author ?? null),
    media: mediaItems(row.post_media),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBlog(row: ContentRow) {
  return {
    id: row.id,
    title: row.title ?? "",
    slug: row.slug ?? "",
    coverImage: row.cover_image ?? null,
    content: row.content ?? "",
    targetType: "ALL",
    visibility: row.visibility,
    active: row.is_active,
    tags: parseList(row.tags),
    likeCount: row.like_count,
    commentCount: row.comment_count,
    saveCount: row.save_count,
    shareCount: row.share_count,
    category: categorySummary(row.category),
    author: userSummary(row.author ?? null),
    media: mediaItems(row.blog_media),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function truncate(value?: string | null) {
  const text = value?.trim() ?? "";
  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
}

export function mapAdminContent(row: ContentRow, kind: ContentKind) {
  const isPost = kind === "post";
  const author = kind === "project" ? userSummary(row.owner ?? null) : userSummary(row.author ?? null);

  return {
    id: row.id,
    contentType: kind.toUpperCase(),
    title: isPost ? `Post #${row.id}` : row.title ?? "",
    excerpt: truncate(kind === "project" ? row.short_desc ?? row.full_desc : row.content),
    subtype: isPost ? row.post_type ?? null : null,
    thumbnailUrl: kind === "blog" ? row.cover_image ?? null : kind === "project" ? row.thumbnail ?? null : null,
    tags: parseList(row.tags),
    ownerId: author.id,
    ownerUsername: author.username,
    ownerFullName: author.fullName,
    ownerProfileImage: author.profileImage,
    categoryId: row.category?.id ?? null,
    categoryName: row.category?.name ?? null,
    visibility: row.visibility,
    active: row.is_active,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    saveCount: row.save_count,
    shareCount: row.share_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
    deletedBy: row.deleted_by ?? null,
  };
}
