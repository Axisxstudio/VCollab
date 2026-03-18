import { FileText, Layout, MessageSquare } from "lucide-react";
import { routes } from "../config/routes";

export function getContentConfig(contentType) {
  if (contentType === "PROJECT") return { label: "Project", icon: Layout, variant: "project" };
  if (contentType === "BLOG") return { label: "Blog", icon: FileText, variant: "blog" };
  return { label: "Post", icon: MessageSquare, variant: "post" };
}

function dedupeMedia(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.url) {
      return false;
    }

    const key = `${item.mediaType || "IMAGE"}:${item.url}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeMediaItem(item, index, labelPrefix = "Media") {
  if (!item?.url) {
    return null;
  }

  return {
    url: item.url,
    mediaType: item.mediaType || "IMAGE",
    label: item.label || item.fileName || `${labelPrefix} ${index + 1}`,
    fileName: item.fileName || null,
    fileSize: item.fileSize || null,
    sortOrder: item.sortOrder ?? index
  };
}

function sortMedia(items = []) {
  return [...items].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
}

export function getContentDetailPath(contentType, id) {
  if (contentType === "PROJECT") {
    return routes.projectDetail.replace(":id", id);
  }

  if (contentType === "BLOG") {
    return routes.blogDetail.replace(":id", id);
  }

  return routes.postDetail.replace(":id", id);
}

export function getContentTypeLabel(contentType) {
  return getContentConfig(contentType).label;
}

export function buildProjectGalleryItems(project) {
  const items = [];

  if (project?.thumbnail) {
    items.push({
      url: project.thumbnail,
      mediaType: "IMAGE",
      label: "Project cover",
      sortOrder: -1
    });
  }

  sortMedia(project?.media || []).forEach((mediaItem, index) => {
    const normalized = normalizeMediaItem(mediaItem, index, "Project media");
    if (normalized) {
      items.push(normalized);
    }
  });

  return dedupeMedia(items);
}

export function buildPostGalleryItems(post) {
  return dedupeMedia(
    sortMedia(post?.media || [])
      .map((mediaItem, index) => normalizeMediaItem(mediaItem, index, "Post media"))
      .filter(Boolean)
  );
}

export function buildBlogGalleryItems(blog) {
  const items = [];

  if (blog?.coverImage) {
    items.push({
      url: blog.coverImage,
      mediaType: "IMAGE",
      label: "Blog cover",
      sortOrder: -1
    });
  }

  sortMedia(blog?.media || []).forEach((mediaItem, index) => {
    const normalized = normalizeMediaItem(mediaItem, index, "Blog media");
    if (normalized) {
      items.push(normalized);
    }
  });

  return dedupeMedia(items);
}

export function buildFeedGalleryItems(item) {
  const items = [];

  sortMedia(item?.media || []).forEach((mediaItem, index) => {
    const normalized = normalizeMediaItem(mediaItem, index, `${getContentTypeLabel(item?.contentType)} media`);
    if (normalized) {
      items.push(normalized);
    }
  });

  if (!items.length && item?.previewMediaUrl) {
    items.push({
      url: item.previewMediaUrl,
      mediaType: item.previewMediaType || "IMAGE",
      label: `${getContentTypeLabel(item?.contentType)} preview`,
      sortOrder: 0
    });
  }

  return dedupeMedia(items);
}

export function buildSavedGalleryItems(item) {
  const items = [];

  sortMedia(item?.media || []).forEach((mediaItem, index) => {
    const normalized = normalizeMediaItem(mediaItem, index, `${getContentTypeLabel(item?.contentType)} media`);
    if (normalized) {
      items.push(normalized);
    }
  });

  if (!items.length && item?.previewMediaUrl) {
    items.push({
      url: item.previewMediaUrl,
      mediaType: item.previewMediaType || "IMAGE",
      label: `${getContentTypeLabel(item?.contentType)} preview`,
      sortOrder: 0
    });
  }

  return dedupeMedia(items);
}