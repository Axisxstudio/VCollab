import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  FileText,
  Github,
  Layout,
  MessageSquare,
  Plus,
  Users
} from "lucide-react";
import SchoolContentToggle from "../../components/content/SchoolContentToggle";
import ContributorSearchPanel from "../../components/discovery/ContributorSearchPanel";
import ContentActions from "../../components/interactions/ContentActions";
import FollowButton from "../../components/interactions/FollowButton";
import MediaGallery from "../../components/media/MediaGallery";
import { routes } from "../../config/routes";
import { getHomeFeed } from "../../services/feed.service";
import { buildFeedGalleryItems, getContentConfig, getContentTypeLabel } from "../../utils/content";
import { shouldShowContentForViewer, sortContentForViewerPriority } from "../../utils/schoolContent";
import useViewerProfile from "../../hooks/useViewerProfile";
import useFeedUpdates from "../../websocket/useFeedUpdates";
import { formatTimeAgo } from "../../utils/date";

const FEED_SIZE = 12;

const FEED_SCOPES = [
  {
    value: "FOR_YOU",
    label: "For You",
    description: "A mix of fresh community work and your network highlights."
  },
  {
    value: "FOLLOWING",
    label: "Following",
    description: "Updates from people you follow."
  }
];



const getDetailPath = (item) => {
  if (item.contentType === "PROJECT") {
    return routes.projectDetail.replace(":id", item.id);
  }
  if (item.contentType === "BLOG") {
    return routes.blogDetail.replace(":id", item.id);
  }
  return routes.postDetail.replace(":id", item.id);
};

const getProfilePath = (author) => {
  if (!author?.username) return routes.home;
  return routes.profile.replace(":username", author.username);
};

const getAuthorName = (author) => author?.fullName || author?.username || "VCollab member";

const getAvatarContent = (author) => {
  if (author?.profileImage) {
    return <img src={author.profileImage} alt={getAuthorName(author)} />;
  }

  return getAuthorName(author).charAt(0).toUpperCase();
};

const buildShareUrl = (path) => {
  if (!path) return "";
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
};

