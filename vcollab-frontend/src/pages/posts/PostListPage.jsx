import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layers, User, MessageSquare, Plus } from "lucide-react";
import SchoolContentToggle from "../../components/content/SchoolContentToggle";
import DiscoveryToolbar from "../../components/discovery/DiscoveryToolbar";
import HoverActionPill from "../../components/discovery/HoverActionPill";
import ContentActions from "../../components/interactions/ContentActions";
import FollowButton from "../../components/interactions/FollowButton";
import useViewerProfile from "../../hooks/useViewerProfile";
import MediaGallery from "../../components/media/MediaGallery";
import { routes } from "../../config/routes";
import { listPosts, listUserPosts } from "../../services/post.service";
import {
  buildDiscoveryParams,
  buildDiscoveryQueryKey,
  buildShareUrl,
  createInitialDiscoveryFilters,
  formatDate,
  getProfilePath
} from "../../utils/discovery";
import { buildPostGalleryItems } from "../../utils/content";
import { truncateRichText } from "../../utils/richText";
import { shouldShowContentForViewer, sortContentForViewerPriority } from "../../utils/schoolContent";
import useFeedUpdates from "../../websocket/useFeedUpdates";

const PAGE_SIZE = 9;

function getAvatar(author) {
  if (author?.profileImage) {
    return <img src={author.profileImage} alt={author.fullName || author.username} />;
  }

  return (author?.fullName || author?.username || "V").charAt(0).toUpperCase();
}

