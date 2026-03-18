import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  CalendarDays,
  Clock3,
  ExternalLink,
  FileCode2,
  FileText,
  Folder,
  Globe,
  Heart,
  Lock,
  MessageCircle,
  Pencil,
  Power,
  Share2,
  Tag,
  UserRound,
  X
} from "lucide-react";
import MediaGallery from "../media/MediaGallery";
import { routes } from "../../config/routes";
import { getBlog } from "../../services/blog.service";
import { getPost } from "../../services/post.service";
import { getProject } from "../../services/project.service";
import { buildBlogGalleryItems, buildPostGalleryItems, buildProjectGalleryItems } from "../../utils/content";
import { formatDate } from "../../utils/discovery";
import useFeedUpdates from "../../websocket/useFeedUpdates";

const DETAIL_FETCHERS = {
  PROJECT: getProject,
  POST: getPost,
  BLOG: getBlog
};

const DETAIL_PATHS = {
  PROJECT: routes.projectDetail,
  POST: routes.postDetail,
  BLOG: routes.blogDetail
};

const EDIT_PATHS = {
  PROJECT: routes.projectEdit,
  POST: routes.postEdit,
  BLOG: routes.blogEdit
};

function resolveOwner(detail, fallback) {
  return detail?.owner || detail?.author || {
    id: fallback.ownerId,
    username: fallback.ownerUsername,
    fullName: fallback.ownerFullName,
    profileImage: fallback.ownerProfileImage
  };
}

function resolveMedia(item, detail) {
  if (!detail) {
    return item.thumbnailUrl
      ? [{ url: item.thumbnailUrl, mediaType: "IMAGE", label: "Preview media" }]
      : [];
  }

  if (item.contentType === "PROJECT") {
    return buildProjectGalleryItems(detail);
  }

  if (item.contentType === "BLOG") {
    return buildBlogGalleryItems(detail);
  }

  return buildPostGalleryItems(detail);
}

function resolveMainText(item, detail) {
  if (item.contentType === "PROJECT") {
    return {
      intro: detail?.shortDesc || item.excerpt,
      body: detail?.fullDesc || null
    };
  }

  if (item.contentType === "BLOG") {
    return {
      intro: null,
      body: detail?.content || item.excerpt
    };
  }

  return {
    intro: null,
    body: detail?.content || item.excerpt
  };
}

function resolveTitle(item, detail) {
  if (item.contentType === "POST") {
    return `Post #${item.id}`;
  }
  return detail?.title || item.title || `${item.contentType} #${item.id}`;
}

function resolveProfilePath(username) {
  return username ? routes.profile.replace(":username", username) : routes.home;
}