export default function HomePage() {
  const { authUser: user, viewer, viewerEducationType, isUniversityViewer } = useViewerProfile();
  const [scope, setScope] = useState(FEED_SCOPES[0].value);
  const [showSchool, setShowSchool] = useState(false);
  const requestedFeedSize = showSchool || viewerEducationType === "SCHOOL" ? FEED_SIZE * 3 : FEED_SIZE;

  useEffect(() => {
    if (!isUniversityViewer && showSchool) {
      setShowSchool(false);
    }
  }, [isUniversityViewer, showSchool]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["feed", scope, showSchool, viewerEducationType || "UNKNOWN"],
    queryFn: () => getHomeFeed({ scope, size: requestedFeedSize, includeSchool: showSchool })
  });

  useFeedUpdates({
    queryKeys: [["feed", scope]]
  });

  if (isLoading) {
    return <div className="page-loading-pro">Loading your collaboration feed...</div>;
  }

  if (isError) {
    return <div className="error-panel-pro">We could not load the feed right now.</div>;
  }

  const feed = data || {};
  const items = feed.items || [];
  const visibleItems = sortContentForViewerPriority(
    items.filter((item) => shouldShowContentForViewer({
      viewerEducationType,
      showSchool,
      targetType: item.targetType,
      authorEducationType: item.author?.educationType
    })),
    viewerEducationType,
    (item) => ({
      targetType: item.targetType,
      authorEducationType: item.author?.educationType
    })
  ).slice(0, FEED_SIZE);
  const stats = visibleItems.reduce((summary, item) => {
    if (item.contentType === "PROJECT") {
      summary.projectCount += 1;
    } else if (item.contentType === "POST") {
      summary.postCount += 1;
    } else if (item.contentType === "BLOG") {
      summary.blogCount += 1;
    }
    return summary;
  }, { projectCount: 0, postCount: 0, blogCount: 0 });
  const visibleRelevantCount = visibleItems.filter((item) => item.prioritized).length;

  return (
    <div className="home-social-container">

      <aside className="social-sidebar-left">
        <div className="profile-card-pro">
          <div className="profile-card-cover" />
          <div className="profile-card-content">
            <div className="profile-card-avatar">
              {viewer?.profileImage ? (
                <img src={viewer.profileImage} alt={viewer?.fullName || viewer?.username || "VCollab member"} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                viewer?.fullName?.charAt(0) || viewer?.username?.charAt(0) || "V"
              )}
            </div>
            <div className="profile-card-info">
              <h3>{viewer?.fullName || viewer?.username}</h3>
              <p>@{viewer?.username}</p>
            </div>
            <div className="profile-card-stats">
              <div className="stat-item-pro">
                <strong>{feed.followingCount || 0}</strong>
                <span>Following</span>
              </div>
              <div className="stat-item-pro">
                <strong>{stats.projectCount || 0}</strong>
                <span>Projects</span>
              </div>
            </div>
          </div>
          <div style={{ padding: "0 16px 16px" }}>
            <Link to={getProfilePath(viewer)} className="btn-outline" style={{ display: "block", width: "100%", textAlign: "center", fontSize: "0.85rem" }}>
              My Profile
            </Link>
          </div>
        </div>

        <nav className="card social-nav-pro">
          <Link to={routes.projects} className="share-action-item" style={{ justifyContent: "flex-start", padding: "12px 16px" }}>
            <Layout size={20} color="#1877f2" />
            <span>Discover Projects</span>
          </Link>
          <Link to={routes.posts} className="share-action-item" style={{ justifyContent: "flex-start", padding: "12px 16px" }}>
            <MessageSquare size={20} color="#10b981" />
            <span>Latest Updates</span>
          </Link>
          <Link to={routes.blogs} className="share-action-item" style={{ justifyContent: "flex-start", padding: "12px 16px" }}>
            <FileText size={20} color="#f59e0b" />
            <span>Expert Blogs</span>
          </Link>
        </nav>
      </aside>

      <main className="social-feed-center">
        <div className="share-box-pro">
          <div className="share-box-top">
            <div className="feed-avatar" style={{ width: "40px", height: "40px", fontSize: "1rem" }}>
              {viewer?.fullName?.charAt(0) || "V"}
            </div>
            <Link to={routes.postCreate} className="share-trigger-btn">
              What's on your mind, {viewer?.fullName?.split(" ")[0] || "Partner"}?
            </Link>
          </div>
          <div className="share-box-actions">
            <Link to={routes.postCreate} className="share-action-item"><Plus size={18} color="#1877f2" /><span>Post</span></Link>
            <Link to={routes.projectCreate} className="share-action-item"><Layout size={18} color="#10b981" /><span>Project</span></Link>
            <Link to={routes.blogCreate} className="share-action-item"><FileText size={18} color="#f59e0b" /><span>Blog</span></Link>
          </div>
        </div>

        <div className="feed-tabs-pro">
          <div style={{ display: "flex", gap: "12px" }}>
            {FEED_SCOPES.map((option) => (
              <button key={option.value} className={`feed-tab-pro ${scope === option.value ? "active" : ""}`} onClick={() => setScope(option.value)}>
                {option.label}
              </button>
            ))}
          </div>

          <SchoolContentToggle
            isVisible={isUniversityViewer}
            showSchool={showSchool}
            onToggle={() => setShowSchool((current) => !current)}
          />
        </div>

        <div className="social-stream-pro">
          {visibleItems.map((item) => {
            const detailPath = getDetailPath(item);
            const profilePath = getProfilePath(item.author);
            const config = getContentConfig(item.contentType);
            const Icon = config.icon;
            const galleryItems = buildFeedGalleryItems(item);

            const isOwner = item.author?.id === user?.id || item.author?.username === user?.username;

            return (
              <article key={`${item.contentType}-${item.id}`} className={`content-surface ${isOwner ? "is-owner" : ""}`}>
                <div className="content-surface__header">
                  <div className="content-surface__identity">
                    <Link to={profilePath} className="content-surface__avatar">{getAvatarContent(item.author)}</Link>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Link to={profilePath} className="content-surface__author">{getAuthorName(item.author)}</Link>
                        <FollowButton userId={item.author?.id} username={item.author?.username} />
                      </div>
                      <div className="content-surface__meta">
                        <span className="content-surface__date">{formatTimeAgo(item.createdAt)}</span>
                        <span className={`content-badge-inline content-badge-inline--${config.variant}`}>
                          <Icon size={12} strokeWidth={2.5} /> {config.label}
                        </span>
                        {item.category?.name && (
                          <span className="content-surface__category">{item.category.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <MediaGallery
                  items={galleryItems}
                  title={item.title || getContentTypeLabel(item.contentType)}
                  variant="card"
                  aspect={item.contentType === "POST" ? "square" : "landscape"}
                />

                {item.title && <h3 className="content-surface__title" style={{ marginBottom: '4px' }}>{item.title}</h3>}
                <div style={{ marginBottom: '12px' }}>
                  <p className="content-surface__excerpt">
                    {item.excerpt}
                  </p>
                  <Link to={detailPath} className="content-more-link-inline">View More</Link>
                </div>

                {item.tags?.length > 0 && (
                  <div className="tag-list">
                    {item.tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="tag-chip">{tag}</span>
                    ))}
                  </div>
                )}

                {(item.githubUrl || item.demoUrl) && (
                  <div className="feed-link-row">
                    {item.githubUrl && (
                      <a href={item.githubUrl} target="_blank" rel="noreferrer" className="feed-text-link">
                        <Github size={14} /> GitHub
                      </a>
                    )}
                    {item.demoUrl && (
                      <a href={item.demoUrl} target="_blank" rel="noreferrer" className="feed-text-link">
                        <ExternalLink size={14} /> Demo
                      </a>
                    )}
                  </div>
                )}

                <ContentActions
                  contentType={item.contentType}
                  contentId={item.id}
                  counts={item}
                  queryKeys={[["feed", scope]]}
                  shareUrl={buildShareUrl(detailPath)}
                  layout="facebook"
                  authorUsername={item.author?.username}
                  title={item.title}
                  author={item.author}
                  mediaUrl={galleryItems[0]?.url}
                />

                <div className="content-surface__footer">
                  {/* View More moved inline */}
                </div>
              </article>
            );
          })}

          {visibleItems.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: "40px", color: "#65676b" }}>
              <Users size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
              <h3>{showSchool ? "No school content in this feed right now" : "Your feed is quiet..."}</h3>
              <p>
                {showSchool
                  ? "Switch back to main content or try a different feed tab to see more activity."
                  : "Try following more creators or sharing your own updates to get the conversation started."}
              </p>
            </div>
          )}
        </div>
      </main>

      <aside className="social-sidebar-right">
        <div className="card feed-panel feed-summary" style={{ margin: 0 }}>
          <h3 style={{ fontSize: "1rem", borderBottom: "1px solid #f0f2f5", paddingBottom: "12px", marginBottom: "16px" }}>Feed Insights</h3>
          <div className="feed-summary-grid">
            <div className="feed-stat"><strong>{stats.projectCount || 0}</strong><span>Projects</span></div>
            <div className="feed-stat"><strong>{stats.postCount || 0}</strong><span>Updates</span></div>
            <div className="feed-stat"><strong>{stats.blogCount || 0}</strong><span>Stories</span></div>
            <div className="feed-stat"><strong>{visibleRelevantCount || 0}</strong><span>Relevant</span></div>
          </div>
        </div>

        <ContributorSearchPanel />

        <div className="card" style={{ padding: "16px" }}>
          <h3 style={{ fontSize: "0.9rem", color: "#65676b", marginBottom: "12px" }}>Quick Start</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Link to={routes.projectCreate} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>Create Project</Link>
            <Link to={routes.postCreate} className="btn-outline" style={{ width: "100%", justifyContent: "center" }}>Post Update</Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