export default function PostListPage() {
  const { authUser: currentUser, viewerEducationType, isUniversityViewer } = useViewerProfile();
  const [filters, setFilters] = useState(createInitialDiscoveryFilters());
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState("All");
  const [showSchool, setShowSchool] = useState(false);

  const effectiveFilters = viewMode === "Mine" ? { ...filters, owner: currentUser?.username } : filters;
  const queryKey = buildDiscoveryQueryKey(`posts-${viewMode}`, effectiveFilters, page);

  useEffect(() => {
    if (!isUniversityViewer && showSchool) {
      setShowSchool(false);
    }
  }, [isUniversityViewer, showSchool]);
  
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => {
      if (viewMode === "Mine") {
        return listUserPosts(currentUser.username, { page, size: PAGE_SIZE });
      }
      const params = buildDiscoveryParams(filters, page, PAGE_SIZE);
      return listPosts(params);
    },
    enabled: viewMode !== "Mine" || !!currentUser?.username
  });

  useFeedUpdates({
    contentType: "POST",
    queryKeys: [queryKey]
  });

  const handleFilterChange = (field, value) => {
    setPage(0);
    setFilters((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const handleReset = () => {
    setPage(0);
    setFilters(createInitialDiscoveryFilters());
    setViewMode("All");
  };

  if (isLoading) {
    return <div className="card">Loading posts...</div>;
  }

  if (isError) {
    return <div className="card">We could not load posts right now.</div>;
  }

  const posts = data?.content || [];
  const prioritizedPosts = sortContentForViewerPriority(
    posts,
    viewerEducationType,
    (post) => ({
      targetType: post.targetType,
      authorEducationType: post.author?.educationType
    })
  );
  const visiblePosts = prioritizedPosts.filter((post) => shouldShowContentForViewer({
    viewerEducationType,
    showSchool,
    targetType: post.targetType,
    authorEducationType: post.author?.educationType
  }));
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || posts.length;
  const resultsMeta = isUniversityViewer && showSchool
    ? `${visiblePosts.length} school post${visiblePosts.length === 1 ? "" : "s"} on this page`
    : isUniversityViewer && !showSchool
    ? `${visiblePosts.length} visible on this page${totalElements ? ` | ${totalElements} total found` : ""}`
    : `${totalElements} post${totalElements === 1 ? "" : "s"} found`;

  return (
    <div className="section">
      <div className="project-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "4px" }}>Social Hub</h2>
          <p className="profile-meta">Share quick updates, ideas, and announcements with the community.</p>
        </div>
        <HoverActionPill
          icon={Plus}
          label="Create Post"
          to={routes.postCreate}
          variant="primary"
        />
      </div>

      <DiscoveryToolbar
        title="Refine post discovery"
        description="Search social updates by topic, author, category, and recency instead of endlessly scrolling."
        categoryType="POST"
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
        searchPlaceholder="Search post text, announcements, and contributor names"
      />

      <div className="discovery-action-rail">
        <div className="discovery-action-rail__group">
          {currentUser && (
            <>
              <HoverActionPill
                icon={Layers}
                label="All Posts"
                onClick={() => { setViewMode("All"); setPage(0); }}
                active={viewMode === "All"}
              />
              <HoverActionPill
                icon={User}
                label="My Posts"
                onClick={() => { setViewMode("Mine"); setPage(0); }}
                active={viewMode === "Mine"}
              />
            </>
          )}
          <SchoolContentToggle
            isVisible={isUniversityViewer}
            showSchool={showSchool}
            onToggle={() => { setShowSchool((current) => !current); setPage(0); }}
          />
        </div>
      </div>

      <div className="discovery-results-header">
        <h3>{viewMode === "Mine" ? "My Post Results" : "Global Post Results"}</h3>
        <span className="discovery-results-meta">{resultsMeta}</span>
      </div>

      {visiblePosts.length === 0 ? (
        <div className="card discovery-empty">
          <h3>No posts match these filters right now</h3>
          <p>
            {posts.length > 0 && isUniversityViewer && showSchool
              ? "There is no school content on this page right now. Switch back to main content or try another page."
              : posts.length > 0 && isUniversityViewer && !showSchool
              ? "School content is hidden on this page. Turn on school content if you want to include those results."
              : "Broaden your filters to pull in more student updates and announcements."}
          </p>
        </div>
      ) : (
        <div className="discovery-content-grid">
          {visiblePosts.map((post) => {
            const detailPath = routes.postDetail.replace(":id", post.id);
            const profilePath = getProfilePath(post.author?.username);
            const isOwner = Boolean(currentUser?.id && post.author?.id === currentUser.id);
            const canOpen = post.active !== false || isOwner;
            const galleryItems = buildPostGalleryItems(post);

            return (
              <article key={post.id} className={`content-surface ${!canOpen ? "discovery-card--disabled" : ""} ${isOwner ? "is-owner" : ""}`}>
                <div className="content-surface__header">
                  <div className="content-surface__identity">
                    <Link to={profilePath} className="content-surface__avatar">{getAvatar(post.author)}</Link>
                    <div className="content-surface__author-box">
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Link to={profilePath} className="content-surface__author">
                          {post.author?.fullName || post.author?.username || "VCollab member"}
                        </Link>
                        <FollowButton userId={post.author?.id} username={post.author?.username} />
                      </div>
                      <div className="content-surface__meta">
                        <span className="content-surface__date">{formatDate(post.createdAt)}</span>
                        <span className="content-badge-inline content-badge-inline--post">
                          <MessageSquare size={12} strokeWidth={2.5} /> Post
                        </span>
                        {post.category?.name && (
                          <span className="content-surface__category">{post.category.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="feed-badges">
                    {post.active === false && <span className="feed-badge feed-badge--inactive">Inactive</span>}
                  </div>
                </div>

                <MediaGallery items={galleryItems} title="Post media" variant="card" aspect="square" showCaption={false} />

                <div style={{ margin: '12px 0', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <p className="content-surface__excerpt">
                    {truncateRichText(post.content, 220)}
                  </p>
                  <Link to={detailPath} className="content-more-link-inline">View More</Link>
                </div>

                {post.tags?.length > 0 && (
                  <div className="tag-list">
                    {post.tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="tag-chip">{tag}</span>
                    ))}
                  </div>
                )}

                <ContentActions
                  contentType="POST"
                  contentId={post.id}
                  counts={post}
                  queryKeys={[queryKey]}
                  shareUrl={buildShareUrl(detailPath)}
                  layout="facebook"
                  disabled={!canOpen}
                  disabledReason="This post is inactive. Only the owner or admin can open it."
                  authorUsername={post.author?.username}
                />
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="discovery-pagination">
          <button type="button" className="btn-outline" onClick={() => setPage((current) => Math.max(current - 1, 0))} disabled={page === 0}>
            Previous
          </button>
          <span className="discovery-results-meta">Page {page + 1} of {totalPages}</span>
          <button type="button" className="btn-outline" onClick={() => setPage((current) => current + 1)} disabled={page + 1 >= totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