export default function AdminContentDetailModal({ item, onClose }) {
  const queryKey = ["admin-content-detail", item?.contentType, item?.id];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => DETAIL_FETCHERS[item.contentType](item.id),
    enabled: Boolean(item?.id && item?.contentType),
    refetchInterval: 15000
  });

  useFeedUpdates({
    contentType: item?.contentType,
    contentId: item?.id,
    queryKeys: [queryKey]
  });

  useEffect(() => {
    if (!item) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  const detailPath = DETAIL_PATHS[item.contentType]?.replace(":id", item.id) || routes.home;
  const editPath = EDIT_PATHS[item.contentType]?.replace(":id", item.id) || routes.home;

  const resolvedDetail = data || null;
  const title = resolveTitle(item, resolvedDetail);
  const owner = resolveOwner(resolvedDetail, item);
  const media = resolveMedia(item, resolvedDetail);
  const text = resolveMainText(item, resolvedDetail);
  const tags = resolvedDetail?.tags || item.tags || [];
  const techStack = resolvedDetail?.techStack || [];
  const categoryName = resolvedDetail?.category?.name || item.categoryName;

  return (
    <div className="admin-detail-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="admin-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-detail-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-detail-modal__header">
          <div>
            <div className="feed-badges">
              <span className="feed-badge">{item.contentType}</span>
              <span className={`status-pill ${item.active ? "status-active" : "status-inactive"}`}>
                <Power size={12} />
                {item.active ? "Active" : "Inactive"}
              </span>
              <span className="status-pill">
                {item.visibility === "PUBLIC" ? <Globe size={12} /> : <Lock size={12} />}
                {item.visibility}
              </span>
            </div>
            <h2 id="admin-detail-modal-title">{title}</h2>
            <p className="admin-page-description">
              Full moderation preview for this {item.contentType.toLowerCase()}.
            </p>
          </div>

          <div className="admin-detail-modal__header-actions">
            <Link to={detailPath} target="_blank" className="btn-glass admin-detail-link">
              <ExternalLink size={16} />
              Open page
            </Link>
            <Link to={editPath} className="btn-glass admin-detail-link">
              <Pencil size={16} />
              Edit
            </Link>
            <button type="button" className="admin-icon-btn" onClick={onClose} aria-label="Close details" title="Close">
              <X size={18} />
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="admin-detail-modal__state">
            <p>Loading live details...</p>
          </div>
        ) : (
          <div className="admin-detail-modal__body">
            {isError && (
              <div className="content-availability-note">
                We could not load the full content payload, so this panel is showing the stored summary instead.
              </div>
            )}

            <div className="admin-detail-modal__meta-grid">
              <div className="admin-detail-meta-card">
                <div className="admin-detail-meta-card__label">
                  <UserRound size={15} />
                  Creator
                </div>
                <Link to={resolveProfilePath(owner.username)} className="admin-owner-link">
                  <div className="admin-owner-link__avatar">
                    {owner.profileImage ? (
                      <img src={owner.profileImage} alt={owner.fullName || owner.username} />
                    ) : (
                      (owner.fullName || owner.username || "V").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <strong>{owner.fullName || owner.username || "Unknown user"}</strong>
                    <span>@{owner.username || "unknown"}</span>
                  </div>
                </Link>
              </div>

              <div className="admin-detail-meta-card">
                <div className="admin-detail-meta-card__label">
                  <CalendarDays size={15} />
                  Dates
                </div>
                <div className="admin-detail-date-list">
                  <span>Created {formatDate(data?.createdAt || item.createdAt)}</span>
                  <span>Updated {formatDate(data?.updatedAt || item.updatedAt || item.createdAt)}</span>
                </div>
              </div>

              <div className="admin-detail-meta-card">
                <div className="admin-detail-meta-card__label">
                  <Folder size={15} />
                  Category
                </div>
                <strong>{categoryName || "Uncategorized"}</strong>
              </div>

              <div className="admin-detail-meta-card">
                <div className="admin-detail-meta-card__label">
                  <Clock3 size={15} />
                  Activity
                </div>
                <div className="admin-detail-stats-inline">
                  <span><Heart size={14} /> {data?.likeCount ?? item.likeCount ?? 0}</span>
                  <span><MessageCircle size={14} /> {data?.commentCount ?? item.commentCount ?? 0}</span>
                  <span><Bookmark size={14} /> {data?.saveCount ?? item.saveCount ?? 0}</span>
                  <span><Share2 size={14} /> {data?.shareCount ?? item.shareCount ?? 0}</span>
                  {item.contentType === "PROJECT" && (
                    <span><Clock3 size={14} /> {resolvedDetail?.viewCount ?? 0} views</span>
                  )}
                </div>
              </div>
            </div>

            {media.length > 0 && (
              <MediaGallery items={media} title={`${title} gallery`} />
            )}

            <div className="admin-detail-reading-panel">
              {text.intro && (
                <div className="admin-detail-copy-block">
                  <div className="admin-detail-copy-block__label">
                    <FileText size={15} />
                    Summary
                  </div>
                  <p>{text.intro}</p>
                </div>
              )}

              {text.body && (
                <div className="admin-detail-copy-block">
                  <div className="admin-detail-copy-block__label">
                    <FileText size={15} />
                    Full content
                  </div>
                  <p>{text.body}</p>
                </div>
              )}

              {tags.length > 0 && (
                <div className="admin-detail-copy-block">
                  <div className="admin-detail-copy-block__label">
                    <Tag size={15} />
                    Tags
                  </div>
                  <div className="admin-content-record-card__tags">
                    {tags.map((tag) => (
                      <span key={tag} className="status-pill admin-tag-pill">
                        <Tag size={12} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {techStack.length > 0 && (
                <div className="admin-detail-copy-block">
                  <div className="admin-detail-copy-block__label">
                    <FileCode2 size={15} />
                    Tech stack
                  </div>
                  <div className="admin-content-record-card__tags">
                    {techStack.map((stackItem) => (
                      <span key={stackItem} className="status-pill admin-tag-pill">
                        <FileCode2 size={12} />
                        {stackItem}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(resolvedDetail?.githubUrl || resolvedDetail?.demoUrl) && (
                <div className="admin-detail-copy-block">
                  <div className="admin-detail-copy-block__label">
                    <Globe size={15} />
                    External links
                  </div>
                  <div className="feed-link-row">
                    {resolvedDetail?.githubUrl && (
                      <a href={resolvedDetail.githubUrl} target="_blank" rel="noreferrer" className="btn-glass admin-detail-link">
                        <FileCode2 size={16} />
                        GitHub
                      </a>
                    )}
                    {resolvedDetail?.demoUrl && (
                      <a href={resolvedDetail.demoUrl} target="_blank" rel="noreferrer" className="btn-glass admin-detail-link">
                        <ExternalLink size={16} />
                        Demo
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
